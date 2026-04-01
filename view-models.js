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

  function inferPoiseDamage(skill) {
    const data = skill || {};
    if (Number.isFinite(Number(data.poiseDamage))) {
      return Math.max(0, Number(data.poiseDamage));
    }
    if (data.effect !== "damage" && data.effect !== "poison") {
      return 0;
    }
    const power = Math.max(0, Number.isFinite(Number(data.power)) ? Number(data.power) : 1);
    const delayBonus = Number(data.delayTarget || 0) > 0 ? 1 : 0;
    const advanceBonus = Number(data.advanceSelf || 0) > 0 ? 1 : 0;
    const ultimateBonus = data.actionType === "ultimate" ? 2 : 0;
    return clamp(Math.round(power * 2 + delayBonus + advanceBonus + ultimateBonus), 1, 12);
  }

  function createHudViewModel(input) {
    const data = input || {};
    const player = data.player || {};
    const stageLabel = data.stageLabel || "-";
    const stageDescription = data.stageDescription || "";
    const className = player.className || "-";
    const buildNote = player.classBuildNote || "";
    const specializationText = player.buildSnapshot && player.buildSnapshot.activeTrackNames && player.buildSnapshot.activeTrackNames.length
      ? " 已激活专精：" + player.buildSnapshot.activeTrackNames.join(" / ") + "。"
      : "";
    const relicTagText = player.buildSnapshot && player.buildSnapshot.relicTags && player.buildSnapshot.relicTags.length
      ? " 当前遗物倾向：" + player.buildSnapshot.relicTags.join(" / ") + "。"
      : "";
    const classSummary = player.className
      ? player.className + "，当前位于 " + stageLabel + "。" + stageDescription + (buildNote ? " 构筑提示：" + buildNote : "") + specializationText + relicTagText
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
      classResourceVisible: Boolean(player.classResource && player.classResource.id),
      classResourceLabel: player.classResource ? player.classResource.label || "职业资源" : "职业资源",
      classResourceText: player.classResource ? (player.classResource.current || 0) + " / " + (player.classResource.max || 0) : "0 / 0",
      classResourcePercent: toPercent(player.classResource ? player.classResource.current || 0 : 0, player.classResource ? player.classResource.max || 0 : 0),
      classResourceColorClass: player.classResource ? player.classResource.colorClass || "resource-neutral" : "resource-neutral",
    };
  }

  function createEnemyViewModel(input) {
    const data = input && input.enemy ? input : { enemy: input, intent: null, pressure: null };
    const enemy = data.enemy;
    const intent = data.intent || null;
    const pressure = data.pressure || null;
    if (!enemy) {
      return {
        visible: false,
        name: "",
        hpText: "0 / 0",
        hpPercent: 0,
        poiseVisible: false,
        poiseText: "",
        poisePercent: 0,
        stanceText: "",
        chargeText: "",
        intentVisible: false,
        intentLabel: "",
        intentName: "",
        intentSummary: "",
      };
    }

    return {
      visible: true,
      name: enemy.isBoss ? "【首领】" + enemy.name : enemy.encounterType === "elite" ? "【精英】" + enemy.name : enemy.name,
      hpText: enemy.hp + " / " + enemy.maxHp,
      hpPercent: toPercent(enemy.hp, enemy.maxHp),
      poiseVisible: Boolean(pressure && pressure.poiseMax > 0),
      poiseText: pressure ? pressure.poiseCurrent + " / " + pressure.poiseMax : "",
      poisePercent: pressure ? toPercent(pressure.poiseCurrent, pressure.poiseMax) : 0,
      stanceText: pressure
        ? pressure.executionReady
          ? "失衡窗口已打开"
          : pressure.chargeLevel > 0
            ? (pressure.stanceLabel || "蓄势") + " " + pressure.chargeLevel + "/" + (pressure.chargeMax || pressure.chargeLevel)
            : pressure.stanceLabel || "稳固"
        : "",
      chargeText: pressure && pressure.chargeLevel > 0
        ? (pressure.chargeActionName || pressure.chargeLabel || "蓄力动作")
          + (pressure.chargeInterruptible ? " · 可打断" : "")
        : "",
      intentVisible: Boolean(intent && intent.label),
      intentLabel: intent && intent.pressure === "charge"
        ? "蓄力预告"
        : intent && intent.pressure === "control"
        ? "压制预告"
        : intent && intent.pressure === "burst"
          ? "爆发预告"
          : intent && intent.pressure === "guard"
            ? "防守预告"
            : "即将行动",
      intentName: intent ? intent.label || "" : "",
      intentSummary: intent
        ? [intent.summary, intent.timingText].filter(Boolean).join(" · ")
        : "",
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
        { label: "传承印记", value: String(data.legacyMarksEarned || 0) },
        { label: "城镇声望", value: String(data.townRenownEarned || 0) },
        { label: "新遗物", value: (data.gainedRelics || []).join("、") || "暂无" },
        { label: "新材料", value: (data.gainedMaterials || []).join("、") || "暂无" },
        { label: "本轮祝福", value: (data.gainedBlessings || []).join("、") || "暂无" },
        { label: "章节推进", value: data.unlockedChapterLabel || "无" },
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

  function createBuildCodexViewModel(input) {
    const data = input || {};
    const player = data.player || {};
    return {
      overlayEyebrow: "构筑详情",
      overlayTitle: (player.className || "冒险者") + " 构筑手册",
      summaryRows: [
        { label: "职业", value: player.className || "未选择" },
        { label: "构筑方向", value: player.classBuildNote || player.classDescription || "尚未选择职业" },
        { label: "核心资源", value: player.classResource && player.classResource.id ? player.classResource.label + "（" + player.classResource.current + " / " + player.classResource.max + "）" : "当前职业暂无专属资源" },
        { label: "已激活专精", value: player.buildSnapshot && player.buildSnapshot.activeTrackNames && player.buildSnapshot.activeTrackNames.length ? player.buildSnapshot.activeTrackNames.join("、") : "暂未投入专精节点" },
        { label: "遗物联动标签", value: player.buildSnapshot && player.buildSnapshot.relicTags && player.buildSnapshot.relicTags.length ? player.buildSnapshot.relicTags.join("、") : "暂未形成遗物倾向" },
      ],
      sections: data.sections || [],
    };
  }

  function renderBuildCodexHtml(viewModel) {
    const summaryHtml = (viewModel.summaryRows || []).map(function mapRow(row) {
      return "<p><strong>" + row.label + "：</strong>" + row.value + "</p>";
    }).join("");
    const sectionsHtml = (viewModel.sections || []).map(function mapSection(section) {
      const entriesHtml = (section.entries || []).map(function mapEntry(entry) {
        const detailsHtml = (entry.details || []).map(function mapDetail(detail) {
          return "<li>" + detail + "</li>";
        }).join("");
        return "<div class=\"build-codex-entry\"><div class=\"build-codex-entry-title\"><strong>" + entry.name + "</strong><span>" + (entry.meta || "") + "</span></div><div class=\"build-codex-entry-sub\">" + (entry.summary || "") + "</div><ul>" + detailsHtml + "</ul></div>";
      }).join("");
      return "<section class=\"build-codex-section\"><h3>" + section.title + "</h3>" + entriesHtml + "</section>";
    }).join("");
    return "<div class=\"build-codex\"><div class=\"detail-stats\">" + summaryHtml + "</div>" + sectionsHtml + "</div>";
  }

  function createCombatTimelineViewModel(snapshot) {
    const data = snapshot || {};
    const timeline = data.timeline || {};
    const queuePreview = Array.isArray(timeline.queuePreview) ? timeline.queuePreview.slice(0, 5) : [];
    const statusText = data.inCombat
      ? (data.insertWindow && data.insertWindow.open
        ? "终结可插入"
        : data.playerTurn
          ? "你的回合"
          : "敌方逼近")
      : "未进入战斗，时间轴将在遭遇战开始后显示。";

    return {
      visible: Boolean(data.inCombat),
      statusText: statusText,
      entries: queuePreview.map(function mapEntry(entry, index) {
        const isCurrent = entry.unitId === timeline.currentActorId;
        return {
          key: entry.unitId + "-" + index,
          label: entry.side === "player" ? "你" : entry.label,
          badge: isCurrent ? "当前" : "序 " + (index + 1),
          avText: "AV " + entry.currentAv,
          meta: "速度 " + entry.speed + " · AV " + entry.currentAv,
          sideClass: entry.side === "player" ? "is-player" : "is-enemy",
          isCurrent: isCurrent,
        };
      }),
    };
  }

  function createCombatIntentViewModel(snapshot) {
    const data = snapshot || {};
    const intent = data.enemyIntent || null;
    const enemyPressure = data.enemyPressure || null;
    const playerPressure = data.playerPressure || null;
    if (data.inCombat && enemyPressure && enemyPressure.executionReady) {
      return {
        visible: true,
        summaryText: "敌方失衡窗口已打开",
        actionHintText: "敌方失衡 · 可趁势重击",
      };
    }
    if (data.inCombat && playerPressure && playerPressure.executionReady) {
      return {
        visible: true,
        summaryText: "你正处于失衡状态",
        actionHintText: "自身失衡 · 小心敌方重击",
      };
    }
    if (data.inCombat && enemyPressure && enemyPressure.chargeLevel > 0) {
      return {
        visible: true,
        summaryText: (enemyPressure.chargeActionName || enemyPressure.chargeLabel || "敌方蓄力")
          + (enemyPressure.chargeInterruptible ? " · 可打断" : ""),
        actionHintText: enemyPressure.chargeInterruptible
          ? "敌方蓄力 · 快用压制打断"
          : "敌方蓄力 · 小心下一拍重击",
      };
    }
    if (!data.inCombat || !intent) {
      return {
        visible: false,
        summaryText: "",
        actionHintText: data && data.inCombat
          ? (data.playerTurn ? "你的回合" : "敌方逼近")
          : "等待接敌",
      };
    }

    const summary = [intent.label, intent.summary, intent.timingText, intent.interruptible ? "可打断" : ""].filter(Boolean).join(" · ");
    return {
      visible: true,
      summaryText: summary,
      actionHintText: data.insertWindow && data.insertWindow.open
        ? "终结可插入 · " + intent.label
        : data.playerTurn
          ? "你的回合 · 敌方准备 " + intent.label
          : "敌方蓄势 · " + intent.label,
    };
  }

  function createCombatMenuTimingViewModel(input) {
    const data = input || {};
    const skill = data.skill || {};
    const snapshot = data.snapshot || {};
    const parts = [];

    if (typeof skill.baseDelay === "number") {
      parts.push("延迟 " + skill.baseDelay);
    }
    if (skill.advanceSelf) {
      parts.push("抢轴 +" + skill.advanceSelf);
    }
    if (skill.delayTarget) {
      parts.push("压制 +" + skill.delayTarget);
    }
    if (inferPoiseDamage(skill)) {
      parts.push("韧性 -" + inferPoiseDamage(skill));
    }
    if (snapshot.enemyPressure && snapshot.enemyPressure.chargeLevel > 0 && inferPoiseDamage(skill) > 0) {
      parts.push(inferPoiseDamage(skill) >= (snapshot.enemyPressure.poiseCurrent || 0) ? "可打断" : "可压制");
    }
    if (skill.ultimateChargeGain) {
      parts.push("终结 +" + skill.ultimateChargeGain);
    }
    if (skill.actionType === "ultimate" && typeof skill.ultimateChargeCost === "number") {
      const currentCharge = snapshot.ultimate ? snapshot.ultimate.current || 0 : 0;
      parts.push("耗 " + skill.ultimateChargeCost + "/" + currentCharge);
      if (snapshot.insertWindow && snapshot.insertWindow.open) {
        parts.push("可插入");
      }
    }
    if (!parts.length) {
      parts.push("稳");
    }

    return {
      metaText: parts.join(" · "),
    };
  }

  window.GameViewModels = {
    createHudViewModel: createHudViewModel,
    createEnemyViewModel: createEnemyViewModel,
    createDetailStatsViewModel: createDetailStatsViewModel,
    renderDetailStatsHtml: renderDetailStatsHtml,
    createRunSummaryViewModel: createRunSummaryViewModel,
    renderRunSummaryHtml: renderRunSummaryHtml,
    createBuildCodexViewModel: createBuildCodexViewModel,
    renderBuildCodexHtml: renderBuildCodexHtml,
    createCombatTimelineViewModel: createCombatTimelineViewModel,
    createCombatMenuTimingViewModel: createCombatMenuTimingViewModel,
    createCombatIntentViewModel: createCombatIntentViewModel,
  };
})();
