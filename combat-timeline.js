(function exposeCombatTimeline() {
  const DEFAULT_BASE_AV = 100;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toNumber(value, fallback) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function computeBaseAv(speed) {
    return clamp(Math.round(DEFAULT_BASE_AV - toNumber(speed, 0) * 3), 38, 96);
  }

  function normalizeActor(input) {
    const actor = input || {};
    const speed = toNumber(actor.speed, 0);
    const hp = toNumber(actor.hp, 0);
    const maxHp = toNumber(actor.maxHp, hp);
    return {
      unitId: String(actor.unitId || ""),
      side: actor.side || "neutral",
      label: actor.label || actor.unitId || "unit",
      hp: hp,
      maxHp: maxHp,
      speed: speed,
      currentAv: toNumber(actor.currentAv, computeBaseAv(speed)),
      baseAv: toNumber(actor.baseAv, computeBaseAv(speed)),
      canAct: actor.canAct !== false && hp > 0,
      tags: Array.isArray(actor.tags) ? actor.tags.slice() : [],
    };
  }

  function cloneActor(actor) {
    return {
      unitId: actor.unitId,
      side: actor.side,
      label: actor.label,
      hp: actor.hp,
      maxHp: actor.maxHp,
      speed: actor.speed,
      currentAv: actor.currentAv,
      baseAv: actor.baseAv,
      canAct: actor.canAct,
      tags: Array.isArray(actor.tags) ? actor.tags.slice() : [],
    };
  }

  function getLivingActors(state) {
    return (state.actors || []).filter(function filterActor(actor) {
      return actor && actor.canAct !== false && actor.hp > 0;
    });
  }

  function sortActorsForTurnOrder(actors) {
    return actors.slice().sort(function sortActors(a, b) {
      if (a.currentAv !== b.currentAv) {
        return a.currentAv - b.currentAv;
      }
      if (a.speed !== b.speed) {
        return b.speed - a.speed;
      }
      return a.unitId.localeCompare(b.unitId);
    });
  }

  function buildQueuePreview(state, size) {
    const previewSize = size || 6;
    const actors = getLivingActors(state).map(cloneActor);
    const preview = [];

    if (!actors.length) {
      return preview;
    }

    for (let index = 0; index < previewSize; index += 1) {
      const sortedActors = sortActorsForTurnOrder(actors);
      const nextActor = sortedActors[0];
      if (!nextActor) {
        break;
      }
      const delta = Math.max(0, nextActor.currentAv);
      actors.forEach(function advanceActor(actor) {
        actor.currentAv = Math.max(0, actor.currentAv - delta);
      });
      preview.push({
        unitId: nextActor.unitId,
        side: nextActor.side,
        label: nextActor.label,
        currentAv: nextActor.currentAv,
        baseAv: nextActor.baseAv,
      });
      nextActor.currentAv = clamp(nextActor.baseAv, 1, 999);
    }

    return preview;
  }

  function refreshQueuePreview(state) {
    state.queuePreview = buildQueuePreview(state, 6);
    return state;
  }

  function getActor(state, unitId) {
    return (state.actors || []).find(function findActor(actor) {
      return actor.unitId === unitId;
    }) || null;
  }

  function getCurrentActor(state) {
    if (!state || !state.currentActorId) {
      return null;
    }
    return getActor(state, state.currentActorId);
  }

  function setActorState(state, unitId, changes) {
    const actor = getActor(state, unitId);
    if (!actor || !changes) {
      return actor;
    }
    if (Object.prototype.hasOwnProperty.call(changes, "hp")) {
      actor.hp = toNumber(changes.hp, actor.hp);
    }
    if (Object.prototype.hasOwnProperty.call(changes, "maxHp")) {
      actor.maxHp = toNumber(changes.maxHp, actor.maxHp);
    }
    if (Object.prototype.hasOwnProperty.call(changes, "speed")) {
      actor.speed = toNumber(changes.speed, actor.speed);
      actor.baseAv = computeBaseAv(actor.speed);
    }
    if (Object.prototype.hasOwnProperty.call(changes, "currentAv")) {
      actor.currentAv = clamp(toNumber(changes.currentAv, actor.currentAv), 0, 999);
    }
    if (Object.prototype.hasOwnProperty.call(changes, "canAct")) {
      actor.canAct = Boolean(changes.canAct);
    } else {
      actor.canAct = actor.hp > 0;
    }
    if (Object.prototype.hasOwnProperty.call(changes, "label")) {
      actor.label = changes.label || actor.label;
    }
    refreshQueuePreview(state);
    return actor;
  }

  function advanceToNextActor(state) {
    const livingActors = sortActorsForTurnOrder(getLivingActors(state));
    if (!livingActors.length) {
      state.currentActorId = "";
      state.lastResolvedAction = null;
      refreshQueuePreview(state);
      return null;
    }

    const delta = Math.max(0, livingActors[0].currentAv);
    state.actors.forEach(function advanceActor(actor) {
      if (actor.canAct !== false && actor.hp > 0) {
        actor.currentAv = Math.max(0, actor.currentAv - delta);
      }
    });

    const nextActors = sortActorsForTurnOrder(getLivingActors(state));
    const activeActor = nextActors[0] || null;
    state.currentActorId = activeActor ? activeActor.unitId : "";
    if (activeActor) {
      state.roundIndex += 1;
    }
    refreshQueuePreview(state);
    return activeActor;
  }

  function createTimelineState(input) {
    const state = {
      actors: Array.isArray(input && input.actors) ? input.actors.map(normalizeActor) : [],
      currentActorId: "",
      roundIndex: 0,
      queuePreview: [],
      pendingInsertWindow: null,
      lastResolvedAction: null,
    };
    advanceToNextActor(state);
    return state;
  }

  function resolveAction(state, actionSpec) {
    const action = actionSpec || {};
    const actor = getActor(state, action.sourceUnitId);
    if (!actor) {
      return null;
    }

    const target = action.targetUnitId ? getActor(state, action.targetUnitId) : null;
    const baseDelay = Math.max(0, toNumber(action.baseDelay, actor.baseAv));
    const advanceSelf = Math.max(0, toNumber(action.advanceSelf, 0));
    const delayTarget = Math.max(0, toNumber(action.delayTarget, 0));

    actor.currentAv = clamp(baseDelay - advanceSelf, 0, 999);
    if (target && target.canAct !== false && target.hp > 0) {
      target.currentAv = clamp(target.currentAv + delayTarget, 0, 999);
    }

    state.lastResolvedAction = {
      actionId: String(action.actionId || ""),
      actionType: action.actionType || "skill",
      sourceUnitId: actor.unitId,
      targetUnitId: target ? target.unitId : "",
      baseDelay: baseDelay,
      advanceSelf: advanceSelf,
      delayTarget: delayTarget,
    };

    return advanceToNextActor(state);
  }

  function cloneTimelineState(state) {
    const data = state || {};
    return {
      actors: Array.isArray(data.actors) ? data.actors.map(cloneActor) : [],
      currentActorId: data.currentActorId || "",
      roundIndex: toNumber(data.roundIndex, 0),
      queuePreview: Array.isArray(data.queuePreview) ? data.queuePreview.map(function mapEntry(entry) {
        return {
          unitId: entry.unitId,
          side: entry.side,
          label: entry.label,
          currentAv: entry.currentAv,
          baseAv: entry.baseAv,
        };
      }) : [],
      pendingInsertWindow: data.pendingInsertWindow || null,
      lastResolvedAction: data.lastResolvedAction
        ? {
            actionId: data.lastResolvedAction.actionId || "",
            actionType: data.lastResolvedAction.actionType || "skill",
            sourceUnitId: data.lastResolvedAction.sourceUnitId || "",
            targetUnitId: data.lastResolvedAction.targetUnitId || "",
            baseDelay: toNumber(data.lastResolvedAction.baseDelay, 0),
            advanceSelf: toNumber(data.lastResolvedAction.advanceSelf, 0),
            delayTarget: toNumber(data.lastResolvedAction.delayTarget, 0),
          }
        : null,
    };
  }

  window.CombatTimeline = {
    DEFAULT_BASE_AV: DEFAULT_BASE_AV,
    computeBaseAv: computeBaseAv,
    createTimelineState: createTimelineState,
    cloneTimelineState: cloneTimelineState,
    getActor: getActor,
    getCurrentActor: getCurrentActor,
    setActorState: setActorState,
    resolveAction: resolveAction,
    buildQueuePreview: buildQueuePreview,
    advanceToNextActor: advanceToNextActor,
  };
})();
