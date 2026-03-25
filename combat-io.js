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
        skillId: input.skillId || (input.actionId === "attack" ? "attack" : input.actionId),
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

    return {
      actionId: String(input || ""),
      kind: "skill",
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
