function createCombatController(options) {
  const config = options || {};
  const player = config.player;
  const skills = config.skills || {};
  const resolveSkill = config.resolveSkill || function fallbackResolveSkill(skillId) { return skills[skillId] || null; };
  const getUltimateSkills = config.getUltimateSkills || function fallbackGetUltimateSkills() {
    return (player && Array.isArray(player.unlockedSkills) ? player.unlockedSkills : []).map(function mapSkill(skillId) {
      return resolveSkill(skillId);
    }).filter(function filterSkill(skill) {
      return skill && skill.actionType === "ultimate";
    });
  };
  const ioApi = window.CombatIO || {};
  const timelineApi = window.CombatTimeline || {};
  const effectsApi = window.CombatEffects || {};
  const actionsApi = window.CombatActions || {};
  const normalizeCombatLogEntry = ioApi.normalizeCombatLogEntry || function fallbackNormalize(input, meta) {
    return {
      text: typeof input === "string" ? input : String((input && input.text) || ""),
      type: (meta && meta.type) || "info",
      source: (meta && meta.source) || "system",
      emphasis: Boolean(meta && meta.emphasis),
      turn: (meta && meta.turn) || "",
      meta: (meta && meta.meta) || null,
    };
  };
  const createCombatSnapshot = ioApi.createCombatSnapshot || function fallbackSnapshot(payload) { return payload; };
  const createCombatEndPayload = ioApi.createCombatEndPayload || function fallbackEnd(payload) { return payload; };
  const createCombatActionRequest = ioApi.createCombatActionRequest || function fallbackAction(input) {
    return {
      actionId: String(input || ""),
      kind: input === "flee" ? "flee" : "skill",
      skillId: String(input || ""),
    };
  };
  const createStatusRuntime = effectsApi.createStatusBag || function fallbackStatusBag() {
    return {
      guard: 0,
      poisonTurns: 0,
      poisonDamage: 0,
      regenTurns: 0,
      regenValue: 0,
      attackBuffTurns: 0,
      attackBuffValue: 0,
      speedDownTurns: 0,
      speedDownValue: 0,
    };
  };
  const createUltimateRuntime = effectsApi.createUltimateState || function fallbackUltimateState() {
    return {
      current: 0,
      max: 8,
    };
  };
  const getEffectiveAttack = effectsApi.effectiveAttack || function fallbackEffectiveAttack(unit, statusBag) {
    const buff = statusBag.attackBuffTurns > 0 ? statusBag.attackBuffValue : 0;
    return unit.attack * (1 + buff);
  };
  const getEffectiveSpeed = effectsApi.effectiveSpeed || function fallbackEffectiveSpeed(unit, statusBag) {
    const slow = statusBag.speedDownTurns > 0 ? statusBag.speedDownValue : 0;
    return Math.max(1, unit.speed - slow);
  };
  const rollDamage = effectsApi.damageByFormula || function fallbackDamage(attackerAttack, power, defenderDefense, randomFn) {
    const base = Math.max(1, attackerAttack * power - defenderDefense);
    const swing = typeof randomFn === "function" ? randomFn(0.92, 1.08) : rand(0.92, 1.08);
    return Math.max(1, Math.round(base * swing));
  };
  const applyDamageToTarget = effectsApi.applyDamage || function fallbackApplyDamage(target, statusBag, rawDamage) {
    const finalDamage = Math.max(1, Math.round(rawDamage * (1 - statusBag.guard)));
    target.hp = clamp(target.hp - finalDamage, 0, target.maxHp);
    return finalDamage;
  };
  const tickStatusEffects = effectsApi.tickStatus || function fallbackTickStatus(input) {
    const statusBag = input.statusBag;
    const unit = input.unit;
    const label = input.label;
    const statusLog = input.log;
    if (statusBag.poisonTurns > 0) {
      unit.hp = clamp(unit.hp - statusBag.poisonDamage, 0, unit.maxHp);
      statusBag.poisonTurns -= 1;
      statusLog(label + " 因中毒损失 " + statusBag.poisonDamage + " 点生命。", { type: "status", source: "system", turn: "tick" });
    }
    if (statusBag.regenTurns > 0) {
      unit.hp = clamp(unit.hp + statusBag.regenValue, 0, unit.maxHp);
      statusBag.regenTurns -= 1;
      statusLog(label + " 受到持续恢复，回了 " + statusBag.regenValue + " 点生命。", { type: "status", source: "system", turn: "tick" });
    }
    if (statusBag.attackBuffTurns > 0) {
      statusBag.attackBuffTurns -= 1;
      if (statusBag.attackBuffTurns === 0) {
        statusBag.attackBuffValue = 0;
      }
    }
    if (statusBag.speedDownTurns > 0) {
      statusBag.speedDownTurns -= 1;
      if (statusBag.speedDownTurns === 0) {
        statusBag.speedDownValue = 0;
      }
    }
    if (statusBag.guard > 0) {
      statusBag.guard = 0;
    }
  };
  const gainCharge = effectsApi.gainCharge || function fallbackGainCharge(pool, amount) {
    const delta = Math.max(0, toNumber(amount, 0));
    if (!delta) {
      return 0;
    }
    const previous = pool.current;
    pool.current = clamp(pool.current + delta, 0, pool.max);
    return pool.current - previous;
  };
  const spendCharge = effectsApi.spendCharge || function fallbackSpendCharge(pool, amount) {
    const cost = Math.max(0, toNumber(amount, 0));
    if (!cost) {
      return true;
    }
    if (pool.current < cost) {
      return false;
    }
    pool.current -= cost;
    return true;
  };
  const resolveActionTiming = actionsApi.resolveActionDelay || function fallbackResolveActionDelay(input) {
    const config = input || {};
    const baseAv = timelineApi.computeBaseAv ? timelineApi.computeBaseAv(config.sourceSpeed || 1) : 52;
    const skillBaseDelay = toNumber(config.skillLike && config.skillLike.baseDelay, 52);
    return clamp(baseAv + (skillBaseDelay - 52), 18, 999);
  };
  const createActionFrame = actionsApi.createActionContext || function fallbackActionContext(input) {
    const config = input || {};
    const timing = config.timingLike || {};
    return {
      actionId: config.actionId || "",
      actionType: config.actionType || "skill",
      sourceUnitId: config.sourceUnitId || "",
      targetUnitId: config.targetUnitId || "",
      baseDelay: resolveActionTiming({
        sourceSpeed: config.sourceSpeed,
        skillLike: timing,
        timelineApi: timelineApi,
      }),
      advanceSelf: Math.max(0, toNumber(timing.advanceSelf, 0)),
      delayTarget: Math.max(0, toNumber(timing.delayTarget, 0)),
    };
  };
  const createInsertWindowSpec = actionsApi.createInsertWindow || function fallbackInsertWindow(input) {
    const actor = input.actor;
    const availableSkills = input.availableSkills || [];
    if (!actor || actor.side !== "enemy" || !availableSkills.length) {
      return null;
    }
    return {
      open: true,
      sourceUnitId: "player",
      allowedActionIds: availableSkills.map(function mapSkill(skill) { return skill.id; }),
      reason: input.reason || "enemy_turn",
    };
  };
  const canUseInsertWindowAction = actionsApi.canUseInsertWindow || function fallbackCanUseInsert(insertWindow, skillId) {
    return Boolean(insertWindow && insertWindow.open && insertWindow.allowedActionIds.indexOf(skillId) !== -1);
  };
  const createTimelineChangeLogs = actionsApi.createTimelineChangeLogs || function fallbackTimelineChangeLogs(actionContext, getLabel) {
    const entries = [];
    const sourceLabel = getLabel(actionContext.sourceUnitId);
    const targetLabel = actionContext.targetUnitId ? getLabel(actionContext.targetUnitId) : "";
    if (actionContext.advanceSelf > 0) {
      entries.push({
        text: sourceLabel + " 借势抢回了 " + actionContext.advanceSelf + " 点行动值。",
        meta: { type: "timeline", source: "system", turn: "timeline" },
      });
    }
    if (actionContext.delayTarget > 0 && targetLabel) {
      entries.push({
        text: targetLabel + " 的行动被压后了 " + actionContext.delayTarget + " 点。",
        meta: { type: "timeline", source: "system", turn: "timeline" },
      });
    }
    return entries;
  };

  let currentEnemy = null;
  let state = "idle";
  let locked = false;
  let sourceTile = 0;
  let roundCount = 0;
  let enemyTurnTimer = 0;
  let timelineState = null;
  let pendingInsertWindow = null;
  let pendingEnemyIntent = null;
  let playerUltimate = createUltimateRuntime();
  let playerStatus = createStatusRuntime();
  let enemyStatus = createStatusRuntime();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toNumber(value, fallback) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function log(message, meta) {
    if (config.onLog) {
      config.onLog(normalizeCombatLogEntry(message, meta));
    }
  }

  function emitState(payload) {
    if (config.onStateChange) {
      config.onStateChange(payload);
    }
  }

  function emitStatus() {
    if (config.onStatusSync) {
      config.onStatusSync();
    }
  }

  function emitEffect(name, payload) {
    if (config.onEffect) {
      config.onEffect(name, payload || {});
    }
  }

  function clearEnemyTimer() {
    if (enemyTurnTimer) {
      clearTimeout(enemyTurnTimer);
      enemyTurnTimer = 0;
    }
  }

  function hasClassResource() {
    return Boolean(player.classResource && player.classResource.id);
  }

  function getClassResourceLabel() {
    if (!hasClassResource()) {
      return "职业资源";
    }
    return player.classResource.shortLabel || player.classResource.label || "职业资源";
  }

  function gainPlayerClassResource(amount) {
    if (!hasClassResource() || !amount) {
      return 0;
    }
    const previous = player.classResource.current;
    player.classResource.current = clamp(player.classResource.current + amount, 0, player.classResource.max);
    return player.classResource.current - previous;
  }

  function spendPlayerClassResource(amount) {
    if (!hasClassResource() || !amount) {
      return true;
    }
    if (player.classResource.current < amount) {
      return false;
    }
    player.classResource.current -= amount;
    return true;
  }

  function getResolvedUltimateSkills() {
    return getUltimateSkills().filter(Boolean);
  }

  function getAffordableUltimateSkills() {
    return getResolvedUltimateSkills().filter(function filterSkill(skill) {
      return playerUltimate.current >= (skill.ultimateChargeCost || 0);
    });
  }

  function getPrimaryUltimateSkill(skillsList) {
    const list = skillsList || getResolvedUltimateSkills();
    return list.length ? list[0] : null;
  }

  function cloneEnemyTemplate(template) {
    return {
      id: template.id,
      name: template.name,
      hp: template.hp,
      maxHp: template.hp,
      attack: template.attack,
      defense: template.defense,
      speed: template.speed,
      exp: template.exp,
      gold: template.gold,
      isBoss: Boolean(template.isBoss),
      skills: template.skills || [],
      role: template.role || "basic",
      assetKey: template.assetKey || (template.isBoss ? "boss" : "enemy"),
      encounterType: template.encounterType || (template.isBoss ? "boss" : "normal"),
      dropTableId: template.dropTableId || "",
    };
  }

  function getEnemyTemplate(tile, playerLevel) {
    const levelScale = Math.max(0, playerLevel - 1);
    if (tile === 5) {
      return {
        id: "boss",
        name: "深渊主祭",
        hp: 132 + levelScale * 16,
        attack: 14 + levelScale * 2,
        defense: 5 + Math.floor(levelScale * 0.8),
        speed: 9 + Math.floor(levelScale * 0.5),
        exp: 90 + levelScale * 12,
        gold: 80 + levelScale * 10,
        isBoss: true,
        skills: ["shadow_blast", "devour"],
        role: "boss",
        assetKey: "boss",
        encounterType: "boss",
        dropTableId: "boss_default",
      };
    }

    const variants = [
      { name: "史莱姆", hp: 30, attack: 6, defense: 1, speed: 5, exp: 16, gold: 12 },
      { name: "哥布林", hp: 38, attack: 8, defense: 2, speed: 7, exp: 20, gold: 16 },
      { name: "骷髅兵", hp: 46, attack: 9, defense: 3, speed: 6, exp: 24, gold: 18 },
    ];
    const pick = variants[Math.floor(Math.random() * variants.length)];
    return {
      id: "enemy",
      name: pick.name,
      hp: pick.hp + levelScale * 8,
      attack: pick.attack + levelScale * 2,
      defense: pick.defense + Math.floor(levelScale * 0.7),
      speed: pick.speed + Math.floor(levelScale * 0.4),
      exp: pick.exp + levelScale * 5,
      gold: pick.gold + levelScale * 4,
      isBoss: false,
      skills: [],
      role: "basic",
      assetKey: "enemy",
      encounterType: "normal",
      dropTableId: "field_default",
    };
  }

  function getStatusBagForSide(side) {
    return side === "player" ? playerStatus : enemyStatus;
  }

  function getUnitForSide(side) {
    return side === "player" ? player : currentEnemy;
  }

  function getUnitLabel(side) {
    const unit = getUnitForSide(side);
    return unit ? unit.name : "单位";
  }

  function syncTimelineActors() {
    if (!timelineState || !timelineApi.setActorState) {
      return;
    }
    timelineApi.setActorState(timelineState, "player", {
      label: player.name,
      hp: player.hp,
      maxHp: player.maxHp,
      speed: getEffectiveSpeed(player, playerStatus),
      canAct: player.hp > 0,
    });
    if (currentEnemy) {
      timelineApi.setActorState(timelineState, "enemy", {
        label: currentEnemy.name,
        hp: currentEnemy.hp,
        maxHp: currentEnemy.maxHp,
        speed: getEffectiveSpeed(currentEnemy, enemyStatus),
        canAct: currentEnemy.hp > 0,
      });
    }
    timelineState.pendingInsertWindow = pendingInsertWindow;
    roundCount = timelineState.roundIndex || roundCount;
  }

  function getCurrentTimelineActor() {
    if (!timelineState || !timelineApi.getCurrentActor) {
      return null;
    }
    return timelineApi.getCurrentActor(timelineState);
  }

  function isPlayerTurn() {
    const actor = getCurrentTimelineActor();
    return Boolean(actor && actor.side === "player");
  }

  function getUltimateSnapshot() {
    const allSkills = getResolvedUltimateSkills();
    const availableSkills = getAffordableUltimateSkills();
    const primarySkill = getPrimaryUltimateSkill(allSkills);
    return {
      current: playerUltimate.current,
      max: playerUltimate.max,
      primarySkillId: primarySkill ? primarySkill.id : "",
      primarySkillName: primarySkill ? primarySkill.name : "",
      skillIds: allSkills.map(function mapSkill(skill) { return skill.id; }),
      availableSkillIds: availableSkills.map(function mapSkill(skill) { return skill.id; }),
      canActNow: isPlayerTurn() && !locked && availableSkills.length > 0,
      canInsert: Boolean(pendingInsertWindow && pendingInsertWindow.open && availableSkills.length > 0),
    };
  }

  function snapshotState() {
    syncTimelineActors();
    const currentActor = getCurrentTimelineActor();
    const timelineSnapshot = timelineApi.cloneTimelineState ? timelineApi.cloneTimelineState(timelineState) : timelineState;
    if (timelineSnapshot) {
      timelineSnapshot.pendingInsertWindow = pendingInsertWindow;
    }
    return createCombatSnapshot({
      inCombat: state === "combat",
      phase: state,
      playerTurn: Boolean(currentActor && currentActor.side === "player"),
      enemy: currentEnemy,
      enemyTile: sourceTile,
      locked: locked,
      round: timelineState ? timelineState.roundIndex : roundCount,
      pendingAction: currentActor ? currentActor.side : "",
      currentActorId: currentActor ? currentActor.unitId : "",
      enemyIntent: getEnemyIntentSnapshot(),
      insertWindow: pendingInsertWindow,
      ultimate: getUltimateSnapshot(),
      timeline: timelineSnapshot,
    });
  }

  function emitSnapshot() {
    emitState(snapshotState());
  }

  function gainExpAndMaybeLevelUp(expValue) {
    player.exp += expValue;
    log("获得经验 " + expValue + " 点。", { type: "reward", source: "system", turn: "end" });
    while (player.exp >= player.expToNext) {
      player.exp -= player.expToNext;
      player.level += 1;
      player.maxHp += 18;
      player.maxMp += 8;
      player.attack += 4;
      player.defense += 2;
      player.speed += 1;
      player.hp = player.maxHp;
      player.mp = player.maxMp;
      player.expToNext = Math.floor(player.expToNext * 1.35);
      log("升级了，当前 Lv." + player.level + "，状态已回满。", { type: "level_up", source: "player", emphasis: true, turn: "end" });
      if (config.onLevelUp) {
        config.onLevelUp(player.level);
      }
    }
    emitStatus();
  }

  function gainUltimateCharge(amount, sourceLabel) {
    const gained = gainCharge(playerUltimate, amount);
    if (gained > 0) {
      log((sourceLabel || "战斗节奏") + " 为你积累了 " + gained + " 点终结充能。", { type: "ultimate_gain", source: "player", turn: "timeline" });
    }
    return gained;
  }

  function spendUltimateCharge(amount) {
    return spendCharge(playerUltimate, amount);
  }

  function refreshInsertWindow(reason) {
    const actor = getCurrentTimelineActor();
    const availableSkills = getAffordableUltimateSkills();
    pendingInsertWindow = createInsertWindowSpec({
      actor: actor,
      availableSkills: availableSkills,
      sourceUnitId: "player",
      reason: reason || "enemy_turn",
    });
  }

  function closeInsertWindow() {
    pendingInsertWindow = null;
    if (timelineState) {
      timelineState.pendingInsertWindow = null;
    }
  }

  function clearEnemyIntent() {
    pendingEnemyIntent = null;
  }

  function createEnemyIntent(config) {
    const data = config || {};
    return {
      id: data.id || "",
      label: data.label || "普通攻击",
      summary: data.summary || "",
      pressure: data.pressure || "neutral",
      timingText: data.timingText || "",
      insertHint: data.insertHint || "",
      actionContext: data.actionContext || null,
      execute: typeof data.execute === "function" ? data.execute : function noop() {},
    };
  }

  function getEnemyIntentSnapshot() {
    if (!pendingEnemyIntent) {
      return null;
    }
    return {
      id: pendingEnemyIntent.id,
      label: pendingEnemyIntent.label,
      summary: pendingEnemyIntent.summary,
      pressure: pendingEnemyIntent.pressure,
      timingText: pendingEnemyIntent.timingText,
      insertHint: pendingEnemyIntent.insertHint,
    };
  }

  function planEnemyIntent() {
    const enemySpeed = getEffectiveSpeed(currentEnemy, enemyStatus);

    function enemyActionFrame(actionId, targetUnitId, timingLike) {
      return createActionFrame({
        sourceUnitId: "enemy",
        targetUnitId: targetUnitId,
        actionId: actionId,
        actionType: "skill",
        timingLike: timingLike,
        timelineApi: timelineApi,
        sourceSpeed: enemySpeed,
      });
    }

    function emitEnemyHitLog(message, damage) {
      log(message, { type: "enemy_action", source: "enemy", turn: "enemy" });
      emitEffect("playerHit", { damage: damage, enemy: currentEnemy });
    }

    function emitEnemySetupLog(message) {
      log(message, { type: "enemy_action", source: "enemy", turn: "enemy" });
      emitEffect("enemyHit", { damage: 0, enemy: currentEnemy });
    }

    if (currentEnemy.isBoss && currentEnemy.role === "pack_alpha" && Math.random() < 0.55) {
      return createEnemyIntent({
        id: "pack_alpha_howl",
        label: "狼群号令",
        summary: "高伤害并进入狂怒",
        pressure: "burst",
        timingText: "延迟 62",
        insertHint: "若现在插入，可抢在下一波重击前出手。",
        actionContext: enemyActionFrame("pack_alpha_howl", "player", { baseDelay: 62 }),
        execute: function executePackAlphaHowl() {
          const rawDamage = rollDamage(currentEnemy.attack, 1.35, player.defense, rand);
          const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
          enemyStatus.attackBuffValue = 0.18;
          enemyStatus.attackBuffTurns = 2;
          emitEnemyHitLog(currentEnemy.name + " 号召狼群，造成 " + dealt + " 点伤害并进入狂怒状态。", dealt);
        },
      });
    }
    if (currentEnemy.isBoss && currentEnemy.role === "arcane_warden" && Math.random() < 0.52) {
      return createEnemyIntent({
        id: "arcane_pulse",
        label: "禁术震波",
        summary: "中伤害并施加减速",
        pressure: "control",
        timingText: "压后 +12",
        insertHint: "若现在插入，可避免被减速后再掉出节奏。",
        actionContext: enemyActionFrame("arcane_pulse", "player", { baseDelay: 60, delayTarget: 12 }),
        execute: function executeArcanePulse() {
          const rawDamage = rollDamage(currentEnemy.attack, 1.45, player.defense, rand);
          const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
          playerStatus.speedDownTurns = 1;
          playerStatus.speedDownValue = 2;
          emitEnemyHitLog(currentEnemy.name + " 释放禁术震波，造成 " + dealt + " 点伤害并使你减速。", dealt);
        },
      });
    }
    if (currentEnemy.isBoss && currentEnemy.role === "inferno_tyrant" && Math.random() < 0.58) {
      return createEnemyIntent({
        id: "inferno_breath",
        label: "烈焰喷吐",
        summary: "中伤害并附带灼烧",
        pressure: "burst",
        timingText: "压后 +6",
        insertHint: "若现在插入，可先手压血，避免承受持续灼烧。",
        actionContext: enemyActionFrame("inferno_breath", "player", { baseDelay: 64, delayTarget: 6 }),
        execute: function executeInfernoBreath() {
          const rawDamage = rollDamage(currentEnemy.attack, 1.28, player.defense, rand);
          const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
          playerStatus.poisonTurns = 2;
          playerStatus.poisonDamage = 7;
          emitEnemyHitLog(currentEnemy.name + " 喷吐烈焰，造成 " + dealt + " 点伤害并附带灼烧。", dealt);
        },
      });
    }
    if (currentEnemy.role === "poisoner" && Math.random() < 0.34) {
      return createEnemyIntent({
        id: "poison_bite",
        label: "毒咬",
        summary: "低伤害并附加中毒",
        pressure: "control",
        timingText: "压后 +4",
        insertHint: "若现在插入，可在中毒生效前先抢一手。",
        actionContext: enemyActionFrame("poison_bite", "player", { baseDelay: 56, delayTarget: 4 }),
        execute: function executePoisonBite() {
          const rawDamage = rollDamage(currentEnemy.attack, 0.9, player.defense, rand);
          const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
          playerStatus.poisonTurns = 2;
          playerStatus.poisonDamage = 4;
          emitEnemyHitLog(currentEnemy.name + " 的毒咬造成 " + dealt + " 点伤害，并让你进入中毒状态。", dealt);
        },
      });
    }
    if (currentEnemy.role === "caster" && Math.random() < 0.3) {
      return createEnemyIntent({
        id: "arcane_bolt",
        label: "奥术脉冲",
        summary: "中伤害并压慢你的节奏",
        pressure: "control",
        timingText: "压后 +6",
        insertHint: "若现在插入，可避免下一轮时间轴被拉开。",
        actionContext: enemyActionFrame("arcane_bolt", "player", { baseDelay: 58, delayTarget: 6 }),
        execute: function executeArcaneBolt() {
          const rawDamage = rollDamage(currentEnemy.attack, 1.22, player.defense, rand);
          const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
          playerStatus.speedDownTurns = 1;
          playerStatus.speedDownValue = 1;
          emitEnemyHitLog(currentEnemy.name + " 释放奥术脉冲，造成 " + dealt + " 点伤害。", dealt);
        },
      });
    }
    if (currentEnemy.role === "guardian" && Math.random() < 0.28) {
      return createEnemyIntent({
        id: "guardian_guard",
        label: "举盾固守",
        summary: "获得承伤并提前回轴",
        pressure: "guard",
        timingText: "抢轴 +8",
        insertHint: "若现在插入，可压在其防势成型前打出收益。",
        actionContext: enemyActionFrame("guardian_guard", "enemy", { baseDelay: 42, advanceSelf: 8 }),
        execute: function executeGuardianGuard() {
          enemyStatus.guard = Math.max(enemyStatus.guard, 0.35);
          emitEnemySetupLog(currentEnemy.name + " 举盾固守，准备承伤。");
        },
      });
    }
    if (currentEnemy.role === "berserker" && Math.random() < 0.32) {
      return createEnemyIntent({
        id: "berserk_charge",
        label: "狂化突进",
        summary: "中高伤害并蓄下一击",
        pressure: "burst",
        timingText: "延迟 60",
        insertHint: "若现在插入，可减少其连段滚雪球空间。",
        actionContext: enemyActionFrame("berserk_charge", "player", { baseDelay: 60 }),
        execute: function executeBerserkCharge() {
          const rawDamage = rollDamage(currentEnemy.attack, 1.22, player.defense, rand);
          const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
          enemyStatus.attackBuffValue = 0.14;
          enemyStatus.attackBuffTurns = 1;
          emitEnemyHitLog(currentEnemy.name + " 狂化突进，造成 " + dealt + " 点伤害，下一击会更重。", dealt);
        },
      });
    }
    if (currentEnemy.role === "stalker" && Math.random() < 0.36) {
      return createEnemyIntent({
        id: "stalker_strike",
        label: "林影突袭",
        summary: "中伤害并自提回轴",
        pressure: "burst",
        timingText: "抢轴 +6 · 压后 +4",
        insertHint: "若现在插入，可打乱其连续追击节奏。",
        actionContext: enemyActionFrame("stalker_strike", "player", { baseDelay: 50, advanceSelf: 6, delayTarget: 4 }),
        execute: function executeStalkerStrike() {
          const rawDamage = rollDamage(currentEnemy.attack, 1.16, player.defense, rand);
          const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
          playerStatus.poisonTurns = Math.max(playerStatus.poisonTurns, 1);
          playerStatus.poisonDamage = Math.max(playerStatus.poisonDamage, 5);
          emitEnemyHitLog(currentEnemy.name + " 借着林影突袭，造成 " + dealt + " 点伤害并留下毒性创口。", dealt);
        },
      });
    }
    if (currentEnemy.role === "mana_drain" && Math.random() < 0.34) {
      return createEnemyIntent({
        id: "mana_drain",
        label: "法力抽离",
        summary: "中伤害并抽走法力",
        pressure: "control",
        timingText: "压后 +4",
        insertHint: "若现在插入，可避免关键回合被抽空法力。",
        actionContext: enemyActionFrame("mana_drain", "player", { baseDelay: 58, delayTarget: 4 }),
        execute: function executeManaDrain() {
          const rawDamage = rollDamage(currentEnemy.attack, 1.08, player.defense, rand);
          const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
          const drained = Math.min(player.mp, 6);
          player.mp = clamp(player.mp - drained, 0, player.maxMp);
          emitEnemyHitLog(currentEnemy.name + " 抽离你的法力，造成 " + dealt + " 点伤害并吸走 " + drained + " 点法力。", dealt);
        },
      });
    }
    if (currentEnemy.role === "bulwark" && Math.random() < 0.3) {
      return createEnemyIntent({
        id: "bulwark_guard",
        label: "收缩防线",
        summary: "强化防势并准备下一击",
        pressure: "guard",
        timingText: "抢轴 +8",
        insertHint: "若现在插入，可趁其架势建立前抢伤害。",
        actionContext: enemyActionFrame("bulwark_guard", "enemy", { baseDelay: 46, advanceSelf: 8 }),
        execute: function executeBulwarkGuard() {
          enemyStatus.guard = Math.max(enemyStatus.guard, 0.42);
          enemyStatus.attackBuffValue = Math.max(enemyStatus.attackBuffValue, 0.12);
          enemyStatus.attackBuffTurns = 1;
          emitEnemySetupLog(currentEnemy.name + " 收缩防线，架起防势并准备下一次重击。");
        },
      });
    }
    if (currentEnemy.role === "pyromancer" && Math.random() < 0.34) {
      return createEnemyIntent({
        id: "ember_rain",
        label: "灵火灰烬",
        summary: "中伤害并附加灼烧",
        pressure: "control",
        timingText: "压后 +5",
        insertHint: "若现在插入，可减少持续伤害滚雪球。",
        actionContext: enemyActionFrame("ember_rain", "player", { baseDelay: 60, delayTarget: 5 }),
        execute: function executeEmberRain() {
          const rawDamage = rollDamage(currentEnemy.attack, 1.14, player.defense, rand);
          const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
          playerStatus.poisonTurns = Math.max(playerStatus.poisonTurns, 2);
          playerStatus.poisonDamage = Math.max(playerStatus.poisonDamage, 6);
          emitEnemyHitLog(currentEnemy.name + " 洒下灵火灰烬，造成 " + dealt + " 点伤害并附加灼烧。", dealt);
        },
      });
    }

    return createEnemyIntent({
      id: "enemy_attack",
      label: "普通攻击",
      summary: "稳定造成伤害",
      pressure: "neutral",
      timingText: "延迟 54",
      insertHint: "若现在插入，可纯粹争抢节奏。",
      actionContext: enemyActionFrame("enemy_attack", "player", { baseDelay: 54 }),
      execute: function executeBasicAttack() {
        const rawDamage = rollDamage(getEffectiveAttack(currentEnemy, enemyStatus), 1, player.defense, rand);
        const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
        emitEnemyHitLog(currentEnemy.name + " 使用普通攻击，造成 " + dealt + " 点伤害。", dealt);
      },
    });
  }

  function finishCombat(result, reason) {
    if (state !== "combat") {
      return;
    }
    clearEnemyTimer();
    const payload = createCombatEndPayload({
      result: result,
      reason: reason || "",
      enemyTile: sourceTile,
      enemy: currentEnemy,
    });
    closeInsertWindow();
    clearEnemyIntent();
    state = "idle";
    locked = false;
    roundCount = 0;
    timelineState = null;
    playerUltimate = createUltimateRuntime();
    emitSnapshot();
    if (config.onCombatEnd) {
      config.onCombatEnd(payload);
    }
    currentEnemy = null;
    sourceTile = 0;
  }

  function finalizeAction(actionContext) {
    if (!timelineState || !timelineApi.resolveAction) {
      return;
    }
    closeInsertWindow();
    syncTimelineActors();
    createTimelineChangeLogs(actionContext, function resolveLabel(unitId) {
      return getUnitLabel(unitId === "player" ? "player" : "enemy");
    }).forEach(function eachEntry(entry) {
      log(entry.text, entry.meta);
    });
    timelineApi.resolveAction(timelineState, actionContext);
    roundCount = timelineState.roundIndex || roundCount;
    emitSnapshot();
    enterActiveTurn(false);
  }

  function handleDefeatIfNeeded(reason) {
    if (player.hp <= 0) {
      log("你被击败了。", { type: "defeat", source: "enemy", emphasis: true, turn: "end" });
      finishCombat("defeat", reason || "player_down");
      return true;
    }
    return false;
  }

  function handleVictoryIfNeeded(reason) {
    if (currentEnemy && currentEnemy.hp <= 0) {
      log("你击败了 " + currentEnemy.name + "。", { type: "victory", source: "player", emphasis: true, turn: "end" });
      gainExpAndMaybeLevelUp(currentEnemy.exp);
      finishCombat("victory", reason || "enemy_down");
      return true;
    }
    return false;
  }

  function enterActiveTurn(initial) {
    if (state !== "combat" || !timelineState) {
      return;
    }
    const actor = getCurrentTimelineActor();
    if (!actor) {
      return;
    }

    if (actor.side !== "enemy") {
      clearEnemyIntent();
    }

    const statusBag = getStatusBagForSide(actor.side);
    const unit = getUnitForSide(actor.side);
    const label = getUnitLabel(actor.side);

    tickStatusEffects({
      statusBag: statusBag,
      unit: unit,
      label: label,
      log: log,
    });
    emitStatus();
    syncTimelineActors();

    if (actor.side === "player") {
      if (handleDefeatIfNeeded("player_tick_down")) {
        return;
      }
    } else if (handleVictoryIfNeeded("enemy_tick_down")) {
      return;
    }

    if (actor.side === "enemy" && !pendingEnemyIntent) {
      pendingEnemyIntent = planEnemyIntent();
    }
    refreshInsertWindow(actor.side === "enemy" ? "enemy_turn" : "");
    emitSnapshot();

    if (actor.side === "player") {
      locked = false;
      if (!initial) {
        log("时间轴推进：轮到你行动。", { type: "turn_change", source: "system", turn: "player" });
      }
      emitSnapshot();
      return;
    }

    if (pendingInsertWindow) {
      locked = false;
      if (!initial) {
        log("终结技插入窗口已打开，现在可以抢在 " + (pendingEnemyIntent ? pendingEnemyIntent.label : label) + " 前出手。", { type: "ultimate_window", source: "system", emphasis: true, turn: "timeline" });
      }
      emitSnapshot();
      clearEnemyTimer();
      enemyTurnTimer = setTimeout(function delayedEnemyTurnAfterWindow() {
        enemyTurnTimer = 0;
        locked = true;
        closeInsertWindow();
        emitSnapshot();
        runEnemyTurn();
      }, 1400);
      return;
    }

    locked = true;
    if (!initial) {
      log("时间轴推进：" + label + " 即将行动。", { type: "turn_change", source: "system", turn: "enemy" });
    }
    emitSnapshot();
    clearEnemyTimer();
    enemyTurnTimer = setTimeout(function delayedEnemyTurn() {
      enemyTurnTimer = 0;
      runEnemyTurn();
    }, initial ? 320 : 420);
  }

  function startCombat(input) {
    if (!player || state === "combat" || !timelineApi.createTimelineState) {
      return false;
    }
    const encounter = typeof input === "object" && input !== null ? input : { tile: input };
    sourceTile = encounter.tile;
    currentEnemy = cloneEnemyTemplate(encounter.enemyTemplate || getEnemyTemplate(encounter.tile, player.level));
    playerStatus = createStatusRuntime();
    enemyStatus = createStatusRuntime();
    playerUltimate = createUltimateRuntime();
    clearEnemyIntent();
    if (typeof encounter.playerUltimateCharge === "number") {
      playerUltimate.current = clamp(encounter.playerUltimateCharge, 0, playerUltimate.max);
    }
    pendingInsertWindow = null;
    state = "combat";
    locked = true;
    roundCount = 0;
    clearEnemyTimer();
    timelineState = timelineApi.createTimelineState({
      actors: [
        { unitId: "player", side: "player", label: player.name, hp: player.hp, maxHp: player.maxHp, speed: getEffectiveSpeed(player, playerStatus) },
        { unitId: "enemy", side: "enemy", label: currentEnemy.name, hp: currentEnemy.hp, maxHp: currentEnemy.maxHp, speed: getEffectiveSpeed(currentEnemy, enemyStatus) },
      ],
    });

    const firstActor = getCurrentTimelineActor();
    log("遭遇 " + currentEnemy.name + "。", { type: "combat_start", source: "system", emphasis: true, turn: "start" });
    log(firstActor && firstActor.side === "player" ? "你抢到了先手。" : currentEnemy.name + " 抢在你前面进入了行动位。", {
      type: "initiative",
      source: firstActor && firstActor.side === "player" ? "player" : "enemy",
      turn: "start",
    });
    emitEffect("combatStart", { enemy: currentEnemy });
    emitSnapshot();
    enterActiveTurn(true);
    return true;
  }

  function applyPlayerSkill(skillId, actionMode) {
    const skill = resolveSkill(skillId);
    const isUltimateAction = (actionMode || (skill && skill.actionType)) === "ultimate";
    const playerCanActNormally = isPlayerTurn() && !locked;
    const canUseInsertWindow = isUltimateAction && canUseInsertWindowAction(pendingInsertWindow, skillId);
    if (!skill || state !== "combat" || (!playerCanActNormally && !canUseInsertWindow)) {
      return false;
    }
    if (skill.resourceCost && !spendPlayerClassResource(skill.resourceCost)) {
      log(getClassResourceLabel() + "不足，无法施放 " + skill.name + "。", { type: "resource_fail", source: "player" });
      return false;
    }
    if (player.mp < skill.cost) {
      if (skill.resourceCost) {
        gainPlayerClassResource(skill.resourceCost);
      }
      log("MP 不足，无法施放 " + skill.name + "。", { type: "resource_fail", source: "player" });
      return false;
    }
    if (isUltimateAction && !spendUltimateCharge(skill.ultimateChargeCost || 0)) {
      if (skill.resourceCost) {
        gainPlayerClassResource(skill.resourceCost);
      }
      log("终结充能不足，无法施放 " + skill.name + "。", { type: "resource_fail", source: "player" });
      return false;
    }

    clearEnemyTimer();
    closeInsertWindow();
    player.mp = clamp(player.mp - skill.cost, 0, player.maxMp);
    const attackValue = getEffectiveAttack(player, playerStatus);
    const actionContext = createActionFrame({
      sourceUnitId: "player",
      targetUnitId: "enemy",
      actionId: skill.id,
      actionType: skill.actionType || "skill",
      timingLike: skill,
      timelineApi: timelineApi,
      sourceSpeed: getEffectiveSpeed(player, playerStatus),
    });

    if (skill.effect === "damage") {
      let power = skill.power;
      if (skill.bonusFirst && isPlayerTurn()) {
        power += skill.bonusFirst;
      }
      const rawDamage = rollDamage(attackValue, power, currentEnemy.defense, rand);
      const dealt = applyDamageToTarget(currentEnemy, enemyStatus, rawDamage);
      log((isUltimateAction ? "你插入施放了 " : "你使用了 ") + skill.name + "，对 " + currentEnemy.name + " 造成 " + dealt + " 点伤害。", {
        type: isUltimateAction ? "ultimate_action" : "player_action",
        source: "player",
        emphasis: isUltimateAction,
        turn: "player",
      });
      emitEffect("enemyHit", { damage: dealt, enemy: currentEnemy });
    } else if (skill.effect === "heal") {
      const healValue = Math.max(1, Math.round((attackValue * Math.abs(skill.power) + player.level * 4) * rand(0.96, 1.08)));
      player.hp = clamp(player.hp + healValue, 0, player.maxHp);
      log("你施放了 " + skill.name + "，恢复了 " + healValue + " 点生命。", { type: isUltimateAction ? "ultimate_action" : "player_action", source: "player", emphasis: isUltimateAction, turn: "player" });
      emitEffect("playerHeal", { amount: healValue });
      actionContext.targetUnitId = "player";
    } else if (skill.effect === "guard") {
      playerStatus.guard = Math.max(playerStatus.guard, skill.guard || 0.3);
      log("你施放了 " + skill.name + "，准备承受下一波攻击。", { type: isUltimateAction ? "ultimate_action" : "player_action", source: "player", emphasis: isUltimateAction, turn: "player" });
      actionContext.targetUnitId = "player";
    } else if (skill.effect === "buff_attack") {
      playerStatus.attackBuffValue = skill.buff || 0.2;
      playerStatus.attackBuffTurns = skill.turns || 2;
      log("你施放了 " + skill.name + "，攻击力提升。", { type: isUltimateAction ? "ultimate_action" : "player_action", source: "player", emphasis: isUltimateAction, turn: "player" });
      actionContext.targetUnitId = "player";
    } else if (skill.effect === "restore_mp") {
      player.mp = clamp(player.mp + (skill.restoreMp || 6), 0, player.maxMp);
      playerStatus.guard = Math.max(playerStatus.guard, skill.guard || 0);
      log("你施放了 " + skill.name + "，恢复了法力。", { type: isUltimateAction ? "ultimate_action" : "player_action", source: "player", emphasis: isUltimateAction, turn: "player" });
      actionContext.targetUnitId = "player";
    } else if (skill.effect === "poison") {
      const rawDamage = rollDamage(attackValue, skill.power || 1, currentEnemy.defense, rand);
      const dealt = applyDamageToTarget(currentEnemy, enemyStatus, rawDamage);
      enemyStatus.poisonTurns = skill.poisonTurns || 2;
      enemyStatus.poisonDamage = skill.poisonDamage || 5;
      log("你使用了 " + skill.name + "，造成 " + dealt + " 点伤害并附加中毒。", {
        type: isUltimateAction ? "ultimate_action" : "player_action",
        source: "player",
        emphasis: isUltimateAction,
        turn: "player",
      });
      emitEffect("enemyHit", { damage: dealt, enemy: currentEnemy });
    } else if (skill.effect === "regen") {
      playerStatus.regenTurns = skill.regenTurns || 2;
      playerStatus.regenValue = skill.regenValue || 8;
      log("你施放了 " + skill.name + "，持续恢复开始生效。", { type: isUltimateAction ? "ultimate_action" : "player_action", source: "player", emphasis: isUltimateAction, turn: "player" });
      actionContext.targetUnitId = "player";
    } else if (skill.effect === "guard_heal") {
      const healValue = Math.max(1, Math.round((attackValue * Math.abs(skill.power) + player.level * 2) * rand(0.95, 1.06)));
      player.hp = clamp(player.hp + healValue, 0, player.maxHp);
      playerStatus.guard = Math.max(playerStatus.guard, skill.guard || 0.3);
      log("你施放了 " + skill.name + "，恢复了 " + healValue + " 点生命并获得减伤。", { type: isUltimateAction ? "ultimate_action" : "player_action", source: "player", emphasis: isUltimateAction, turn: "player" });
      emitEffect("playerHeal", { amount: healValue });
      actionContext.targetUnitId = "player";
    }

    if (!isUltimateAction && skill.resourceGain) {
      const gained = gainPlayerClassResource(skill.resourceGain);
      if (gained > 0) {
        log("你积累了 " + gained + " 点" + getClassResourceLabel() + "。", { type: "resource_gain", source: "player", turn: "player" });
      }
    }
    if (!isUltimateAction && skill.ultimateChargeGain) {
      gainUltimateCharge(skill.ultimateChargeGain, skill.name);
    } else if (isUltimateAction) {
      log("你消耗了 " + (skill.ultimateChargeCost || 0) + " 点终结充能。", { type: "ultimate_spend", source: "player", emphasis: true, turn: "player" });
    }

    emitStatus();
    syncTimelineActors();
    emitSnapshot();

    if (handleVictoryIfNeeded("enemy_down")) {
      return true;
    }

    locked = true;
    finalizeAction(actionContext);
    return true;
  }

  function enemySkillAction() {
    const intent = planEnemyIntent();
    intent.execute();
    return intent.actionContext;
  }

  function runEnemyTurn() {
    if (state !== "combat" || locked === false) {
      return;
    }
    const actor = getCurrentTimelineActor();
    if (!actor || actor.side !== "enemy" || !currentEnemy) {
      return;
    }

    closeInsertWindow();
    const intent = pendingEnemyIntent || planEnemyIntent();
    clearEnemyIntent();
    intent.execute();
    const actionContext = intent.actionContext;
    gainUltimateCharge(1, currentEnemy.name + " 的压制");
    emitStatus();
    syncTimelineActors();
    emitSnapshot();

    if (handleDefeatIfNeeded("player_down")) {
      return;
    }
    if (handleVictoryIfNeeded("enemy_down")) {
      return;
    }

    finalizeAction(actionContext);
  }

  function playerFlee() {
    if (state !== "combat" || !isPlayerTurn() || locked) {
      return false;
    }
    const baseRate = currentEnemy.isBoss ? 0.12 : 0.72;
    const speedBonus = clamp((getEffectiveSpeed(player, playerStatus) - getEffectiveSpeed(currentEnemy, enemyStatus)) * 0.03, -0.15, 0.18);
    const finalRate = clamp(baseRate + speedBonus, 0.04, 0.94);
    if (Math.random() <= finalRate) {
      log("你成功撤离了战斗。", { type: "flee", source: "player", turn: "end" });
      finishCombat("flee", "escaped");
      return true;
    }
    log("撤退失败，敌人堵住了去路。", { type: "flee_fail", source: "enemy", turn: "enemy" });
    locked = true;
    finalizeAction(createActionFrame({
      sourceUnitId: "player",
      targetUnitId: "enemy",
      actionId: "flee",
      actionType: "flee",
      timingLike: { baseDelay: 72 },
      timelineApi: timelineApi,
      sourceSpeed: getEffectiveSpeed(player, playerStatus),
    }));
    return false;
  }

  function playerAction(actionName) {
    const action = createCombatActionRequest(actionName);
    if (action.kind === "flee") {
      return playerFlee();
    }
    if (action.kind === "ultimate") {
      return applyPlayerSkill(action.skillId || action.actionId.replace(/^ultimate:/, ""), "ultimate");
    }
    return applyPlayerSkill(action.skillId);
  }

  function getState() {
    return snapshotState();
  }

  return {
    startCombat: startCombat,
    playerAction: playerAction,
    getState: getState,
  };
}

window.CombatSystem = {
  createCombatController: createCombatController,
};

