(function exposeCombatActions() {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toNumber(value, fallback) {
    return Number.isFinite(Number(value)) ? Number(value) : fallback;
  }

  function inferPoiseDamage(timing) {
    const data = timing || {};
    if (Number.isFinite(Number(data.poiseDamage))) {
      return Math.max(0, toNumber(data.poiseDamage, 0));
    }
    if (data.effect !== "damage" && data.effect !== "poison") {
      return 0;
    }
    const power = Math.max(0, toNumber(data.power, 1));
    const delayBonus = toNumber(data.delayTarget, 0) > 0 ? 1 : 0;
    const advanceBonus = toNumber(data.advanceSelf, 0) > 0 ? 1 : 0;
    const ultimateBonus = data.actionType === "ultimate" ? 2 : 0;
    return clamp(Math.round(power * 2 + delayBonus + advanceBonus + ultimateBonus), 1, 12);
  }

  function resolveActionDelay(input) {
    const config = input || {};
    const timelineApi = config.timelineApi || {};
    const computeBaseAv = typeof timelineApi.computeBaseAv === "function"
      ? timelineApi.computeBaseAv
      : function fallbackBaseAv() { return 52; };
    const sourceSpeed = Math.max(1, toNumber(config.sourceSpeed, 1));
    const skillLike = config.skillLike || {};
    const baseAv = computeBaseAv(sourceSpeed);
    const skillBaseDelay = toNumber(skillLike.baseDelay, 52);
    return clamp(baseAv + (skillBaseDelay - 52), 18, 999);
  }

  function createActionContext(input) {
    const config = input || {};
    const timing = config.timingLike || {};
    return {
      actionId: config.actionId || "",
      actionType: config.actionType || "skill",
      sourceUnitId: config.sourceUnitId || "",
      targetUnitId: config.targetUnitId || "",
      baseDelay: resolveActionDelay({
        timelineApi: config.timelineApi,
        sourceSpeed: config.sourceSpeed,
        skillLike: timing,
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
  }

  function createInsertWindow(input) {
    const config = input || {};
    const actor = config.actor;
    const availableSkills = Array.isArray(config.availableSkills) ? config.availableSkills : [];
    if (!actor || actor.side !== "enemy" || !availableSkills.length) {
      return null;
    }
    return {
      open: true,
      sourceUnitId: config.sourceUnitId || "player",
      allowedActionIds: availableSkills.map(function mapSkill(skill) {
        return skill.id;
      }),
      reason: config.reason || "enemy_turn",
    };
  }

  function canUseInsertWindow(insertWindow, skillId) {
    return Boolean(
      insertWindow
      && insertWindow.open
      && Array.isArray(insertWindow.allowedActionIds)
      && insertWindow.allowedActionIds.indexOf(skillId) !== -1
    );
  }

  function createTimelineChangeLogs(actionContext, getLabel) {
    const entries = [];
    if (!actionContext) {
      return entries;
    }
    const labelResolver = typeof getLabel === "function" ? getLabel : function fallbackLabel(side) { return side; };
    const sourceLabel = labelResolver(actionContext.sourceUnitId);
    const targetLabel = actionContext.targetUnitId ? labelResolver(actionContext.targetUnitId) : "";
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
  }

  window.CombatActions = {
    resolveActionDelay: resolveActionDelay,
    createActionContext: createActionContext,
    createInsertWindow: createInsertWindow,
    canUseInsertWindow: canUseInsertWindow,
    createTimelineChangeLogs: createTimelineChangeLogs,
  };
})();
