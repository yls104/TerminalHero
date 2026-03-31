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
    "actionHint",
    "btnUltimate",
    "timelinePanel",
    "timelineStatus",
    "timelinePreview",
    "playerCombatPanel",
    "combatPlayerHp",
    "combatPlayerMp",
    "combatPlayerResourceRow",
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
    ".combat-hud-layer",
    ".combat-top-strip",
    ".combat-action-dock",
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

function validateDataAndViewModels() {
  const context = createBrowserContext();
  loadScriptIntoContext(context, "combat-io.js");
  loadScriptIntoContext(context, "combat-timeline.js");
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
  assert(combatApi && typeof combatApi.createCombatController === "function", "combat.js 必须暴露 createCombatController");

  assert(stageApi && typeof stageApi.createStageProgress === "function", "stage-data.js 未暴露 createStageProgress");
  assert(timelineApi && typeof timelineApi.createTimelineState === "function", "combat-timeline.js 未暴露 createTimelineState");
  assert(entitiesApi && typeof entitiesApi.getResolvedSkill === "function", "entities.js 未暴露 getResolvedSkill");
  assert(viewApi && typeof viewApi.createCombatTimelineViewModel === "function", "view-models.js 未暴露 createCombatTimelineViewModel");
  assert(viewApi && typeof viewApi.createCombatMenuTimingViewModel === "function", "view-models.js 未暴露 createCombatMenuTimingViewModel");
  assert(Array.isArray(stageApi.CHAPTERS) && stageApi.CHAPTERS.length >= 3, "章节配置未正确暴露");

  const attackSkill = entitiesApi.getResolvedSkill("attack");
  assert(typeof attackSkill.baseDelay === "number", "技能解析未补齐 baseDelay");
  assert(typeof attackSkill.advanceSelf === "number", "技能解析未补齐 advanceSelf");
  assert(typeof attackSkill.delayTarget === "number", "技能解析未补齐 delayTarget");

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
  entitiesApi.applyClassToPlayer("warrior");
  entitiesApi.player.level = 3;
  entitiesApi.player.classResource.current = entitiesApi.player.classResource.max;
  entitiesApi.unlockClassSkillIfNeeded();
  const ultimateSkills = entitiesApi.getResolvedUltimateSkills();
  assert(ultimateSkills.length > 0, "战士终结技未能在 3 级后正确解锁");

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
