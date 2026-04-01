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

  function computePoiseMax(unit, options) {
    const data = unit || {};
    const config = options || {};
    if (Number.isFinite(Number(config.poiseMax))) {
      return clamp(toNumber(config.poiseMax, 16), 1, 180);
    }
    const hp = Math.max(1, toNumber(data.maxHp || data.hp, 1));
    const defense = Math.max(0, toNumber(data.defense, 0));
    const speed = Math.max(1, toNumber(data.speed, 1));
    const role = config.role || data.role || "";
    const roleBonus = role === "boss"
      ? 14
      : role === "guardian" || role === "bulwark"
        ? 8
        : role === "berserker" || role === "pack_alpha"
          ? 5
          : 0;
    const raw = 10 + hp * 0.1 + defense * 4 + speed * 1.2 + roleBonus + toNumber(config.extraPoise, 0);
    return clamp(Math.round(raw), 8, 180);
  }

  function createPressureState(unit, options) {
    const maxPoise = computePoiseMax(unit, options);
    return {
      poiseCurrent: maxPoise,
      poiseMax: maxPoise,
      stance: "steady",
      stanceLabel: "稳固",
      exposedTurns: 0,
      executionReady: false,
      chargeLevel: 0,
      chargeMax: clamp(toNumber(options && options.chargeMax, 2), 1, 9),
      chargeLabel: "",
      chargeActionName: "",
      chargeInterruptible: false,
      lastBreakSource: "",
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

  function applyPoiseDamage(pressureState, amount, options) {
    const state = pressureState;
    const value = Math.max(0, toNumber(amount, 0));
    if (!state || !value || state.executionReady) {
      return {
        applied: 0,
        broken: false,
        previous: state ? state.poiseCurrent : 0,
        current: state ? state.poiseCurrent : 0,
      };
    }
    const previous = state.poiseCurrent;
    state.poiseCurrent = clamp(state.poiseCurrent - value, 0, state.poiseMax);
    const broken = state.poiseCurrent === 0;
    if (broken) {
      state.stance = "broken";
      state.stanceLabel = "失衡";
      state.exposedTurns = Math.max(state.exposedTurns, 1);
      state.executionReady = true;
      state.lastBreakSource = options && options.sourceUnitId ? options.sourceUnitId : "";
    }
    return {
      applied: previous - state.poiseCurrent,
      broken: broken,
      previous: previous,
      current: state.poiseCurrent,
    };
  }

  function recoverPressureWindow(pressureState) {
    const state = pressureState;
    if (!state) {
      return { recovered: false, remaining: 0 };
    }
    if (state.exposedTurns > 0) {
      state.exposedTurns -= 1;
      if (state.exposedTurns <= 0) {
        state.exposedTurns = 0;
        state.executionReady = false;
        state.stance = "steady";
        state.stanceLabel = "稳固";
        state.poiseCurrent = state.poiseMax;
        state.lastBreakSource = "";
        state.chargeActionName = "";
        state.chargeInterruptible = false;
        return { recovered: true, remaining: 0 };
      }
    }
    return { recovered: false, remaining: state.exposedTurns };
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
    computePoiseMax: computePoiseMax,
    createPressureState: createPressureState,
    effectiveAttack: effectiveAttack,
    effectiveSpeed: effectiveSpeed,
    damageByFormula: damageByFormula,
    applyDamage: applyDamage,
    applyPoiseDamage: applyPoiseDamage,
    recoverPressureWindow: recoverPressureWindow,
    tickStatus: tickStatus,
    gainCharge: gainCharge,
    spendCharge: spendCharge,
  };
})();
