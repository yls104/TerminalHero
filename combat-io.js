(function exposeCombatIO() {
  let logSeed = 0;

  function cloneEnemy(enemy) {
    if (!enemy) {
      return null;
    }
    return {
      id: enemy.id,
      name: enemy.name,
      hp: enemy.hp,
      maxHp: enemy.maxHp,
      attack: enemy.attack,
      defense: enemy.defense,
      speed: enemy.speed,
      exp: enemy.exp,
      gold: enemy.gold,
      isBoss: Boolean(enemy.isBoss),
      role: enemy.role || "basic",
      assetKey: enemy.assetKey || (enemy.isBoss ? "boss" : "enemy"),
      skills: Array.isArray(enemy.skills) ? enemy.skills.slice() : [],
      encounterType: enemy.encounterType || "normal",
      dropTableId: enemy.dropTableId || "",
    };
  }

  function createCombatLogEntry(text, options) {
    const config = options || {};
    logSeed += 1;
    return {
      id: "combat-log-" + logSeed,
      type: config.type || "info",
      source: config.source || "system",
      text: String(text || ""),
      emphasis: Boolean(config.emphasis),
      turn: config.turn || "",
      meta: config.meta || null,
    };
  }

  function normalizeCombatLogEntry(input, options) {
    if (input && typeof input === "object" && typeof input.text === "string") {
      return createCombatLogEntry(input.text, {
        type: input.type,
        source: input.source,
        emphasis: input.emphasis,
        turn: input.turn,
        meta: input.meta,
      });
    }
    return createCombatLogEntry(input, options);
  }

  function clonePressureState(state) {
    if (!state) {
      return null;
    }
    return {
      poiseCurrent: state.poiseCurrent || 0,
      poiseMax: state.poiseMax || 0,
      poisePercent: state.poisePercent || 0,
      stance: state.stance || "steady",
      stanceLabel: state.stanceLabel || "稳固",
      exposedTurns: state.exposedTurns || 0,
      executionReady: Boolean(state.executionReady),
      chargeLevel: state.chargeLevel || 0,
      chargeMax: state.chargeMax || 0,
      chargeLabel: state.chargeLabel || "",
      chargeActionName: state.chargeActionName || "",
      chargeInterruptible: Boolean(state.chargeInterruptible),
    };
  }

  function createCombatSnapshot(payload) {
    const data = payload || {};
    return {
      inCombat: Boolean(data.inCombat),
      phase: data.phase || (data.inCombat ? "combat" : "idle"),
      playerTurn: Boolean(data.playerTurn),
      enemy: cloneEnemy(data.enemy),
      enemyTile: typeof data.enemyTile === "number" ? data.enemyTile : 0,
      locked: Boolean(data.locked),
      round: typeof data.round === "number" ? data.round : 0,
      pendingAction: data.pendingAction || "",
      currentActorId: data.currentActorId || "",
      playerPressure: clonePressureState(data.playerPressure),
      enemyPressure: clonePressureState(data.enemyPressure),
      enemyIntent: data.enemyIntent
        ? {
            id: data.enemyIntent.id || "",
            label: data.enemyIntent.label || "",
            summary: data.enemyIntent.summary || "",
            pressure: data.enemyIntent.pressure || "neutral",
            timingText: data.enemyIntent.timingText || "",
            insertHint: data.enemyIntent.insertHint || "",
            interruptible: Boolean(data.enemyIntent.interruptible),
          }
        : null,
      insertWindow: data.insertWindow
        ? {
            open: Boolean(data.insertWindow.open),
            sourceUnitId: data.insertWindow.sourceUnitId || "",
            allowedActionIds: Array.isArray(data.insertWindow.allowedActionIds) ? data.insertWindow.allowedActionIds.slice() : [],
            reason: data.insertWindow.reason || "",
          }
        : null,
      ultimate: data.ultimate
        ? {
            current: data.ultimate.current || 0,
            max: data.ultimate.max || 0,
            primarySkillId: data.ultimate.primarySkillId || "",
            skillIds: Array.isArray(data.ultimate.skillIds) ? data.ultimate.skillIds.slice() : [],
            availableSkillIds: Array.isArray(data.ultimate.availableSkillIds) ? data.ultimate.availableSkillIds.slice() : [],
            canActNow: Boolean(data.ultimate.canActNow),
            canInsert: Boolean(data.ultimate.canInsert),
          }
        : null,
      timeline: data.timeline
        ? {
            actors: Array.isArray(data.timeline.actors) ? data.timeline.actors.map(function mapActor(actor) {
              return {
                unitId: actor.unitId,
                side: actor.side,
                label: actor.label,
                hp: actor.hp,
                maxHp: actor.maxHp,
                speed: actor.speed,
                currentAv: actor.currentAv,
                baseAv: actor.baseAv,
                canAct: actor.canAct !== false,
              };
            }) : [],
            roundIndex: data.timeline.roundIndex || 0,
            currentActorId: data.timeline.currentActorId || "",
            queuePreview: Array.isArray(data.timeline.queuePreview) ? data.timeline.queuePreview.map(function mapEntry(entry) {
              return {
                unitId: entry.unitId,
                side: entry.side,
                label: entry.label,
                speed: entry.speed,
                currentAv: entry.currentAv,
                baseAv: entry.baseAv,
              };
            }) : [],
            pendingInsertWindow: data.timeline.pendingInsertWindow || null,
            lastResolvedAction: data.timeline.lastResolvedAction || null,
          }
        : null,
    };
  }

  function createCombatEndPayload(payload) {
    const data = payload || {};
    const enemy = cloneEnemy(data.enemy);
    return {
      result: data.result || "unknown",
      reason: data.reason || "",
      enemyTile: typeof data.enemyTile === "number" ? data.enemyTile : 0,
      enemy: enemy,
      wasBoss: Boolean(enemy && enemy.isBoss),
      rewards: {
        exp: enemy ? enemy.exp || 0 : 0,
        gold: enemy ? enemy.gold || 0 : 0,
      },
    };
  }

  function createCombatActionRequest(input) {
    if (input && typeof input === "object" && typeof input.actionId === "string") {
      return {
        actionId: input.actionId,
        kind: input.kind || "skill",
        skillId: input.skillId || (input.actionId === "attack" ? "attack" : input.actionId.replace(/^ultimate:/, "")),
      };
    }

    if (input === "flee") {
      return {
        actionId: "flee",
        kind: "flee",
        skillId: "",
      };
    }

    if (input === "attack") {
      return {
        actionId: "attack",
        kind: "basic",
        skillId: "attack",
      };
    }

    if (input === "ultimate") {
      return {
        actionId: "ultimate",
        kind: "ultimate",
        skillId: "",
      };
    }

    if (typeof input === "string" && input.indexOf("ultimate:") === 0) {
      return {
        actionId: input,
        kind: "ultimate",
        skillId: input.replace(/^ultimate:/, ""),
      };
    }

    return {
      actionId: String(input || ""),
      kind: String(input || "").indexOf("ultimate:") === 0 ? "ultimate" : "skill",
      skillId: String(input || ""),
    };
  }

  window.CombatIO = {
    cloneEnemy: cloneEnemy,
    createCombatLogEntry: createCombatLogEntry,
    normalizeCombatLogEntry: normalizeCombatLogEntry,
    createCombatSnapshot: createCombatSnapshot,
    createCombatEndPayload: createCombatEndPayload,
    createCombatActionRequest: createCombatActionRequest,
  };
})();
