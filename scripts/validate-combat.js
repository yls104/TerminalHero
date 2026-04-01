const fs = require("fs");
const path = require("path");
const vm = require("vm");

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

function createBrowserContext() {
  const pendingTimers = {};
  let timerSeed = 0;
  const mathObject = Object.create(Math);
  mathObject.random = function random() {
    return 0.99;
  };

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
    Math: mathObject,
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

  context.__runNextTimer = function runNextTimer() {
    const nextId = Object.keys(pendingTimers).map(Number).sort(function sortAsc(a, b) { return a - b; })[0];
    if (!nextId) {
      return false;
    }
    const fn = pendingTimers[nextId];
    delete pendingTimers[nextId];
    fn();
    return true;
  };

  context.__drainTimers = function drainTimers(limit) {
    let count = 0;
    const max = typeof limit === "number" ? limit : 8;
    while (count < max && context.__runNextTimer()) {
      count += 1;
    }
    return count;
  };

  context.window.setTimeout = context.setTimeout;
  context.window.clearTimeout = context.clearTimeout;
  context.window.window = context.window;
  return vm.createContext(context);
}

function loadApis(context) {
  [
    "combat-io.js",
    "combat-timeline.js",
    "combat-effects.js",
    "combat-actions.js",
    "entities.js",
    "combat.js",
    "view-models.js",
  ].forEach(function eachFile(file) {
    loadScriptIntoContext(context, file);
  });

  return {
    ioApi: context.window.CombatIO,
    timelineApi: context.window.CombatTimeline,
    entitiesApi: context.window.GameEntities,
    combatApi: context.window.CombatSystem,
    viewApi: context.window.GameViewModels,
  };
}

function testTimelineInitializationAndSpeed(timelineApi) {
  const fastTimeline = timelineApi.createTimelineState({
    actors: [
      { unitId: "player", side: "player", label: "勇者", hp: 100, maxHp: 100, speed: 16 },
      { unitId: "enemy", side: "enemy", label: "史莱姆", hp: 30, maxHp: 30, speed: 8 },
    ],
  });
  assert(fastTimeline.currentActorId === "player", "高速度单位未取得首个行动位");
  assert(fastTimeline.queuePreview[0].unitId === "player", "时间轴预览未体现高速单位先手");
  assert(fastTimeline.queuePreview[0].speed === 16, "时间轴预览未携带速度字段");

  const slowTimeline = timelineApi.createTimelineState({
    actors: [
      { unitId: "player", side: "player", label: "勇者", hp: 100, maxHp: 100, speed: 8 },
      { unitId: "enemy", side: "enemy", label: "史莱姆", hp: 30, maxHp: 30, speed: 16 },
    ],
  });
  assert(slowTimeline.currentActorId === "enemy", "速度差未改变先手行动者");
  assert(slowTimeline.queuePreview[0].unitId === "enemy", "速度差未改变时间轴预览顺序");
}

function testDelayAndAdvanceAffectTiming(timelineApi) {
  function getOccurrenceIndex(queuePreview, unitId, occurrence) {
    let seen = 0;
    for (let index = 0; index < queuePreview.length; index += 1) {
      if (queuePreview[index].unitId === unitId) {
        seen += 1;
        if (seen === occurrence) {
          return index;
        }
      }
    }
    return -1;
  }

  const quickTimeline = timelineApi.createTimelineState({
    actors: [
      { unitId: "player", side: "player", label: "勇者", hp: 100, maxHp: 100, speed: 12 },
      { unitId: "enemy", side: "enemy", label: "史莱姆", hp: 100, maxHp: 100, speed: 10 },
    ],
  });
  timelineApi.resolveAction(quickTimeline, {
    sourceUnitId: "player",
    targetUnitId: "enemy",
    actionId: "quick",
    baseDelay: 36,
    advanceSelf: 12,
    delayTarget: 10,
  });
  const quickPlayer = timelineApi.getActor(quickTimeline, "player");

  const heavyTimeline = timelineApi.createTimelineState({
    actors: [
      { unitId: "player", side: "player", label: "勇者", hp: 100, maxHp: 100, speed: 12 },
      { unitId: "enemy", side: "enemy", label: "史莱姆", hp: 100, maxHp: 100, speed: 10 },
    ],
  });
  timelineApi.resolveAction(heavyTimeline, {
    sourceUnitId: "player",
    targetUnitId: "enemy",
    actionId: "heavy",
    baseDelay: 78,
    advanceSelf: 0,
    delayTarget: 0,
  });
  const heavyPlayer = timelineApi.getActor(heavyTimeline, "player");
  const quickPlayerNextIndex = getOccurrenceIndex(quickTimeline.queuePreview, "player", 1);
  const heavyPlayerNextIndex = getOccurrenceIndex(heavyTimeline.queuePreview, "player", 1);
  const quickEnemySecondIndex = getOccurrenceIndex(quickTimeline.queuePreview, "enemy", 2);
  const heavyEnemySecondIndex = getOccurrenceIndex(heavyTimeline.queuePreview, "enemy", 2);

  assert(quickPlayer.currentAv < heavyPlayer.currentAv, "技能延迟差未改变玩家下次行动时机");
  assert(quickPlayerNextIndex < heavyPlayerNextIndex, "快招与慢招未改变玩家在时间轴中的回合顺位");
  assert(quickEnemySecondIndex > heavyEnemySecondIndex, "目标延后未改变敌方后续行动顺位");
}

