const fs = require("fs");
const path = require("path");
const vm = require("vm");
const childProcess = require("child_process");

const projectRoot = path.resolve(__dirname, "..");

function readFile(relativePath) {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function fail(message) {
  throw new Error(message);
}

function assert(condition, message) {
  if (!condition) {
    fail(message);
  }
}

function loadScriptIntoContext(context, relativePath) {
  vm.runInContext(readFile(relativePath), context, { filename: relativePath });
}

function validateHtmlContract(indexHtml) {
  [
    "gameCanvas",
    "virtualJoystick",
    "statusToggle",
    "floatingStatusPanel",
    "combatHudLayer",
    "mobileExploreHud",
    "mobilePanelToggle",
    "mobilePanelBackdrop",
    "mobileClassValue",
    "mobileStageValue",
    "mobilePosValue",
    "actionHint",
    "btnUltimate",
    "timelinePanel",
    "timelineStatus",
    "timelinePreview",
    "playerCombatPanel",
    "combatPlayerHp",
    "combatPlayerMp",
    "combatPlayerResourceRow",
    "enemyPoiseRow",
    "enemyPoiseText",
    "enemyPoiseBar",
    "enemyStanceText",
    "enemyIntentRow",
    "enemyIntentLabel",
    "enemyIntentName",
    "enemyIntentSummary",
    "classValue",
    "stageValue",
    "routeValue",
    "pressureValue",
    "rewardValue",
    "btnOpenLog",
    "btnSaveMenu",
    "battleLog",
  ].forEach(function eachId(id) {
    assert(indexHtml.includes('id="' + id + '"'), "index.html 缺少关键节点 #" + id);
  });
}

function validateStyleContract(styleCss) {
  [
    ".virtual-joystick",
    ".floating-status-panel",
    ".hud-toggle",
    ".mobile-explore-hud",
    ".mobile-panel-toggle",
    ".mobile-panel-backdrop",
    ".combat-hud-layer",
    ".combat-top-strip",
    ".enemy-poise-row",
    ".enemy-stance-text",
    ".enemy-intent-row",
    ".enemy-intent-summary",
    ".combat-action-dock",
    "body.mobile-side-panel-open .side-panel",
    "body.combat-mode .side-panel",
    ".adventure-summary",
    ".signal-chip",
    ".action-hint",
    ".action-button-meta",
    ".action-menu button.is-insert-window",
    ".timeline-chip",
    ".battle-log p:nth-last-child(n + 5)",
    ".mini-button",
  ].forEach(function eachSelector(selector) {
    assert(styleCss.includes(selector), "style.css 缺少移动端或日志相关样式：" + selector);
  });
}

function createBrowserContext() {
  const pendingTimers = {};
  let timerSeed = 0;
  const context = {
    console: console,
    setTimeout(fn) {
      timerSeed += 1;
      pendingTimers[timerSeed] = fn;
      return timerSeed;
    },
    clearTimeout(timerId) {
      delete pendingTimers[timerId];
    },
    Math: Math,
    Date: Date,
    JSON: JSON,
    window: {
      localStorage: {
        _store: {},
        getItem(key) {
          return Object.prototype.hasOwnProperty.call(this._store, key) ? this._store[key] : null;
        },
        setItem(key, value) {
          this._store[key] = String(value);
        },
        removeItem(key) {
          delete this._store[key];
        },
      },
      GameMap: {
        TILE: { FLOOR: 0, WALL: 1, PLAYER_START: 2, ENEMY: 3, HEAL_POINT: 4, BOSS: 5, PORTAL: 6, ELITE: 7, EVENT: 8 },
        MAP_COLS: 20,
        MAP_ROWS: 15,
      },
    },
  };
  context.window.setTimeout = context.setTimeout;
  context.window.clearTimeout = context.clearTimeout;
  context.window.window = context.window;
  return vm.createContext(context);
}

function collectReachableKeys(mapData, start, wallTile) {
  const visited = {};
  const queue = [{ x: start.x, y: start.y }];
  visited[start.x + "," + start.y] = true;

  while (queue.length) {
    const current = queue.shift();
    [
      { x: current.x + 1, y: current.y },
      { x: current.x - 1, y: current.y },
      { x: current.x, y: current.y + 1 },
      { x: current.x, y: current.y - 1 },
    ].forEach(function each(next) {
      const row = mapData[next.y];
      const key = next.x + "," + next.y;
      if (!row || visited[key] || row[next.x] === wallTile) {
        return;
      }
      visited[key] = true;
      queue.push(next);
    });
  }

  return visited;
}

function validateStageGeneration(stageApi, tileMap) {
  const fieldStages = ["verdant_grove", "sunken_archive", "ember_hollow"];
  fieldStages.forEach(function eachStage(stageId) {
    for (let index = 0; index < 24; index += 1) {
      const stage = stageApi.createStageInstance(stageId, {});
      const reachable = collectReachableKeys(stage.map, stage.start, tileMap.WALL);

      assert(stage.portalPos, stageId + " 缺少 Boss 传送门位置");
      assert(stage.map[stage.portalPos.y][stage.portalPos.x] === tileMap.PORTAL, stageId + " 的 Boss 传送门未直接显示");
      assert(reachable[stage.portalPos.x + "," + stage.portalPos.y], stageId + " 的 Boss 传送门不可达");

      Object.keys(stage.encounters || {}).forEach(function eachEncounter(position) {
        assert(reachable[position], stageId + " 出现不可达的敌人刷点：" + position);
      });

      Object.keys(stage.events || {}).forEach(function eachEvent(position) {
        assert(reachable[position], stageId + " 出现不可达的事件节点：" + position);
      });
    }
  });
}

function validateDataAndViewModels() {
  const context = createBrowserContext();
  loadScriptIntoContext(context, "combat-io.js");
  loadScriptIntoContext(context, "combat-timeline.js");
  loadScriptIntoContext(context, "combat-effects.js");
  loadScriptIntoContext(context, "combat-actions.js");
  loadScriptIntoContext(context, "entities.js");
  loadScriptIntoContext(context, "combat.js");
  loadScriptIntoContext(context, "stage-data.js");
  loadScriptIntoContext(context, "view-models.js");
  loadScriptIntoContext(context, "save-system.js");

  const combatApi = context.window.CombatSystem;
  const entitiesApi = context.window.GameEntities;
  const stageApi = context.window.GameStageData;
  const viewApi = context.window.GameViewModels;
  const saveApi = context.window.GameSaveSystem;
  const timelineApi = context.window.CombatTimeline;
  const tileMap = context.window.GameMap.TILE;
  assert(combatApi && typeof combatApi.createCombatController === "function", "combat.js 必须暴露 createCombatController");

  assert(stageApi && typeof stageApi.createStageProgress === "function", "stage-data.js 未暴露 createStageProgress");
  assert(timelineApi && typeof timelineApi.createTimelineState === "function", "combat-timeline.js 未暴露 createTimelineState");
  assert(entitiesApi && typeof entitiesApi.getResolvedSkill === "function", "entities.js 未暴露 getResolvedSkill");
  assert(viewApi && typeof viewApi.createCombatTimelineViewModel === "function", "view-models.js 未暴露 createCombatTimelineViewModel");
  assert(viewApi && typeof viewApi.createCombatMenuTimingViewModel === "function", "view-models.js 未暴露 createCombatMenuTimingViewModel");
  assert(Array.isArray(stageApi.CHAPTERS) && stageApi.CHAPTERS.length >= 3, "章节配置未正确暴露");

  validateStageGeneration(stageApi, tileMap);

  const attackSkill = entitiesApi.getResolvedSkill("attack");
  const slashSkill = entitiesApi.getResolvedSkill("slash");
  const battleCrySkill = entitiesApi.getResolvedSkill("battle_cry");
  const earthshatterSkill = entitiesApi.getResolvedSkill("earthshatter");
  const executionSealSkill = entitiesApi.getResolvedSkill("execution_seal");
  assert(entitiesApi.classes.warrior && entitiesApi.classes.warrior.selectable !== false, "战士应保持为当前可选职业");
  assert(entitiesApi.classes.mage && entitiesApi.classes.mage.selectable === false, "法师应在职业重构阶段被禁用");
  assert(entitiesApi.classes.rogue && entitiesApi.classes.rogue.selectable !== false, "盗贼重构试行版应已恢复选择入口");
  assert(entitiesApi.classes.ranger && entitiesApi.classes.ranger.selectable !== false, "游侠重构试行版应已恢复选择入口");
  assert(entitiesApi.classes.paladin && entitiesApi.classes.paladin.refactorLabel === "重构中", "尚未重构的职业仍应标记为重构中");
  assert(entitiesApi.classes.warrior.resourceConfig.max === 5, "战士压制值上限应提升到新版模板的 5 点");
  assert(entitiesApi.classes.rogue.resourceConfig.max === 6, "盗贼连击点上限应提升到新版模板的 6 点");
  assert(entitiesApi.classes.ranger.resourceConfig.max === 5, "游侠专注值上限应提升到新版模板的 5 点");
  assert(typeof attackSkill.baseDelay === "number", "技能解析未补齐 baseDelay");
  assert(typeof attackSkill.advanceSelf === "number", "技能解析未补齐 advanceSelf");
  assert(typeof attackSkill.delayTarget === "number", "技能解析未补齐 delayTarget");
  assert(slashSkill.resourceGain === 2, "裂风斩应成为战士的主压制值生成技");
  assert(slashSkill.bonusVsChargingRatio > 0, "裂风斩未接入对蓄力目标的额外收益");
  assert(battleCrySkill.resourceCost === 1, "战吼应改为低消耗的窗口启动技");
  assert(earthshatterSkill.resourceCost === 3, "裂地猛击应改为新版战士的主处决消耗");
  assert(executionSealSkill.bonusVsBrokenRatio > 0, "处决印记未接入失衡处决收益");

  const timeline = timelineApi.createTimelineState({
    actors: [
      { unitId: "player", side: "player", label: "勇者", hp: 100, maxHp: 100, speed: 12 },
      { unitId: "enemy", side: "enemy", label: "史莱姆", hp: 30, maxHp: 30, speed: 6 },
    ],
  });
  assert(timeline.currentActorId === "player", "时间轴未正确根据速度选择首个行动者");
  timelineApi.resolveAction(timeline, { sourceUnitId: "player", targetUnitId: "enemy", actionId: "attack", baseDelay: 54, advanceSelf: 0, delayTarget: 0 });
  const timelineView = viewApi.createCombatTimelineViewModel({
    inCombat: true,
    playerTurn: true,
    insertWindow: { open: false },
    timeline: timeline,
  });
  assert(Array.isArray(timelineView.entries) && timelineView.entries.length > 0, "时间轴视图模型未生成行动预览");
  assert(timelineView.entries[0].meta.includes("AV"), "时间轴视图模型未展示 AV 信息");
  const menuTimingView = viewApi.createCombatMenuTimingViewModel({
    skill: attackSkill,
    snapshot: {
      inCombat: true,
      playerTurn: true,
      ultimate: {
        current: 0,
      },
      insertWindow: {
        open: false,
      },
    },
  });
  assert(menuTimingView.metaText.includes("延迟"), "战斗菜单节奏视图模型未展示延迟信息");
  const chargeTimingView = viewApi.createCombatMenuTimingViewModel({
    skill: slashSkill,
    snapshot: {
      enemyPressure: {
        chargeLevel: 1,
        poiseCurrent: 6,
      },
    },
  });
  assert(chargeTimingView.metaText.includes("蓄力特攻"), "技能菜单未展示蓄力特攻信息");
  assert(chargeTimingView.metaText.includes("可打断"), "技能菜单未根据额外韧性收益提示可打断");
  const executionTimingView = viewApi.createCombatMenuTimingViewModel({
    skill: executionSealSkill,
    snapshot: {},
  });
  assert(executionTimingView.metaText.includes("处决 +"), "技能菜单未展示处决收益信息");
  entitiesApi.setRelicResolver(stageApi.findRelicByName);
  entitiesApi.player.relics = ["破阵狼徽", "处刑王冠"];
  entitiesApi.refreshBuildSnapshot();
  const relicSlashSkill = entitiesApi.getResolvedSkill("slash");
  const relicExecutionSkill = entitiesApi.getResolvedSkill("execution_seal");
  assert(relicSlashSkill.bonusVsChargingRatio > slashSkill.bonusVsChargingRatio, "挂轴遗物未提高打断型技能对蓄力目标的收益");
  assert(relicExecutionSkill.bonusVsBrokenRatio > executionSealSkill.bonusVsBrokenRatio, "挂轴遗物未提高处决型技能对失衡目标的收益");
  assert(Array.isArray(entitiesApi.player.buildSnapshot.combatFocuses) && entitiesApi.player.buildSnapshot.combatFocuses.length > 0, "构筑快照未汇总战斗倾向");
  const buildCodexView = viewApi.createBuildCodexViewModel({ player: entitiesApi.player, sections: [] });
  assert(buildCodexView.summaryRows.some(function hasFocus(row) { return row.label === "战斗倾向" && row.value.indexOf("反蓄力") !== -1; }), "构筑详情未展示遗物形成的战斗倾向");
  entitiesApi.applyClassToPlayer("warrior");
  entitiesApi.player.level = 3;
  entitiesApi.player.classResource.current = entitiesApi.player.classResource.max;
  entitiesApi.unlockClassSkillIfNeeded();
  assert(entitiesApi.player.buildSnapshot.combatFocuses.includes("起手压制"), "战士构筑快照未体现起手压制职责");
  assert(entitiesApi.player.buildSnapshot.combatFocuses.includes("失衡处决"), "战士构筑快照未体现失衡处决职责");
  const ultimateSkills = entitiesApi.getResolvedUltimateSkills();
  assert(ultimateSkills.length > 0, "战士终结技未能在 3 级后正确解锁");

  entitiesApi.applyClassToPlayer("rogue");
  entitiesApi.player.level = 3;
  entitiesApi.player.classResource.current = entitiesApi.player.classResource.max;
  entitiesApi.unlockClassSkillIfNeeded();
  const rogueUltimateSkills = entitiesApi.getResolvedUltimateSkills();
  assert(rogueUltimateSkills.some(function hasRogueUltimate(skill) { return skill.id === "shadow_flurry"; }), "盗贼终结技未在 3 级后正确解锁");
  assert(entitiesApi.player.buildSnapshot.combatFocuses.includes("起手抢轴"), "盗贼构筑快照未体现起手抢轴职责");
  assert(entitiesApi.player.buildSnapshot.combatFocuses.includes("斩杀处决"), "盗贼构筑快照未体现斩杀处决职责");

  entitiesApi.applyClassToPlayer("ranger");
  entitiesApi.player.level = 3;
  entitiesApi.player.classResource.current = entitiesApi.player.classResource.max;
  entitiesApi.unlockClassSkillIfNeeded();
  const rangerUltimateSkills = entitiesApi.getResolvedUltimateSkills();
  assert(rangerUltimateSkills.some(function hasRangerUltimate(skill) { return skill.id === "volley"; }), "游侠终结技未在 3 级后正确解锁");
  assert(entitiesApi.player.buildSnapshot.combatFocuses.includes("起手拖轴"), "游侠构筑快照未体现起手拖轴职责");
  assert(entitiesApi.player.buildSnapshot.combatFocuses.includes("收割处决"), "游侠构筑快照未体现收割处决职责");

  entitiesApi.applyClassToPlayer("warrior");
  entitiesApi.player.level = 3;
  entitiesApi.player.classResource.current = entitiesApi.player.classResource.max;
  entitiesApi.unlockClassSkillIfNeeded();

  const combatController = combatApi.createCombatController({
    player: entitiesApi.player,
    skills: entitiesApi.skills,
    resolveSkill: entitiesApi.getResolvedSkill,
    getUltimateSkills: entitiesApi.getResolvedUltimateSkills,
    onLog: function noopLog() {},
    onStatusSync: function noopStatus() {},
    onEffect: function noopEffect() {},
    onStateChange: function noopState() {},
    onCombatEnd: function noopEnd() {},
  });
  const started = combatController.startCombat({
    tile: 3,
    playerUltimateCharge: 8,
    enemyTemplate: {
      id: "timeline_enemy",
      name: "时间试炼偶",
      hp: 120,
      attack: 10,
      defense: 2,
      speed: 18,
      exp: 0,
      gold: 0,
      skills: [],
      role: "basic",
      assetKey: "enemy",
      encounterType: "normal",
      dropTableId: "field_default",
    },
  });
  assert(started, "终结技插入验证战斗未能成功启动");

  const beforeInsert = combatController.getState();
  const primaryUltimate = ultimateSkills[0];
  assert(beforeInsert.insertWindow && beforeInsert.insertWindow.open, "敌方行动前未打开终结技插入窗口");
  assert(beforeInsert.ultimate && beforeInsert.ultimate.availableSkillIds.includes(primaryUltimate.id), "终结技可用时未出现在插入窗口可选列表中");

  const usedUltimate = combatController.playerAction("ultimate:" + primaryUltimate.id);
  assert(usedUltimate, "终结技在插入窗口内未能成功释放");
  const afterInsert = combatController.getState();
  assert(!afterInsert.insertWindow || !afterInsert.insertWindow.open, "终结技释放后插入窗口未关闭");
  assert(afterInsert.ultimate && afterInsert.ultimate.current < beforeInsert.ultimate.current, "终结技释放后未正确扣减终结能量");
  assert(Boolean(timeline.currentActorId), "时间轴在结算行动后未推进到下一行动者");

  const progress = stageApi.createStageProgress();
  assert(progress.chapterProgress, "createStageProgress 未生成 chapterProgress");
  assert(Array.isArray(progress.chapterProgress.unlockedChapterIds), "chapterProgress.unlockedChapterIds 缺失");
  assert(progress.longTerm && typeof progress.longTerm.townRenown === "number", "longTerm.townRenown 缺失");

  const archiveChapter = stageApi.getChapterByStageId("sunken_archive");
  assert(archiveChapter && archiveChapter.label.includes("第二章"), "getChapterByStageId 未返回正确章节");

  const summaryHtml = viewApi.renderRunSummaryHtml(viewApi.createRunSummaryViewModel({
    stageLabel: "青藤密林",
    unlockedChapterLabel: "第二章：书库回响",
    unlockedStageLabel: "沉没书库",
  }));
  assert(summaryHtml.includes("章节推进"), "结算视图未展示章节推进");

  const saveResult = saveApi.saveSnapshot({
    currentStageName: "azure_town",
    currentStageLabel: "蔚蓝城镇",
    currentStageMode: "town",
    player: { className: "勇者" },
    progress: progress,
  });
  assert(saveResult.ok, "save-system.js 无法保存基础快照");
  const metadata = saveApi.getSaveMetadata();
  assert(metadata.exists, "save-system.js 未能读取保存后的元信息");
}

function validateSourceSyntax(relativePath) {
  const source = readFile(relativePath);
  try {
    new vm.Script(source, { filename: relativePath });
  } catch (error) {
    fail(relativePath + " 存在语法错误：" + error.message);
  }
}

function main() {
  validateHtmlContract(readFile("index.html"));
  validateStyleContract(readFile("style.css"));
  [
    "main.js",
    "combat-io.js",
    "combat-timeline.js",
    "combat-effects.js",
    "combat-actions.js",
    "combat.js",
    "entities.js",
    "stage-data.js",
    "view-models.js",
    "save-system.js",
    "scripts/validate-combat.js",
  ].forEach(validateSourceSyntax);
  validateDataAndViewModels();
  childProcess.execFileSync(process.execPath, [path.join(__dirname, "validate-combat.js")], { stdio: "inherit" });
  console.log("基础验证通过：UI 合同、章节进度、结算视图与存档链路正常。");
}

main();
