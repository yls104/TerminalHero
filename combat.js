function createCombatController(options) {
  const config = options || {};
  const player = config.player;
  const skills = config.skills || {};
  const resolveSkill = config.resolveSkill || function fallbackResolveSkill(skillId) { return skills[skillId] || null; };
  const ioApi = window.CombatIO || {};
  const timelineApi = window.CombatTimeline || {};
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

  let currentEnemy = null;
  let state = "idle";
  let locked = false;
  let sourceTile = 0;
  let roundCount = 0;
  let enemyTurnTimer = 0;
  let timelineState = null;
  let playerStatus = createStatusBag();
  let enemyStatus = createStatusBag();

  function createStatusBag() {
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
  }

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

  function effectiveAttack(unit, statusBag) {
    const buff = statusBag.attackBuffTurns > 0 ? statusBag.attackBuffValue : 0;
    return unit.attack * (1 + buff);
  }

  function effectiveSpeed(unit, statusBag) {
    const slow = statusBag.speedDownTurns > 0 ? statusBag.speedDownValue : 0;
    return Math.max(1, unit.speed - slow);
  }

  function damageByFormula(attackerAttack, power, defenderDefense) {
    const base = Math.max(1, attackerAttack * power - defenderDefense);
    const swing = rand(0.92, 1.08);
    return Math.max(1, Math.round(base * swing));
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
      speed: effectiveSpeed(player, playerStatus),
      canAct: player.hp > 0,
    });
    if (currentEnemy) {
      timelineApi.setActorState(timelineState, "enemy", {
        label: currentEnemy.name,
        hp: currentEnemy.hp,
        maxHp: currentEnemy.maxHp,
        speed: effectiveSpeed(currentEnemy, enemyStatus),
        canAct: currentEnemy.hp > 0,
      });
    }
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

  function snapshotState() {
    syncTimelineActors();
    const currentActor = getCurrentTimelineActor();
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
      timeline: timelineApi.cloneTimelineState ? timelineApi.cloneTimelineState(timelineState) : timelineState,
    });
  }

  function emitSnapshot() {
    emitState(snapshotState());
  }

  function tickStatus(statusBag, unit, label) {
    if (statusBag.poisonTurns > 0) {
      unit.hp = clamp(unit.hp - statusBag.poisonDamage, 0, unit.maxHp);
      statusBag.poisonTurns -= 1;
      log(label + " 因中毒损失 " + statusBag.poisonDamage + " 点生命。", { type: "status", source: "system", turn: "tick" });
    }
    if (statusBag.regenTurns > 0) {
      unit.hp = clamp(unit.hp + statusBag.regenValue, 0, unit.maxHp);
      statusBag.regenTurns -= 1;
      log(label + " 受到持续恢复，回了 " + statusBag.regenValue + " 点生命。", { type: "status", source: "system", turn: "tick" });
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

  function applyDamage(target, statusBag, rawDamage) {
    const finalDamage = Math.max(1, Math.round(rawDamage * (1 - statusBag.guard)));
    target.hp = clamp(target.hp - finalDamage, 0, target.maxHp);
    return finalDamage;
  }

  function resolveActionDelay(unit, skillLike) {
    const baseAv = timelineApi.computeBaseAv ? timelineApi.computeBaseAv(effectiveSpeed(unit, unit === player ? playerStatus : enemyStatus)) : 52;
    const skillBaseDelay = toNumber(skillLike && skillLike.baseDelay, 52);
    return clamp(baseAv + (skillBaseDelay - 52), 18, 999);
  }

  function createActionContext(sourceUnitId, targetUnitId, actionId, actionType, timingLike) {
    const sourceUnit = sourceUnitId === "player" ? player : currentEnemy;
    const timing = timingLike || {};
    return {
      actionId: actionId,
      actionType: actionType || "skill",
      sourceUnitId: sourceUnitId,
      targetUnitId: targetUnitId || "",
      baseDelay: resolveActionDelay(sourceUnit, timing),
      advanceSelf: Math.max(0, toNumber(timing.advanceSelf, 0)),
      delayTarget: Math.max(0, toNumber(timing.delayTarget, 0)),
    };
  }

  function logTimelineChanges(actionContext) {
    if (!actionContext) {
      return;
    }
    const sourceLabel = getUnitLabel(actionContext.sourceUnitId === "player" ? "player" : "enemy");
    const targetLabel = actionContext.targetUnitId ? getUnitLabel(actionContext.targetUnitId === "player" ? "player" : "enemy") : "";
    if (actionContext.advanceSelf > 0) {
      log(sourceLabel + " 借势抢回了 " + actionContext.advanceSelf + " 点行动值。", { type: "timeline", source: "system", turn: "timeline" });
    }
    if (actionContext.delayTarget > 0 && targetLabel) {
      log(targetLabel + " 的行动被压后了 " + actionContext.delayTarget + " 点。", { type: "timeline", source: "system", turn: "timeline" });
    }
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
    state = "idle";
    locked = false;
    roundCount = 0;
    timelineState = null;
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
    syncTimelineActors();
    logTimelineChanges(actionContext);
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

    const statusBag = getStatusBagForSide(actor.side);
    const unit = getUnitForSide(actor.side);
    const label = getUnitLabel(actor.side);

    tickStatus(statusBag, unit, label);
    emitStatus();
    syncTimelineActors();

    if (actor.side === "player") {
      if (handleDefeatIfNeeded("player_tick_down")) {
        return;
      }
    } else if (handleVictoryIfNeeded("enemy_tick_down")) {
      return;
    }

    emitSnapshot();

    if (actor.side === "player") {
      locked = false;
      if (!initial) {
        log("时间轴推进：轮到你行动。", { type: "turn_change", source: "system", turn: "player" });
      }
      emitSnapshot();
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
    playerStatus = createStatusBag();
    enemyStatus = createStatusBag();
    state = "combat";
    locked = true;
    roundCount = 0;
    clearEnemyTimer();
    timelineState = timelineApi.createTimelineState({
      actors: [
        { unitId: "player", side: "player", label: player.name, hp: player.hp, maxHp: player.maxHp, speed: effectiveSpeed(player, playerStatus) },
        { unitId: "enemy", side: "enemy", label: currentEnemy.name, hp: currentEnemy.hp, maxHp: currentEnemy.maxHp, speed: effectiveSpeed(currentEnemy, enemyStatus) },
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

  function applyPlayerSkill(skillId) {
    const skill = resolveSkill(skillId);
    if (!skill || state !== "combat" || !isPlayerTurn() || locked) {
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

    player.mp = clamp(player.mp - skill.cost, 0, player.maxMp);
    const attackValue = effectiveAttack(player, playerStatus);
    const actionContext = createActionContext("player", "enemy", skill.id, skill.actionType || "skill", skill);

    if (skill.effect === "damage") {
      let power = skill.power;
      if (skill.bonusFirst && isPlayerTurn()) {
        power += skill.bonusFirst;
      }
      const rawDamage = damageByFormula(attackValue, power, currentEnemy.defense);
      const dealt = applyDamage(currentEnemy, enemyStatus, rawDamage);
      log("你使用了 " + skill.name + "，对 " + currentEnemy.name + " 造成 " + dealt + " 点伤害。", {
        type: "player_action",
        source: "player",
        turn: "player",
      });
      emitEffect("enemyHit", { damage: dealt, enemy: currentEnemy });
    } else if (skill.effect === "heal") {
      const healValue = Math.max(1, Math.round((attackValue * Math.abs(skill.power) + player.level * 4) * rand(0.96, 1.08)));
      player.hp = clamp(player.hp + healValue, 0, player.maxHp);
      log("你施放了 " + skill.name + "，恢复了 " + healValue + " 点生命。", { type: "player_action", source: "player", turn: "player" });
      emitEffect("playerHeal", { amount: healValue });
      actionContext.targetUnitId = "player";
    } else if (skill.effect === "guard") {
      playerStatus.guard = Math.max(playerStatus.guard, skill.guard || 0.3);
      log("你施放了 " + skill.name + "，准备承受下一波攻击。", { type: "player_action", source: "player", turn: "player" });
      actionContext.targetUnitId = "player";
    } else if (skill.effect === "buff_attack") {
      playerStatus.attackBuffValue = skill.buff || 0.2;
      playerStatus.attackBuffTurns = skill.turns || 2;
      log("你施放了 " + skill.name + "，攻击力提升。", { type: "player_action", source: "player", turn: "player" });
      actionContext.targetUnitId = "player";
    } else if (skill.effect === "restore_mp") {
      player.mp = clamp(player.mp + (skill.restoreMp || 6), 0, player.maxMp);
      playerStatus.guard = Math.max(playerStatus.guard, skill.guard || 0);
      log("你施放了 " + skill.name + "，恢复了法力。", { type: "player_action", source: "player", turn: "player" });
      actionContext.targetUnitId = "player";
    } else if (skill.effect === "poison") {
      const rawDamage = damageByFormula(attackValue, skill.power || 1, currentEnemy.defense);
      const dealt = applyDamage(currentEnemy, enemyStatus, rawDamage);
      enemyStatus.poisonTurns = skill.poisonTurns || 2;
      enemyStatus.poisonDamage = skill.poisonDamage || 5;
      log("你使用了 " + skill.name + "，造成 " + dealt + " 点伤害并附加中毒。", {
        type: "player_action",
        source: "player",
        turn: "player",
      });
      emitEffect("enemyHit", { damage: dealt, enemy: currentEnemy });
    } else if (skill.effect === "regen") {
      playerStatus.regenTurns = skill.regenTurns || 2;
      playerStatus.regenValue = skill.regenValue || 8;
      log("你施放了 " + skill.name + "，持续恢复开始生效。", { type: "player_action", source: "player", turn: "player" });
      actionContext.targetUnitId = "player";
    } else if (skill.effect === "guard_heal") {
      const healValue = Math.max(1, Math.round((attackValue * Math.abs(skill.power) + player.level * 2) * rand(0.95, 1.06)));
      player.hp = clamp(player.hp + healValue, 0, player.maxHp);
      playerStatus.guard = Math.max(playerStatus.guard, skill.guard || 0.3);
      log("你施放了 " + skill.name + "，恢复了 " + healValue + " 点生命并获得减伤。", { type: "player_action", source: "player", turn: "player" });
      emitEffect("playerHeal", { amount: healValue });
      actionContext.targetUnitId = "player";
    }

    if (skill.resourceGain) {
      const gained = gainPlayerClassResource(skill.resourceGain);
      if (gained > 0) {
        log("你积累了 " + gained + " 点" + getClassResourceLabel() + "。", { type: "resource_gain", source: "player", turn: "player" });
      }
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
    const role = currentEnemy.role || "basic";
    let actionContext = createActionContext("enemy", "player", "enemy_attack", "skill", { baseDelay: 54 });

    if (currentEnemy.isBoss && role === "pack_alpha" && Math.random() < 0.55) {
      const rawDamage = damageByFormula(currentEnemy.attack, 1.35, player.defense);
      const dealt = applyDamage(player, playerStatus, rawDamage);
      enemyStatus.attackBuffValue = 0.18;
      enemyStatus.attackBuffTurns = 2;
      log(currentEnemy.name + " 号召狼群，造成 " + dealt + " 点伤害并进入狂怒状态。", { type: "enemy_action", source: "enemy", turn: "enemy" });
      emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
      return createActionContext("enemy", "player", "pack_alpha_howl", "skill", { baseDelay: 62 });
    }
    if (currentEnemy.isBoss && role === "arcane_warden" && Math.random() < 0.52) {
      const rawDamage = damageByFormula(currentEnemy.attack, 1.45, player.defense);
      const dealt = applyDamage(player, playerStatus, rawDamage);
      playerStatus.speedDownTurns = 1;
      playerStatus.speedDownValue = 2;
      log(currentEnemy.name + " 释放禁术震波，造成 " + dealt + " 点伤害并使你减速。", { type: "enemy_action", source: "enemy", turn: "enemy" });
      emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
      return createActionContext("enemy", "player", "arcane_pulse", "skill", { baseDelay: 60, delayTarget: 12 });
    }
    if (currentEnemy.isBoss && role === "inferno_tyrant" && Math.random() < 0.58) {
      const rawDamage = damageByFormula(currentEnemy.attack, 1.28, player.defense);
      const dealt = applyDamage(player, playerStatus, rawDamage);
      playerStatus.poisonTurns = 2;
      playerStatus.poisonDamage = 7;
      log(currentEnemy.name + " 喷吐烈焰，造成 " + dealt + " 点伤害并附带灼烧。", { type: "enemy_action", source: "enemy", turn: "enemy" });
      emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
      return createActionContext("enemy", "player", "inferno_breath", "skill", { baseDelay: 64, delayTarget: 6 });
    }
    if (role === "poisoner" && Math.random() < 0.34) {
      const rawDamage = damageByFormula(currentEnemy.attack, 0.9, player.defense);
      const dealt = applyDamage(player, playerStatus, rawDamage);
      playerStatus.poisonTurns = 2;
      playerStatus.poisonDamage = 4;
      log(currentEnemy.name + " 的毒咬造成 " + dealt + " 点伤害，并让你进入中毒状态。", { type: "enemy_action", source: "enemy", turn: "enemy" });
      emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
      return createActionContext("enemy", "player", "poison_bite", "skill", { baseDelay: 56, delayTarget: 4 });
    }
    if (role === "caster" && Math.random() < 0.3) {
      const rawDamage = damageByFormula(currentEnemy.attack, 1.22, player.defense);
      const dealt = applyDamage(player, playerStatus, rawDamage);
      playerStatus.speedDownTurns = 1;
      playerStatus.speedDownValue = 1;
      log(currentEnemy.name + " 释放奥术脉冲，造成 " + dealt + " 点伤害。", { type: "enemy_action", source: "enemy", turn: "enemy" });
      emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
      return createActionContext("enemy", "player", "arcane_bolt", "skill", { baseDelay: 58, delayTarget: 6 });
    }
    if (role === "guardian" && Math.random() < 0.28) {
      enemyStatus.guard = Math.max(enemyStatus.guard, 0.35);
      log(currentEnemy.name + " 举盾固守，准备承伤。", { type: "enemy_action", source: "enemy", turn: "enemy" });
      emitEffect("enemyHit", { damage: 0, enemy: currentEnemy });
      return createActionContext("enemy", "enemy", "guardian_guard", "skill", { baseDelay: 42, advanceSelf: 8 });
    }
    if (role === "berserker" && Math.random() < 0.32) {
      const rawDamage = damageByFormula(currentEnemy.attack, 1.22, player.defense);
      const dealt = applyDamage(player, playerStatus, rawDamage);
      enemyStatus.attackBuffValue = 0.14;
      enemyStatus.attackBuffTurns = 1;
      log(currentEnemy.name + " 狂化突进，造成 " + dealt + " 点伤害，下一击会更重。", { type: "enemy_action", source: "enemy", turn: "enemy" });
      emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
      return createActionContext("enemy", "player", "berserk_charge", "skill", { baseDelay: 60 });
    }
    if (role === "stalker" && Math.random() < 0.36) {
      const rawDamage = damageByFormula(currentEnemy.attack, 1.16, player.defense);
      const dealt = applyDamage(player, playerStatus, rawDamage);
      playerStatus.poisonTurns = Math.max(playerStatus.poisonTurns, 1);
      playerStatus.poisonDamage = Math.max(playerStatus.poisonDamage, 5);
      log(currentEnemy.name + " 借着林影突袭，造成 " + dealt + " 点伤害并留下毒性创口。", { type: "enemy_action", source: "enemy", turn: "enemy" });
      emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
      return createActionContext("enemy", "player", "stalker_strike", "skill", { baseDelay: 50, advanceSelf: 6, delayTarget: 4 });
    }
    if (role === "mana_drain" && Math.random() < 0.34) {
      const rawDamage = damageByFormula(currentEnemy.attack, 1.08, player.defense);
      const dealt = applyDamage(player, playerStatus, rawDamage);
      const drained = Math.min(player.mp, 6);
      player.mp = clamp(player.mp - drained, 0, player.maxMp);
      log(currentEnemy.name + " 抽离你的法力，造成 " + dealt + " 点伤害并吸走 " + drained + " 点法力。", { type: "enemy_action", source: "enemy", turn: "enemy" });
      emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
      return createActionContext("enemy", "player", "mana_drain", "skill", { baseDelay: 58, delayTarget: 4 });
    }
    if (role === "bulwark" && Math.random() < 0.3) {
      enemyStatus.guard = Math.max(enemyStatus.guard, 0.42);
      enemyStatus.attackBuffValue = Math.max(enemyStatus.attackBuffValue, 0.12);
      enemyStatus.attackBuffTurns = 1;
      log(currentEnemy.name + " 收缩防线，架起防势并准备下一次重击。", { type: "enemy_action", source: "enemy", turn: "enemy" });
      emitEffect("enemyHit", { damage: 0, enemy: currentEnemy });
      return createActionContext("enemy", "enemy", "bulwark_guard", "skill", { baseDelay: 46, advanceSelf: 8 });
    }
    if (role === "pyromancer" && Math.random() < 0.34) {
      const rawDamage = damageByFormula(currentEnemy.attack, 1.14, player.defense);
      const dealt = applyDamage(player, playerStatus, rawDamage);
      playerStatus.poisonTurns = Math.max(playerStatus.poisonTurns, 2);
      playerStatus.poisonDamage = Math.max(playerStatus.poisonDamage, 6);
      log(currentEnemy.name + " 洒下灵火灰烬，造成 " + dealt + " 点伤害并附加灼烧。", { type: "enemy_action", source: "enemy", turn: "enemy" });
      emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
      return createActionContext("enemy", "player", "ember_rain", "skill", { baseDelay: 60, delayTarget: 5 });
    }

    const rawDamage = damageByFormula(effectiveAttack(currentEnemy, enemyStatus), 1, player.defense);
    const dealt = applyDamage(player, playerStatus, rawDamage);
    log(currentEnemy.name + " 使用普通攻击，造成 " + dealt + " 点伤害。", { type: "enemy_action", source: "enemy", turn: "enemy" });
    emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
    return actionContext;
  }

  function runEnemyTurn() {
    if (state !== "combat" || locked === false) {
      return;
    }
    const actor = getCurrentTimelineActor();
    if (!actor || actor.side !== "enemy" || !currentEnemy) {
      return;
    }

    const actionContext = enemySkillAction();
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
    const speedBonus = clamp((effectiveSpeed(player, playerStatus) - effectiveSpeed(currentEnemy, enemyStatus)) * 0.03, -0.15, 0.18);
    const finalRate = clamp(baseRate + speedBonus, 0.04, 0.94);
    if (Math.random() <= finalRate) {
      log("你成功撤离了战斗。", { type: "flee", source: "player", turn: "end" });
      finishCombat("flee", "escaped");
      return true;
    }
    log("撤退失败，敌人堵住了去路。", { type: "flee_fail", source: "enemy", turn: "enemy" });
    locked = true;
    finalizeAction(createActionContext("player", "enemy", "flee", "flee", { baseDelay: 72 }));
    return false;
  }

  function playerAction(actionName) {
    const action = createCombatActionRequest(actionName);
    if (action.kind === "flee") {
      return playerFlee();
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
