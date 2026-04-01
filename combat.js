function createCombatController(options) {
  const config = options || {};
  const player = config.player;
  const skills = config.skills || {};
  const resolveSkill = config.resolveSkill || function fallbackResolveSkill(skillId) { return skills[skillId] || null; };
  const onPlayerSkillResolved = typeof config.onPlayerSkillResolved === "function" ? config.onPlayerSkillResolved : null;
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
  const createPressureRuntime = effectsApi.createPressureState || function fallbackPressureState(unit, options) {
    const data = unit || {};
    const config = options || {};
    if (Number.isFinite(Number(config.poiseMax))) {
      const maxPoiseOverride = clamp(toNumber(config.poiseMax, 16), 1, 180);
      return {
        poiseCurrent: maxPoiseOverride,
        poiseMax: maxPoiseOverride,
        stance: "steady",
        stanceLabel: "稳固",
        exposedTurns: 0,
        executionReady: false,
        chargeLevel: 0,
        chargeMax: clamp(toNumber(config.chargeMax, 2), 1, 9),
        chargeLabel: "",
        chargeActionName: "",
        chargeInterruptible: false,
        lastBreakSource: "",
      };
    }
    const hp = Math.max(1, toNumber(data.maxHp || data.hp, 1));
    const defense = Math.max(0, toNumber(data.defense, 0));
    const speed = Math.max(1, toNumber(data.speed, 1));
    const role = config.role || data.role || "";
    const roleBonus = role === "boss" ? 14 : role === "guardian" || role === "bulwark" ? 8 : 0;
    const maxPoise = clamp(Math.round(10 + hp * 0.1 + defense * 4 + speed * 1.2 + roleBonus), 8, 180);
    return {
      poiseCurrent: maxPoise,
      poiseMax: maxPoise,
      stance: "steady",
      stanceLabel: "稳固",
      exposedTurns: 0,
      executionReady: false,
      chargeLevel: 0,
      chargeMax: clamp(toNumber(config.chargeMax, 2), 1, 9),
      chargeLabel: "",
      chargeActionName: "",
      chargeInterruptible: false,
      lastBreakSource: "",
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
  const applyPoiseDamage = effectsApi.applyPoiseDamage || function fallbackApplyPoiseDamage(pressureState, amount, options) {
    const stateBag = pressureState;
    const value = Math.max(0, toNumber(amount, 0));
    if (!stateBag || !value || stateBag.executionReady) {
      return {
        applied: 0,
        broken: false,
        previous: stateBag ? stateBag.poiseCurrent : 0,
        current: stateBag ? stateBag.poiseCurrent : 0,
      };
    }
    const previous = stateBag.poiseCurrent;
    stateBag.poiseCurrent = clamp(stateBag.poiseCurrent - value, 0, stateBag.poiseMax);
    const broken = stateBag.poiseCurrent === 0;
    if (broken) {
      stateBag.stance = "broken";
      stateBag.stanceLabel = "失衡";
      stateBag.exposedTurns = Math.max(stateBag.exposedTurns, 1);
      stateBag.executionReady = true;
      stateBag.lastBreakSource = options && options.sourceUnitId ? options.sourceUnitId : "";
    }
    return {
      applied: previous - stateBag.poiseCurrent,
      broken: broken,
      previous: previous,
      current: stateBag.poiseCurrent,
    };
  };
  const recoverPressureWindow = effectsApi.recoverPressureWindow || function fallbackRecoverPressureWindow(pressureState) {
    if (!pressureState) {
      return { recovered: false, remaining: 0 };
    }
    if (pressureState.exposedTurns > 0) {
      pressureState.exposedTurns -= 1;
      if (pressureState.exposedTurns <= 0) {
        pressureState.exposedTurns = 0;
        pressureState.executionReady = false;
        pressureState.stance = "steady";
        pressureState.stanceLabel = "稳固";
        pressureState.poiseCurrent = pressureState.poiseMax;
        pressureState.lastBreakSource = "";
        pressureState.chargeActionName = "";
        pressureState.chargeInterruptible = false;
        return { recovered: true, remaining: 0 };
      }
    }
    return { recovered: false, remaining: pressureState.exposedTurns };
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
  function inferPoiseDamage(timingLike) {
    const timing = timingLike || {};
    if (Number.isFinite(Number(timing.poiseDamage))) {
      return Math.max(0, toNumber(timing.poiseDamage, 0));
    }
    if (timing.effect !== "damage" && timing.effect !== "poison") {
      return 0;
    }
    const power = Math.max(0, toNumber(timing.power, 1));
    const delayBonus = toNumber(timing.delayTarget, 0) > 0 ? 1 : 0;
    const advanceBonus = toNumber(timing.advanceSelf, 0) > 0 ? 1 : 0;
    const ultimateBonus = timing.actionType === "ultimate" ? 2 : 0;
    return clamp(Math.round(power * 2 + delayBonus + advanceBonus + ultimateBonus), 1, 12);
  }
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
      poiseDamage: inferPoiseDamage(timing),
      breakBonusDamageRatio: Math.max(0, toNumber(timing.breakBonusDamageRatio, timing.actionType === "ultimate" ? 0.28 : 0.18)),
      bonusVsChargingRatio: Math.max(0, toNumber(timing.bonusVsChargingRatio, 0)),
      bonusVsBrokenRatio: Math.max(0, toNumber(timing.bonusVsBrokenRatio, 0)),
      poiseBonusVsCharging: Math.max(0, toNumber(timing.poiseBonusVsCharging, 0)),
      interruptCharge: timing.interruptCharge !== false && inferPoiseDamage(timing) > 0,
      grantsExecutionWindow: timing.grantsExecutionWindow !== false,
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
  let pendingChargedEnemyAction = null;
  let playerUltimate = createUltimateRuntime();
  let playerStatus = createStatusRuntime();
  let enemyStatus = createStatusRuntime();
  let playerPressure = createPressureRuntime(player, { side: "player" });
  let enemyPressure = createPressureRuntime(null, { side: "enemy" });

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
      poiseMax: Number.isFinite(Number(template.poiseMax)) ? Number(template.poiseMax) : null,
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

  function getPressureStateForSide(side) {
    return side === "player" ? playerPressure : enemyPressure;
  }

  function getPressureSnapshot(side) {
    const pressureState = getPressureStateForSide(side);
    const statusBag = getStatusBagForSide(side);
    if (!pressureState) {
      return null;
    }
    let stance = pressureState.stance || "steady";
    let stanceLabel = pressureState.stanceLabel || "稳固";
    let chargeLevel = pressureState.chargeLevel || 0;
    let chargeMax = pressureState.chargeMax || 0;
    let chargeLabel = pressureState.chargeLabel || "";
    let chargeActionName = pressureState.chargeActionName || "";
    let chargeInterruptible = Boolean(pressureState.chargeInterruptible);

    if (!pressureState.executionReady && side === "enemy" && pendingEnemyIntent && pendingEnemyIntent.chargeLevel > 0) {
      stance = "charging";
      stanceLabel = pendingEnemyIntent.chargeLabel || "蓄势";
      chargeLevel = pendingEnemyIntent.chargeLevel;
      chargeMax = pendingEnemyIntent.chargeMax || Math.max(chargeLevel, chargeMax || 1);
      chargeLabel = pendingEnemyIntent.chargeLabel || "蓄势";
      chargeActionName = pendingEnemyIntent.label || chargeActionName;
      chargeInterruptible = Boolean(pendingEnemyIntent.interruptible);
    } else if (!pressureState.executionReady && statusBag && statusBag.guard > 0) {
      stance = "guarded";
      stanceLabel = "防守";
    }

    return {
      poiseCurrent: pressureState.poiseCurrent,
      poiseMax: pressureState.poiseMax,
      poisePercent: pressureState.poiseMax > 0 ? Math.round((pressureState.poiseCurrent / pressureState.poiseMax) * 100) : 0,
      stance: stance,
      stanceLabel: stanceLabel,
      exposedTurns: pressureState.exposedTurns || 0,
      executionReady: Boolean(pressureState.executionReady),
      chargeLevel: chargeLevel,
      chargeMax: chargeMax,
      chargeLabel: chargeLabel,
      chargeActionName: chargeActionName,
      chargeInterruptible: chargeInterruptible,
    };
  }

  function clearEnemyCharge() {
    pendingChargedEnemyAction = null;
    if (!enemyPressure) {
      return;
    }
    enemyPressure.chargeLevel = 0;
    enemyPressure.chargeLabel = "";
    enemyPressure.chargeActionName = "";
    enemyPressure.chargeInterruptible = false;
    enemyPressure.chargeMax = Math.max(enemyPressure.chargeMax || 1, 1);
  }

  function beginEnemyCharge(config) {
    const data = config || {};
    pendingChargedEnemyAction = data.intent || null;
    enemyPressure.executionReady = false;
    enemyPressure.exposedTurns = 0;
    enemyPressure.chargeLevel = Math.max(1, toNumber(data.chargeLevel, 1));
    enemyPressure.chargeMax = Math.max(enemyPressure.chargeLevel, toNumber(data.chargeMax, enemyPressure.chargeLevel));
    enemyPressure.chargeLabel = data.chargeLabel || "蓄势";
    enemyPressure.chargeActionName = data.actionName || (data.intent ? data.intent.label || "" : "");
    enemyPressure.chargeInterruptible = data.interruptible !== false;
    enemyPressure.stance = "charging";
    enemyPressure.stanceLabel = enemyPressure.chargeLabel;
  }

  function interruptEnemyCharge(sourceActionContext) {
    if (!pendingChargedEnemyAction || !enemyPressure || !timelineState || !timelineApi.getActor || !timelineApi.setActorState) {
      return false;
    }
    const enemyActor = timelineApi.getActor(timelineState, "enemy");
    if (enemyActor) {
      timelineApi.setActorState(timelineState, "enemy", {
        currentAv: enemyActor.currentAv + 18,
      });
    }
    log(currentEnemy.name + " 的「" + (enemyPressure.chargeActionName || "蓄力") + "」被打断，行动被压后。", {
      type: "pressure_interrupt",
      source: sourceActionContext && sourceActionContext.sourceUnitId === "player" ? "player" : "enemy",
      emphasis: true,
      turn: "pressure",
    });
    clearEnemyIntent();
    clearEnemyCharge();
    return true;
  }

  function getPressureDamageProfile(targetSide, actionContext) {
    const pressureState = getPressureStateForSide(targetSide);
    const profile = {
      multiplier: 1,
      poiseBonus: 0,
      broken: false,
      charging: false,
    };
    if (!pressureState || !actionContext) {
      return profile;
    }
    if (pressureState.executionReady) {
      profile.broken = true;
      profile.multiplier *= 1 + Math.max(0, toNumber(actionContext.breakBonusDamageRatio, 0.18));
      profile.multiplier *= 1 + Math.max(0, toNumber(actionContext.bonusVsBrokenRatio, 0));
    }
    if (pressureState.chargeLevel > 0) {
      profile.charging = true;
      profile.multiplier *= 1 + Math.max(0, toNumber(actionContext.bonusVsChargingRatio, 0));
      profile.poiseBonus += Math.max(0, toNumber(actionContext.poiseBonusVsCharging, 0));
    }
    return profile;
  }

  function resolveDamageAgainstSide(targetSide, rawDamage, actionContext) {
    const profile = getPressureDamageProfile(targetSide, actionContext);
    return Math.max(1, Math.round(rawDamage * profile.multiplier));
  }

  function applyPressureDamageToSide(targetSide, actionContext) {
    const profile = getPressureDamageProfile(targetSide, actionContext);
    const totalPoiseDamage = Math.max(0, toNumber(actionContext && actionContext.poiseDamage, 0) + profile.poiseBonus);
    if (!actionContext || !totalPoiseDamage) {
      return { applied: 0, broken: false };
    }
    const targetPressure = getPressureStateForSide(targetSide);
    const targetLabel = getUnitLabel(targetSide);
    const outcome = applyPoiseDamage(targetPressure, totalPoiseDamage, {
      sourceUnitId: actionContext.sourceUnitId,
    });
    if (outcome.broken) {
      log(targetLabel + " 的架势被击穿，进入失衡窗口。", {
        type: "pressure_break",
        source: actionContext.sourceUnitId === "player" ? "player" : "enemy",
        emphasis: true,
        turn: "pressure",
      });
      if (targetSide === "enemy" && actionContext.interruptCharge) {
        interruptEnemyCharge(actionContext);
      }
    }
    return outcome;
  }

  function advancePressureWindowForSide(side) {
    const pressureState = getPressureStateForSide(side);
    const outcome = recoverPressureWindow(pressureState);
    if (outcome.recovered) {
      log(getUnitLabel(side) + " 重新稳住了架势。", {
        type: "pressure_recover",
        source: side,
        turn: "pressure",
      });
    }
    return outcome;
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
      playerPressure: getPressureSnapshot("player"),
      enemyPressure: getPressureSnapshot("enemy"),
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
      chargeLevel: Math.max(0, toNumber(data.chargeLevel, 0)),
      chargeMax: Math.max(0, toNumber(data.chargeMax, 0)),
      chargeLabel: data.chargeLabel || "",
      interruptible: Boolean(data.interruptible),
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
      chargeLevel: pendingEnemyIntent.chargeLevel,
      chargeMax: pendingEnemyIntent.chargeMax,
      chargeLabel: pendingEnemyIntent.chargeLabel,
      interruptible: Boolean(pendingEnemyIntent.interruptible),
    };
  }

  function planEnemyIntent() {
    const enemySpeed = getEffectiveSpeed(currentEnemy, enemyStatus);

    if (pendingChargedEnemyAction) {
      return pendingChargedEnemyAction;
    }

    function enemyActionFrame(actionId, targetUnitId, timingLike) {
      const timingData = Object.assign({
        effect: targetUnitId === "player" ? "damage" : "utility",
      }, timingLike || {});
      return createActionFrame({
        sourceUnitId: "enemy",
        targetUnitId: targetUnitId,
        actionId: actionId,
        actionType: "skill",
        timingLike: timingData,
        timelineApi: timelineApi,
        sourceSpeed: enemySpeed,
      });
    }

    function createChargeIntent(config) {
      const data = config || {};
      const releaseIntent = createEnemyIntent({
        id: data.releaseId,
        label: data.releaseLabel,
        summary: data.releaseSummary,
        pressure: data.releasePressure || "burst",
        timingText: data.releaseTimingText || "",
        insertHint: data.releaseInsertHint || "",
        actionContext: enemyActionFrame(data.releaseId, data.releaseTargetId || "player", data.releaseTimingLike || {}),
        execute: function executeReleasedIntent() {
          clearEnemyCharge();
          enemyPressure.stance = "steady";
          enemyPressure.stanceLabel = "稳固";
          data.releaseExecute();
        },
      });
      return createEnemyIntent({
        id: data.chargeId,
        label: data.chargeLabel,
        summary: data.chargeSummary || ("正在蓄力「" + data.releaseLabel + "」，可被打断。"),
        pressure: "charge",
        timingText: data.chargeTimingText || "蓄力 1 拍",
        insertHint: data.chargeInsertHint || "尽快击穿韧性，可打断该动作并压后敌方行动。",
        chargeLevel: Math.max(1, toNumber(data.chargeLevel, 1)),
        chargeMax: Math.max(1, toNumber(data.chargeMax, 1)),
        chargeLabel: data.chargeStateLabel || data.chargeLabel || "蓄势",
        interruptible: true,
        actionContext: enemyActionFrame(data.chargeId, "enemy", data.chargeTimingLike || { baseDelay: 44, advanceSelf: 0, poiseDamage: 0, interruptCharge: false }),
        execute: function executeChargeIntent() {
          beginEnemyCharge({
            intent: releaseIntent,
            chargeLevel: data.chargeLevel || 1,
            chargeMax: data.chargeMax || 1,
            chargeLabel: data.chargeStateLabel || data.chargeLabel || "蓄势",
            actionName: data.releaseLabel,
            interruptible: true,
          });
          emitEnemySetupLog(data.chargeLog || (currentEnemy.name + " 开始蓄力「" + data.releaseLabel + "」，下一拍会释放重击。"));
        },
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

    function createExecutionIntent(data) {
      return createEnemyIntent({
        id: data.id,
        label: data.label,
        summary: data.summary || "对失衡目标发动处决重击",
        pressure: "execution",
        timingText: data.timingText || "处决重击",
        insertHint: data.insertHint || "你已处于失衡窗口，若让敌方连上这一击会很危险。",
        actionContext: enemyActionFrame(data.id, data.targetId || "player", data.timingLike || { baseDelay: 40, power: 1.45, breakBonusDamageRatio: 0.32 }),
        execute: data.execute,
      });
    }

    if (playerPressure && playerPressure.executionReady) {
      if (currentEnemy.role === "execution_dummy") {
        return createExecutionIntent({
          id: "dummy_execution_drop",
          label: "处决重踏",
          summary: "专门针对失衡目标的试炼重击",
          timingText: "处决重击 · 压后 +8",
          insertHint: "你已处于失衡状态，若再吃下这招会被连续压制。",
          timingLike: { baseDelay: 36, delayTarget: 8, power: 1.32, breakBonusDamageRatio: 0.55 },
          execute: function executeDummyExecution() {
            const rawDamage = resolveDamageAgainstSide("player", rollDamage(currentEnemy.attack, 1.32, player.defense, rand), {
              breakBonusDamageRatio: 0.55,
              bonusVsBrokenRatio: 0.22,
            });
            const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
            emitEnemyHitLog(currentEnemy.name + " 看准你的失衡破绽，踏下处决重击，造成 " + dealt + " 点伤害。", dealt);
          },
        });
      }
      if (currentEnemy.isBoss && currentEnemy.role === "pack_alpha") {
        return createExecutionIntent({
          id: "pack_alpha_execution",
          label: "裂喉处刑",
          summary: "狼王扑向失衡目标，打出极重收尾",
          timingText: "处决重击 · 抢轴 +10",
          insertHint: "狼王已经锁定你的破绽，优先考虑自保与回稳。",
          timingLike: { baseDelay: 38, advanceSelf: 10, power: 1.48, breakBonusDamageRatio: 0.62 },
          execute: function executePackAlphaExecution() {
            const rawDamage = resolveDamageAgainstSide("player", rollDamage(currentEnemy.attack, 1.48, player.defense, rand), {
              breakBonusDamageRatio: 0.62,
              bonusVsBrokenRatio: 0.24,
            });
            const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
            enemyStatus.attackBuffValue = Math.max(enemyStatus.attackBuffValue, 0.1);
            enemyStatus.attackBuffTurns = Math.max(enemyStatus.attackBuffTurns, 1);
            emitEnemyHitLog(currentEnemy.name + " 撕开你的失衡防线，造成 " + dealt + " 点伤害并继续逼压。", dealt);
          },
        });
      }
      if (currentEnemy.isBoss && currentEnemy.role === "arcane_warden") {
        return createExecutionIntent({
          id: "arcane_warden_execution",
          label: "封印断罪",
          summary: "对失衡目标施加高压惩戒并抽离资源",
          timingText: "处决重击 · 压后 +10",
          insertHint: "典狱官会趁你失衡时连同资源一起压垮。",
          timingLike: { baseDelay: 40, delayTarget: 10, power: 1.42, breakBonusDamageRatio: 0.58 },
          execute: function executeArcaneWardenExecution() {
            const rawDamage = resolveDamageAgainstSide("player", rollDamage(currentEnemy.attack, 1.42, player.defense, rand), {
              breakBonusDamageRatio: 0.58,
              bonusVsBrokenRatio: 0.2,
            });
            const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
            const drained = Math.min(player.mp, 8);
            player.mp = clamp(player.mp - drained, 0, player.maxMp);
            playerStatus.speedDownTurns = Math.max(playerStatus.speedDownTurns, 1);
            playerStatus.speedDownValue = Math.max(playerStatus.speedDownValue, 2);
            emitEnemyHitLog(currentEnemy.name + " 对准你的破绽落下封印断罪，造成 " + dealt + " 点伤害并抽离 " + drained + " 点法力。", dealt);
          },
        });
      }
      if (currentEnemy.isBoss && currentEnemy.role === "inferno_tyrant") {
        return createExecutionIntent({
          id: "inferno_tyrant_execution",
          label: "熔核裁决",
          summary: "对失衡目标施放高压灼烧处决",
          timingText: "处决重击 · 灼烧",
          insertHint: "暴君已经进入收割节奏，最好先想办法活过这次爆压。",
          timingLike: { baseDelay: 42, delayTarget: 6, power: 1.5, breakBonusDamageRatio: 0.64 },
          execute: function executeInfernoTyrantExecution() {
            const rawDamage = resolveDamageAgainstSide("player", rollDamage(currentEnemy.attack, 1.5, player.defense, rand), {
              breakBonusDamageRatio: 0.64,
              bonusVsBrokenRatio: 0.26,
            });
            const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
            playerStatus.poisonTurns = Math.max(playerStatus.poisonTurns, 2);
            playerStatus.poisonDamage = Math.max(playerStatus.poisonDamage, 8);
            emitEnemyHitLog(currentEnemy.name + " 借着你的失衡压下熔核裁决，造成 " + dealt + " 点伤害并点燃灼烧。", dealt);
          },
        });
      }
      if (currentEnemy.role === "stalker" || currentEnemy.role === "swift") {
        return createExecutionIntent({
          id: "stalker_execution",
          label: "穿心追猎",
          summary: "高机动敌人锁定失衡破绽发起追击",
          timingText: "处决重击 · 抢轴 +8",
          timingLike: { baseDelay: 38, advanceSelf: 8, power: 1.28, breakBonusDamageRatio: 0.4 },
          execute: function executeStalkerExecution() {
            const rawDamage = resolveDamageAgainstSide("player", rollDamage(currentEnemy.attack, 1.28, player.defense, rand), {
              breakBonusDamageRatio: 0.4,
              bonusVsBrokenRatio: 0.14,
            });
            const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
            emitEnemyHitLog(currentEnemy.name + " 顺着你的失衡空档穿心追猎，造成 " + dealt + " 点伤害。", dealt);
          },
        });
      }
      if (currentEnemy.role === "poisoner" || currentEnemy.role === "pyromancer" || currentEnemy.role === "caster" || currentEnemy.role === "mana_drain") {
        return createExecutionIntent({
          id: "control_execution",
          label: currentEnemy.role === "mana_drain" ? "空耗断脉" : currentEnemy.role === "pyromancer" ? "燃痕处决" : "破绽咒袭",
          summary: "控场型敌人会在你失衡时补上一段高价值压制",
          timingText: currentEnemy.role === "mana_drain" ? "处决重击 · 吸蓝" : "处决重击 · 持续压制",
          timingLike: { baseDelay: 40, delayTarget: 6, power: 1.24, breakBonusDamageRatio: 0.36 },
          execute: function executeControlExecution() {
            const rawDamage = resolveDamageAgainstSide("player", rollDamage(currentEnemy.attack, 1.24, player.defense, rand), {
              breakBonusDamageRatio: 0.36,
              bonusVsBrokenRatio: 0.12,
            });
            const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
            if (currentEnemy.role === "mana_drain") {
              const drained = Math.min(player.mp, 5);
              player.mp = clamp(player.mp - drained, 0, player.maxMp);
              emitEnemyHitLog(currentEnemy.name + " 借着你的失衡空耗断脉，造成 " + dealt + " 点伤害并吸走 " + drained + " 点法力。", dealt);
              return;
            }
            if (currentEnemy.role === "pyromancer") {
              playerStatus.poisonTurns = Math.max(playerStatus.poisonTurns, 2);
              playerStatus.poisonDamage = Math.max(playerStatus.poisonDamage, 6);
              emitEnemyHitLog(currentEnemy.name + " 在你的破绽中灌入烈焰，造成 " + dealt + " 点伤害并附加灼烧。", dealt);
              return;
            }
            if (currentEnemy.role === "poisoner") {
              playerStatus.poisonTurns = Math.max(playerStatus.poisonTurns, 2);
              playerStatus.poisonDamage = Math.max(playerStatus.poisonDamage, 5);
            } else {
              playerStatus.speedDownTurns = Math.max(playerStatus.speedDownTurns, 1);
              playerStatus.speedDownValue = Math.max(playerStatus.speedDownValue, 1);
            }
            emitEnemyHitLog(currentEnemy.name + " 抓住你的失衡破绽补上咒袭，造成 " + dealt + " 点伤害。", dealt);
          },
        });
      }
      if (currentEnemy.role === "guardian" || currentEnemy.role === "bulwark" || currentEnemy.role === "berserker") {
        return createExecutionIntent({
          id: "brute_execution",
          label: currentEnemy.role === "guardian" || currentEnemy.role === "bulwark" ? "壁垒处刑" : "断骨重砸",
          summary: "重装 / 狂战型敌人会在你失衡时补上正面处决",
          timingText: currentEnemy.role === "berserker" ? "处决重击 · 爆发" : "处决重击 · 压后 +8",
          timingLike: { baseDelay: 42, delayTarget: 8, power: 1.34, breakBonusDamageRatio: 0.44 },
          execute: function executeBruteExecution() {
            const rawDamage = resolveDamageAgainstSide("player", rollDamage(currentEnemy.attack, 1.34, player.defense, rand), {
              breakBonusDamageRatio: 0.44,
              bonusVsBrokenRatio: 0.16,
            });
            const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
            if (currentEnemy.role === "guardian" || currentEnemy.role === "bulwark") {
              enemyStatus.guard = Math.max(enemyStatus.guard, 0.3);
            } else {
              enemyStatus.attackBuffValue = Math.max(enemyStatus.attackBuffValue, 0.12);
              enemyStatus.attackBuffTurns = Math.max(enemyStatus.attackBuffTurns, 1);
            }
            emitEnemyHitLog(currentEnemy.name + " 趁你失衡正面压上，造成 " + dealt + " 点伤害。", dealt);
          },
        });
      }
    }

    if (currentEnemy.role === "execution_dummy") {
      return createEnemyIntent({
        id: "dummy_break_strike",
        label: "碎势敲击",
        summary: "试炼偶会优先击穿你的架势，再接下一拍处决",
        pressure: "control",
        timingText: "韧性压制 · 抢轴 +14",
        insertHint: "若不尽快回稳，它会沿着失衡窗口继续追击。",
        actionContext: enemyActionFrame("dummy_break_strike", "player", { baseDelay: 34, advanceSelf: 14, poiseDamage: 18 }),
        execute: function executeDummyBreakStrike() {
          const rawDamage = rollDamage(currentEnemy.attack, 0.88, player.defense, rand);
          const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
          emitEnemyHitLog(currentEnemy.name + " 以碎势敲击撬开你的架势，造成 " + dealt + " 点伤害。", dealt);
        },
      });
    }

    if (currentEnemy.role === "charge_dummy") {
      return createChargeIntent({
        chargeId: "dummy_charge_start",
        chargeLabel: "蓄力姿态",
        chargeStateLabel: "试炼蓄势",
        chargeSummary: "正在蓄力「碎甲重锤」，可被打断。",
        chargeTimingLike: { baseDelay: 42, poiseDamage: 0, interruptCharge: false },
        chargeLog: currentEnemy.name + " 摆出沉重架势，正在蓄力「碎甲重锤」。",
        releaseId: "dummy_charge_release",
        releaseLabel: "碎甲重锤",
        releaseSummary: "蓄力重击，若未被打断会造成高伤害",
        releasePressure: "burst",
        releaseTimingText: "高伤害 · 可打断",
        releaseInsertHint: "若已击穿韧性，将直接打断这次重锤。",
        releaseTimingLike: { baseDelay: 66, delayTarget: 10, power: 1.55, poiseDamage: 5 },
        releaseExecute: function executeDummyRelease() {
          const rawDamage = rollDamage(currentEnemy.attack, 1.55, player.defense, rand);
          const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
          emitEnemyHitLog(currentEnemy.name + " 砸下碎甲重锤，造成 " + dealt + " 点伤害并把你压后。", dealt);
        },
      });
    }

    if (currentEnemy.isBoss && currentEnemy.role === "pack_alpha" && Math.random() < 0.55) {
      return createChargeIntent({
        chargeId: "pack_alpha_howl_charge",
        chargeLabel: "狼王号令",
        chargeStateLabel: "狂怒蓄势",
        chargeSummary: "正在蓄力「狼群号令」，若不打断将造成高伤害并进入狂怒。",
        chargeTimingLike: { baseDelay: 46, poiseDamage: 0, interruptCharge: false },
        chargeLog: currentEnemy.name + " 仰天长嚎，正在蓄力「狼群号令」。",
        releaseId: "pack_alpha_howl",
        releaseLabel: "狼群号令",
        releaseSummary: "高伤害并进入狂怒",
        releasePressure: "burst",
        releaseTimingText: "高伤害 · 可打断",
        releaseInsertHint: "若已击穿韧性，可直接打断狼王的咆哮节奏。",
        releaseTimingLike: { baseDelay: 62, power: 1.35, poiseDamage: 5 },
        releaseExecute: function executePackAlphaHowl() {
          const rawDamage = rollDamage(currentEnemy.attack, 1.35, player.defense, rand);
          const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
          enemyStatus.attackBuffValue = 0.18;
          enemyStatus.attackBuffTurns = 2;
          emitEnemyHitLog(currentEnemy.name + " 号召狼群，造成 " + dealt + " 点伤害并进入狂怒状态。", dealt);
        },
      });
    }
    if (currentEnemy.isBoss && currentEnemy.role === "arcane_warden" && Math.random() < 0.52) {
      return createChargeIntent({
        chargeId: "arcane_pulse_charge",
        chargeLabel: "禁术聚能",
        chargeStateLabel: "禁术蓄势",
        chargeSummary: "正在蓄力「禁术震波」，若不打断将造成减速压制。",
        chargeTimingLike: { baseDelay: 46, poiseDamage: 0, interruptCharge: false },
        chargeLog: currentEnemy.name + " 牵引封印残响，正在蓄力「禁术震波」。",
        releaseId: "arcane_pulse",
        releaseLabel: "禁术震波",
        releaseSummary: "中伤害并施加减速",
        releasePressure: "control",
        releaseTimingText: "压后 +12 · 可打断",
        releaseInsertHint: "若已击穿韧性，可直接阻断禁术震波。",
        releaseTimingLike: { baseDelay: 60, delayTarget: 12, power: 1.45, poiseDamage: 4 },
        releaseExecute: function executeArcanePulse() {
          const rawDamage = rollDamage(currentEnemy.attack, 1.45, player.defense, rand);
          const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
          playerStatus.speedDownTurns = 1;
          playerStatus.speedDownValue = 2;
          emitEnemyHitLog(currentEnemy.name + " 释放禁术震波，造成 " + dealt + " 点伤害并使你减速。", dealt);
        },
      });
    }
    if (currentEnemy.isBoss && currentEnemy.role === "inferno_tyrant" && Math.random() < 0.58) {
      return createChargeIntent({
        chargeId: "inferno_breath_charge",
        chargeLabel: "熔炎鼓荡",
        chargeStateLabel: "烈焰蓄势",
        chargeSummary: "正在蓄力「烈焰喷吐」，若不打断将附带持续灼烧。",
        chargeTimingLike: { baseDelay: 48, poiseDamage: 0, interruptCharge: false },
        chargeLog: currentEnemy.name + " 深吸灼焰，正在蓄力「烈焰喷吐」。",
        releaseId: "inferno_breath",
        releaseLabel: "烈焰喷吐",
        releaseSummary: "中伤害并附带灼烧",
        releasePressure: "burst",
        releaseTimingText: "压后 +6 · 可打断",
        releaseInsertHint: "若已击穿韧性，可打断整段喷吐。",
        releaseTimingLike: { baseDelay: 64, delayTarget: 6, power: 1.28, poiseDamage: 4 },
        releaseExecute: function executeInfernoBreath() {
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
        actionContext: enemyActionFrame("poison_bite", "player", { baseDelay: 56, delayTarget: 4, poiseDamage: 2 }),
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
        actionContext: enemyActionFrame("arcane_bolt", "player", { baseDelay: 58, delayTarget: 6, poiseDamage: 3 }),
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
        chargeLevel: 1,
        chargeMax: 1,
        chargeLabel: "防守架势",
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
        actionContext: enemyActionFrame("berserk_charge", "player", { baseDelay: 60, poiseDamage: 4 }),
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
        actionContext: enemyActionFrame("stalker_strike", "player", { baseDelay: 50, advanceSelf: 6, delayTarget: 4, poiseDamage: 3 }),
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
        actionContext: enemyActionFrame("mana_drain", "player", { baseDelay: 58, delayTarget: 4, poiseDamage: 3 }),
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
      return createChargeIntent({
        chargeId: "bulwark_guard_charge",
        chargeLabel: "收缩防线",
        chargeStateLabel: "防线成型",
        chargeSummary: "正在架起防线并准备重击，可被打断。",
        chargeTimingLike: { baseDelay: 40, advanceSelf: 6, poiseDamage: 0, interruptCharge: false },
        chargeLog: currentEnemy.name + " 收缩防线，准备借防势发动重击。",
        releaseId: "bulwark_guard",
        releaseLabel: "壁垒反压",
        releaseSummary: "强化防势后打出反压重击",
        releasePressure: "guard",
        releaseTimingText: "抢轴 +8 · 可打断",
        releaseInsertHint: "若已击穿韧性，可阻止这次防守反压。",
        releaseTimingLike: { baseDelay: 46, advanceSelf: 8, power: 1.18, poiseDamage: 4 },
        releaseExecute: function executeBulwarkGuard() {
          const rawDamage = rollDamage(currentEnemy.attack, 1.18, player.defense, rand);
          const dealt = applyDamageToTarget(player, playerStatus, rawDamage);
          enemyStatus.guard = Math.max(enemyStatus.guard, 0.42);
          enemyStatus.attackBuffValue = Math.max(enemyStatus.attackBuffValue, 0.12);
          enemyStatus.attackBuffTurns = 1;
          emitEnemyHitLog(currentEnemy.name + " 借着壁垒反压，造成 " + dealt + " 点伤害并架起防势。", dealt);
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
        actionContext: enemyActionFrame("ember_rain", "player", { baseDelay: 60, delayTarget: 5, poiseDamage: 3 }),
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
      actionContext: enemyActionFrame("enemy_attack", "player", { baseDelay: 54, poiseDamage: 2 }),
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
    clearEnemyCharge();
    state = "idle";
    locked = false;
    roundCount = 0;
    timelineState = null;
    playerUltimate = createUltimateRuntime();
    playerPressure = createPressureRuntime(player, { side: "player" });
    enemyPressure = createPressureRuntime(null, { side: "enemy" });
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

  function logPressureWindowHit(targetSide, profile) {
    if (!profile || profile.multiplier <= 1) {
      return;
    }
    if (profile.broken) {
      log(getUnitLabel(targetSide) + " 处于失衡，承受了更重的打击。", {
        type: "pressure_window",
        source: targetSide === "enemy" ? "player" : "enemy",
        emphasis: true,
        turn: "pressure",
      });
      return;
    }
    if (profile.charging) {
      log(getUnitLabel(targetSide) + " 在蓄力破绽中吃下了更重的打击。", {
        type: "pressure_charge_hit",
        source: targetSide === "enemy" ? "player" : "enemy",
        emphasis: true,
        turn: "pressure",
      });
    }
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

    if (actor.side === "enemy" && enemyPressure && enemyPressure.executionReady) {
      clearEnemyIntent();
      closeInsertWindow();
      locked = true;
      emitSnapshot();
      clearEnemyTimer();
      enemyTurnTimer = setTimeout(function delayedStaggeredEnemyTurn() {
        enemyTurnTimer = 0;
        runEnemyTurn();
      }, initial ? 220 : 260);
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
    playerPressure = createPressureRuntime(player, { side: "player" });
    enemyPressure = createPressureRuntime(currentEnemy, {
      side: "enemy",
      role: currentEnemy.role,
      poiseMax: currentEnemy.poiseMax,
    });
    clearEnemyIntent();
    clearEnemyCharge();
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
      const pressureProfile = getPressureDamageProfile("enemy", actionContext);
      const rawDamage = resolveDamageAgainstSide("enemy", rollDamage(attackValue, power, currentEnemy.defense, rand), actionContext);
      const dealt = applyDamageToTarget(currentEnemy, enemyStatus, rawDamage);
      logPressureWindowHit("enemy", pressureProfile);
      log((isUltimateAction ? "你插入施放了 " : "你使用了 ") + skill.name + "，对 " + currentEnemy.name + " 造成 " + dealt + " 点伤害。", {
        type: isUltimateAction ? "ultimate_action" : "player_action",
        source: "player",
        emphasis: isUltimateAction,
        turn: "player",
      });
      emitEffect("enemyHit", { damage: dealt, enemy: currentEnemy });
      applyPressureDamageToSide("enemy", actionContext);
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
      const pressureProfile = getPressureDamageProfile("enemy", actionContext);
      const rawDamage = resolveDamageAgainstSide("enemy", rollDamage(attackValue, skill.power || 1, currentEnemy.defense, rand), actionContext);
      const dealt = applyDamageToTarget(currentEnemy, enemyStatus, rawDamage);
      logPressureWindowHit("enemy", pressureProfile);
      enemyStatus.poisonTurns = skill.poisonTurns || 2;
      enemyStatus.poisonDamage = skill.poisonDamage || 5;
      log("你使用了 " + skill.name + "，造成 " + dealt + " 点伤害并附加中毒。", {
        type: isUltimateAction ? "ultimate_action" : "player_action",
        source: "player",
        emphasis: isUltimateAction,
        turn: "player",
      });
      emitEffect("enemyHit", { damage: dealt, enemy: currentEnemy });
      applyPressureDamageToSide("enemy", actionContext);
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
    if (onPlayerSkillResolved) {
      const professionResult = onPlayerSkillResolved(skill.id);
      if (professionResult && professionResult.gained > 0) {
        log(professionResult.label + " +" + professionResult.gained + "（" + ((professionResult.state && professionResult.state.valueText) || "") + "）。", {
          type: "profession_gain",
          source: "player",
          turn: "player",
        });
      }
      if (professionResult && professionResult.readied) {
        log(professionResult.label + "已成：当前适合交出强化技能兑现窗口。", {
          type: "profession_ready",
          source: "player",
          emphasis: true,
          turn: "player",
        });
      }
      if (professionResult && professionResult.consumed) {
        log(professionResult.label + "已兑现，重新进入下一轮铺势。", {
          type: "profession_spend",
          source: "player",
          turn: "player",
        });
      }
    }

    emitStatus();
    syncTimelineActors();
    emitSnapshot();

    if (handleVictoryIfNeeded("enemy_down")) {
      return true;
    }

    locked = true;
    advancePressureWindowForSide("player");
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
    if (enemyPressure && enemyPressure.executionReady) {
      clearEnemyIntent();
      clearEnemyCharge();
      log(currentEnemy.name + " 仍处于失衡，动作被打断并踉跄后退。", {
        type: "pressure_stagger",
        source: "player",
        emphasis: true,
        turn: "pressure",
      });
      advancePressureWindowForSide("enemy");
      const staggerContext = createActionFrame({
        sourceUnitId: "enemy",
        targetUnitId: "enemy",
        actionId: "stagger_recover",
        actionType: "stagger",
        timingLike: { baseDelay: 74, poiseDamage: 0, interruptCharge: false },
        timelineApi: timelineApi,
        sourceSpeed: getEffectiveSpeed(currentEnemy, enemyStatus),
      });
      emitStatus();
      syncTimelineActors();
      emitSnapshot();
      finalizeAction(staggerContext);
      return;
    }
    const intent = pendingEnemyIntent || planEnemyIntent();
    clearEnemyIntent();
    intent.execute();
    const actionContext = intent.actionContext;
    applyPressureDamageToSide("player", actionContext);
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

    advancePressureWindowForSide("enemy");
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