function testUltimateInsertFlow(context, apis) {
  const logs = [];
  const entitiesApi = apis.entitiesApi;
  const combatApi = apis.combatApi;
  const viewApi = apis.viewApi;

  entitiesApi.applyClassToPlayer("warrior");
  entitiesApi.player.level = 3;
  entitiesApi.player.hp = entitiesApi.player.maxHp;
  entitiesApi.player.mp = entitiesApi.player.maxMp;
  entitiesApi.player.classResource.current = entitiesApi.player.classResource.max;
  entitiesApi.unlockClassSkillIfNeeded();

  const combatController = combatApi.createCombatController({
    player: entitiesApi.player,
    skills: entitiesApi.skills,
    resolveSkill: entitiesApi.getResolvedSkill,
    getUltimateSkills: entitiesApi.getResolvedUltimateSkills,
    onLog(entry) {
      logs.push(entry);
    },
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
      hp: 140,
      attack: 8,
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
  assert(started, "战斗专项烟雾测试未能成功启动");

  const beforeInsert = combatController.getState();
  const primaryUltimate = entitiesApi.getResolvedUltimateSkills()[0];
  assert(beforeInsert.insertWindow && beforeInsert.insertWindow.open, "敌方回合前未打开终结技插入窗口");
  assert(beforeInsert.timeline && beforeInsert.timeline.queuePreview.length > 0, "战斗快照未携带时间轴预览");
  assert(beforeInsert.enemyIntent && beforeInsert.enemyIntent.label, "敌方回合前未生成可读的敌方意图快照");

  const enemyView = viewApi.createEnemyViewModel({
    enemy: beforeInsert.enemy,
    intent: beforeInsert.enemyIntent,
  });
  assert(enemyView.intentVisible, "敌方信息面板未承接敌方意图显示");
  assert(enemyView.intentName === beforeInsert.enemyIntent.label, "敌方信息面板未展示敌方意图名称");
  assert(enemyView.intentSummary.length > 0, "敌方信息面板未展示敌方意图摘要");

  const combatIntentView = viewApi.createCombatIntentViewModel(beforeInsert);
  assert(combatIntentView.visible, "战斗行动提示未承接敌方意图可见状态");
  assert(combatIntentView.actionHintText.includes(beforeInsert.enemyIntent.label), "战斗行动提示未引用敌方意图名称");

  const timingView = viewApi.createCombatMenuTimingViewModel({
    skill: primaryUltimate,
    snapshot: beforeInsert,
  });
  assert(timingView.metaText.includes("可插入"), "终结技菜单说明未体现插入窗口");

  const usedUltimate = combatController.playerAction("ultimate:" + primaryUltimate.id);
  assert(usedUltimate, "终结技在插入窗口内未能成功释放");

  const afterInsert = combatController.getState();
  assert(!afterInsert.insertWindow || !afterInsert.insertWindow.open, "终结技释放后插入窗口未关闭");
  assert(afterInsert.ultimate.current < beforeInsert.ultimate.current, "终结技释放后未扣减终结资源");
  assert(logs.some(function hasUltimateLog(entry) {
    return entry && entry.type === "ultimate_action";
  }), "终结技释放未产出专项战斗日志");

  const drained = context.__drainTimers(4);
  assert(drained > 0, "敌方行动计时器未被触发，普通回合链路未推进");
  assert(logs.some(function hasEnemyAction(entry) {
    return entry && entry.type === "enemy_action";
  }), "终结技插入后未恢复敌方普通行动");

  const finalState = combatController.getState();
  assert(finalState.inCombat, "终结技插入后战斗流程异常中断");
  assert(finalState.timeline && Boolean(finalState.timeline.currentActorId), "终结技插入后时间轴未继续推进");

  const timelineView = viewApi.createCombatTimelineViewModel(finalState);
  assert(timelineView.entries.length > 0, "战斗结束前时间轴视图模型未能读取快照");
  assert(timelineView.entries[0].meta.includes("速度"), "时间轴视图模型未展示速度信息");
}

function validateSourceSyntax(relativePath) {
  const source = readFile(relativePath);
  try {
    new vm.Script(source, { filename: relativePath });
  } catch (error) {
    fail(relativePath + " 存在语法错误: " + error.message);
  }
}

function main() {
  validateSourceSyntax("scripts/validate-combat.js");
  const context = createBrowserContext();
  const apis = loadApis(context);
  testTimelineInitializationAndSpeed(apis.timelineApi);
  testDelayAndAdvanceAffectTiming(apis.timelineApi);
  testUltimateInsertFlow(context, apis);
  console.log("战斗专项验证通过：时间轴、速度收益、技能延迟、终结技插入与 UI 快照读取正常。");
}

main();
