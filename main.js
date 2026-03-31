(function bootstrap() {
  const PLAYER_MOVE_DURATION = 112;
  const TILE = (window.GameMap && window.GameMap.TILE) || { FLOOR: 0, WALL: 1, PLAYER_START: 2, ENEMY: 3, HEAL_POINT: 4, BOSS: 5, PORTAL: 6, ELITE: 7, EVENT: 8 };
  const entitiesApi = window.GameEntities || {};
  const mapApi = window.GameMap || {};
  const combatApi = window.CombatSystem || {};
  const combatIoApi = window.CombatIO || {};
  const stateApi = window.GameStateStore || {};
  const stageApi = window.GameStageData || {};
  const viewModelApi = window.GameViewModels || {};
  const saveApi = window.GameSaveSystem || {};

  const GAME_STATE = stateApi.GAME_STATE || {
    EXPLORE: "EXPLORE_STATE",
    COMBAT: "COMBAT_STATE",
    BOSS_INTRO: "BOSS_INTRO_STATE",
    PORTAL_TRANSIT: "PORTAL_TRANSIT_STATE",
    GAME_OVER: "GAME_OVER_STATE",
  };

  const player = entitiesApi.player;
  const classes = entitiesApi.classes || {};
  const skills = entitiesApi.skills || {};
  const applyClassToPlayer = entitiesApi.applyClassToPlayer || function noop() { return false; };
  const unlockClassSkillIfNeeded = entitiesApi.unlockClassSkillIfNeeded || function noSkill() { return null; };
  const getPlayerSkills = entitiesApi.getPlayerSkills || function emptySkills() { return []; };
  const getResolvedSkill = entitiesApi.getResolvedSkill || function fallbackResolvedSkill(skillId) { return skills[skillId] || null; };
  const getResolvedPlayerSkills = entitiesApi.getResolvedPlayerSkills || function fallbackResolvedSkills() { return getPlayerSkills(); };
  const getResolvedUltimateSkills = entitiesApi.getResolvedUltimateSkills || function fallbackResolvedUltimateSkills() { return []; };
  const isUltimateSkill = entitiesApi.isUltimateSkill || function fallbackIsUltimateSkill(skill) { return Boolean(skill && skill.actionType === "ultimate"); };
  const setRelicResolver = entitiesApi.setRelicResolver || function noopRelicResolver() {};
  const refreshBuildSnapshot = entitiesApi.refreshBuildSnapshot || function noopRefreshBuildSnapshot() {};
  const getSpecializationTracks = entitiesApi.getSpecializationTracks || function noTracks() { return []; };
  const getUnlockedSpecializationNodes = entitiesApi.getUnlockedSpecializationNodes || function noUnlockedNodes() { return []; };
  const unlockSpecializationNode = entitiesApi.unlockSpecializationNode || function noUnlock() { return { ok: false, reason: "当前版本未接入职业专精。" }; };
  const spendSkillPoint = entitiesApi.spendSkillPoint || function noSpend() { return false; };
  const buyEquipment = entitiesApi.buyEquipment || function noBuy() { return false; };
  const upgradeEquipment = entitiesApi.upgradeEquipment || function noUpgrade() { return { ok: false, reason: "当前版本未接入装备强化。" }; };

  const TILE_SIZE = mapApi.TILE_SIZE || 32;
  const drawMap = mapApi.drawMap;
  const loadMapAssets = mapApi.loadMapAssets || function noopAssets() { return Promise.resolve([]); };
  const getMapAsset = mapApi.getMapAsset || function missingAsset() { return null; };

  const STAGE_META = stageApi.STAGE_META || {};
  const STAGE_SEQUENCE = stageApi.STAGE_SEQUENCE || [];
  const CHAPTERS = stageApi.CHAPTERS || [];
  const SHOP_ITEMS = stageApi.SHOP_ITEMS || [];
  const TOWN_UPGRADES = stageApi.TOWN_UPGRADES || {};
  const RELIC_POOLS = stageApi.RELIC_POOLS || {};
  const DROP_TABLES = stageApi.DROP_TABLES || {};
  const getStageMeta = stageApi.getStageMeta || function fallbackStageMeta(stageName) { return STAGE_META[stageName] || {}; };
  const getChapterByStageId = stageApi.getChapterByStageId || function fallbackChapterByStageId(stageId) {
    return CHAPTERS.find(function findChapter(chapter) {
      return chapter.stageId === stageId;
    }) || null;
  };
  const createStageInstance = stageApi.createStageInstance || function fallbackStageInstance() { return { map: [], encounters: {}, events: {}, portalPos: null, contentPools: {} }; };
  const createStageProgress = stageApi.createStageProgress || function fallbackProgress() { return { availableStages: [], clearedBosses: {} }; };
  const positionKey = stageApi.positionKey || function fallbackPositionKey(x, y) { return x + "," + y; };
  const findRelicByName = stageApi.findRelicByName || function fallbackRelic() { return null; };
  const createEquipmentOffer = stageApi.createEquipmentOffer || function fallbackEquipmentOffer(item) { return item; };
  const upgradeEquipmentInstance = stageApi.upgradeEquipmentInstance || function fallbackUpgradeEquipmentInstance(item) { return item; };
  const createRewardChoices = stageApi.createRewardChoices || function noRewardChoices() { return []; };

  const createHudViewModel = viewModelApi.createHudViewModel || function fallbackHudViewModel() { return {}; };
  const createEnemyViewModel = viewModelApi.createEnemyViewModel || function fallbackEnemyViewModel() { return { visible: false, name: "", hpText: "0 / 0", hpPercent: 0 }; };
  const createDetailStatsViewModel = viewModelApi.createDetailStatsViewModel || function fallbackDetailStatsViewModel() { return { overlayEyebrow: "", overlayTitle: "", rows: [] }; };
  const renderDetailStatsHtml = viewModelApi.renderDetailStatsHtml || function fallbackDetailHtml() { return ""; };
  const createRunSummaryViewModel = viewModelApi.createRunSummaryViewModel || function fallbackRunSummaryViewModel() { return { overlayEyebrow: "", overlayTitle: "", rows: [] }; };
  const renderRunSummaryHtml = viewModelApi.renderRunSummaryHtml || function fallbackRunSummaryHtml() { return ""; };
  const createBuildCodexViewModel = viewModelApi.createBuildCodexViewModel || function fallbackBuildCodexViewModel() { return { overlayEyebrow: "", overlayTitle: "", summaryRows: [], sections: [] }; };
  const renderBuildCodexHtml = viewModelApi.renderBuildCodexHtml || function fallbackBuildCodexHtml() { return ""; };
  const createCombatTimelineViewModel = viewModelApi.createCombatTimelineViewModel || function fallbackCombatTimelineViewModel() { return { visible: false, statusText: "", entries: [] }; };
  const createCombatMenuTimingViewModel = viewModelApi.createCombatMenuTimingViewModel || function fallbackCombatMenuTimingViewModel() { return { metaText: "" }; };
  const saveSnapshot = saveApi.saveSnapshot || function noSave() { return { ok: false, reason: "当前版本未接入存档。" }; };
  const loadSnapshot = saveApi.loadSnapshot || function noLoad() { return { ok: false, reason: "当前版本未接入存档。" }; };
  const clearSnapshot = saveApi.clearSnapshot || function noClear() { return { ok: false, reason: "当前版本未接入存档。" }; };
  const getSaveMetadata = saveApi.getSaveMetadata || function noMeta() { return { exists: false, savedAt: "", summary: "" }; };
  const normalizeCombatLogEntry = combatIoApi.normalizeCombatLogEntry || function fallbackLogEntry(input) {
    return typeof input === "string" ? { text: input, type: "info", emphasis: false } : { text: String((input && input.text) || ""), type: "info", emphasis: false };
  };

  const canvas = document.querySelector("#gameCanvas");
  if (!canvas || !player || typeof drawMap !== "function") {
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const ui = {
    hp: document.querySelector("#hpValue"),
    mp: document.querySelector("#mpValue"),
    classValue: document.querySelector("#classValue"),
    stageValue: document.querySelector("#stageValue"),
    classSummary: document.querySelector("#classSummary"),
    level: document.querySelector("#levelValue"),
    exp: document.querySelector("#expValue"),
    gold: document.querySelector("#goldValue"),
    skillPoints: document.querySelector("#spValue"),
    legacyMarks: document.querySelector("#legacyValue"),
    townRenown: document.querySelector("#renownValue"),
    classResourceItem: document.querySelector("#classResourceItem"),
    classResourceLabel: document.querySelector("#classResourceLabel"),
    classResourceValue: document.querySelector("#classResourceValue"),
    classResourceBar: document.querySelector("#classResourceBar"),
    routeValue: document.querySelector("#routeValue"),
    pressureValue: document.querySelector("#pressureValue"),
    rewardValue: document.querySelector("#rewardValue"),
    pos: document.querySelector("#posValue"),
    sidePanel: document.querySelector(".side-panel"),
    mobileExploreHud: document.querySelector("#mobileExploreHud"),
    mobileClassValue: document.querySelector("#mobileClassValue"),
    mobileStageValue: document.querySelector("#mobileStageValue"),
    mobilePosValue: document.querySelector("#mobilePosValue"),
    mobileGoldValue: document.querySelector("#mobileGoldValue"),
    mobileSpValue: document.querySelector("#mobileSpValue"),
    mobilePanelToggle: document.querySelector("#mobilePanelToggle"),
    mobilePanelBackdrop: document.querySelector("#mobilePanelBackdrop"),
    mobileSideCloseButton: document.querySelector("#mobileSideCloseButton"),
    statusList: document.querySelector(".status-list"),
    resourcePanel: document.querySelector("#resourcePanel"),
    mobileBottomBar: document.querySelector("#mobileBottomBar"),
    mobileHudDock: document.querySelector("#mobileHudDock"),
    statusToggle: document.querySelector("#statusToggle"),
    floatingStatusPanel: document.querySelector("#floatingStatusPanel"),
    combatHudLayer: document.querySelector("#combatHudLayer"),
    btnCloseStatusPanel: document.querySelector("#btnCloseStatusPanel"),
    hpBar: document.querySelector("#hpBar"),
    mpBar: document.querySelector("#mpBar"),
    expBar: document.querySelector("#expBar"),
    actionPanel: document.querySelector("#actionPanel"),
    actionHint: document.querySelector("#actionHint"),
    actionMenu: document.querySelector("#actionMenu"),
    btnBasicAttack: document.querySelector("#btnBasicAttack"),
    btnSkillMenu: document.querySelector("#btnSkillMenu"),
    skillButtons: document.querySelector("#skillButtons"),
    btnUltimate: document.querySelector("#btnUltimate"),
    btnFlee: document.querySelector("#btnFlee"),
    timelinePanel: document.querySelector("#timelinePanel"),
    timelineStatus: document.querySelector("#timelineStatus"),
    timelinePreview: document.querySelector("#timelinePreview"),
    enemyPanel: document.querySelector("#enemyPanel"),
    enemyName: document.querySelector("#enemyName"),
    enemyHpText: document.querySelector("#enemyHpText"),
    enemyHpBar: document.querySelector("#enemyHpBar"),
    battleLog: document.querySelector("#battleLog"),
    combatBanner: document.querySelector("#combatBanner"),
    canvasWrap: document.querySelector(".canvas-wrap"),
    screenFlash: document.querySelector("#screenFlash"),
    sceneOverlay: document.querySelector("#sceneOverlay"),
    overlayEyebrow: document.querySelector("#overlayEyebrow"),
    overlayTitle: document.querySelector("#overlayTitle"),
    overlayText: document.querySelector("#overlayText"),
    overlayButton: document.querySelector("#overlayButton"),
    btnDetailStats: document.querySelector("#btnDetailStats"),
    btnSaveMenu: document.querySelector("#btnSaveMenu"),
    btnOpenLog: document.querySelector("#btnOpenLog"),
    combatPlayerHp: document.querySelector("#combatPlayerHp"),
    combatPlayerMp: document.querySelector("#combatPlayerMp"),
    combatPlayerResourceRow: document.querySelector("#combatPlayerResourceRow"),
    combatPlayerResourceLabel: document.querySelector("#combatPlayerResourceLabel"),
    combatPlayerResourceValue: document.querySelector("#combatPlayerResourceValue"),
    virtualJoystick: document.querySelector("#virtualJoystick"),
    joystickBase: document.querySelector("#joystickBase"),
    joystickKnob: document.querySelector("#joystickKnob"),
  };

  const movementByKey = {
    ArrowUp: { dx: 0, dy: -1 },
    ArrowDown: { dx: 0, dy: 1 },
    ArrowLeft: { dx: -1, dy: 0 },
    ArrowRight: { dx: 1, dy: 0 },
    w: { dx: 0, dy: -1 },
    a: { dx: -1, dy: 0 },
    s: { dx: 0, dy: 1 },
    d: { dx: 1, dy: 0 },
  };

  const progress = createStageProgress();
  const gameStateStore = stateApi.createGameStateStore
    ? stateApi.createGameStateStore(GAME_STATE.EXPLORE)
    : {
        currentState: GAME_STATE.EXPLORE,
        getState: function getState() { return this.currentState; },
        setState: function setState(nextState) { this.currentState = nextState; return this.currentState; },
        canTransition: function canTransition() { return true; },
        getAllowedTransitions: function getAllowedTransitions() { return []; },
        getHistory: function getHistory() { return []; },
        matches: function matches(targetState) { return this.currentState === targetState; },
        subscribe: function subscribe() { return function noopUnsubscribe() {}; },
        subscribeInvalid: function subscribeInvalid() { return function noopUnsubscribe() {}; },
      };

  let currentStageName = "azure_town";
  let currentStageMode = "town";
  let currentMap = [];
  let currentPortalPos = null;
  let currentEncounterPool = {};
  let currentEventPool = {};
  let currentStageContent = { eventPoolId: "", relicPoolId: "", dropTableId: "", elitePoolId: "", rewardProfileId: "", routeLabel: "", pressureLabel: "", rewardLabel: "", layoutProfile: "" };
  let renderPosition = { x: 1, y: 1 };
  let overlayAction = null;
  let combatSnapshot = null;
  let encounterPos = null;
  let bossIntroTimeout = 0;
  let lastFrameTime = 0;
  let preferredMoveKey = "";
  let skillMenuOpen = false;
  const heldKeys = {};
  const logHistory = [];
  const floatingHudState = {
    open: false,
    pointerId: null,
    dragging: false,
    pendingDrag: false,
    moved: false,
    offsetX: 0,
    offsetY: 0,
    pressX: 0,
    pressY: 0,
    leftPercent: 0.84,
    topPercent: 0.04,
  };
  const mobileHudState = {
    sidePanelOpen: false,
  };
  const joystickState = {
    active: false,
    pointerId: null,
    knobX: 0,
    knobY: 0,
    directionKey: "",
  };
  let runSummary = createEmptyRunSummary();
  let merchantStock = [];
  const movementState = {
    active: false,
    elapsed: 0,
    duration: PLAYER_MOVE_DURATION,
    fromX: 1,
    fromY: 1,
    toX: 1,
    toY: 1,
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function cloneValue(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function createEmptyRunSummary() {
    return {
      stageId: "",
      stageLabel: "",
      combatsWon: 0,
      elitesDefeated: 0,
      eventsResolved: 0,
      rewardsClaimed: 0,
      goldEarned: 0,
      expGained: 0,
      skillPointsEarned: 0,
      relicsFound: 0,
      materialsFound: 0,
      gainedRelics: [],
      gainedMaterials: [],
      gainedBlessings: [],
      bossCleared: false,
      outcomeText: "",
      unlockedStageLabel: "",
      unlockedChapterLabel: "",
      legacyMarksEarned: 0,
      townRenownEarned: 0,
    };
  }

  function startRun(stageId) {
    const meta = getStageMeta(stageId);
    runSummary = createEmptyRunSummary();
    runSummary.stageId = stageId;
    runSummary.stageLabel = meta.label || stageId;
  }

  function buildRunSummarySnapshot(overrides) {
    return Object.assign({}, runSummary, overrides || {});
  }

  function ensureRunCollections() {
    if (!Array.isArray(player.relics)) {
      player.relics = [];
    }
    if (!player.materials || typeof player.materials !== "object") {
      player.materials = {};
    }
    if (!Array.isArray(player.runBlessings)) {
      player.runBlessings = [];
    }
  }

  function ensureProgressState() {
    const defaultProgress = createStageProgress();
    if (!Array.isArray(progress.availableStages) || !progress.availableStages.length) {
      progress.availableStages = defaultProgress.availableStages.slice();
    }
    if (!progress.clearedBosses || typeof progress.clearedBosses !== "object") {
      progress.clearedBosses = {};
    }
    if (!progress.chapterProgress || typeof progress.chapterProgress !== "object") {
      progress.chapterProgress = cloneValue(defaultProgress.chapterProgress || {});
    }
    if (!Array.isArray(progress.chapterProgress.unlockedChapterIds) || !progress.chapterProgress.unlockedChapterIds.length) {
      progress.chapterProgress.unlockedChapterIds = cloneValue((defaultProgress.chapterProgress && defaultProgress.chapterProgress.unlockedChapterIds) || [1]);
    }
    if (!Array.isArray(progress.chapterProgress.clearedStageIds)) {
      progress.chapterProgress.clearedStageIds = [];
    }
    if (typeof progress.chapterProgress.currentChapterId !== "number") {
      progress.chapterProgress.currentChapterId = ((defaultProgress.chapterProgress && defaultProgress.chapterProgress.currentChapterId) || 1);
    }
    if (typeof progress.chapterProgress.campaignComplete !== "boolean") {
      progress.chapterProgress.campaignComplete = Boolean(defaultProgress.chapterProgress && defaultProgress.chapterProgress.campaignComplete);
    }
    if (!progress.longTerm || typeof progress.longTerm !== "object") {
      progress.longTerm = {};
    }
    if (typeof progress.longTerm.legacyMarks !== "number") {
      progress.longTerm.legacyMarks = 0;
    }
    if (typeof progress.longTerm.townRenown !== "number") {
      progress.longTerm.townRenown = 0;
    }
    if (!progress.longTerm.townUpgrades || typeof progress.longTerm.townUpgrades !== "object") {
      progress.longTerm.townUpgrades = {};
    }
    Object.keys(TOWN_UPGRADES).forEach(function eachUpgrade(upgradeId) {
      if (typeof progress.longTerm.townUpgrades[upgradeId] !== "number") {
        progress.longTerm.townUpgrades[upgradeId] = 0;
      }
    });

    CHAPTERS.forEach(function eachChapter(chapter) {
      if (progress.clearedBosses[chapter.stageId] && progress.chapterProgress.clearedStageIds.indexOf(chapter.stageId) === -1) {
        progress.chapterProgress.clearedStageIds.push(chapter.stageId);
      }
      if (progress.availableStages.indexOf(chapter.stageId) !== -1 && progress.chapterProgress.unlockedChapterIds.indexOf(chapter.id) === -1) {
        progress.chapterProgress.unlockedChapterIds.push(chapter.id);
      }
    });
  }

  function getUnlockedChapterIds() {
    ensureProgressState();
    return progress.chapterProgress.unlockedChapterIds;
  }

  function isStageCleared(stageId) {
    ensureProgressState();
    return progress.chapterProgress.clearedStageIds.indexOf(stageId) !== -1 || Boolean(progress.clearedBosses[stageId]);
  }

  function unlockChapter(chapterId) {
    ensureProgressState();
    if (getUnlockedChapterIds().indexOf(chapterId) !== -1) {
      return false;
    }
    progress.chapterProgress.unlockedChapterIds.push(chapterId);
    return true;
  }

  function markStageCleared(stageId) {
    ensureProgressState();
    if (progress.chapterProgress.clearedStageIds.indexOf(stageId) === -1) {
      progress.chapterProgress.clearedStageIds.push(stageId);
    }
    const chapter = getChapterByStageId(stageId);
    if (chapter) {
      progress.chapterProgress.currentChapterId = chapter.id;
    }
  }

  function tryAdvanceChapterAfterBoss(stageId) {
    ensureProgressState();
    const chapter = getChapterByStageId(stageId);
    if (!chapter) {
      return { unlockedChapter: null, blockedChapter: null, campaignComplete: false };
    }

    markStageCleared(stageId);
    const currentIndex = CHAPTERS.findIndex(function findChapterIndex(item) {
      return item.id === chapter.id;
    });
    const nextChapter = currentIndex >= 0 ? CHAPTERS[currentIndex + 1] : null;
    if (!nextChapter) {
      progress.chapterProgress.campaignComplete = true;
      progress.chapterProgress.currentChapterId = chapter.id;
      return { unlockedChapter: null, blockedChapter: null, campaignComplete: true };
    }

    progress.chapterProgress.currentChapterId = nextChapter.id;
    if ((progress.longTerm.townRenown || 0) < nextChapter.requiredRenown) {
      return { unlockedChapter: null, blockedChapter: nextChapter, campaignComplete: false };
    }

    unlockChapter(nextChapter.id);
    unlockStage(nextChapter.stageId);
    return { unlockedChapter: nextChapter, blockedChapter: null, campaignComplete: false };
  }

  function getTownUpgradeLevel(upgradeId) {
    ensureProgressState();
    return progress.longTerm.townUpgrades[upgradeId] || 0;
  }

  function applyTownUpgradeBonusesToPlayer() {
    const hpLevel = getTownUpgradeLevel("training_ground");
    const mpLevel = getTownUpgradeLevel("arcane_archive");
    if (hpLevel > 0) {
      player.maxHp += hpLevel * 10;
      player.hp = player.maxHp;
    }
    if (mpLevel > 0) {
      player.maxMp += mpLevel * 6;
      player.mp = player.maxMp;
    }
  }

  function awardLongTermProgress(summary) {
    ensureProgressState();
    const source = summary || runSummary;
    const legacyMarks = Math.max(0, (source.elitesDefeated || 0) + (source.bossCleared ? 3 : 0));
    const townRenown = Math.max(0, (source.bossCleared ? 2 : 0) + Math.floor((source.eventsResolved || 0) / 2));
    progress.longTerm.legacyMarks += legacyMarks;
    progress.longTerm.townRenown += townRenown;
    runSummary.legacyMarksEarned += legacyMarks;
    runSummary.townRenownEarned += townRenown;
    if (legacyMarks > 0 || townRenown > 0) {
      appendLog("回城沉淀：获得传承印记 " + legacyMarks + "，城镇声望 " + townRenown + "。");
    }
  }

  function getEncounterGoldBonus(enemy) {
    const level = getTownUpgradeLevel("supply_caravan");
    if (!enemy || level <= 0) {
      return 0;
    }
    if (enemy.isBoss) {
      return level * 18;
    }
    if (enemy.encounterType === "elite") {
      return level * 6;
    }
    return 0;
  }

  function getTownUpgradePreviewLines(upgradeId) {
    const config = TOWN_UPGRADES[upgradeId];
    if (!config) {
      return [];
    }
    const level = getTownUpgradeLevel(upgradeId);
    const nextCost = config.costs[level];
    return [
      "当前等级：" + level + " / " + config.maxLevel,
      config.effectText,
      nextCost ? ("下一次升级消耗：" + nextCost + " 传承印记") : "已达到最高等级",
    ];
  }

  function purchaseTownUpgrade(upgradeId) {
    ensureProgressState();
    const config = TOWN_UPGRADES[upgradeId];
    if (!config) {
      return { ok: false, reason: "未找到对应的城镇建设项目。" };
    }
    const currentLevel = getTownUpgradeLevel(upgradeId);
    if (currentLevel >= config.maxLevel) {
      return { ok: false, reason: "该建设项目已经升到上限。" };
    }
    const cost = config.costs[currentLevel];
    if (progress.longTerm.legacyMarks < cost) {
      return { ok: false, reason: "传承印记不足。" };
    }
    progress.longTerm.legacyMarks -= cost;
    progress.longTerm.townUpgrades[upgradeId] = currentLevel + 1;

    if (upgradeId === "training_ground") {
      player.maxHp += 10;
      player.hp = clamp(player.hp + 10, 1, player.maxHp);
    } else if (upgradeId === "arcane_archive") {
      player.maxMp += 6;
      player.mp = clamp(player.mp + 6, 0, player.maxMp);
    }
    syncStatusPanel();
    return { ok: true, level: currentLevel + 1, name: config.name };
  }

  function formatSaveTime(value) {
    if (!value) {
      return "未知时间";
    }
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return "未知时间";
    }
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  function buildSaveSnapshot() {
    return {
      currentStageName: currentStageName,
      currentStageLabel: getCurrentStageLabel(),
      currentStageMode: currentStageMode,
      currentMap: cloneValue(currentMap),
      currentPortalPos: cloneValue(currentPortalPos),
      currentEncounterPool: cloneValue(currentEncounterPool),
      currentEventPool: cloneValue(currentEventPool),
      currentStageContent: cloneValue(currentStageContent),
      player: cloneValue(player),
      progress: cloneValue(progress),
      merchantStock: cloneValue(merchantStock),
      runSummary: cloneValue(runSummary),
      renderPosition: cloneValue(renderPosition),
    };
  }

  function canPersistGame() {
    if (getGameState() === GAME_STATE.COMBAT || getGameState() === GAME_STATE.BOSS_INTRO || getGameState() === GAME_STATE.GAME_OVER) {
      return { ok: false, reason: "战斗中、Boss 演出中或结算失败时无法存档。" };
    }
    if (!player.classId) {
      return { ok: false, reason: "请先选择职业，再保存你的冒险进度。" };
    }
    return { ok: true };
  }

  function saveCurrentProgress(options) {
    const settings = options || {};
    const validation = canPersistGame();
    if (!validation.ok) {
      return validation;
    }
    const result = saveSnapshot(buildSaveSnapshot());
    if (result.ok && !settings.silent) {
      appendLog((settings.label || "存档已更新。") + "（" + formatSaveTime(result.savedAt) + "）");
    }
    return result;
  }

  function applyLoadedSnapshot(snapshot) {
    if (!snapshot || !snapshot.player || !snapshot.progress) {
      return { ok: false, reason: "存档内容不完整。" };
    }

    Object.keys(player).forEach(function eachKey(key) {
      delete player[key];
    });
    Object.assign(player, cloneValue(snapshot.player));
    ensureRunCollections();
    ensureProgressState();
    setRelicResolver(findRelicByName);

    progress.availableStages = Array.isArray(snapshot.progress.availableStages) ? snapshot.progress.availableStages.slice() : createStageProgress().availableStages.slice();
    progress.clearedBosses = snapshot.progress.clearedBosses ? cloneValue(snapshot.progress.clearedBosses) : {};
    progress.chapterProgress = snapshot.progress.chapterProgress ? cloneValue(snapshot.progress.chapterProgress) : createStageProgress().chapterProgress;
    progress.longTerm = snapshot.progress.longTerm ? cloneValue(snapshot.progress.longTerm) : createStageProgress().longTerm;
    ensureProgressState();

    currentStageName = snapshot.currentStageName || "azure_town";
    currentStageMode = snapshot.currentStageMode || (currentStageName === "azure_town" ? "town" : "field");
    currentMap = Array.isArray(snapshot.currentMap) && snapshot.currentMap.length ? cloneValue(snapshot.currentMap) : createStageInstance(currentStageName, currentStageMode === "boss" ? { mode: "boss" } : {}).map;
    currentPortalPos = snapshot.currentPortalPos ? cloneValue(snapshot.currentPortalPos) : null;
    currentEncounterPool = snapshot.currentEncounterPool ? cloneValue(snapshot.currentEncounterPool) : {};
    currentEventPool = snapshot.currentEventPool ? cloneValue(snapshot.currentEventPool) : {};
    currentStageContent = snapshot.currentStageContent
      ? cloneValue(snapshot.currentStageContent)
      : { eventPoolId: "", relicPoolId: "", dropTableId: "", elitePoolId: "", rewardProfileId: "", routeLabel: "", pressureLabel: "", rewardLabel: "", layoutProfile: "" };
    merchantStock = Array.isArray(snapshot.merchantStock) ? cloneValue(snapshot.merchantStock) : [];
    runSummary = snapshot.runSummary ? cloneValue(snapshot.runSummary) : createEmptyRunSummary();
    renderPosition = snapshot.renderPosition ? cloneValue(snapshot.renderPosition) : { x: player.position.x, y: player.position.y };
    movementState.active = false;
    clearHeldMoveKeys();
    encounterPos = null;
    combatSnapshot = null;
    syncEnemyPanel(null);
    setActionMenu(false, false);
    updateSkillMenuVisibility();
    renderSkillButtons();
    setGameState(GAME_STATE.EXPLORE);
    ensureFieldPortalVisible();
    syncStatusPanel();
    return { ok: true };
  }

  function addMaterial(materialLabel, amount) {
    const count = amount || 1;
    const key = materialLabel || "未知材料";
    player.materials[key] = (player.materials[key] || 0) + count;
    runSummary.materialsFound += count;
    const summaryLabel = key + " x" + count;
    if (!runSummary.gainedMaterials.includes(summaryLabel)) {
      runSummary.gainedMaterials.push(summaryLabel);
    }
  }

  function addRelic(relicName) {
    if (!relicName) {
      return false;
    }
    if (player.relics.includes(relicName)) {
      return false;
    }
    player.relics.push(relicName);
    const relic = findRelicByName(relicName);
    if (relic && relic.bonus) {
      applyBonusPackage(relic.bonus);
    }
    refreshBuildSnapshot();
    runSummary.relicsFound += 1;
    runSummary.gainedRelics.push(relicName);
    return true;
  }

  function addBlessing(label) {
    if (!label) {
      return;
    }
    if (!player.runBlessings.includes(label)) {
      player.runBlessings.push(label);
    }
    if (!runSummary.gainedBlessings.includes(label)) {
      runSummary.gainedBlessings.push(label);
    }
  }

  function rollWeightedEntry(entries) {
    if (!Array.isArray(entries) || entries.length === 0) {
      return null;
    }
    const totalWeight = entries.reduce(function sum(total, entry) {
      return total + (entry.weight || 1);
    }, 0);
    if (totalWeight <= 0) {
      return entries[0];
    }
    let cursor = Math.random() * totalWeight;
    for (let i = 0; i < entries.length; i += 1) {
      cursor -= entries[i].weight || 1;
      if (cursor <= 0) {
        return entries[i];
      }
    }
    return entries[entries.length - 1];
  }

  function statBonusLines(bonus) {
    const lines = [];
    if (!bonus) {
      return lines;
    }
    if (bonus.attack) {
      lines.push("攻击 " + (bonus.attack > 0 ? "+" : "") + bonus.attack);
    }
    if (bonus.defense) {
      lines.push("防御 " + (bonus.defense > 0 ? "+" : "") + bonus.defense);
    }
    if (bonus.maxHp) {
      lines.push("生命上限 " + (bonus.maxHp > 0 ? "+" : "") + bonus.maxHp);
    }
    if (bonus.maxMp) {
      lines.push("法力上限 " + (bonus.maxMp > 0 ? "+" : "") + bonus.maxMp);
    }
    if (bonus.speed) {
      lines.push("速度 " + (bonus.speed > 0 ? "+" : "") + bonus.speed);
    }
    return lines;
  }

  function describeMaterialCost(materials) {
    return Object.keys(materials || {}).map(function mapMaterial(name) {
      return name + " x" + materials[name];
    }).join("，");
  }

  function getEquipmentEntry(entry) {
    if (!entry) {
      return null;
    }
    if (typeof entry === "string") {
      const template = SHOP_ITEMS.find(function findItem(item) {
        return item.id === entry;
      });
      return template ? Object.assign({ baseId: template.id, level: 1, maxLevel: template.maxLevel || 1 }, template) : null;
    }
    return entry;
  }

  function getEquipmentInspectLines(item) {
    const details = [];
    if (!item) {
      return details;
    }
    const levelText = item.level ? "等级：" + item.level + " / " + (item.maxLevel || item.level) : "";
    if (levelText) {
      details.push(levelText);
    }
    if (item.description) {
      details.push(item.description);
    }
    statBonusLines(item.bonus).forEach(function eachLine(line) {
      details.push(line);
    });
    (item.inspect || []).forEach(function eachLine(line) {
      if (!details.includes(line)) {
        details.push(line);
      }
    });
    return details;
  }

  function refreshMerchantStock() {
    merchantStock = SHOP_ITEMS.map(function mapItem(item) {
      return createEquipmentOffer(item);
    }).filter(Boolean);
  }

  function createSkillInspectLines(skill) {
    const lines = [];
    if (skill.actionType === "ultimate") {
      lines.push("技能类型：终结技");
    }
    if (typeof skill.baseDelay === "number") {
      lines.push("行动延迟：" + skill.baseDelay);
    }
    if (skill.advanceSelf) {
      lines.push("自身提前：" + skill.advanceSelf);
    }
    if (skill.delayTarget) {
      lines.push("目标延后：" + skill.delayTarget);
    }
    if (typeof skill.cost === "number") {
      lines.push("法力消耗：" + skill.cost);
    }
    if (typeof skill.power === "number") {
      if (skill.effect === "heal" || skill.effect === "guard_heal") {
        lines.push("治疗倍率：" + Math.round(Math.abs(skill.power) * 100) + "% 攻击");
      } else {
        lines.push("伤害倍率：" + Math.round(skill.power * 100) + "% 攻击");
      }
    }
    if (skill.resourceGain) {
      lines.push("生成职业资源：" + skill.resourceGain);
    }
    if (skill.resourceCost) {
      lines.push("消耗职业资源：" + skill.resourceCost);
    }
    if (typeof skill.ultimateChargeGain === "number" && skill.ultimateChargeGain > 0) {
      lines.push("终结充能：" + skill.ultimateChargeGain);
    }
    if (typeof skill.ultimateChargeCost === "number" && skill.ultimateChargeCost > 0) {
      lines.push("终结消耗：" + skill.ultimateChargeCost);
    }
    if (skill.guard) {
      lines.push("减伤效果：" + Math.round(skill.guard * 100) + "%");
    }
    if (skill.buff) {
      lines.push("攻击提升：" + Math.round(skill.buff * 100) + "%，持续 " + (skill.turns || 0) + " 回合");
    }
    if (skill.restoreMp) {
      lines.push("恢复法力：" + skill.restoreMp);
    }
    if (skill.poisonDamage) {
      lines.push("中毒伤害：" + skill.poisonDamage + "，持续 " + (skill.poisonTurns || 0) + " 回合");
    }
    if (skill.regenValue) {
      lines.push("持续恢复：" + skill.regenValue + "，持续 " + (skill.regenTurns || 0) + " 回合");
    }
    if (skill.inspectTags && skill.inspectTags.length) {
      lines.push("构筑标签：" + skill.inspectTags.join(" / "));
    }
    if (skill.inspectNotes && skill.inspectNotes.length) {
      skill.inspectNotes.forEach(function eachNote(note) {
        lines.push(note);
      });
    }
    return lines;
  }

  function collectBuildTagCounts() {
    const tagCounts = {};

    function addTag(tag) {
      if (!tag) {
        return;
      }
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    }

    getResolvedPlayerSkills().forEach(function eachSkill(skill) {
      (skill.inspectTags || []).forEach(addTag);
    });

    getUnlockedSpecializationNodes().forEach(function eachNode(node) {
      addTag(node.trackName);
    });

    (player.buildSnapshot && player.buildSnapshot.relicTags ? player.buildSnapshot.relicTags : []).forEach(addTag);

    player.equipment.forEach(function eachEquipment(entry) {
      const item = getEquipmentEntry(entry);
      (item && item.tags ? item.tags : []).forEach(addTag);
    });

    return Object.keys(tagCounts).sort(function sortTags(a, b) {
      return tagCounts[b] - tagCounts[a] || a.localeCompare(b);
    }).map(function mapTag(tag) {
      return { tag: tag, count: tagCounts[tag] };
    });
  }

  function applyBonusPackage(bonus) {
    if (!bonus) {
      return;
    }
    player.maxHp += bonus.maxHp || 0;
    player.hp = clamp(player.hp + (bonus.maxHp || 0), 1, player.maxHp);
    player.maxMp += bonus.maxMp || 0;
    player.mp = clamp(player.mp + (bonus.maxMp || 0), 0, player.maxMp);
    player.attack += bonus.attack || 0;
    player.defense += bonus.defense || 0;
    player.speed += bonus.speed || 0;
  }

  function getGameState() {
    return gameStateStore.getState();
  }

  function setGameState(nextState, payload) {
    return gameStateStore.setState(nextState, payload);
  }

  function getCurrentStageLabel() {
    const meta = getStageMeta(currentStageName);
    if (currentStageName === "azure_town") {
      return meta.label;
    }
    return currentStageMode === "boss" ? (meta.bossLabel || meta.label) : meta.label;
  }

  function getCurrentStageDescription() {
    const meta = getStageMeta(currentStageName);
    if (currentStageName === "azure_town") {
      return meta.description;
    }
    const baseDescription = currentStageMode === "boss" ? (meta.bossDescription || meta.description) : meta.description;
    const extraNotes = [];
    if (currentStageContent.routeLabel) {
      extraNotes.push("路线：" + currentStageContent.routeLabel);
    }
    if (currentStageContent.pressureLabel) {
      extraNotes.push("压力：" + currentStageContent.pressureLabel);
    }
    if (currentStageContent.rewardLabel) {
      extraNotes.push("奖励倾向：" + currentStageContent.rewardLabel);
    }
    return baseDescription + (extraNotes.length ? " " + extraNotes.join("；") + "。" : "");
  }

  function appendLog(message) {
    if (!ui.battleLog) {
      return;
    }
    const entry = normalizeCombatLogEntry(message);
    logHistory.push({
      text: entry.text,
      type: entry.type || "info",
      emphasis: Boolean(entry.emphasis),
    });
    if (logHistory.length > 80) {
      logHistory.shift();
    }
    const line = document.createElement("p");
    line.textContent = entry.text;
    line.dataset.logType = entry.type || "info";
    if (entry.emphasis) {
      line.classList.add("is-emphasis");
    }
    ui.battleLog.appendChild(line);
    ui.battleLog.scrollTop = ui.battleLog.scrollHeight;
  }

  function hydrateLogHistoryFromDom() {
    if (!ui.battleLog) {
      return;
    }
    Array.from(ui.battleLog.querySelectorAll("p")).forEach(function eachLine(line) {
      const text = (line.textContent || "").trim();
      if (!text) {
        return;
      }
      logHistory.push({
        text: text,
        type: line.dataset.logType || "info",
        emphasis: line.classList.contains("is-emphasis"),
      });
    });
  }

  function renderLogHistoryHtml() {
    const logs = logHistory.slice(-40).reverse();
    if (!logs.length) {
      return "<div class=\"detail-stats\"><p>当前还没有可查看的日志。</p></div>";
    }
    return "<div class=\"log-history\">"
      + logs.map(function mapLog(entry, index) {
        return "<div class=\"log-entry\">"
          + "<span class=\"log-entry-index\">#" + (logs.length - index) + "</span>"
          + "<span>" + entry.text + "</span>"
          + "</div>";
      }).join("")
      + "</div>";
  }

  function showBattleLogOverlay() {
    showOverlay("战斗日志", "查看近期记录", "移动端横屏默认只保留两行紧凑视图，完整记录可以在这里查看。" + renderLogHistoryHtml(), "关闭", hideOverlay);
  }

  function syncFloatingStatusHud() {
    if (!ui.canvasWrap || !ui.statusToggle || !ui.floatingStatusPanel) {
      return;
    }
    if (isMobileLandscapeLayout()) {
      const right = 8;
      const bottom = 8;
      const buttonHeight = ui.statusToggle.offsetHeight || 34;
      ui.statusToggle.style.left = "auto";
      ui.statusToggle.style.top = "auto";
      ui.statusToggle.style.right = right + "px";
      ui.statusToggle.style.bottom = bottom + "px";

      ui.floatingStatusPanel.style.left = "auto";
      ui.floatingStatusPanel.style.top = "auto";
      ui.floatingStatusPanel.style.right = right + "px";
      ui.floatingStatusPanel.style.bottom = (bottom + buttonHeight + 6) + "px";
      return;
    }
    const wrapWidth = ui.canvasWrap.clientWidth || 1;
    const wrapHeight = ui.canvasWrap.clientHeight || 1;
    const buttonWidth = ui.statusToggle.offsetWidth || 76;
    const buttonHeight = ui.statusToggle.offsetHeight || 34;
    const minMargin = 10;
    const left = clamp(Math.round(floatingHudState.leftPercent * wrapWidth), minMargin, Math.max(minMargin, wrapWidth - buttonWidth - minMargin));
    const top = clamp(Math.round(floatingHudState.topPercent * wrapHeight), minMargin, Math.max(minMargin, wrapHeight - buttonHeight - minMargin));

    ui.statusToggle.style.left = left + "px";
    ui.statusToggle.style.top = top + "px";
    ui.statusToggle.style.right = "auto";
    ui.statusToggle.style.bottom = "auto";

    const panelWidth = ui.floatingStatusPanel.offsetWidth || Math.min(280, wrapWidth - minMargin * 2);
    const panelHeight = ui.floatingStatusPanel.offsetHeight || 220;
    const panelLeft = clamp(left + buttonWidth - panelWidth, minMargin, Math.max(minMargin, wrapWidth - panelWidth - minMargin));
    const preferredTop = top + buttonHeight + 8;
    const panelTop = preferredTop + panelHeight <= wrapHeight - minMargin
      ? preferredTop
      : clamp(top - panelHeight - 8, minMargin, Math.max(minMargin, wrapHeight - panelHeight - minMargin));

    ui.floatingStatusPanel.style.left = panelLeft + "px";
    ui.floatingStatusPanel.style.top = panelTop + "px";
    ui.floatingStatusPanel.style.right = "auto";
    ui.floatingStatusPanel.style.bottom = "auto";
  }

  function setFloatingStatusPanelVisible(visible) {
    floatingHudState.open = visible;
    if (!ui.floatingStatusPanel || !ui.statusToggle) {
      return;
    }
    ui.floatingStatusPanel.classList.toggle("is-hidden", !visible);
    ui.floatingStatusPanel.setAttribute("aria-hidden", visible ? "false" : "true");
    ui.statusToggle.setAttribute("aria-expanded", visible ? "true" : "false");
    ui.statusToggle.textContent = visible ? "收起状态" : "状态";
    syncFloatingStatusHud();
    window.requestAnimationFrame(syncFloatingStatusHud);
  }

  function syncTouchMoveButtons() {
    if (!ui.virtualJoystick || !ui.joystickKnob || !ui.joystickBase) {
      return;
    }
    ui.virtualJoystick.classList.toggle("is-active", joystickState.active);
    ui.joystickBase.classList.toggle("is-engaged", Boolean(joystickState.directionKey));
    ui.joystickKnob.style.transform = "translate(" + joystickState.knobX + "px, " + joystickState.knobY + "px)";
  }

  function clearHeldMoveKeys() {
    Object.keys(heldKeys).forEach(function clearKey(key) {
      heldKeys[key] = false;
    });
    preferredMoveKey = "";
    joystickState.active = false;
    joystickState.pointerId = null;
    joystickState.knobX = 0;
    joystickState.knobY = 0;
    joystickState.directionKey = "";
    syncTouchMoveButtons();
  }

  function isOverlayVisible() {
    return !ui.sceneOverlay.classList.contains("is-hidden");
  }

  function showOverlay(eyebrow, title, text, buttonLabel, action) {
    clearHeldMoveKeys();
    setMobileSidePanelOpen(false);
    overlayAction = action || null;
    ui.overlayEyebrow.textContent = eyebrow;
    ui.overlayTitle.textContent = title;
    ui.overlayText.innerHTML = text;
    ui.overlayButton.textContent = buttonLabel;
    ui.sceneOverlay.classList.remove("is-hidden");
    ui.sceneOverlay.setAttribute("aria-hidden", "false");
  }

  function showNotice(eyebrow, title, text, buttonLabel, action) {
    showOverlay(eyebrow, title, text, buttonLabel || "我知道了", action || hideOverlay);
  }

  function hideOverlay() {
    ui.sceneOverlay.classList.add("is-hidden");
    ui.sceneOverlay.setAttribute("aria-hidden", "true");
    overlayAction = null;
    clearHeldMoveKeys();
  }

  function setCombatBanner(visible, text) {
    ui.combatBanner.classList.toggle("is-hidden", !visible);
    if (text) {
      ui.combatBanner.textContent = text;
    }
  }

  function isMobileLandscapeLayout() {
    return window.matchMedia("(max-width: 980px) and (orientation: landscape) and (pointer: coarse)").matches;
  }

  function shouldShowMobileExploreHud(state) {
    return isMobileLandscapeLayout() && !shouldUseCombatLayout(state || getGameState());
  }

  function setMobileSidePanelOpen(visible) {
    const mobileEligible = shouldShowMobileExploreHud();
    mobileHudState.sidePanelOpen = Boolean(visible && mobileEligible);
    if (mobileHudState.sidePanelOpen && floatingHudState.open) {
      setFloatingStatusPanelVisible(false);
    }
    document.body.classList.toggle("mobile-side-panel-open", mobileHudState.sidePanelOpen);
    if (ui.sidePanel) {
      ui.sidePanel.setAttribute("aria-hidden", mobileEligible ? (mobileHudState.sidePanelOpen ? "false" : "true") : (shouldUseCombatLayout(getGameState()) ? "true" : "false"));
    }
    if (ui.mobilePanelToggle) {
      ui.mobilePanelToggle.setAttribute("aria-expanded", mobileHudState.sidePanelOpen ? "true" : "false");
      ui.mobilePanelToggle.textContent = mobileHudState.sidePanelOpen ? "收起" : "远征";
    }
    if (ui.mobilePanelBackdrop) {
      ui.mobilePanelBackdrop.classList.toggle("is-hidden", !mobileHudState.sidePanelOpen);
      ui.mobilePanelBackdrop.setAttribute("aria-hidden", mobileHudState.sidePanelOpen ? "false" : "true");
    }
  }

  function syncResponsiveHudLayout() {
    if (!ui.canvasWrap || !ui.statusToggle || !ui.floatingStatusPanel) {
      return;
    }
    const mobileExploreVisible = shouldShowMobileExploreHud();
    if (ui.mobileExploreHud) {
      ui.mobileExploreHud.classList.toggle("is-hidden", !mobileExploreVisible);
      ui.mobileExploreHud.setAttribute("aria-hidden", mobileExploreVisible ? "false" : "true");
    }
    if (!mobileExploreVisible) {
      setMobileSidePanelOpen(false);
    } else {
      setMobileSidePanelOpen(mobileHudState.sidePanelOpen);
    }
    syncFloatingStatusHud();
  }

  function shouldUseCombatLayout(state) {
    return state === GAME_STATE.COMBAT || state === GAME_STATE.BOSS_INTRO || state === GAME_STATE.GAME_OVER;
  }

  function syncCombatLayout(state) {
    const layoutState = state || getGameState();
    const combatLayout = shouldUseCombatLayout(layoutState);
    document.body.classList.toggle("combat-mode", combatLayout);
    if (combatLayout) {
      setFloatingStatusPanelVisible(false);
      setMobileSidePanelOpen(false);
    }
    if (ui.combatHudLayer) {
      ui.combatHudLayer.classList.toggle("is-hidden", !combatLayout);
      ui.combatHudLayer.setAttribute("aria-hidden", combatLayout ? "false" : "true");
    }
    if (ui.sidePanel && !isMobileLandscapeLayout()) {
      ui.sidePanel.setAttribute("aria-hidden", combatLayout ? "true" : "false");
    }
    syncResponsiveHudLayout();
  }

  function syncJourneySignal(node, label, value) {
    if (!node) {
      return;
    }
    const visible = Boolean(value);
    node.classList.toggle("is-hidden", !visible);
    node.setAttribute("aria-hidden", visible ? "false" : "true");
    node.textContent = visible ? (label + "：" + value) : "";
  }

  function setExploreControlsVisible(visible) {
    if (!ui.virtualJoystick) {
      return;
    }
    ui.virtualJoystick.classList.toggle("is-hidden", !visible);
    ui.virtualJoystick.setAttribute("aria-hidden", visible ? "false" : "true");
    if (!visible) {
      clearHeldMoveKeys();
    }
  }

  function updateSkillMenuVisibility() {
    ui.skillButtons.classList.toggle("is-hidden", !skillMenuOpen);
    setActionButtonContent(ui.btnSkillMenu, skillMenuOpen ? "收起技能" : "技能", "打开二级技能菜单，查看所有节奏型技能");
  }

  function setActionButtonContent(button, label, metaText) {
    if (!button) {
      return;
    }
    button.innerHTML = "<span class=\"action-button-main\">" + label + "</span><span class=\"action-button-meta\">" + (metaText || "稳定推进") + "</span>";
  }

  function syncTimelinePanel(snapshot) {
    if (!ui.timelineStatus || !ui.timelinePreview || !ui.timelinePanel) {
      return;
    }
    const timelineView = createCombatTimelineViewModel(snapshot);
    ui.timelinePanel.classList.toggle("is-hidden", !timelineView.visible);
    ui.timelinePanel.setAttribute("aria-hidden", timelineView.visible ? "false" : "true");
    if (!timelineView.visible) {
      ui.timelineStatus.textContent = timelineView.statusText;
      ui.timelinePreview.classList.add("timeline-preview-empty");
      ui.timelinePreview.innerHTML = "";
      return;
    }
    ui.timelineStatus.textContent = timelineView.statusText;
    ui.timelinePreview.classList.toggle("timeline-preview-empty", !timelineView.entries.length);
    ui.timelinePreview.innerHTML = timelineView.entries.map(function mapEntry(entry) {
      const classes = ["timeline-chip", entry.sideClass];
      if (entry.isCurrent) {
        classes.push("is-current");
      }
      return "<div class=\"" + classes.join(" ") + "\">"
        + "<span class=\"timeline-chip-order\">" + entry.badge + "</span>"
        + "<strong class=\"timeline-chip-name\" title=\"" + entry.meta + "\">" + entry.label + "</strong>"
        + "<span class=\"timeline-chip-av\">" + entry.avText + "</span>"
        + "</div>";
    }).join("");
  }

  function syncActionHint(snapshot) {
    if (!ui.actionHint) {
      return;
    }
    if (!snapshot || !snapshot.inCombat) {
      ui.actionHint.textContent = "等待接敌";
      return;
    }
    if (snapshot.insertWindow && snapshot.insertWindow.open) {
      ui.actionHint.textContent = "终结可插入";
      return;
    }
    ui.actionHint.textContent = snapshot.playerTurn
      ? "你的回合"
      : "敌方逼近";
  }

  function getPrimaryUltimateSkill() {
    const ultimateSkills = getResolvedUltimateSkills().filter(Boolean);
    return ultimateSkills.length ? ultimateSkills[0] : null;
  }

  function syncUltimateButtonState(snapshot) {
    if (!ui.btnUltimate) {
      return;
    }

    const skill = getPrimaryUltimateSkill();
    const ultimateState = snapshot && snapshot.ultimate ? snapshot.ultimate : null;
    const insertWindowOpen = Boolean(snapshot && snapshot.insertWindow && snapshot.insertWindow.open);
    const charged = Boolean(skill && ultimateState && ultimateState.availableSkillIds && ultimateState.availableSkillIds.includes(skill.id));
    const canUseNow = Boolean(skill && ultimateState && (ultimateState.canActNow || ultimateState.canInsert));
    const chargeCurrent = ultimateState ? ultimateState.current : 0;
    const chargeCost = skill ? (skill.ultimateChargeCost || 0) : 0;

    if (!skill) {
      setActionButtonContent(ui.btnUltimate, "终结技", "未解锁，3 级后开放");
      ui.btnUltimate.title = "达到 3 级后可解锁职业终结技。";
      ui.btnUltimate.disabled = true;
      ui.btnUltimate.classList.remove("is-insert-window");
      ui.btnUltimate.removeAttribute("data-skill-id");
      return;
    }

    ui.btnUltimate.dataset.skillId = skill.id;
    ui.btnUltimate.classList.add("action-ultimate");
    setActionButtonContent(ui.btnUltimate, skill.name, createCombatMenuTimingViewModel({ skill: skill, snapshot: snapshot }).metaText);
    ui.btnUltimate.title = skill.name + "：" + (skill.description || "等待插入窗口或己方行动时使用。");
    ui.btnUltimate.disabled = !canUseNow;
    ui.btnUltimate.classList.toggle("is-insert-window", insertWindowOpen && charged);
  }

  function setActionMenu(visible, enabled, snapshot) {
    if (ui.actionPanel) {
      ui.actionPanel.classList.toggle("is-hidden", !visible);
      ui.actionPanel.setAttribute("aria-hidden", visible ? "false" : "true");
    }
    ui.actionMenu.classList.toggle("is-hidden", !visible);
    ui.actionMenu.setAttribute("aria-hidden", visible ? "false" : "true");
    if (!visible || !enabled) {
      skillMenuOpen = false;
    }
    setActionButtonContent(ui.btnBasicAttack, "普通攻击", createCombatMenuTimingViewModel({ skill: getResolvedSkill("attack"), snapshot: snapshot }).metaText);
    setActionButtonContent(ui.btnSkillMenu, skillMenuOpen ? "收起技能" : "技能", skillMenuOpen ? "折叠技能列" : "展开技能列");
    setActionButtonContent(ui.btnFlee, "撤退", "脱离战斗");
    ui.btnBasicAttack.disabled = !enabled;
    ui.btnSkillMenu.disabled = !enabled;
    ui.btnFlee.disabled = !enabled;
    Array.from(ui.skillButtons.querySelectorAll("button")).forEach(function toggle(button) {
      button.disabled = !enabled;
    });
    syncUltimateButtonState(snapshot);
    syncActionHint(snapshot);
    syncTimelinePanel(snapshot);
    updateSkillMenuVisibility();
  }

  function syncEnemyPanel(enemy) {
    const enemyView = createEnemyViewModel(enemy);
    if (!enemyView.visible) {
      ui.enemyPanel.classList.add("is-hidden");
      ui.enemyPanel.setAttribute("aria-hidden", "true");
      return;
    }
    ui.enemyPanel.classList.remove("is-hidden");
    ui.enemyPanel.setAttribute("aria-hidden", "false");
    ui.enemyName.textContent = enemyView.name;
    ui.enemyHpText.textContent = enemyView.hpText;
    ui.enemyHpBar.style.width = enemyView.hpPercent + "%";
  }

  function syncStatusPanel() {
    const hudView = createHudViewModel({
      player: player,
      stageLabel: getCurrentStageLabel(),
      stageDescription: getCurrentStageDescription(),
    });

    ui.hp.textContent = hudView.hpText;
    ui.mp.textContent = hudView.mpText;
    ui.level.textContent = hudView.levelText;
    ui.exp.textContent = hudView.expText;
    ui.gold.textContent = hudView.goldText;
    ui.skillPoints.textContent = hudView.skillPointText;
    if (ui.legacyMarks) {
      ui.legacyMarks.textContent = String(progress.longTerm ? progress.longTerm.legacyMarks || 0 : 0);
    }
    if (ui.townRenown) {
      ui.townRenown.textContent = String(progress.longTerm ? progress.longTerm.townRenown || 0 : 0);
    }
    ui.classValue.textContent = hudView.classText;
    ui.stageValue.textContent = hudView.stageText;
    ui.pos.textContent = hudView.positionText;
    ui.classSummary.textContent = hudView.classSummary;
    if (ui.mobileClassValue) {
      ui.mobileClassValue.textContent = hudView.classText;
    }
    if (ui.mobileStageValue) {
      ui.mobileStageValue.textContent = hudView.stageText;
    }
    if (ui.mobilePosValue) {
      ui.mobilePosValue.textContent = hudView.positionText;
    }
    if (ui.mobileGoldValue) {
      ui.mobileGoldValue.textContent = "金币 " + hudView.goldText;
    }
    if (ui.mobileSpValue) {
      ui.mobileSpValue.textContent = "技能点 " + hudView.skillPointText;
    }
    if (ui.combatPlayerHp) {
      ui.combatPlayerHp.textContent = "HP " + hudView.hpText;
    }
    if (ui.combatPlayerMp) {
      ui.combatPlayerMp.textContent = "MP " + hudView.mpText;
    }
    if (ui.combatPlayerResourceRow && ui.combatPlayerResourceLabel && ui.combatPlayerResourceValue) {
      ui.combatPlayerResourceRow.classList.toggle("is-hidden", !hudView.classResourceVisible);
      ui.combatPlayerResourceRow.setAttribute("aria-hidden", hudView.classResourceVisible ? "false" : "true");
      ui.combatPlayerResourceLabel.textContent = hudView.classResourceLabel;
      ui.combatPlayerResourceValue.textContent = hudView.classResourceText;
    }
    syncJourneySignal(ui.routeValue, "路线", currentStageName === "azure_town" ? "城镇枢纽" : currentStageContent.routeLabel);
    syncJourneySignal(ui.pressureValue, "压力", currentStageName === "azure_town" ? "" : currentStageContent.pressureLabel);
    syncJourneySignal(ui.rewardValue, "奖励", currentStageName === "azure_town" ? "构筑整备" : currentStageContent.rewardLabel);
    ui.hpBar.style.width = hudView.hpPercent + "%";
    ui.mpBar.style.width = hudView.mpPercent + "%";
    ui.expBar.style.width = hudView.expPercent + "%";
    if (ui.classResourceItem) {
      ui.classResourceItem.classList.toggle("is-hidden", !hudView.classResourceVisible);
      ui.classResourceItem.setAttribute("aria-hidden", hudView.classResourceVisible ? "false" : "true");
      ui.classResourceLabel.textContent = hudView.classResourceLabel;
      ui.classResourceValue.textContent = hudView.classResourceText;
      ui.classResourceBar.style.width = hudView.classResourcePercent + "%";
      ui.classResourceBar.className = "meter-fill " + (hudView.classResourceColorClass || "resource-neutral");
    }

    Array.from(ui.skillButtons.querySelectorAll("button")).forEach(function updateButton(button) {
      const skill = getResolvedSkill(button.dataset.skillId);
      const lacksClassResource = skill && skill.resourceCost && (!player.classResource || player.classResource.current < skill.resourceCost);
      button.disabled = !skill || player.mp < skill.cost || lacksClassResource || getGameState() !== GAME_STATE.COMBAT;
    });
  }

  function showDetailStatsOverlay() {
    const equippedEntries = player.equipment.map(function mapEquipment(entry) {
      const item = getEquipmentEntry(entry);
      if (!item) {
        return { name: "未知装备", meta: "", summary: "未找到装备配置。", details: [] };
      }
      return {
        name: item.name,
        meta: (item.slot || "装备") + " / " + (item.rarity || "普通") + (item.level ? " / Lv." + item.level : ""),
        summary: item.description,
        details: getEquipmentInspectLines(item),
      };
    });

    const relicEntries = (player.relics || []).map(function mapRelic(relicName) {
      const relic = findRelicByName(relicName);
      if (!relic) {
        return { name: relicName, meta: "", summary: "未找到遗物配置。", details: [] };
      }
      return {
        name: relic.name,
        meta: "遗物 / " + (relic.rarity || "普通"),
        summary: relic.summary || "暂无说明。",
        details: statBonusLines(relic.bonus).concat(relic.inspect || []),
      };
    });

    const skillEntries = getResolvedPlayerSkills().map(function mapSkill(skill) {
      return {
        name: skill.name,
        meta: (skill.type === "magic" ? "法术" : skill.type === "utility" ? "战术" : "攻击") + " / " + (skill.cost || 0) + " 法力",
        summary: skill.description,
        details: createSkillInspectLines(skill),
      };
    });

    const specializationEntries = getSpecializationTracks().map(function mapTrack(track) {
      const unlockedNodes = track.nodes.filter(function filterNode(node) {
        return node.unlocked;
      });
      const availableNodes = track.nodes.filter(function filterNode(node) {
        return !node.unlocked;
      });
      const details = unlockedNodes.map(function mapNode(node) {
        return "已解锁：" + node.name + " - " + node.summary;
      }).concat(availableNodes.map(function mapNode(node) {
        return (node.available ? "可解锁" : "待前置") + "：" + node.name + "（消耗 " + node.cost + " 技能点）";
      }));
      return {
        name: track.name,
        meta: "职业专精 / 已投入 " + unlockedNodes.length + " 节点",
        summary: track.summary,
        details: details.length ? details : ["当前尚未投入该路线。"],
      };
    });

    const buildTagEntries = collectBuildTagCounts().map(function mapTag(entry) {
      return {
        name: entry.tag,
        meta: "构筑标签 / 出现 " + entry.count + " 次",
        summary: "当前技能、专精、装备或遗物共同指向这个方向。",
        details: ["这个标签正在参与 build 识别，后续会继续承接遗物与装备联动。"],
      };
    });

    const materialEntries = Object.keys(player.materials || {}).map(function mapMaterial(name) {
      return {
        name: name,
        meta: "材料",
        summary: "当前持有数量：" + player.materials[name],
        details: ["用于后续装备、遗物与成长系统。"],
      };
    });

    const townEntries = Object.keys(TOWN_UPGRADES).map(function mapUpgrade(upgradeId) {
      const config = TOWN_UPGRADES[upgradeId];
      return {
        name: config.name,
        meta: "城镇建设 / Lv." + getTownUpgradeLevel(upgradeId),
        summary: config.summary,
        details: getTownUpgradePreviewLines(upgradeId),
      };
    });

    const buildView = createBuildCodexViewModel({
      player: player,
      sections: [
        { title: "技能详情", entries: skillEntries.length ? skillEntries : [{ name: "暂无技能", meta: "", summary: "先选择职业后再查看。", details: [] }] },
        { title: "职业专精", entries: specializationEntries.length ? specializationEntries : [{ name: "暂无专精", meta: "", summary: "先选择职业后再查看。", details: [] }] },
        { title: "构筑标签", entries: buildTagEntries.length ? buildTagEntries : [{ name: "暂无标签", meta: "", summary: "当前还没有形成明显的 build 倾向。", details: [] }] },
        { title: "装备详情", entries: equippedEntries.length ? equippedEntries : [{ name: "暂无装备", meta: "", summary: "当前没有已装备物品。", details: [] }] },
        { title: "遗物详情", entries: relicEntries.length ? relicEntries : [{ name: "暂无遗物", meta: "", summary: "还没有获取遗物。", details: [] }] },
        { title: "材料与资源", entries: materialEntries.length ? materialEntries : [{ name: "暂无材料", meta: "", summary: "后续构筑素材会显示在这里。", details: [] }] },
        { title: "长期沉淀", entries: [{ name: "传承印记", meta: "长期资源", summary: "当前持有：" + (progress.longTerm ? progress.longTerm.legacyMarks : 0), details: ["用于城镇建设和永久升级。"] }, { name: "城镇声望", meta: "长期资源", summary: "当前持有：" + (progress.longTerm ? progress.longTerm.townRenown : 0), details: ["用于后续世界推进与章节解锁。"] }].concat(townEntries) },
      ],
    });
    showOverlay(buildView.overlayEyebrow, buildView.overlayTitle, renderBuildCodexHtml(buildView), "关闭", hideOverlay);
  }

  function pulseFlash() {
    ui.screenFlash.classList.remove("is-hidden");
    ui.screenFlash.classList.remove("active");
    window.requestAnimationFrame(function start() {
      ui.screenFlash.classList.add("active");
      window.setTimeout(function stop() {
        ui.screenFlash.classList.remove("active");
        ui.screenFlash.classList.add("is-hidden");
      }, 240);
    });
  }

  function shakeCanvas() {
    ui.canvasWrap.classList.remove("shake");
    window.requestAnimationFrame(function start() {
      ui.canvasWrap.classList.add("shake");
      window.setTimeout(function stop() {
        ui.canvasWrap.classList.remove("shake");
      }, 280);
    });
  }

  function drawPortrait(assetKey, x, y, size, fallbackColor) {
    const image = getMapAsset(assetKey);
    if (image && image.complete) {
      ctx.drawImage(image, x, y, size, size);
      return;
    }
    ctx.fillStyle = fallbackColor;
    ctx.fillRect(x, y, size, size);
  }

  function drawCombatHealthPlate(centerX, topY, currentHp, maxHp, side) {
    const width = 150;
    const height = 8;
    const left = Math.round(centerX - width / 2);
    const top = Math.round(topY);
    const percent = maxHp > 0 ? clamp(currentHp / maxHp, 0, 1) : 0;

    ctx.save();
    ctx.fillStyle = "rgba(15, 23, 42, 0.84)";
    ctx.fillRect(left, top, width, height);
    ctx.strokeStyle = "rgba(2, 6, 23, 0.96)";
    ctx.lineWidth = 1;
    ctx.strokeRect(left + 0.5, top + 0.5, width - 1, height - 1);
    ctx.fillStyle = side === "enemy" ? "#ef4444" : "#22c55e";
    ctx.fillRect(left + 1, top + 1, Math.max(0, Math.round((width - 2) * percent)), height - 2);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 13px Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(currentHp + " / " + maxHp, centerX, top + height + 4);
    ctx.restore();
  }

  function drawReadableMapLabel(text, centerX, bottomY) {
    const paddingX = 7;
    const labelHeight = 16;
    ctx.save();
    ctx.font = "bold 12px Consolas, monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const labelWidth = Math.ceil(ctx.measureText(text).width) + paddingX * 2;
    const left = Math.round(centerX - labelWidth / 2);
    const top = Math.round(bottomY - labelHeight);

    ctx.fillStyle = "rgba(2, 6, 23, 0.88)";
    ctx.fillRect(left, top, labelWidth, labelHeight);
    ctx.strokeStyle = "rgba(103, 232, 249, 0.42)";
    ctx.lineWidth = 1;
    ctx.strokeRect(left + 0.5, top + 0.5, labelWidth - 1, labelHeight - 1);

    ctx.lineWidth = 3;
    ctx.strokeStyle = "rgba(2, 6, 23, 0.95)";
    ctx.strokeText(text, centerX, top + labelHeight / 2);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText(text, centerX, top + labelHeight / 2);
    ctx.restore();
  }

  function drawTownDecorations() {
    const meta = getStageMeta("azure_town");
    const npcImage = getMapAsset("npc");
    const houseImage = getMapAsset("house");

    (meta.houses || []).forEach(function drawHouse(house) {
      if (houseImage && houseImage.complete) {
        ctx.drawImage(houseImage, house.x * TILE_SIZE - 8, house.y * TILE_SIZE - 8, 64, 64);
      }
    });

    (meta.npcs || []).forEach(function drawNpc(npc) {
      if (npcImage && npcImage.complete) {
        ctx.drawImage(npcImage, npc.x * TILE_SIZE, npc.y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      }
      drawReadableMapLabel(npc.label, npc.x * TILE_SIZE + TILE_SIZE / 2, npc.y * TILE_SIZE - 6);
    });
  }

  function drawCombatView() {
    const enemy = combatSnapshot && combatSnapshot.enemy;
    const playerPortrait = { x: 92, y: 294, size: 124 };
    const enemyPortrait = { x: canvas.width - 236, y: 94, size: 124 };
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#4c0519");
    gradient.addColorStop(1, "#0f172a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPortrait("player", playerPortrait.x, playerPortrait.y, playerPortrait.size, "#22d3ee");
    drawPortrait(enemy ? (enemy.assetKey || (enemy.isBoss ? "boss" : "enemy")) : "enemy", enemyPortrait.x, enemyPortrait.y, enemyPortrait.size, "#ef4444");
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 22px Consolas, monospace";
    ctx.fillText(enemy && enemy.isBoss ? "首领战" : enemy && enemy.encounterType === "elite" ? "精英战" : "战斗中", 24, 34);
    ctx.font = "15px Consolas, monospace";
    ctx.fillText(enemy ? enemy.name : "敌人", 28, 66);
    ctx.fillText(player.name, canvas.width - 250, canvas.height - 30);
    drawCombatHealthPlate(playerPortrait.x + playerPortrait.size / 2, playerPortrait.y + playerPortrait.size + 10, player.hp, player.maxHp, "player");
    if (enemy) {
      drawCombatHealthPlate(enemyPortrait.x + enemyPortrait.size / 2, enemyPortrait.y + enemyPortrait.size + 10, enemy.hp, enemy.maxHp, "enemy");
    }
  }

  function loadStage(stageName, options) {
    const settings = options || {};
    const generatedStage = createStageInstance(stageName, settings);

    currentStageName = stageName;
    currentStageMode = stageName === "azure_town" ? "town" : (settings.mode === "boss" ? "boss" : "field");
    currentMap = generatedStage.map;
    currentPortalPos = generatedStage.portalPos || null;
    currentEncounterPool = generatedStage.encounters || {};
    currentEventPool = generatedStage.events || {};
    currentStageContent = generatedStage.contentPools || { eventPoolId: "", relicPoolId: "", dropTableId: "", elitePoolId: "", rewardProfileId: "", routeLabel: "", pressureLabel: "", rewardLabel: "", layoutProfile: "" };
    if (stageName === "azure_town") {
      refreshMerchantStock();
    }

    for (let y = 0; y < currentMap.length; y += 1) {
      for (let x = 0; x < currentMap[y].length; x += 1) {
        if (currentMap[y][x] === TILE.PLAYER_START) {
          currentMap[y][x] = TILE.FLOOR;
          player.position.x = x;
          player.position.y = y;
          renderPosition.x = x;
          renderPosition.y = y;
        }
      }
    }

    movementState.active = false;
    clearHeldMoveKeys();
    ensureFieldPortalVisible();
    syncStatusPanel();
    if (stageName !== "azure_town" && currentStageMode === "field") {
      appendLog("区域简报：" + [currentStageContent.routeLabel, currentStageContent.pressureLabel, currentStageContent.rewardLabel].filter(Boolean).join(" / ") + "。");
      if (currentPortalPos) {
        appendLog("Boss 传送门已显现，你可以随时进入首领房。");
      }
    }
  }

  function countTiles(tileType) {
    let total = 0;
    for (let y = 0; y < currentMap.length; y += 1) {
      for (let x = 0; x < currentMap[y].length; x += 1) {
        if (currentMap[y][x] === tileType) {
          total += 1;
        }
      }
    }
    return total;
  }

  function countRemainingHostiles() {
    return countTiles(TILE.ENEMY) + countTiles(TILE.ELITE);
  }

  function ensureFieldPortalVisible() {
    if (currentStageName === "azure_town" || currentStageMode !== "field" || !currentPortalPos) {
      return;
    }
    if (currentMap[currentPortalPos.y] && currentMap[currentPortalPos.y][currentPortalPos.x] !== TILE.PORTAL) {
      currentMap[currentPortalPos.y][currentPortalPos.x] = TILE.PORTAL;
    }
  }

  function showChoiceButtons(choices) {
    const buttonsHtml = choices.map(function mapChoice(choice, index) {
      return "<button type=\"button\" class=\"overlay-button overlay-choice\" data-choice-index=\"" + index + "\">" + choice.label + "</button>";
    }).join("");
    return "<div class=\"class-pick-list\">" + buttonsHtml + "</div>";
  }

  function bindOverlayChoices(choices) {
    Array.from(document.querySelectorAll(".overlay-choice")).forEach(function bindChoice(button) {
      button.addEventListener("click", function onChoice() {
        const choice = choices[Number(button.dataset.choiceIndex)];
        if (choice && choice.onClick) {
          choice.onClick();
        }
      });
    });
  }

  function renderSpecializationTrackHtml(track) {
    const nodesHtml = track.nodes.map(function mapNode(node) {
      const stateText = node.unlocked ? "已解锁" : node.available ? ("消耗 " + node.cost + " 技能点") : "需要前置节点";
      return "<p><strong>" + node.name + "：</strong>" + node.summary + " <span class=\"overlay-inline-note\">" + stateText + "</span></p>";
    }).join("");
    return "<div class=\"detail-stats\">" + nodesHtml + "</div>";
  }

  function showSpecializationTrackOverlay(trackId) {
    const track = getSpecializationTracks().find(function findTrack(entry) {
      return entry.id === trackId;
    });
    if (!track) {
      showNotice("职业导师", "暂无该路线", "当前职业没有找到对应的专精路线。", "返回导师", showMentorOverlay);
      return;
    }

    const choices = track.nodes.map(function mapNode(node) {
      return {
        label: node.name + "（" + (node.unlocked ? "已解锁" : node.available ? ("消耗 " + node.cost + " 技能点") : "需要前置") + "）",
        onClick: function unlockNode() {
          if (node.unlocked) {
            showNotice("职业专精", node.name, "这个专精节点已经解锁，不需要重复投入。", "继续查看", function reopenTrack() {
              showSpecializationTrackOverlay(trackId);
            });
            return;
          }
          const result = unlockSpecializationNode(trackId, node.id);
          if (!result.ok) {
            showNotice("职业专精", "无法解锁", result.reason || "当前无法解锁该专精节点。", "继续查看", function reopenTrack() {
              showSpecializationTrackOverlay(trackId);
            });
            return;
          }
          renderSkillButtons();
          syncStatusPanel();
          appendLog("已解锁专精节点：" + result.track.name + " - " + result.node.name + "。");
          showSpecializationTrackOverlay(trackId);
        },
      };
    }).concat([
      {
        label: "返回专精总览",
        onClick: showSpecializationOverviewOverlay,
      },
    ]);

    showOverlay(
      "职业专精",
      track.name,
      track.summary + "<br>当前技能点：" + player.skillPoints + renderSpecializationTrackHtml(track) + showChoiceButtons(choices),
      "返回导师",
      showMentorOverlay
    );
    bindOverlayChoices(choices);
  }

  function showSpecializationOverviewOverlay() {
    if (!player.classId) {
      showNotice("职业导师", "尚未选择职业", "请先选择职业，再来分配专精路线。", "选择职业", showClassSelectionOverlay);
      return;
    }
    const tracks = getSpecializationTracks();
    const choices = tracks.map(function mapTrack(track) {
      const unlockedCount = track.nodes.filter(function filterNode(node) {
        return node.unlocked;
      }).length;
      return {
        label: track.name + "（已解锁 " + unlockedCount + "/" + track.nodes.length + "）",
        onClick: function openTrack() {
          showSpecializationTrackOverlay(track.id);
        },
      };
    });

    showOverlay(
      "职业导师",
      "职业专精",
      "每条专精路线都会给你不同的技能与强化方向。当前技能点：" + player.skillPoints + showChoiceButtons(choices),
      "返回导师",
      showMentorOverlay
    );
    bindOverlayChoices(choices);
  }

  function applyRewardEffect(effect, sourceLabel) {
    if (!effect) {
      return;
    }
    ensureRunCollections();

    if (effect.type === "heal") {
      const amount = effect.value || 0;
      player.hp = clamp(player.hp + amount, 0, player.maxHp);
      appendLog((sourceLabel || "奖励") + "：恢复了 " + amount + " 点生命。");
      return;
    }
    if (effect.type === "mp") {
      const amount = effect.value || 0;
      player.mp = clamp(player.mp + amount, 0, player.maxMp);
      appendLog((sourceLabel || "奖励") + "：恢复了 " + amount + " 点法力。");
      return;
    }
    if (effect.type === "damage") {
      const amount = effect.value || 0;
      player.hp = Math.max(1, clamp(player.hp - amount, 0, player.maxHp));
      appendLog((sourceLabel || "事件") + "：你失去了 " + amount + " 点生命。");
      return;
    }
    if (effect.type === "gold") {
      const amount = typeof effect.value === "number" ? effect.value : randInt(effect.min || 0, effect.max || effect.min || 0);
      player.gold += amount;
      runSummary.goldEarned += amount;
      appendLog((sourceLabel || "奖励") + "：获得金币 " + amount + "。");
      return;
    }
    if (effect.type === "skill_point") {
      const amount = effect.value || 1;
      player.skillPoints += amount;
      runSummary.skillPointsEarned += amount;
      appendLog((sourceLabel || "奖励") + "：获得技能点 " + amount + "。");
      return;
    }
    if (effect.type === "exp") {
      const amount = effect.value || 0;
      player.exp += amount;
      runSummary.expGained += amount;
      appendLog((sourceLabel || "奖励") + "：额外获得经验 " + amount + "。");
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
        onLevelUp();
      }
      return;
    }
    if (effect.type === "stat") {
      const statKey = effect.stat;
      const amount = effect.amount || 0;
      if (!statKey || typeof player[statKey] !== "number") {
        return;
      }
      player[statKey] += amount;
      if (statKey === "maxHp") {
        player.hp = clamp(player.hp + amount, 1, player.maxHp);
      } else if (statKey === "maxMp") {
        player.mp = clamp(player.mp + amount, 0, player.maxMp);
      }
      addBlessing(effect.label || (statKey + "+" + amount));
      appendLog((sourceLabel || "祝福") + "： " + (effect.label || statKey + " +" + amount) + "。");
      return;
    }
    if (effect.type === "material") {
      const label = effect.label || effect.itemId || "素材";
      const amount = effect.amount || 1;
      addMaterial(label, amount);
      appendLog((sourceLabel || "奖励") + "：获得" + label + " x" + amount + "。");
      return;
    }
    if (effect.type === "relic") {
      const relicList = RELIC_POOLS[effect.poolId] || [];
      const available = relicList.filter(function filterRelic(relic) {
        return !player.relics.includes(relic.name);
      });
      const relic = available[Math.floor(Math.random() * available.length)] || relicList[0];
      if (!relic) {
        return;
      }
      if (addRelic(relic.name)) {
        appendLog((sourceLabel || "奖励") + "：获得遗物「" + relic.name + "」。");
      } else {
        player.gold += 18;
        runSummary.goldEarned += 18;
        appendLog((sourceLabel || "奖励") + "：遗物已拥有，改为获得金币 18。");
      }
    }
  }

  function applyEffectBundle(effects, sourceLabel) {
    (effects || []).forEach(function eachEffect(effect) {
      applyRewardEffect(effect, sourceLabel);
    });
    syncStatusPanel();
  }

  function resolveDropReward(dropTableId) {
    const table = DROP_TABLES[dropTableId] || [];
    const rolled = rollWeightedEntry(table);
    if (!rolled) {
      return {
        label: "战场补给（恢复 20 生命 / 8 法力）",
        effects: [{ type: "heal", value: 20 }, { type: "mp", value: 8 }],
      };
    }
    if (rolled.type === "gold") {
      const amount = randInt(rolled.min || 0, rolled.max || rolled.min || 0);
      return {
        label: "金币赏金（+" + amount + " 金币）",
        effects: [{ type: "gold", value: amount }],
      };
    }
    if (rolled.type === "material") {
      return {
        label: "战利材料（" + (rolled.label || "素材") + "）",
        effects: [{ type: "material", itemId: rolled.id, label: rolled.label || rolled.id, amount: rolled.amount || 1 }],
      };
    }
    if (rolled.type === "relic") {
      const relicList = RELIC_POOLS[rolled.poolId] || [];
      const preview = relicList.find(function findRelic(relic) {
        return !player.relics.includes(relic.name);
      }) || relicList[0];
      return {
        label: "遗物抉择（" + (preview ? preview.name : "随机遗物") + "）",
        effects: [{ type: "relic", poolId: rolled.poolId }],
      };
    }
    return {
      label: "战场补给（恢复 20 生命 / 8 法力）",
      effects: [{ type: "heal", value: 20 }, { type: "mp", value: 8 }],
    };
  }

  function createFallbackRewardChoices(encounterType, dropReward) {
    const choices = [
      {
        label: encounterType === "boss" ? "凯旋补给（回满生命与法力）" : "补给包（恢复 24 生命 / 10 法力）",
        effects: encounterType === "boss"
          ? [{ type: "heal", value: player.maxHp }, { type: "mp", value: player.maxMp }]
          : [{ type: "heal", value: 24 }, { type: "mp", value: 10 }],
      },
      encounterType === "elite" || encounterType === "boss"
        ? { label: "战术心得（+1 技能点）", effects: [{ type: "skill_point", value: 1 }] }
        : { label: "赏金加码（+22 金币）", effects: [{ type: "gold", value: 22 }] },
      dropReward,
    ];

    if (encounterType === "normal" && choices[2].effects[0] && choices[2].effects[0].type === "gold") {
      choices[2] = {
        label: "战斗心得（攻击 +1）",
        effects: [{ type: "stat", stat: "attack", amount: 1, label: "战斗心得" }],
      };
    }

    if (encounterType === "boss") {
      choices[1] = { label: "成长契机（+1 技能点，生命上限 +6）", effects: [{ type: "skill_point", value: 1 }, { type: "stat", stat: "maxHp", amount: 6, label: "胜利余辉" }] };
    }

    return choices;
  }

  function buildRewardChoiceSummary(choice) {
    if (!choice || !Array.isArray(choice.effects)) {
      return "区域奖励。";
    }
    return choice.effects.map(function mapEffect(effect) {
      if (effect.type === "heal") {
        return "恢复 " + effect.value + " 生命";
      }
      if (effect.type === "mp") {
        return "恢复 " + effect.value + " 法力";
      }
      if (effect.type === "gold") {
        return "获得金币";
      }
      if (effect.type === "material") {
        return "获得" + (effect.label || effect.itemId || "材料");
      }
      if (effect.type === "relic") {
        return "获得区域遗物";
      }
      if (effect.type === "skill_point") {
        return "获得 " + effect.value + " 技能点";
      }
      if (effect.type === "exp") {
        return "获得 " + effect.value + " 经验";
      }
      if (effect.type === "stat") {
        const statNames = { attack: "攻击", defense: "防御", maxHp: "生命上限", maxMp: "法力上限", speed: "速度" };
        return (statNames[effect.stat] || effect.stat) + " +" + effect.amount;
      }
      return "获得区域收益";
    }).join("；");
  }

  function buildVictoryChoices(enemy) {
    const encounterType = enemy && enemy.encounterType ? enemy.encounterType : "normal";
    const rewardProfileId = (enemy && enemy.rewardProfile) || currentStageContent.rewardProfileId || currentStageName;
    const dropTableId = (enemy && enemy.dropTableId) || currentStageContent.dropTableId;
    const configuredChoices = createRewardChoices(rewardProfileId, encounterType).map(function mapChoice(choice) {
      if (choice.useDropTable) {
        return resolveDropReward(choice.dropTableId || dropTableId);
      }
      return choice;
    }).filter(Boolean);

    return configuredChoices.length
      ? configuredChoices
      : createFallbackRewardChoices(encounterType, resolveDropReward(dropTableId));
  }

  function showVictoryRewardOverlay(enemy, onComplete) {
    const rewardChoices = buildVictoryChoices(enemy);
    const choices = rewardChoices.map(function mapChoice(choice) {
      return {
        label: choice.label,
        onClick: function takeReward() {
          runSummary.rewardsClaimed += 1;
          hideOverlay();
          applyEffectBundle(choice.effects, "战后奖励");
          if (onComplete) {
            onComplete();
          }
        },
      };
    });

    const choicePreviewHtml = "<div class=\"detail-stats\">"
      + rewardChoices.map(function mapChoice(choice) {
        return "<p><strong>" + choice.label + "</strong><br>" + buildRewardChoiceSummary(choice) + "</p>";
      }).join("")
      + "</div>";

    showOverlay("战后奖励", "挑选一项战利品", "这一战已经结束，从下列奖励中选择一项带走。" + choicePreviewHtml + showChoiceButtons(choices), "放弃奖励", function skipReward() {
      hideOverlay();
      appendLog("你放弃了本次额外奖励。");
      if (onComplete) {
        onComplete();
      }
    });
    bindOverlayChoices(choices);
  }

  function showRunSummaryOverlay(summary, onClose) {
    const summaryView = createRunSummaryViewModel(summary);
    showOverlay(summaryView.overlayEyebrow, summaryView.overlayTitle, renderRunSummaryHtml(summaryView), "返回城镇", function closeSummary() {
      hideOverlay();
      if (onClose) {
        onClose();
      }
    });
  }

  function resolveEventChoice(eventNode, choice, x, y) {
    currentMap[y][x] = TILE.FLOOR;
    delete currentEventPool[positionKey(x, y)];
    runSummary.eventsResolved += 1;
    hideOverlay();
    appendLog("你处理了事件：" + eventNode.name + "。");
    applyEffectBundle(choice.effects, eventNode.name);
  }

  function showStageEvent(x, y) {
    const eventNode = currentEventPool[positionKey(x, y)];
    if (!eventNode) {
      return;
    }
    const choices = (eventNode.choices || []).map(function mapChoice(choice) {
      return {
        label: choice.label,
        onClick: function chooseEventOption() {
          resolveEventChoice(eventNode, choice, x, y);
        },
      };
    });

    const eventTypeMap = {
      risk_reward: "搏命收益",
      recovery: "恢复节点",
      hunt: "追猎节点",
      skill_test: "知识试炼",
      story: "残响事件",
      study: "研究节点",
      sacrifice: "献祭节点",
      ambush: "伏击节点",
      armory: "军备节点",
    };
    const eventMeta = []
      .concat(eventNode.type ? ["类型：" + (eventTypeMap[eventNode.type] || eventNode.type)] : [])
      .concat(eventNode.tags && eventNode.tags.length ? ["标签：" + eventNode.tags.join(" / ")] : [])
      .join("　");

    showOverlay(
      "事件节点",
      eventNode.name,
      (eventMeta ? "<div class=\"detail-stats\"><p>" + eventMeta + "</p></div>" : "") + eventNode.prompt + showChoiceButtons(choices),
      "稍后再来",
      hideOverlay
    );
    bindOverlayChoices(choices);
  }

  function renderSkillButtons() {
    ui.skillButtons.innerHTML = "";
    getResolvedPlayerSkills().filter(function filterSkill(skill) {
      return skill.id !== "attack" && !isUltimateSkill(skill);
    }).forEach(function renderSkill(skill) {
      const button = document.createElement("button");
      const timingView = createCombatMenuTimingViewModel({
        skill: skill,
        snapshot: combatSnapshot,
      });
      button.type = "button";
      button.dataset.skillId = skill.id;
      const parts = ["消耗 " + skill.cost + " 法力"];
      if (skill.resourceCost && player.classResource && player.classResource.label) {
        parts.push("耗 " + skill.resourceCost + player.classResource.shortLabel);
      } else if (skill.resourceGain && player.classResource && player.classResource.label) {
        parts.push("生 " + skill.resourceGain + player.classResource.shortLabel);
      }
      parts.push(timingView.metaText);
      button.classList.add("action-skill");
      button.innerHTML = "<span class=\"action-button-main\">" + skill.name + "</span>"
        + "<span class=\"action-button-meta\">" + parts.filter(Boolean).join(" · ") + "</span>";
      button.title = skill.description;
      button.addEventListener("click", function onSkillClick() {
        onActionButton(skill.id);
      });
      ui.skillButtons.appendChild(button);
    });
    syncStatusPanel();
  }

  function showClassSelectionOverlay() {
    const choices = Object.keys(classes).map(function mapClass(classId) {
      return {
        label: classes[classId].name,
        onClick: function choose() {
          applyClassToPlayer(classId);
          applyTownUpgradeBonusesToPlayer();
          renderSkillButtons();
          syncStatusPanel();
          saveCurrentProgress({ silent: true });
          hideOverlay();
          appendLog("你选择了职业：" + player.className + "。");
        },
      };
    });

    showOverlay("蔚蓝城镇", "选择职业", "不同职业拥有完全不同的技能构筑与战斗节奏。" + showChoiceButtons(choices), "关闭", hideOverlay);
    bindOverlayChoices(choices);
  }

  function showSaveManagementOverlay() {
    const metadata = getSaveMetadata();
    const choices = [
      {
        label: "保存进度",
        onClick: function saveGameNow() {
          const result = saveCurrentProgress({ label: "手动存档完成。" });
          if (!result.ok) {
            showNotice("存档管理", "无法保存", result.reason || "当前无法保存进度。", "返回存档菜单", showSaveManagementOverlay);
            return;
          }
          syncStatusPanel();
          showNotice("存档管理", "保存成功", "当前进度已写入本地存档。保存时间：" + formatSaveTime(result.savedAt), "继续", showSaveManagementOverlay);
        },
      },
      {
        label: "读取最近存档",
        onClick: function loadGameNow() {
          const loaded = loadSnapshot();
          if (!loaded.ok) {
            showNotice("存档管理", "无法读取", loaded.reason || "当前没有可读取的存档。", "返回存档菜单", showSaveManagementOverlay);
            return;
          }
          const applied = applyLoadedSnapshot(loaded.snapshot);
          if (!applied.ok) {
            showNotice("存档管理", "存档无效", applied.reason || "读取到的存档内容不完整。", "返回存档菜单", showSaveManagementOverlay);
            return;
          }
          hideOverlay();
          appendLog("已读取存档，恢复至 " + getCurrentStageLabel() + "。");
        },
      },
      {
        label: "删除存档",
        onClick: function clearGameSave() {
          if (!metadata.exists) {
            showNotice("存档管理", "暂无存档", "当前没有可删除的本地存档。", "返回存档菜单", showSaveManagementOverlay);
            return;
          }
          const cleared = clearSnapshot();
          if (!cleared.ok) {
            showNotice("存档管理", "删除失败", cleared.reason || "当前无法删除存档。", "返回存档菜单", showSaveManagementOverlay);
            return;
          }
          showNotice("存档管理", "存档已删除", "本地存档已经清除。后续需要重新保存。", "继续", showSaveManagementOverlay);
        },
      },
    ];

    showOverlay(
      "存档管理",
      "本地进度",
      (metadata.exists
        ? ("<div class=\"detail-stats\"><p><strong>最近存档：</strong>" + formatSaveTime(metadata.savedAt) + "</p><p><strong>摘要：</strong>" + (metadata.summary || "当前存档可读取") + "</p></div>")
        : "<div class=\"detail-stats\"><p>当前还没有可读取的本地存档。</p></div>")
        + showChoiceButtons(choices),
      "关闭",
      hideOverlay
    );
    bindOverlayChoices(choices);
  }

  function showTownUpgradeOverlay() {
    ensureProgressState();
    const choices = Object.keys(TOWN_UPGRADES).map(function mapUpgrade(upgradeId) {
      const config = TOWN_UPGRADES[upgradeId];
      const level = getTownUpgradeLevel(upgradeId);
      const nextCost = config.costs[level];
      return {
        label: config.name + "（Lv." + level + (nextCost ? "，消耗 " + nextCost + " 传承印记" : "，已满级") + "）",
        onClick: function buyUpgradeNow() {
          const result = purchaseTownUpgrade(upgradeId);
          if (!result.ok) {
            showNotice("城镇建设", "无法升级", result.reason || "当前无法建设该项目。", "返回建设菜单", showTownUpgradeOverlay);
            return;
          }
          saveCurrentProgress({ silent: true });
          appendLog("城镇建设：" + result.name + " 升至 Lv." + result.level + "。");
          showTownUpgradeOverlay();
        },
      };
    });

    const detailsHtml = "<div class=\"detail-stats\">"
      + "<p><strong>传承印记：</strong>" + progress.longTerm.legacyMarks + "</p>"
      + "<p><strong>城镇声望：</strong>" + progress.longTerm.townRenown + "</p>"
      + Object.keys(TOWN_UPGRADES).map(function mapUpgradeDetail(upgradeId) {
        const config = TOWN_UPGRADES[upgradeId];
        return "<p><strong>" + config.name + "</strong><br>" + config.summary + "<br>" + getTownUpgradePreviewLines(upgradeId).join("；") + "</p>";
      }).join("")
      + "</div>";

    showOverlay("职业导师", "城镇建设", "把多轮冒险带回来的沉淀投入城镇，才能让后续远征越打越顺。" + detailsHtml + showChoiceButtons(choices), "返回导师", hideOverlay);
    bindOverlayChoices(choices);
  }

  function showStartResumeOverlay() {
    const metadata = getSaveMetadata();
    if (!metadata.exists) {
      showClassSelectionOverlay();
      return;
    }
    const choices = [
      {
        label: "继续冒险",
        onClick: function continueFromSave() {
          const loaded = loadSnapshot();
          if (!loaded.ok) {
            showNotice("冒险继续", "读取失败", loaded.reason || "当前无法读取本地存档。", "开始新冒险", showClassSelectionOverlay);
            return;
          }
          const applied = applyLoadedSnapshot(loaded.snapshot);
          if (!applied.ok) {
            showNotice("冒险继续", "存档损坏", applied.reason || "存档内容无法恢复。", "开始新冒险", showClassSelectionOverlay);
            return;
          }
          hideOverlay();
          appendLog("已从本地存档恢复，继续你的冒险。");
        },
      },
      {
        label: "开始新冒险",
        onClick: function beginFreshRun() {
          clearSnapshot();
          hideOverlay();
          showClassSelectionOverlay();
        },
      },
    ];

    showOverlay(
      "冒险继续",
      "检测到本地存档",
      "<div class=\"detail-stats\"><p><strong>最近存档：</strong>" + formatSaveTime(metadata.savedAt) + "</p><p><strong>摘要：</strong>" + (metadata.summary || "可继续当前进度") + "</p></div>" + showChoiceButtons(choices),
      "关闭",
      hideOverlay
    );
    bindOverlayChoices(choices);
  }

  function showMentorOverlay() {
    function handleSpendSkillPoint(statKey, successText) {
      if (spendSkillPoint(statKey)) {
        syncStatusPanel();
        appendLog(successText);
        hideOverlay();
        return;
      }
      showNotice("技能点不足", "无法强化", "当前技能点不足，先去战斗升级后再回来分配。", "返回导师", showMentorOverlay);
    }

    const choices = [
      { label: "重新选择职业", onClick: showClassSelectionOverlay },
      { label: "存档管理", onClick: showSaveManagementOverlay },
      { label: "城镇建设", onClick: showTownUpgradeOverlay },
      { label: "职业专精（技能树）", onClick: showSpecializationOverviewOverlay },
      { label: "强化攻击（消耗 1 技能点）", onClick: function spendAtk() { handleSpendSkillPoint("attack", "攻击提升。"); } },
      { label: "强化防御（消耗 1 技能点）", onClick: function spendDef() { handleSpendSkillPoint("defense", "防御提升。"); } },
      { label: "强化生命（消耗 1 技能点）", onClick: function spendHp() { handleSpendSkillPoint("maxHp", "生命上限提升。"); } },
      { label: "强化法力（消耗 1 技能点）", onClick: function spendMp() { handleSpendSkillPoint("maxMp", "法力上限提升。"); } },
    ];

    showOverlay("职业导师", "分配成长", "导师会帮你重选职业、分配属性成长，或者沿着职业专精继续深化这套 build。" + showChoiceButtons(choices), "返回城镇", hideOverlay);
    bindOverlayChoices(choices);
  }

  function renderMerchantEquipmentHtml(items) {
    return "<div class=\"detail-stats\">"
      + items.map(function mapItem(item) {
        const upgradeText = item.upgradeCost
          ? "下一级消耗：" + item.upgradeCost.gold + " 金币" + (describeMaterialCost(item.upgradeCost.materials) ? "，" + describeMaterialCost(item.upgradeCost.materials) : "")
          : "已满级";
        return "<p><strong>" + item.name + "</strong> <span class=\"overlay-inline-note\">"
          + (item.slot || "装备") + " / " + (item.rarity || "普通") + " / Lv." + (item.level || 1)
          + "</span><br>" + getEquipmentInspectLines(item).join("；")
          + "<br><span class=\"overlay-inline-note\">" + upgradeText + "</span></p>";
      }).join("")
      + "</div>";
  }

  function showMerchantBuyOverlay() {
    if (!merchantStock.length) {
      refreshMerchantStock();
    }
    const choices = merchantStock.map(function mapItem(item) {
      return {
        label: item.name + "（" + item.rarity + " / " + item.cost + " 金币）",
        onClick: function buy() {
          if (buyEquipment(item)) {
            syncStatusPanel();
            appendLog("购买装备：" + item.name + "。");
            showMerchantOverlay();
            return;
          }
          showNotice(
            "交易失败",
            "无法购买",
            player.equipment.some(function hasItem(entry) {
              const ownedItem = getEquipmentEntry(entry);
              return ownedItem && ownedItem.baseId === item.baseId;
            }) ? "同底座装备已经拥有，先去强化或更换别的部位。" : "你的金币不足，先去刷怪赚些金币再来。",
            "继续查看",
            showMerchantBuyOverlay
          );
        },
      };
    });

    showOverlay(
      "补给商人",
      "购买装备",
      "商人会拿出本轮库存的具体词条装备。每件装备的词条、成长和强化消耗都能直接查看。"
        + renderMerchantEquipmentHtml(merchantStock)
        + showChoiceButtons(choices),
      "返回商店",
      showMerchantOverlay
    );
    bindOverlayChoices(choices);
  }

  function showMerchantUpgradeOverlay() {
    const ownedItems = player.equipment.map(getEquipmentEntry).filter(Boolean);
    if (!ownedItems.length) {
      showNotice("补给商人", "暂无可强化装备", "你还没有买下任何装备，先挑一件顺手的武器或护具吧。", "返回商店", showMerchantOverlay);
      return;
    }

    const choices = ownedItems.map(function mapItem(item) {
      const costText = item.upgradeCost
        ? ("消耗 " + item.upgradeCost.gold + " 金币" + (describeMaterialCost(item.upgradeCost.materials) ? " / " + describeMaterialCost(item.upgradeCost.materials) : ""))
        : "已满级";
      return {
        label: item.name + "（Lv." + item.level + (item.level < item.maxLevel ? " -> " + (item.level + 1) : "") + "，" + costText + "）",
        onClick: function upgrade() {
          if (!item.upgradeCost) {
            showNotice("装备强化", "无法继续强化", "这件装备已经达到当前版本的强化上限。", "返回强化列表", showMerchantUpgradeOverlay);
            return;
          }
          const nextItem = upgradeEquipmentInstance(item);
          const result = upgradeEquipment(item.instanceId, nextItem);
          if (!result.ok) {
            showNotice("装备强化", "强化失败", result.reason || "当前无法强化这件装备。", "返回强化列表", showMerchantUpgradeOverlay);
            return;
          }
          syncStatusPanel();
          appendLog("装备强化：" + result.item.name + " 升至 Lv." + result.item.level + "。");
          showMerchantUpgradeOverlay();
        },
      };
    });

    showOverlay(
      "补给商人",
      "强化装备",
      "强化会消耗金币与材料，并把装备成长值真正转成当前 build 的战力。"
        + renderMerchantEquipmentHtml(ownedItems)
        + showChoiceButtons(choices),
      "返回商店",
      showMerchantOverlay
    );
    bindOverlayChoices(choices);
  }

  function showMerchantOverlay() {
    const choices = [
      { label: "购买装备", onClick: showMerchantBuyOverlay },
      { label: "强化装备", onClick: showMerchantUpgradeOverlay },
      { label: "查看构筑详情", onClick: showDetailStatsOverlay },
    ];

    showOverlay("补给商人", "军备整备", "想让 build 长成型，就要同时看装备词条、成长方向和当前强化资源。" + showChoiceButtons(choices), "返回城镇", hideOverlay);
    bindOverlayChoices(choices);
  }

  function renderStageSelectionBriefing() {
    const unlockedChapterIds = getUnlockedChapterIds();
    return "<div class=\"detail-stats\">"
      + CHAPTERS.map(function mapChapter(chapter) {
        const meta = getStageMeta(chapter.stageId);
        const isUnlocked = unlockedChapterIds.indexOf(chapter.id) !== -1;
        const cleared = isStageCleared(chapter.stageId);
        const statusText = cleared
          ? "已通关"
          : (isUnlocked ? "已开放" : ("未开放（需城镇声望 " + chapter.requiredRenown + "）"));
        return "<p><strong>" + chapter.label + "</strong>"
          + "<br>章节状态：" + statusText
          + "<br>区域：" + (meta.label || chapter.stageId)
          + "<br>路线：" + (meta.routeLabel || "标准推进")
          + "<br>压力：" + (meta.pressureLabel || "常规战斗")
          + "<br>奖励倾向：" + (meta.rewardLabel || "基础收益")
          + "<br>章节目标：" + chapter.summary
          + "</p>";
      }).join("")
      + "</div>";
  }

  function showGatekeeperOverlay() {
    const choices = progress.availableStages.map(function mapStage(stageId) {
      const meta = getStageMeta(stageId);
      const cleared = isStageCleared(stageId);
      const chapter = getChapterByStageId(stageId);
      return {
        label: (chapter ? chapter.label + " / " : "") + meta.label + (cleared ? "（已通关）" : ""),
        onClick: function travel() {
          hideOverlay();
          startRun(stageId);
          loadStage(stageId);
          appendLog("你前往了 " + meta.label + "。");
        },
      };
    });

    showOverlay(
      "守门人",
      "选择章节路线",
      "每次进入关卡都会重新生成地图、精英和事件节点。清光小怪与精英后，Boss 传送门才会开启；章节开放还会受到城镇声望推进影响。"
        + "<p class=\"overlay-inline-note\">Boss 传送门会直接显现，你可以随时进入首领房。</p>"
        + renderStageSelectionBriefing()
        + showChoiceButtons(choices),
      "留下",
      hideOverlay
    );
    bindOverlayChoices(choices);
  }

  function unlockStage(stageId, logText) {
    if (progress.availableStages.includes(stageId)) {
      return;
    }
    progress.availableStages.push(stageId);
    if (logText) {
      appendLog(logText);
    }
  }

  function unlockPortalIfNeeded() {
    if (currentStageMode !== "field" || !currentPortalPos) {
      return;
    }
    if (countRemainingHostiles() > 0 || currentMap[currentPortalPos.y][currentPortalPos.x] === TILE.PORTAL) {
      return;
    }
    currentMap[currentPortalPos.y][currentPortalPos.x] = TILE.PORTAL;
    appendLog("区域小怪已清理完毕，Boss 传送门开启。");
  }

  function beginBossIntro(x, y) {
    const meta = getStageMeta(currentStageName);
    encounterPos = { x: x, y: y };
    setGameState(GAME_STATE.BOSS_INTRO);
    setCombatBanner(true, "首领来袭");
    pulseFlash();
    shakeCanvas();
    showOverlay("警告", meta.bossLabel || "Boss 房", "真正的首领战现在开始。你可以选择直面首领，也可以先在区域里积累优势再来。", "迎战", function confirmBoss() {
      hideOverlay();
      bossIntroTimeout = window.setTimeout(function startBoss() {
        if (combatController) {
          combatController.startCombat({
            tile: TILE.BOSS,
            stageName: currentStageName,
            enemyTemplate: currentEncounterPool[positionKey(x, y)],
          });
        }
      }, 160);
    });
  }

  function handleTownNpc(x, y) {
    const npcs = (getStageMeta("azure_town").npcs || []);
    const npc = npcs.find(function findNpc(item) {
      return item.x === x && item.y === y;
    });
    if (!npc) {
      return false;
    }
    if (npc.id === "mentor") {
      showMentorOverlay();
    } else if (npc.id === "merchant") {
      showMerchantOverlay();
    } else if (npc.id === "gatekeeper") {
      showGatekeeperOverlay();
    }
    return true;
  }

  function handleLandingTile(x, y) {
    if (currentStageName === "azure_town" && handleTownNpc(x, y)) {
      return;
    }

    const tile = currentMap[y][x];
    if (tile === TILE.HEAL_POINT) {
      recoverHpMp(36, 18, currentStageName === "azure_town" ? "你在喷泉边休整，状态恢复。" : "你使用了营地恢复点。");
      return;
    }
    if (tile === TILE.PORTAL) {
      if (currentStageName === "azure_town") {
        showGatekeeperOverlay();
      } else if (currentStageMode === "field") {
        loadStage(currentStageName, { mode: "boss" });
        appendLog("你穿过传送门，进入了该区域的 Boss 房。");
      }
      return;
    }
    if (tile === TILE.EVENT) {
      showStageEvent(x, y);
      return;
    }
    if (tile === TILE.ENEMY || tile === TILE.ELITE) {
      encounterPos = { x: x, y: y };
      if (combatController) {
        combatController.startCombat({
          tile: tile,
          stageName: currentStageName,
          enemyTemplate: currentEncounterPool[positionKey(x, y)],
        });
      }
      return;
    }
    if (tile === TILE.BOSS) {
      beginBossIntro(x, y);
    }
  }

  function recoverHpMp(hpAmount, mpAmount, reason) {
    player.hp = clamp(player.hp + hpAmount, 0, player.maxHp);
    player.mp = clamp(player.mp + mpAmount, 0, player.maxMp);
    syncStatusPanel();
    if (reason) {
      appendLog(reason);
    }
  }

  function beginMove(vector) {
    const nextX = player.position.x + vector.dx;
    const nextY = player.position.y + vector.dy;
    if (nextX < 0 || nextY < 0 || nextY >= currentMap.length || nextX >= currentMap[0].length) {
      return false;
    }
    if (currentMap[nextY][nextX] === TILE.WALL) {
      return false;
    }

    movementState.active = true;
    movementState.elapsed = 0;
    movementState.fromX = player.position.x;
    movementState.fromY = player.position.y;
    movementState.toX = nextX;
    movementState.toY = nextY;
    player.position.x = nextX;
    player.position.y = nextY;
    syncStatusPanel();
    return true;
  }

  function getHeldMoveVector() {
    if (preferredMoveKey && heldKeys[preferredMoveKey] && movementByKey[preferredMoveKey]) {
      return movementByKey[preferredMoveKey];
    }
    const keys = Object.keys(movementByKey);
    for (let i = 0; i < keys.length; i += 1) {
      if (heldKeys[keys[i]]) {
        preferredMoveKey = keys[i];
        return movementByKey[keys[i]];
      }
    }
    return null;
  }

  function setHeldMoveState(key, pressed) {
    if (!movementByKey[key]) {
      return;
    }
    heldKeys[key] = pressed;
    if (pressed) {
      preferredMoveKey = key;
    } else if (preferredMoveKey === key) {
      preferredMoveKey = "";
    }
    syncTouchMoveButtons();
    if (pressed && !movementState.active && getGameState() === GAME_STATE.EXPLORE && !isOverlayVisible()) {
      beginMove(movementByKey[key]);
    }
  }

  function setJoystickDirection(nextKey) {
    ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].forEach(function eachKey(key) {
      if (key !== nextKey && heldKeys[key]) {
        setHeldMoveState(key, false);
      }
    });
    joystickState.directionKey = nextKey || "";
    if (nextKey) {
      setHeldMoveState(nextKey, true);
    }
  }

  function updateJoystickFromPoint(clientX, clientY) {
    if (!ui.joystickBase) {
      return;
    }
    const rect = ui.joystickBase.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    let dx = clientX - centerX;
    let dy = clientY - centerY;
    const maxDistance = Math.max(18, rect.width * 0.5 - 24);
    const distance = Math.hypot(dx, dy);

    if (distance > maxDistance) {
      const ratio = maxDistance / distance;
      dx *= ratio;
      dy *= ratio;
    }

    joystickState.knobX = Math.round(dx);
    joystickState.knobY = Math.round(dy);

    const deadZone = maxDistance * 0.26;
    let nextKey = "";
    if (distance >= deadZone) {
      if (Math.abs(dx) > Math.abs(dy)) {
        nextKey = dx >= 0 ? "ArrowRight" : "ArrowLeft";
      } else {
        nextKey = dy >= 0 ? "ArrowDown" : "ArrowUp";
      }
    }

    setJoystickDirection(nextKey);
    syncTouchMoveButtons();
  }

  function updateMovement(delta) {
    if (!movementState.active) {
      return;
    }

    movementState.elapsed += delta;
    const progressValue = clamp(movementState.elapsed / movementState.duration, 0, 1);
    const eased = 1 - Math.pow(1 - progressValue, 3);
    renderPosition.x = movementState.fromX + (movementState.toX - movementState.fromX) * eased;
    renderPosition.y = movementState.fromY + (movementState.toY - movementState.fromY) * eased;

    if (progressValue >= 1) {
      movementState.active = false;
      renderPosition.x = movementState.toX;
      renderPosition.y = movementState.toY;
      handleLandingTile(movementState.toX, movementState.toY);
      if (getGameState() === GAME_STATE.EXPLORE && !isOverlayVisible()) {
        const heldVector = getHeldMoveVector();
        if (heldVector) {
          beginMove(heldVector);
        }
      }
    }
  }

  function onLevelUp() {
    player.skillPoints += 1;
    runSummary.skillPointsEarned += 1;
    const unlocked = unlockClassSkillIfNeeded();
    if (unlocked && skills[unlocked]) {
      appendLog("你掌握了新技能：" + skills[unlocked].name + "。");
    }
    renderSkillButtons();
    syncStatusPanel();
  }

  function onActionButton(actionName) {
    if (!combatController || getGameState() !== GAME_STATE.COMBAT) {
      return;
    }
    if (combatController.playerAction(actionName)) {
      skillMenuOpen = false;
      updateSkillMenuVisibility();
      syncStatusPanel();
    }
  }

  function onUltimateButton() {
    const skill = getPrimaryUltimateSkill();
    if (!skill) {
      return;
    }
    onActionButton("ultimate:" + skill.id);
  }

  function bindStaticButtons() {
    ui.btnBasicAttack.addEventListener("click", function onBasicAttack() {
      onActionButton("attack");
    });
    ui.btnSkillMenu.addEventListener("click", function onSkillMenu() {
      if (getGameState() !== GAME_STATE.COMBAT) {
        return;
      }
      skillMenuOpen = !skillMenuOpen;
      updateSkillMenuVisibility();
    });
    if (ui.btnUltimate) {
      ui.btnUltimate.addEventListener("click", onUltimateButton);
    }
    ui.btnFlee.addEventListener("click", function onFlee() {
      onActionButton("flee");
    });
    ui.overlayButton.addEventListener("click", function onOverlayButton() {
      if (overlayAction) {
        overlayAction();
      } else {
        hideOverlay();
      }
    });
    if (ui.btnDetailStats) {
      ui.btnDetailStats.addEventListener("click", showDetailStatsOverlay);
    }
    if (ui.btnSaveMenu) {
      ui.btnSaveMenu.addEventListener("click", showSaveManagementOverlay);
    }
    if (ui.btnOpenLog) {
      ui.btnOpenLog.addEventListener("click", showBattleLogOverlay);
    }
    if (ui.mobilePanelToggle) {
      ui.mobilePanelToggle.addEventListener("click", function onMobilePanelToggle() {
        setMobileSidePanelOpen(!mobileHudState.sidePanelOpen);
      });
    }
    if (ui.mobilePanelBackdrop) {
      ui.mobilePanelBackdrop.addEventListener("click", function onMobileBackdrop() {
        setMobileSidePanelOpen(false);
      });
    }
    if (ui.mobileSideCloseButton) {
      ui.mobileSideCloseButton.addEventListener("click", function onMobileSideClose() {
        setMobileSidePanelOpen(false);
      });
    }
    if (ui.statusToggle) {
      ui.statusToggle.addEventListener("click", function onStatusToggle() {
        if (floatingHudState.moved) {
          floatingHudState.moved = false;
          return;
        }
        setFloatingStatusPanelVisible(!floatingHudState.open);
      });
    }
    if (ui.btnCloseStatusPanel) {
      ui.btnCloseStatusPanel.addEventListener("click", function onStatusClose() {
        setFloatingStatusPanelVisible(false);
      });
    }
  }

  function bindTouchControls() {
    if (ui.joystickBase) {
      function press(event) {
        if (isOverlayVisible() || getGameState() !== GAME_STATE.EXPLORE) {
          return;
        }
        event.preventDefault();
        joystickState.active = true;
        joystickState.pointerId = event.pointerId;
        if (typeof ui.joystickBase.setPointerCapture === "function") {
          ui.joystickBase.setPointerCapture(event.pointerId);
        }
        updateJoystickFromPoint(event.clientX, event.clientY);
      }

      function move(event) {
        if (!joystickState.active || event.pointerId !== joystickState.pointerId) {
          return;
        }
        event.preventDefault();
        updateJoystickFromPoint(event.clientX, event.clientY);
      }

      function release(event) {
        if (joystickState.pointerId !== null && event.pointerId !== joystickState.pointerId) {
          return;
        }
        event.preventDefault();
        if (typeof ui.joystickBase.releasePointerCapture === "function" && ui.joystickBase.hasPointerCapture && ui.joystickBase.hasPointerCapture(event.pointerId)) {
          ui.joystickBase.releasePointerCapture(event.pointerId);
        }
        clearHeldMoveKeys();
      }

      ui.joystickBase.addEventListener("pointerdown", press);
      ui.joystickBase.addEventListener("pointermove", move);
      ui.joystickBase.addEventListener("pointerup", release);
      ui.joystickBase.addEventListener("pointercancel", release);
      ui.joystickBase.addEventListener("lostpointercapture", release);
      ui.joystickBase.addEventListener("contextmenu", function preventMenu(event) {
        event.preventDefault();
      });
      ui.joystickBase.addEventListener("selectstart", function preventSelection(event) {
        event.preventDefault();
      });
      ui.joystickBase.addEventListener("dragstart", function preventDrag(event) {
        event.preventDefault();
      });
    }

    if (ui.statusToggle && ui.canvasWrap) {
      const dragThreshold = 8;

      function startHudDrag(event) {
        if (isMobileLandscapeLayout()) {
          return;
        }
        const rect = ui.statusToggle.getBoundingClientRect();
        floatingHudState.pointerId = event.pointerId;
        floatingHudState.dragging = false;
        floatingHudState.pendingDrag = true;
        floatingHudState.moved = false;
        floatingHudState.offsetX = event.clientX - rect.left;
        floatingHudState.offsetY = event.clientY - rect.top;
        floatingHudState.pressX = event.clientX;
        floatingHudState.pressY = event.clientY;
        if (typeof ui.statusToggle.setPointerCapture === "function") {
          ui.statusToggle.setPointerCapture(event.pointerId);
        }
      }

      function moveHudDrag(event) {
        if (event.pointerId !== floatingHudState.pointerId) {
          return;
        }
        const deltaX = event.clientX - floatingHudState.pressX;
        const deltaY = event.clientY - floatingHudState.pressY;
        if (!floatingHudState.dragging) {
          if (!floatingHudState.pendingDrag || Math.hypot(deltaX, deltaY) < dragThreshold) {
            return;
          }
          floatingHudState.dragging = true;
          floatingHudState.pendingDrag = false;
          ui.statusToggle.classList.add("is-dragging");
        }
        const wrapRect = ui.canvasWrap.getBoundingClientRect();
        const buttonWidth = ui.statusToggle.offsetWidth || 76;
        const buttonHeight = ui.statusToggle.offsetHeight || 34;
        const nextLeft = clamp(event.clientX - wrapRect.left - floatingHudState.offsetX, 10, Math.max(10, wrapRect.width - buttonWidth - 10));
        const nextTop = clamp(event.clientY - wrapRect.top - floatingHudState.offsetY, 10, Math.max(10, wrapRect.height - buttonHeight - 10));
        floatingHudState.leftPercent = nextLeft / Math.max(1, wrapRect.width);
        floatingHudState.topPercent = nextTop / Math.max(1, wrapRect.height);
        floatingHudState.moved = true;
        syncFloatingStatusHud();
        event.preventDefault();
      }

      function stopHudDrag(event) {
        if (floatingHudState.pointerId !== null && event.pointerId !== floatingHudState.pointerId) {
          return;
        }
        if (typeof ui.statusToggle.releasePointerCapture === "function" && ui.statusToggle.hasPointerCapture && ui.statusToggle.hasPointerCapture(event.pointerId)) {
          ui.statusToggle.releasePointerCapture(event.pointerId);
        }
        floatingHudState.dragging = false;
        floatingHudState.pendingDrag = false;
        floatingHudState.pointerId = null;
        ui.statusToggle.classList.remove("is-dragging");
      }

      ui.statusToggle.addEventListener("pointerdown", startHudDrag);
      ui.statusToggle.addEventListener("pointermove", moveHudDrag);
      ui.statusToggle.addEventListener("pointerup", stopHudDrag);
      ui.statusToggle.addEventListener("pointercancel", stopHudDrag);
      ui.statusToggle.addEventListener("lostpointercapture", stopHudDrag);
    }

    window.addEventListener("blur", clearHeldMoveKeys);
    document.addEventListener("visibilitychange", function onVisibilityChange() {
      if (document.hidden) {
        clearHeldMoveKeys();
      }
    });
  }

  function handleMoveInput(event) {
    if (isOverlayVisible() || getGameState() !== GAME_STATE.EXPLORE) {
      return;
    }
    const rawKey = event.key || "";
    const key = rawKey.length === 1 ? rawKey.toLowerCase() : rawKey;
    if (!movementByKey[key]) {
      return;
    }
    event.preventDefault();
    setHeldMoveState(key, true);
  }

  function handleMoveKeyUp(event) {
    const rawKey = event.key || "";
    const key = rawKey.length === 1 ? rawKey.toLowerCase() : rawKey;
    if (!movementByKey[key]) {
      return;
    }
    setHeldMoveState(key, false);
  }

  gameStateStore.subscribe(function onStateChanged(nextState) {
    if (nextState === GAME_STATE.EXPLORE) {
      setExploreControlsVisible(true);
    } else {
      setExploreControlsVisible(false);
    }
    syncCombatLayout(nextState);
  });

  if (typeof gameStateStore.subscribeInvalid === "function") {
    gameStateStore.subscribeInvalid(function onInvalidStateTransition(event) {
      console.warn("[GameState] " + event.reason, event);
    });
  }

  const combatController = combatApi.createCombatController
    ? combatApi.createCombatController({
        player: player,
        skills: skills,
        resolveSkill: getResolvedSkill,
        getUltimateSkills: getResolvedUltimateSkills,
        onLog: appendLog,
        onStatusSync: syncStatusPanel,
        onEffect: function onEffect(name) {
          if (name === "playerHit") {
            shakeCanvas();
            pulseFlash();
            setCombatBanner(true, "你受到攻击");
          } else if (name === "enemyHit") {
            pulseFlash();
            setCombatBanner(true, "命中敌人");
          } else if (name === "playerHeal") {
            setCombatBanner(true, "技能生效");
          } else if (name === "combatStart") {
            pulseFlash();
          }
        },
        onStateChange: function onCombatStateChanged(snapshot) {
          combatSnapshot = snapshot;
          if (snapshot.inCombat) {
            clearHeldMoveKeys();
            setGameState(GAME_STATE.COMBAT);
            syncEnemyPanel(snapshot.enemy);
            setActionMenu(true, Boolean(snapshot.playerTurn), snapshot);
            setCombatBanner(true, snapshot.insertWindow && snapshot.insertWindow.open ? "终结技插入" : (snapshot.playerTurn ? "你的回合" : "敌方回合"));
          } else {
            syncEnemyPanel(null);
            setActionMenu(false, false, null);
            setCombatBanner(false, "");
            if (getGameState() !== GAME_STATE.GAME_OVER) {
              setGameState(GAME_STATE.EXPLORE);
            }
          }
        },
        onCombatEnd: function onCombatEnd(payload) {
          const result = payload.result;
          const bossWin = Boolean(payload.enemy && payload.enemy.isBoss);
          const enemy = payload.enemy || null;

          if (result === "victory") {
            if (encounterPos) {
              currentMap[encounterPos.y][encounterPos.x] = TILE.FLOOR;
              delete currentEncounterPool[positionKey(encounterPos.x, encounterPos.y)];
            }
            const bonusGold = getEncounterGoldBonus(enemy);
            const totalGold = (payload.enemy.gold || 0) + bonusGold;
            player.gold += totalGold;
            runSummary.goldEarned += totalGold;
            runSummary.expGained += payload.rewards && payload.rewards.exp ? payload.rewards.exp : 0;
            runSummary.combatsWon += 1;
            if (enemy && enemy.encounterType === "elite") {
              runSummary.elitesDefeated += 1;
            }
            appendLog("获得金币 " + totalGold + (bonusGold > 0 ? "（补给车队额外 +" + bonusGold + "）" : "") + "。");
            unlockPortalIfNeeded();

            showVictoryRewardOverlay(enemy, function afterReward() {
              if (bossWin) {
                progress.clearedBosses[currentStageName] = true;
                runSummary.bossCleared = true;
                awardLongTermProgress(runSummary);
                const chapterAdvance = tryAdvanceChapterAfterBoss(currentStageName);
                if (chapterAdvance.unlockedChapter) {
                  runSummary.unlockedStageLabel = getStageMeta(chapterAdvance.unlockedChapter.stageId).label;
                  runSummary.unlockedChapterLabel = chapterAdvance.unlockedChapter.label;
                  appendLog("世界推进：" + chapterAdvance.unlockedChapter.label + " 已开放。");
                } else if (chapterAdvance.blockedChapter) {
                  appendLog("世界推进：下一章节需要城镇声望 " + chapterAdvance.blockedChapter.requiredRenown + "，当前为 " + (progress.longTerm.townRenown || 0) + "。");
                } else if (chapterAdvance.campaignComplete) {
                  runSummary.unlockedChapterLabel = "终章已完成";
                  appendLog("世界推进：三章试炼已全部完成。");
                }
                showRunSummaryOverlay(buildRunSummarySnapshot({
                  outcomeText: chapterAdvance.campaignComplete
                    ? "终章击破，整条试炼线已经完成。"
                    : "首领击破，成功完成本轮试炼。",
                }), function returnTown() {
                  loadStage("azure_town");
                  setGameState(GAME_STATE.EXPLORE);
                  runSummary = createEmptyRunSummary();
                  saveCurrentProgress({ silent: true });
                });
              } else {
                appendLog(enemy && enemy.encounterType === "elite" ? "你击溃了精英敌人，战场节奏开始向你倾斜。" : "你带着战利品继续推进。");
                setGameState(GAME_STATE.EXPLORE);
              }
            });
          } else if (result === "flee") {
            appendLog("你撤离了当前战斗。");
            setGameState(GAME_STATE.EXPLORE);
          } else if (result === "defeat") {
            setGameState(GAME_STATE.GAME_OVER);
            setActionMenu(false, false);
            setCombatBanner(true, "战斗失败");
            showOverlay("挑战失败", "暂时倒下", "你倒下了，但城镇会永远欢迎下一次重开。", "重开", function reset() {
              hideOverlay();
              window.location.reload();
            });
          }

          encounterPos = null;
          syncStatusPanel();
        },
        onLevelUp: onLevelUp,
      })
    : null;

  function renderFrame(timestamp) {
    if (!lastFrameTime) {
      lastFrameTime = timestamp;
    }
    const delta = Math.min(32, timestamp - lastFrameTime);
    lastFrameTime = timestamp;
    updateMovement(delta);

    if (getGameState() === GAME_STATE.COMBAT || getGameState() === GAME_STATE.GAME_OVER) {
      drawCombatView();
    } else {
      drawMap(ctx, currentMap, renderPosition, {
        stageName: currentStageName,
        stageTheme: getStageMeta(currentStageName).assetTheme || currentStageName,
      });
      if (currentStageName === "azure_town") {
        drawTownDecorations();
      }
    }

    window.requestAnimationFrame(renderFrame);
  }

  function init() {
    ensureRunCollections();
    ensureProgressState();
    setRelicResolver(findRelicByName);
    refreshMerchantStock();
    hydrateLogHistoryFromDom();
    canvas.width = 20 * TILE_SIZE;
    canvas.height = 15 * TILE_SIZE;
    bindStaticButtons();
    bindTouchControls();
    syncResponsiveHudLayout();
    syncCombatLayout(getGameState());
    setFloatingStatusPanelVisible(false);
    loadStage("azure_town");
    renderSkillButtons();
    updateSkillMenuVisibility();
    setExploreControlsVisible(true);
    setActionMenu(false, false);
    syncEnemyPanel(null);
    setCombatBanner(false, "");
    syncStatusPanel();
    window.addEventListener("keydown", handleMoveInput);
    window.addEventListener("keyup", handleMoveKeyUp);
    window.addEventListener("resize", syncResponsiveHudLayout);
    window.addEventListener("orientationchange", syncResponsiveHudLayout);
    window.requestAnimationFrame(renderFrame);
    loadMapAssets().then(function onAssetsLoaded() {
      appendLog("资源已加载，城镇与战斗素材已就绪。");
    });
    appendLog("系统：你现在从蔚蓝城镇出发。职业、技能、装备和关卡循环都已接入。");
    showStartResumeOverlay();
  }

  init();
})();
