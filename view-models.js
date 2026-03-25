(function exposeViewModels() {
  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toPercent(current, max) {
    if (!max || max <= 0) {
      return 0;
    }
    return clamp((current / max) * 100, 0, 100);
  }

  function createHudViewModel(input) {
    const data = input || {};
    const player = data.player || {};
    const stageLabel = data.stageLabel || "-";
    const stageDescription = data.stageDescription || "";
    const className = player.className || "-";
    const classSummary = player.className
      ? player.className + "，当前位于 " + stageLabel + "。" + stageDescription
      : "在城镇中选择职业，确认你这轮的成长路线。";

    return {
      hpText: (player.hp || 0) + " / " + (player.maxHp || 0),
      mpText: (player.mp || 0) + " / " + (player.maxMp || 0),
      levelText: String(player.level || 0),
      expText: (player.exp || 0) + " / " + (player.expToNext || 0),
      goldText: String(player.gold || 0),
      skillPointText: String(player.skillPoints || 0),
      classText: "职业：" + className,
      stageText: "区域：" + stageLabel,
      positionText: "坐标：(" + (player.position ? player.position.x : 0) + ", " + (player.position ? player.position.y : 0) + ")",
      classSummary: classSummary,
      hpPercent: toPercent(player.hp || 0, player.maxHp || 0),
      mpPercent: toPercent(player.mp || 0, player.maxMp || 0),
      expPercent: toPercent(player.exp || 0, player.expToNext || 0),
    };
  }

  function createEnemyViewModel(enemy) {
    if (!enemy) {
      return {
        visible: false,
        name: "",
        hpText: "0 / 0",
        hpPercent: 0,
      };
    }

    return {
      visible: true,
      name: enemy.isBoss ? "【首领】" + enemy.name : enemy.encounterType === "elite" ? "【精英】" + enemy.name : enemy.name,
      hpText: enemy.hp + " / " + enemy.maxHp,
      hpPercent: toPercent(enemy.hp, enemy.maxHp),
    };
  }

  function createDetailStatsViewModel(input) {
    const data = input || {};
    const player = data.player || {};
    const equippedItems = data.equippedItems || [];
    const learnedSkills = data.learnedSkills || [];
    const relics = data.relics || [];
    const blessings = data.blessings || [];
    const materials = data.materials || [];

    return {
      overlayEyebrow: "详细属性",
      overlayTitle: player.className || "冒险者信息",
      rows: [
        { label: "姓名", value: player.name || "-" },
        { label: "职业", value: player.className || "未选择" },
        { label: "职业特性", value: player.classDescription || "尚未选择职业" },
        { label: "区域", value: data.stageLabel || "-" },
        { label: "等级", value: "Lv." + (player.level || 0) },
        { label: "生命", value: (player.hp || 0) + " / " + (player.maxHp || 0) },
        { label: "法力", value: (player.mp || 0) + " / " + (player.maxMp || 0) },
        { label: "经验", value: (player.exp || 0) + " / " + (player.expToNext || 0) },
        { label: "攻击", value: String(player.attack || 0) },
        { label: "防御", value: String(player.defense || 0) },
        { label: "速度", value: String(player.speed || 0) },
        { label: "金币", value: String(player.gold || 0) },
        { label: "技能点", value: String(player.skillPoints || 0) },
        { label: "坐标", value: "(" + (player.position ? player.position.x : 0) + ", " + (player.position ? player.position.y : 0) + ")" },
        { label: "已学技能", value: learnedSkills.join("、") || "暂无" },
        { label: "已装备", value: equippedItems.join("、") || "暂无" },
        { label: "遗物", value: relics.join("、") || "暂无" },
        { label: "材料", value: materials.join("、") || "暂无" },
        { label: "本轮祝福", value: blessings.join("、") || "暂无" },
        { label: "终极技", value: player.learnedUltimate ? "已解锁" : "尚未解锁" },
      ],
    };
  }

  function renderDetailStatsHtml(viewModel) {
    const rows = (viewModel.rows || []).map(function mapRow(row) {
      return "<p><strong>" + row.label + "：</strong>" + row.value + "</p>";
    }).join("");
    return "<div class=\"detail-stats\">" + rows + "</div>";
  }

  function createRunSummaryViewModel(input) {
    const data = input || {};
    return {
      overlayEyebrow: "冒险结算",
      overlayTitle: (data.stageLabel || "本轮冒险") + (data.bossCleared ? " 已完成" : " 暂告一段落"),
      rows: [
        { label: "结果", value: data.outcomeText || "返回城镇" },
        { label: "区域", value: data.stageLabel || "-" },
        { label: "战斗胜利", value: String(data.combatsWon || 0) + " 场" },
        { label: "击败精英", value: String(data.elitesDefeated || 0) + " 个" },
        { label: "解决事件", value: String(data.eventsResolved || 0) + " 次" },
        { label: "领取奖励", value: String(data.rewardsClaimed || 0) + " 次" },
        { label: "获得经验", value: String(data.expGained || 0) },
        { label: "获得金币", value: String(data.goldEarned || 0) },
        { label: "获得技能点", value: String(data.skillPointsEarned || 0) },
        { label: "新遗物", value: (data.gainedRelics || []).join("、") || "暂无" },
        { label: "新材料", value: (data.gainedMaterials || []).join("、") || "暂无" },
        { label: "本轮祝福", value: (data.gainedBlessings || []).join("、") || "暂无" },
        { label: "新解锁区域", value: data.unlockedStageLabel || "无" },
      ],
    };
  }

  function renderRunSummaryHtml(viewModel) {
    const rows = (viewModel.rows || []).map(function mapRow(row) {
      return "<p><strong>" + row.label + "：</strong>" + row.value + "</p>";
    }).join("");
    return "<div class=\"detail-stats run-summary\">" + rows + "</div>";
  }

  window.GameViewModels = {
    createHudViewModel: createHudViewModel,
    createEnemyViewModel: createEnemyViewModel,
    createDetailStatsViewModel: createDetailStatsViewModel,
    renderDetailStatsHtml: renderDetailStatsHtml,
    createRunSummaryViewModel: createRunSummaryViewModel,
    renderRunSummaryHtml: renderRunSummaryHtml,
  };
})();
