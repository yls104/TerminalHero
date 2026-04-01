(function exposeCombatEffects() {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toNumber(value, fallback) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

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

  function createUltimateState(max) {
    return {
      current: 0,
      max: clamp(toNumber(max, 8), 1, 99),
    };
  }

  function effectiveAttack(unit, statusBag) {
    const buff = statusBag && statusBag.attackBuffTurns > 0 ? statusBag.attackBuffValue : 0;
    return unit.attack * (1 + buff);
  }

  function effectiveSpeed(unit, statusBag) {
    const slow = statusBag && statusBag.speedDownTurns > 0 ? statusBag.speedDownValue : 0;
    return Math.max(1, unit.speed - slow);
  }

  function damageByFormula(attackerAttack, power, defenderDefense, randomFn) {
    const base = Math.max(1, attackerAttack * power - defenderDefense);
    const rand = typeof randomFn === "function" ? randomFn(0.92, 1.08) : (Math.random() * 0.16 + 0.92);
    return Math.max(1, Math.round(base * rand));
  }

  function applyDamage(target, statusBag, rawDamage) {
    const guardRatio = statusBag ? statusBag.guard : 0;
    const finalDamage = Math.max(1, Math.round(rawDamage * (1 - guardRatio)));
    target.hp = clamp(target.hp - finalDamage, 0, target.maxHp);
    return finalDamage;
  }

  function tickStatus(input) {
    const config = input || {};
    const statusBag = config.statusBag;
    const unit = config.unit;
    const label = config.label || "单位";
    const log = typeof config.log === "function" ? config.log : function noop() {};

    if (!statusBag || !unit) {
      return;
    }

    if (statusBag.poisonTurns > 0) {
      unit.hp = clamp(unit.hp - statusBag.poisonDamage, 0, unit.maxHp);
      statusBag.poisonTurns -= 1;
      log(label + " 因中毒损失 " + statusBag.poisonDamage + " 点生命。", {
        type: "status",
        source: "system",
        turn: "tick",
      });
    }

    if (statusBag.regenTurns > 0) {
      unit.hp = clamp(unit.hp + statusBag.regenValue, 0, unit.maxHp);
      statusBag.regenTurns -= 1;
      log(label + " 受到持续恢复，回了 " + statusBag.regenValue + " 点生命。", {
        type: "status",
        source: "system",
        turn: "tick",
      });
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

  function gainCharge(pool, amount) {
    const delta = Math.max(0, toNumber(amount, 0));
    if (!pool || !delta) {
      return 0;
    }
    const previous = pool.current;
    pool.current = clamp(pool.current + delta, 0, pool.max);
    return pool.current - previous;
  }

  function spendCharge(pool, amount) {
    const cost = Math.max(0, toNumber(amount, 0));
    if (!pool || !cost) {
      return true;
    }
    if (pool.current < cost) {
      return false;
    }
    pool.current -= cost;
    return true;
  }

  window.CombatEffects = {
    clamp: clamp,
    toNumber: toNumber,
    createStatusBag: createStatusBag,
    createUltimateState: createUltimateState,
    effectiveAttack: effectiveAttack,
    effectiveSpeed: effectiveSpeed,
    damageByFormula: damageByFormula,
    applyDamage: applyDamage,
    tickStatus: tickStatus,
    gainCharge: gainCharge,
    spendCharge: spendCharge,
  };
})();
