function createCombatController(options) {
  const config = options || {};
  const player = config.player;
  const skills = config.skills || {};

  let currentEnemy = null;
  let state = "idle";
  let playerTurn = false;
  let locked = false;
  let sourceTile = 0;
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

  function rand(min, max) {
    return Math.random() * (max - min) + min;
  }

  function log(message) {
    if (config.onLog) {
      config.onLog(message);
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

  function effectiveAttack(unit, statusBag) {
    const buff = statusBag.attackBuffTurns > 0 ? statusBag.attackBuffValue : 0;
    return unit.attack * (1 + buff);
  }

  function effectiveSpeed(unit, statusBag) {
    const slow = statusBag.speedDownTurns > 0 ? statusBag.speedDownValue : 0;
    return unit.speed - slow;
  }

  function damageByFormula(attackerAttack, power, defenderDefense) {
    const base = Math.max(1, attackerAttack * power - defenderDefense);
    const swing = rand(0.92, 1.08);
    return Math.max(1, Math.round(base * swing));
  }

  function snapshotState() {
    return {
      inCombat: state === "combat",
      playerTurn: playerTurn,
      enemy: currentEnemy,
      enemyTile: sourceTile,
      locked: locked,
    };
  }

  function getEnemyTemplate(tile, playerLevel) {
    const levelScale = Math.max(0, playerLevel - 1);
    if (tile === 5) {
      return {
        id: "boss",
        name: "深渊主宰",
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
    };
  }

  function startCombat(input) {
    if (!player || state === "combat") {
      return false;
    }
    const encounter = typeof input === "object" && input !== null ? input : { tile: input };
    sourceTile = encounter.tile;

    const template = encounter.enemyTemplate || getEnemyTemplate(encounter.tile, player.level);
    currentEnemy = {
      id: template.id,
      name: template.name,
      hp: template.hp,
      maxHp: template.hp,
      attack: template.attack,
      defense: template.defense,
      speed: template.speed,
      exp: template.exp,
      gold: template.gold,
      isBoss: template.isBoss,
      skills: template.skills || [],
      role: template.role || "basic",
      assetKey: template.assetKey || (template.isBoss ? "boss" : "enemy"),
    };

    playerStatus = createStatusBag();
    enemyStatus = createStatusBag();
    state = "combat";
    locked = false;
    playerTurn = effectiveSpeed(player, playerStatus) >= effectiveSpeed(currentEnemy, enemyStatus);
    emitState(snapshotState());
    log("遭遇 " + currentEnemy.name + "。");
    log(playerTurn ? "你抢到了先手。" : currentEnemy.name + " 率先发起攻击。");
    emitEffect("combatStart", { enemy: currentEnemy });

    if (!playerTurn) {
      locked = true;
      setTimeout(function delayedEnemyTurn() {
        runEnemyTurn();
      }, 420);
    }
    return true;
  }

  function finishCombat(result) {
    if (state !== "combat") {
      return;
    }
    const payload = {
      result: result,
      enemyTile: sourceTile,
      enemy: currentEnemy,
    };
    state = "idle";
    playerTurn = false;
    locked = false;
    emitState(snapshotState());
    if (config.onCombatEnd) {
      config.onCombatEnd(payload);
    }
    currentEnemy = null;
    sourceTile = 0;
  }

  function tickStatus(statusBag, unit, label) {
    if (statusBag.poisonTurns > 0) {
      unit.hp = clamp(unit.hp - statusBag.poisonDamage, 0, unit.maxHp);
      statusBag.poisonTurns -= 1;
      log(label + " 因中毒损失 " + statusBag.poisonDamage + " 点生命。");
    }
    if (statusBag.regenTurns > 0) {
      unit.hp = clamp(unit.hp + statusBag.regenValue, 0, unit.maxHp);
      statusBag.regenTurns -= 1;
      log(label + " 受到持续恢复，回了 " + statusBag.regenValue + " 点生命。");
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
    log("获得经验 " + expValue + " 点。");
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
      log("升级了，当前 Lv." + player.level + "，状态已回满。");
      if (config.onLevelUp) {
        config.onLevelUp(player.level);
      }
    }
    emitStatus();
  }

  function applyDamage(target, statusBag, rawDamage, label) {
    const finalDamage = Math.max(1, Math.round(rawDamage * (1 - statusBag.guard)));
    target.hp = clamp(target.hp - finalDamage, 0, target.maxHp);
    log(label + " 受到 " + finalDamage + " 点伤害。");
    return finalDamage;
  }

  function applyPlayerSkill(skillId) {
    const skill = skills[skillId];
    if (!skill || state !== "combat" || !playerTurn || locked) {
      return false;
    }
    if (player.mp < skill.cost) {
      log("MP 不足，无法施放 " + skill.name + "。");
      return false;
    }

    player.mp = clamp(player.mp - skill.cost, 0, player.maxMp);
    const attackValue = effectiveAttack(player, playerStatus);

    if (skill.effect === "damage") {
      let power = skill.power;
      if (skill.bonusFirst && playerTurn) {
        power += skill.bonusFirst;
      }
      const rawDamage = damageByFormula(attackValue, power, currentEnemy.defense);
      const dealt = applyDamage(currentEnemy, enemyStatus, rawDamage, currentEnemy.name);
      log("你使用了 " + skill.name + "。");
      emitEffect("enemyHit", { damage: dealt, enemy: currentEnemy });
    } else if (skill.effect === "heal") {
      const healValue = Math.max(1, Math.round((attackValue * Math.abs(skill.power) + player.level * 4) * rand(0.96, 1.08)));
      player.hp = clamp(player.hp + healValue, 0, player.maxHp);
      log("你施放了 " + skill.name + "，恢复了 " + healValue + " 点生命。");
      emitEffect("playerHeal", { amount: healValue });
    } else if (skill.effect === "guard") {
      playerStatus.guard = Math.max(playerStatus.guard, skill.guard || 0.3);
      log("你施放了 " + skill.name + "，准备承受下一波攻击。");
    } else if (skill.effect === "buff_attack") {
      playerStatus.attackBuffValue = skill.buff || 0.2;
      playerStatus.attackBuffTurns = skill.turns || 2;
      log("你施放了 " + skill.name + "，攻击力提升。");
    } else if (skill.effect === "restore_mp") {
      player.mp = clamp(player.mp + (skill.restoreMp || 6), 0, player.maxMp);
      playerStatus.guard = Math.max(playerStatus.guard, skill.guard || 0);
      log("你施放了 " + skill.name + "，恢复了法力。");
    } else if (skill.effect === "poison") {
      const rawDamage = damageByFormula(attackValue, skill.power || 1, currentEnemy.defense);
      const dealt = applyDamage(currentEnemy, enemyStatus, rawDamage, currentEnemy.name);
      enemyStatus.poisonTurns = skill.poisonTurns || 2;
      enemyStatus.poisonDamage = skill.poisonDamage || 5;
      log("你使用了 " + skill.name + "，附加中毒效果。");
      emitEffect("enemyHit", { damage: dealt, enemy: currentEnemy });
    } else if (skill.effect === "regen") {
      playerStatus.regenTurns = skill.regenTurns || 2;
      playerStatus.regenValue = skill.regenValue || 8;
      log("你施放了 " + skill.name + "，持续恢复开始生效。");
    } else if (skill.effect === "guard_heal") {
      const healValue = Math.max(1, Math.round((attackValue * Math.abs(skill.power) + player.level * 2) * rand(0.95, 1.06)));
      player.hp = clamp(player.hp + healValue, 0, player.maxHp);
      playerStatus.guard = Math.max(playerStatus.guard, skill.guard || 0.3);
      log("你施放了 " + skill.name + "，恢复了 " + healValue + " 点生命并获得减伤。");
      emitEffect("playerHeal", { amount: healValue });
    }

    emitStatus();
    emitState(snapshotState());

    if (currentEnemy.hp <= 0) {
      log("你击败了 " + currentEnemy.name + "。");
      gainExpAndMaybeLevelUp(currentEnemy.exp);
      finishCombat("victory");
      return true;
    }

    playerTurn = false;
    locked = true;
    setTimeout(function delayedEnemyTurn() {
      runEnemyTurn();
    }, 420);
    return true;
  }

  function enemySkillAction() {
    const role = currentEnemy.role || "basic";

    if (currentEnemy.isBoss && role === "pack_alpha" && Math.random() < 0.55) {
      const rawDamage = damageByFormula(currentEnemy.attack, 1.35, player.defense);
      const dealt = applyDamage(player, playerStatus, rawDamage, player.name);
      enemyStatus.attackBuffValue = 0.18;
      enemyStatus.attackBuffTurns = 2;
      log(currentEnemy.name + " 号召狼群，进入狂怒状态。");
      emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
      return;
    }
    if (currentEnemy.isBoss && role === "arcane_warden" && Math.random() < 0.52) {
      const rawDamage = damageByFormula(currentEnemy.attack, 1.45, player.defense);
      const dealt = applyDamage(player, playerStatus, rawDamage, player.name);
      playerStatus.speedDownTurns = 1;
      playerStatus.speedDownValue = 2;
      log(currentEnemy.name + " 释放禁术震波。");
      emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
      return;
    }
    if (currentEnemy.isBoss && role === "inferno_tyrant" && Math.random() < 0.58) {
      const rawDamage = damageByFormula(currentEnemy.attack, 1.28, player.defense);
      const dealt = applyDamage(player, playerStatus, rawDamage, player.name);
      playerStatus.poisonTurns = 2;
      playerStatus.poisonDamage = 7;
      log(currentEnemy.name + " 喷吐烈焰，附带持续灼烧。");
      emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
      return;
    }
    if (role === "poisoner" && Math.random() < 0.34) {
      const rawDamage = damageByFormula(currentEnemy.attack, 0.9, player.defense);
      const dealt = applyDamage(player, playerStatus, rawDamage, player.name);
      playerStatus.poisonTurns = 2;
      playerStatus.poisonDamage = 4;
      log(currentEnemy.name + " 的毒咬让你进入中毒状态。");
      emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
      return;
    }
    if (role === "caster" && Math.random() < 0.3) {
      const rawDamage = damageByFormula(currentEnemy.attack, 1.22, player.defense);
      const dealt = applyDamage(player, playerStatus, rawDamage, player.name);
      playerStatus.speedDownTurns = 1;
      playerStatus.speedDownValue = 1;
      log(currentEnemy.name + " 释放奥术脉冲。");
      emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
      return;
    }
    if (role === "guardian" && Math.random() < 0.28) {
      enemyStatus.guard = Math.max(enemyStatus.guard, 0.35);
      log(currentEnemy.name + " 举盾固守，准备承伤。");
      emitEffect("enemyHit", { damage: 0, enemy: currentEnemy });
      return;
    }
    if (role === "berserker" && Math.random() < 0.32) {
      const rawDamage = damageByFormula(currentEnemy.attack, 1.22, player.defense);
      const dealt = applyDamage(player, playerStatus, rawDamage, player.name);
      enemyStatus.attackBuffValue = 0.14;
      enemyStatus.attackBuffTurns = 1;
      log(currentEnemy.name + " 狂化突进，下一击会更重。");
      emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
      return;
    }

    const rawDamage = damageByFormula(effectiveAttack(currentEnemy, enemyStatus), 1, player.defense);
    const dealt = applyDamage(player, playerStatus, rawDamage, player.name);
    log(currentEnemy.name + " 使用普通攻击。");
    emitEffect("playerHit", { damage: dealt, enemy: currentEnemy });
  }

  function runEnemyTurn() {
    if (state !== "combat" || !currentEnemy) {
      return;
    }

    tickStatus(enemyStatus, currentEnemy, currentEnemy.name);
    if (currentEnemy.hp <= 0) {
      log(currentEnemy.name + " 被持续效果击败了。");
      gainExpAndMaybeLevelUp(currentEnemy.exp);
      finishCombat("victory");
      return;
    }

    enemySkillAction();
    emitStatus();
    if (player.hp <= 0) {
      log("你被击败了。");
      finishCombat("defeat");
      return;
    }

    tickStatus(playerStatus, player, player.name);
    emitStatus();
    if (player.hp <= 0) {
      log("你被持续伤害拖垮了。");
      finishCombat("defeat");
      return;
    }

    playerTurn = true;
    locked = false;
    emitState(snapshotState());
    log("轮到你行动。");
  }

  function playerFlee() {
    if (state !== "combat" || !playerTurn || locked) {
      return false;
    }
    const baseRate = currentEnemy.isBoss ? 0.12 : 0.72;
    const speedBonus = clamp((effectiveSpeed(player, playerStatus) - effectiveSpeed(currentEnemy, enemyStatus)) * 0.03, -0.15, 0.18);
    const finalRate = clamp(baseRate + speedBonus, 0.04, 0.94);
    if (Math.random() <= finalRate) {
      log("你成功撤离了战斗。");
      finishCombat("flee");
      return true;
    }
    log("撤退失败，敌人堵住了去路。");
    playerTurn = false;
    locked = true;
    setTimeout(function delayedEnemyTurn() {
      runEnemyTurn();
    }, 380);
    return false;
  }

  function playerAction(actionName) {
    if (actionName === "flee") {
      return playerFlee();
    }
    return applyPlayerSkill(actionName);
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
