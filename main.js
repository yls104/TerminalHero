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
  const setRelicResolver = entitiesApi.setRelicResolver || function noopRelicResolver() {};
  const refreshBuildSnapshot = entitiesApi.refreshBuildSnapshot || function noopRefreshBuildSnapshot() {};
  const getSpecializationTracks = entitiesApi.getSpecializationTracks || function noTracks() { return []; };
  const getUnlockedSpecializationNodes = entitiesApi.getUnlockedSpecializationNodes || function noUnlockedNodes() { return []; };
  const unlockSpecializationNode = entitiesApi.unlockSpecializationNode || function noUnlock() { return { ok: false, reason: "当前版本未接入职业专精。" }; };
  const spendSkillPoint = entitiesApi.spendSkillPoint || function noSpend() { return false; };
  const buyEquipment = entitiesApi.buyEquipment || function noBuy() { return false; };

  const TILE_SIZE = mapApi.TILE_SIZE || 32;
  const drawMap = mapApi.drawMap;
  const loadMapAssets = mapApi.loadMapAssets || function noopAssets() { return Promise.resolve([]); };
  const getMapAsset = mapApi.getMapAsset || function missingAsset() { return null; };

  const STAGE_META = stageApi.STAGE_META || {};
  const STAGE_SEQUENCE = stageApi.STAGE_SEQUENCE || [];
  const SHOP_ITEMS = stageApi.SHOP_ITEMS || [];
  const RELIC_POOLS = stageApi.RELIC_POOLS || {};
  const DROP_TABLES = stageApi.DROP_TABLES || {};
  const getStageMeta = stageApi.getStageMeta || function fallbackStageMeta(stageName) { return STAGE_META[stageName] || {}; };
  const createStageInstance = stageApi.createStageInstance || function fallbackStageInstance() { return { map: [], encounters: {}, events: {}, portalPos: null, contentPools: {} }; };
  const createStageProgress = stageApi.createStageProgress || function fallbackProgress() { return { availableStages: [], clearedBosses: {} }; };
  const positionKey = stageApi.positionKey || function fallbackPositionKey(x, y) { return x + "," + y; };
  const findRelicByName = stageApi.findRelicByName || function fallbackRelic() { return null; };

  const createHudViewModel = viewModelApi.createHudViewModel || function fallbackHudViewModel() { return {}; };
  const createEnemyViewModel = viewModelApi.createEnemyViewModel || function fallbackEnemyViewModel() { return { visible: false, name: "", hpText: "0 / 0", hpPercent: 0 }; };
  const createDetailStatsViewModel = viewModelApi.createDetailStatsViewModel || function fallbackDetailStatsViewModel() { return { overlayEyebrow: "", overlayTitle: "", rows: [] }; };
  const renderDetailStatsHtml = viewModelApi.renderDetailStatsHtml || function fallbackDetailHtml() { return ""; };
  const createRunSummaryViewModel = viewModelApi.createRunSummaryViewModel || function fallbackRunSummaryViewModel() { return { overlayEyebrow: "", overlayTitle: "", rows: [] }; };
  const renderRunSummaryHtml = viewModelApi.renderRunSummaryHtml || function fallbackRunSummaryHtml() { return ""; };
  const createBuildCodexViewModel = viewModelApi.createBuildCodexViewModel || function fallbackBuildCodexViewModel() { return { overlayEyebrow: "", overlayTitle: "", summaryRows: [], sections: [] }; };
  const renderBuildCodexHtml = viewModelApi.renderBuildCodexHtml || function fallbackBuildCodexHtml() { return ""; };
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
    classResourceItem: document.querySelector("#classResourceItem"),
    classResourceLabel: document.querySelector("#classResourceLabel"),
    classResourceValue: document.querySelector("#classResourceValue"),
    classResourceBar: document.querySelector("#classResourceBar"),
    pos: document.querySelector("#posValue"),
    sidePanel: document.querySelector(".side-panel"),
    statusList: document.querySelector(".status-list"),
    resourcePanel: document.querySelector("#resourcePanel"),
    mobileBottomBar: document.querySelector("#mobileBottomBar"),
    mobileHudDock: document.querySelector("#mobileHudDock"),
    hpBar: document.querySelector("#hpBar"),
    mpBar: document.querySelector("#mpBar"),
    expBar: document.querySelector("#expBar"),
    actionPanel: document.querySelector("#actionPanel"),
    actionMenu: document.querySelector("#actionMenu"),
    btnBasicAttack: document.querySelector("#btnBasicAttack"),
    btnSkillMenu: document.querySelector("#btnSkillMenu"),
    skillButtons: document.querySelector("#skillButtons"),
    btnFlee: document.querySelector("#btnFlee"),
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
  let currentStageContent = { eventPoolId: "", relicPoolId: "", dropTableId: "", elitePoolId: "" };
  let renderPosition = { x: 1, y: 1 };
  let overlayAction = null;
  let combatSnapshot = null;
  let encounterPos = null;
  let bossIntroTimeout = 0;
  let lastFrameTime = 0;
  let preferredMoveKey = "";
  let skillMenuOpen = false;
  const heldKeys = {};
  const joystickState = {
    active: false,
    pointerId: null,
    knobX: 0,
    knobY: 0,
    directionKey: "",
  };
  let runSummary = createEmptyRunSummary();
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

  function createSkillInspectLines(skill) {
    const lines = [];
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

    player.equipment.forEach(function eachEquipment(id) {
      const item = SHOP_ITEMS.find(function findItem(entry) {
        return entry.id === id;
      });
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
    return currentStageMode === "boss" ? (meta.bossDescription || meta.description) : meta.description;
  }

  function appendLog(message) {
    if (!ui.battleLog) {
      return;
    }
    const entry = normalizeCombatLogEntry(message);
    const line = document.createElement("p");
    line.textContent = entry.text;
    line.dataset.logType = entry.type || "info";
    if (entry.emphasis) {
      line.classList.add("is-emphasis");
    }
    ui.battleLog.appendChild(line);
    ui.battleLog.scrollTop = ui.battleLog.scrollHeight;
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
    overlayAction = action || null;
    ui.overlayEyebrow.textContent = eyebrow;
    ui.overlayTitle.textContent = title;
    ui.overlayText.innerHTML = text;
    ui.overlayButton.textContent = buttonLabel;
    ui.sceneOverlay.classList.remove("is-hidden");
  }

  function showNotice(eyebrow, title, text, buttonLabel, action) {
    showOverlay(eyebrow, title, text, buttonLabel || "我知道了", action || hideOverlay);
  }

  function hideOverlay() {
    ui.sceneOverlay.classList.add("is-hidden");
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

  function syncResponsiveHudLayout() {
    if (!ui.statusList || !ui.resourcePanel || !ui.sidePanel || !ui.actionPanel || !ui.mobileHudDock || !ui.mobileBottomBar) {
      return;
    }

    if (isMobileLandscapeLayout()) {
      if (ui.statusList.parentNode !== ui.mobileHudDock) {
        ui.mobileHudDock.appendChild(ui.statusList);
      }
      if (ui.resourcePanel.parentNode !== ui.mobileHudDock) {
        ui.mobileHudDock.appendChild(ui.resourcePanel);
      }
      ui.mobileBottomBar.classList.remove("is-hidden");
      ui.mobileBottomBar.setAttribute("aria-hidden", "false");
      ui.mobileHudDock.classList.remove("is-hidden");
      ui.mobileHudDock.setAttribute("aria-hidden", "false");
      return;
    }

    if (ui.statusList.parentNode !== ui.sidePanel) {
      ui.sidePanel.insertBefore(ui.statusList, ui.actionPanel);
    }
    if (ui.resourcePanel.parentNode !== ui.sidePanel) {
      ui.sidePanel.insertBefore(ui.resourcePanel, ui.actionPanel);
    }
    ui.mobileBottomBar.classList.add("is-hidden");
    ui.mobileBottomBar.setAttribute("aria-hidden", "true");
    ui.mobileHudDock.classList.add("is-hidden");
    ui.mobileHudDock.setAttribute("aria-hidden", "true");
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
    ui.btnSkillMenu.textContent = skillMenuOpen ? "收起技能" : "技能";
  }

  function setActionMenu(visible, enabled) {
    if (ui.actionPanel) {
      ui.actionPanel.classList.toggle("is-hidden", !visible);
    }
    ui.actionMenu.classList.toggle("is-hidden", !visible);
    ui.actionMenu.setAttribute("aria-hidden", visible ? "false" : "true");
    if (!visible) {
      skillMenuOpen = false;
    }
    ui.btnBasicAttack.disabled = !enabled;
    ui.btnSkillMenu.disabled = !enabled;
    ui.btnFlee.disabled = !enabled;
    Array.from(ui.skillButtons.querySelectorAll("button")).forEach(function toggle(button) {
      button.disabled = !enabled;
    });
    updateSkillMenuVisibility();
  }

  function syncEnemyPanel(enemy) {
    const enemyView = createEnemyViewModel(enemy);
    if (!enemyView.visible) {
      ui.enemyPanel.classList.add("is-hidden");
      return;
    }
    ui.enemyPanel.classList.remove("is-hidden");
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
    ui.classValue.textContent = hudView.classText;
    ui.stageValue.textContent = hudView.stageText;
    ui.pos.textContent = hudView.positionText;
    ui.classSummary.textContent = hudView.classSummary;
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
    const equippedEntries = player.equipment.map(function mapEquipment(id) {
      const item = SHOP_ITEMS.find(function findItem(entry) {
        return entry.id === id;
      });
      if (!item) {
        return { name: id, meta: "", summary: "未找到装备配置。", details: [] };
      }
      return {
        name: item.name,
        meta: (item.slot || "装备") + " / " + (item.rarity || "普通"),
        summary: item.description,
        details: statBonusLines(item.bonus).concat(item.inspect || []),
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

    const buildView = createBuildCodexViewModel({
      player: player,
      sections: [
        { title: "技能详情", entries: skillEntries.length ? skillEntries : [{ name: "暂无技能", meta: "", summary: "先选择职业后再查看。", details: [] }] },
        { title: "职业专精", entries: specializationEntries.length ? specializationEntries : [{ name: "暂无专精", meta: "", summary: "先选择职业后再查看。", details: [] }] },
        { title: "构筑标签", entries: buildTagEntries.length ? buildTagEntries : [{ name: "暂无标签", meta: "", summary: "当前还没有形成明显的 build 倾向。", details: [] }] },
        { title: "装备详情", entries: equippedEntries.length ? equippedEntries : [{ name: "暂无装备", meta: "", summary: "当前没有已装备物品。", details: [] }] },
        { title: "遗物详情", entries: relicEntries.length ? relicEntries : [{ name: "暂无遗物", meta: "", summary: "还没有获取遗物。", details: [] }] },
        { title: "材料与资源", entries: materialEntries.length ? materialEntries : [{ name: "暂无材料", meta: "", summary: "后续构筑素材会显示在这里。", details: [] }] },
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
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, "#4c0519");
    gradient.addColorStop(1, "#0f172a");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawPortrait("player", 92, 294, 124, "#22d3ee");
    drawPortrait(enemy ? (enemy.assetKey || (enemy.isBoss ? "boss" : "enemy")) : "enemy", canvas.width - 236, 94, 124, "#ef4444");
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 22px Consolas, monospace";
    ctx.fillText(enemy && enemy.isBoss ? "首领战" : enemy && enemy.encounterType === "elite" ? "精英战" : "战斗中", 24, 34);
    ctx.font = "15px Consolas, monospace";
    ctx.fillText((enemy ? enemy.name : "敌人") + "  " + (enemy ? enemy.hp + "/" + enemy.maxHp : ""), 28, 66);
    ctx.fillText(player.name + "  " + player.hp + "/" + player.maxHp, canvas.width - 250, canvas.height - 30);
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
    currentStageContent = generatedStage.contentPools || { eventPoolId: "", relicPoolId: "", dropTableId: "", elitePoolId: "" };

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
    syncStatusPanel();
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

  function buildVictoryChoices(enemy) {
    const encounterType = enemy && enemy.encounterType ? enemy.encounterType : "normal";
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
      resolveDropReward((enemy && enemy.dropTableId) || currentStageContent.dropTableId),
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

  function showVictoryRewardOverlay(enemy, onComplete) {
    const choices = buildVictoryChoices(enemy).map(function mapChoice(choice) {
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

    showOverlay("战后奖励", "挑选一项战利品", "这一战已经结束，从下列奖励中选择一项带走。" + showChoiceButtons(choices), "放弃奖励", function skipReward() {
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

    showOverlay("事件节点", eventNode.name, eventNode.prompt + showChoiceButtons(choices), "稍后再来", hideOverlay);
    bindOverlayChoices(choices);
  }

  function renderSkillButtons() {
    ui.skillButtons.innerHTML = "";
    getResolvedPlayerSkills().filter(function filterSkill(skill) {
      return skill.id !== "attack";
    }).forEach(function renderSkill(skill) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.skillId = skill.id;
      const parts = ["消耗 " + skill.cost + " 法力"];
      if (skill.resourceCost && player.classResource && player.classResource.label) {
        parts.push("消耗 " + skill.resourceCost + " " + player.classResource.shortLabel);
      } else if (skill.resourceGain && player.classResource && player.classResource.label) {
        parts.push("生成 " + skill.resourceGain + " " + player.classResource.shortLabel);
      }
      button.textContent = skill.name + "（" + parts.join(" / ") + "）";
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
          renderSkillButtons();
          syncStatusPanel();
          hideOverlay();
          appendLog("你选择了职业：" + player.className + "。");
        },
      };
    });

    showOverlay("蔚蓝城镇", "选择职业", "不同职业拥有完全不同的技能构筑与战斗节奏。" + showChoiceButtons(choices), "关闭", hideOverlay);
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
      { label: "职业专精（技能树）", onClick: showSpecializationOverviewOverlay },
      { label: "强化攻击（消耗 1 技能点）", onClick: function spendAtk() { handleSpendSkillPoint("attack", "攻击提升。"); } },
      { label: "强化防御（消耗 1 技能点）", onClick: function spendDef() { handleSpendSkillPoint("defense", "防御提升。"); } },
      { label: "强化生命（消耗 1 技能点）", onClick: function spendHp() { handleSpendSkillPoint("maxHp", "生命上限提升。"); } },
      { label: "强化法力（消耗 1 技能点）", onClick: function spendMp() { handleSpendSkillPoint("maxMp", "法力上限提升。"); } },
    ];

    showOverlay("职业导师", "分配成长", "导师会帮你重选职业、分配属性成长，或者沿着职业专精继续深化这套 build。" + showChoiceButtons(choices), "离开", hideOverlay);
    bindOverlayChoices(choices);
  }

  function showMerchantOverlay() {
    const choices = SHOP_ITEMS.map(function mapItem(item) {
      return {
        label: item.name + "（消耗 " + item.cost + " 金币）",
        onClick: function buy() {
          if (buyEquipment(item)) {
            syncStatusPanel();
            hideOverlay();
            appendLog("购买装备：" + item.name + "。");
            return;
          }
          showNotice(
            "交易失败",
            "无法购买",
            player.equipment.includes(item.id) ? "这件装备你已经拥有了，不需要重复购买。" : "你的金币不足，先去刷怪赚些金币再来。",
            "继续查看",
            showMerchantOverlay
          );
        },
      };
    });

    showOverlay("补给商人", "购买装备", "购买更好的装备，让这套职业构筑真正成型。" + showChoiceButtons(choices), "离开", hideOverlay);
    bindOverlayChoices(choices);
  }

  function showGatekeeperOverlay() {
    const choices = progress.availableStages.map(function mapStage(stageId) {
      const meta = getStageMeta(stageId);
      const cleared = progress.clearedBosses[stageId];
      return {
        label: meta.label + (cleared ? "（已通关）" : ""),
        onClick: function travel() {
          hideOverlay();
          startRun(stageId);
          loadStage(stageId);
          appendLog("你前往了 " + meta.label + "。");
        },
      };
    });

    showOverlay("守门人", "选择试炼路线", "每次进入关卡都会重新生成地图、精英和事件节点。清光小怪与精英后，Boss 传送门才会开启。" + showChoiceButtons(choices), "留下", hideOverlay);
    bindOverlayChoices(choices);
  }

  function unlockStage(stageId, logText) {
    if (progress.availableStages.includes(stageId)) {
      return;
    }
    progress.availableStages.push(stageId);
    appendLog(logText);
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
    showOverlay("警告", meta.bossLabel || "Boss 房", "你已经清空当前关卡的小怪，真正的首领战现在开始。", "迎战", function confirmBoss() {
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
            setActionMenu(true, Boolean(snapshot.playerTurn));
            setCombatBanner(true, snapshot.playerTurn ? "你的回合" : "敌方回合");
          } else {
            syncEnemyPanel(null);
            setActionMenu(false, false);
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
            player.gold += payload.enemy.gold || 0;
            runSummary.goldEarned += payload.enemy.gold || 0;
            runSummary.expGained += payload.rewards && payload.rewards.exp ? payload.rewards.exp : 0;
            runSummary.combatsWon += 1;
            if (enemy && enemy.encounterType === "elite") {
              runSummary.elitesDefeated += 1;
            }
            appendLog("获得金币 " + (payload.enemy.gold || 0) + "。");
            unlockPortalIfNeeded();

            showVictoryRewardOverlay(enemy, function afterReward() {
              if (bossWin) {
                progress.clearedBosses[currentStageName] = true;
                runSummary.bossCleared = true;
                const currentStageIndex = STAGE_SEQUENCE.indexOf(currentStageName);
                const nextStage = STAGE_SEQUENCE[currentStageIndex + 1];
                if (nextStage) {
                  unlockStage(nextStage, "你解锁了新区域：" + getStageMeta(nextStage).label + "。");
                  runSummary.unlockedStageLabel = getStageMeta(nextStage).label;
                }
                showRunSummaryOverlay(buildRunSummarySnapshot({
                  outcomeText: "首领击破，成功完成本轮试炼。",
                }), function returnTown() {
                  loadStage("azure_town");
                  setGameState(GAME_STATE.EXPLORE);
                  runSummary = createEmptyRunSummary();
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
    setRelicResolver(findRelicByName);
    canvas.width = 20 * TILE_SIZE;
    canvas.height = 15 * TILE_SIZE;
    bindStaticButtons();
    bindTouchControls();
    syncResponsiveHudLayout();
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
    showClassSelectionOverlay();
  }

  init();
})();
