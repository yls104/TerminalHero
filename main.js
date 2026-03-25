(function bootstrap() {
  const GAME_STATE = {
    EXPLORE: "EXPLORE_STATE",
    COMBAT: "COMBAT_STATE",
    BOSS_INTRO: "BOSS_INTRO_STATE",
    PORTAL_TRANSIT: "PORTAL_TRANSIT_STATE",
    GAME_OVER: "GAME_OVER_STATE",
  };

  const STAGE_MAPS = {
    azure_town: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [1, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 6, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ],
  };

  const STAGE_META = {
    azure_town: {
      label: "蔚蓝城镇",
      description: "职业选择、成长分配与补给休整的安全区域。",
      npcs: [
        { id: "mentor", x: 4, y: 3, label: "职业导师" },
        { id: "merchant", x: 13, y: 3, label: "商人" },
        { id: "gatekeeper", x: 17, y: 2, label: "守门人" },
      ],
      houses: [
        { x: 2, y: 2 },
        { x: 11, y: 2 },
        { x: 6, y: 7 },
      ],
    },
    verdant_grove: {
      label: "青藤密林",
      bossLabel: "狼王巢穴",
      description: "地形会在林地中随机生长，敌人偏向突袭与中毒。",
      bossDescription: "只有扫清林地里的小怪，狼王巢穴才会开放。",
      assetTheme: "verdant_grove",
      floorTarget: [84, 108],
      enemyCount: [5, 7],
      enemyRoster: [
        { id: "mossfang", name: "苔牙狼", hp: 34, attack: 7, defense: 2, speed: 9, exp: 18, gold: 14, role: "swift", assetKey: "grove_enemy" },
        { id: "thorn_viper", name: "棘藤蛇", hp: 30, attack: 6, defense: 1, speed: 8, exp: 19, gold: 15, role: "poisoner", assetKey: "grove_enemy" },
        { id: "root_guard", name: "树根卫士", hp: 42, attack: 8, defense: 4, speed: 5, exp: 23, gold: 17, role: "guardian", assetKey: "grove_enemy" },
      ],
      boss: { id: "thorn_alpha", name: "棘冠狼王", hp: 132, attack: 15, defense: 5, speed: 11, exp: 92, gold: 72, isBoss: true, role: "pack_alpha", assetKey: "grove_boss" },
    },
    sunken_archive: {
      label: "沉没书库",
      bossLabel: "封印藏室",
      description: "断墙和走廊会随机重组，敌人偏向法术骚扰与拖节奏。",
      bossDescription: "清掉书库守卫后，通往封印藏室的法阵才会出现。",
      assetTheme: "sunken_archive",
      floorTarget: [78, 102],
      enemyCount: [6, 8],
      enemyRoster: [
        { id: "ink_wisp", name: "墨雾灯灵", hp: 32, attack: 8, defense: 2, speed: 8, exp: 24, gold: 18, role: "caster", assetKey: "archive_enemy" },
        { id: "archive_guard", name: "石库守卫", hp: 44, attack: 9, defense: 5, speed: 4, exp: 26, gold: 20, role: "guardian", assetKey: "archive_enemy" },
        { id: "quill_hunter", name: "羽笔猎手", hp: 36, attack: 10, defense: 2, speed: 7, exp: 25, gold: 19, role: "swift", assetKey: "archive_enemy" },
      ],
      boss: { id: "seal_warden", name: "封印典狱官", hp: 148, attack: 16, defense: 6, speed: 8, exp: 108, gold: 86, isBoss: true, role: "arcane_warden", assetKey: "archive_boss" },
    },
    ember_hollow: {
      label: "余烬裂谷",
      bossLabel: "熔核祭坛",
      description: "炽热地脉会在每次进入时改变路线，怪物伤害更高更凶。",
      bossDescription: "只有扫平裂谷里的余烬军团，熔核祭坛的大门才会开启。",
      assetTheme: "ember_hollow",
      floorTarget: [74, 96],
      enemyCount: [7, 9],
      enemyRoster: [
        { id: "ash_raider", name: "炽袭者", hp: 40, attack: 11, defense: 2, speed: 8, exp: 29, gold: 22, role: "berserker", assetKey: "ember_enemy" },
        { id: "cinder_mage", name: "余火术士", hp: 34, attack: 12, defense: 2, speed: 7, exp: 31, gold: 24, role: "caster", assetKey: "ember_enemy" },
        { id: "slag_guard", name: "炉渣守卫", hp: 52, attack: 10, defense: 6, speed: 4, exp: 33, gold: 26, role: "guardian", assetKey: "ember_enemy" },
      ],
      boss: { id: "ember_tyrant", name: "熔焰暴君", hp: 172, attack: 18, defense: 7, speed: 9, exp: 126, gold: 104, isBoss: true, role: "inferno_tyrant", assetKey: "ember_boss" },
    },
  };

  const STAGE_SEQUENCE = ["verdant_grove", "sunken_archive", "ember_hollow"];

  const SHOP_ITEMS = [
    { id: "iron_blade", name: "铁刃护手", cost: 42, bonus: { attack: 3 }, description: "提高稳定输出。" },
    { id: "guard_mail", name: "守备胸甲", cost: 48, bonus: { defense: 2, maxHp: 12 }, description: "提升生存能力。" },
    { id: "aether_band", name: "以太指环", cost: 44, bonus: { maxMp: 12, speed: 1 }, description: "提升法力循环。" },
  ];

  const PLAYER_MOVE_DURATION = 112;
  const TILE = (window.GameMap && window.GameMap.TILE) || { FLOOR: 0, WALL: 1, PLAYER_START: 2, ENEMY: 3, HEAL_POINT: 4, BOSS: 5, PORTAL: 6 };
  const entitiesApi = window.GameEntities || {};
  const mapApi = window.GameMap || {};
  const combatApi = window.CombatSystem || {};

  const player = entitiesApi.player;
  const classes = entitiesApi.classes || {};
  const skills = entitiesApi.skills || {};
  const applyClassToPlayer = entitiesApi.applyClassToPlayer || function noop() { return false; };
  const unlockClassSkillIfNeeded = entitiesApi.unlockClassSkillIfNeeded || function noSkill() { return null; };
  const getPlayerSkills = entitiesApi.getPlayerSkills || function emptySkills() { return []; };
  const spendSkillPoint = entitiesApi.spendSkillPoint || function noSpend() { return false; };
  const buyEquipment = entitiesApi.buyEquipment || function noBuy() { return false; };

  const canvas = document.querySelector("#gameCanvas");
  if (!canvas) {
    return;
  }
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return;
  }

  const TILE_SIZE = mapApi.TILE_SIZE || 32;
  const drawMap = mapApi.drawMap;
  const loadMapAssets = mapApi.loadMapAssets || function noopAssets() { return Promise.resolve([]); };
  const getMapAsset = mapApi.getMapAsset || function missingAsset() { return null; };

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
    touchControls: document.querySelector("#touchControls"),
    touchMoveButtons: Array.from(document.querySelectorAll(".touch-move")),
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

  const progress = {
    availableStages: [STAGE_SEQUENCE[0]],
    clearedBosses: {},
  };

  let gameState = GAME_STATE.EXPLORE;
  let currentStageName = "azure_town";
  let currentStageMode = "town";
  let currentMap = [];
  let currentPortalPos = null;
  let currentEncounterPool = {};
  let renderPosition = { x: 1, y: 1 };
  let overlayAction = null;
  let combatSnapshot = null;
  let encounterPos = null;
  let bossIntroTimeout = 0;
  let lastFrameTime = 0;
  let preferredMoveKey = "";
  let skillMenuOpen = false;
  const heldKeys = {};
  const movementState = { active: false, elapsed: 0, duration: PLAYER_MOVE_DURATION, fromX: 1, fromY: 1, toX: 1, toY: 1 };

  function cloneMap(mapData) {
    return mapData.map(function copyRow(row) {
      return row.slice();
    });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function toPercent(current, max) {
    if (!max || max <= 0) {
      return 0;
    }
    return clamp((current / max) * 100, 0, 100);
  }

  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pickRandom(list) {
    return list[randInt(0, list.length - 1)];
  }

  function shuffle(list) {
    const clone = list.slice();
    for (let i = clone.length - 1; i > 0; i -= 1) {
      const swapIndex = randInt(0, i);
      const temp = clone[i];
      clone[i] = clone[swapIndex];
      clone[swapIndex] = temp;
    }
    return clone;
  }

  function positionKey(x, y) {
    return x + "," + y;
  }

  function cloneEnemyTemplate(template) {
    return {
      id: template.id,
      name: template.name,
      hp: template.hp,
      attack: template.attack,
      defense: template.defense,
      speed: template.speed,
      exp: template.exp,
      gold: template.gold,
      isBoss: Boolean(template.isBoss),
      role: template.role || "basic",
      skills: template.skills ? template.skills.slice() : [],
      assetKey: template.assetKey || (template.isBoss ? "boss" : "enemy"),
    };
  }

  function getStageMeta(stageName) {
    return STAGE_META[stageName] || STAGE_META.azure_town;
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

  function createSolidMap() {
    const map = [];
    for (let y = 0; y < mapApi.MAP_ROWS; y += 1) {
      const row = [];
      for (let x = 0; x < mapApi.MAP_COLS; x += 1) {
        row.push(TILE.WALL);
      }
      map.push(row);
    }
    return map;
  }

  function carveBrush(mapData, centerX, centerY, radius) {
    let carved = 0;
    for (let y = Math.max(1, centerY - radius); y <= Math.min(mapData.length - 2, centerY + radius); y += 1) {
      for (let x = Math.max(1, centerX - radius); x <= Math.min(mapData[0].length - 2, centerX + radius); x += 1) {
        if (Math.abs(x - centerX) + Math.abs(y - centerY) > radius + 1) {
          continue;
        }
        if (mapData[y][x] === TILE.WALL) {
          mapData[y][x] = TILE.FLOOR;
          carved += 1;
        }
      }
    }
    return carved;
  }

  function collectFloorCells(mapData) {
    const cells = [];
    for (let y = 1; y < mapData.length - 1; y += 1) {
      for (let x = 1; x < mapData[y].length - 1; x += 1) {
        if (mapData[y][x] === TILE.FLOOR) {
          cells.push({ x: x, y: y });
        }
      }
    }
    return cells;
  }

  function manhattanDistance(a, b) {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  function chooseDistantFloor(cells, start, blocked) {
    const blockedKeys = blocked || {};
    const candidates = cells
      .filter(function filterCell(cell) {
        return !blockedKeys[positionKey(cell.x, cell.y)];
      })
      .sort(function sortByDistance(a, b) {
        return manhattanDistance(b, start) - manhattanDistance(a, start);
      });
    return candidates[0] || null;
  }

  function chooseEnemySpawns(cells, start, count, blocked) {
    const blockedKeys = blocked || {};
    const pool = shuffle(cells.filter(function filterCell(cell) {
      return manhattanDistance(cell, start) >= 4 && !blockedKeys[positionKey(cell.x, cell.y)];
    }));
    const picks = [];
    for (let i = 0; i < pool.length && picks.length < count; i += 1) {
      const cell = pool[i];
      const tooClose = picks.some(function compare(other) {
        return manhattanDistance(other, cell) <= 2;
      });
      if (tooClose) {
        continue;
      }
      picks.push(cell);
      blockedKeys[positionKey(cell.x, cell.y)] = true;
    }
    return picks;
  }

  function generateFieldStage(stageName) {
    const meta = getStageMeta(stageName);
    const mapData = createSolidMap();
    const start = { x: 1, y: 1 };
    let walker = { x: 1, y: 1 };
    let carved = carveBrush(mapData, walker.x, walker.y, 1);
    const carveTarget = randInt(meta.floorTarget[0], meta.floorTarget[1]);
    let steps = 0;

    while (carved < carveTarget && steps < 4200) {
      const directions = shuffle([
        { dx: 1, dy: 0 },
        { dx: -1, dy: 0 },
        { dx: 0, dy: 1 },
        { dx: 0, dy: -1 },
      ]);
      const direction = directions[0];
      walker.x = clamp(walker.x + direction.dx, 1, mapApi.MAP_COLS - 2);
      walker.y = clamp(walker.y + direction.dy, 1, mapApi.MAP_ROWS - 2);
      carved += carveBrush(mapData, walker.x, walker.y, Math.random() < 0.22 ? 1 : 0);
      steps += 1;
    }

    const floors = collectFloorCells(mapData);
    const blocked = {};
    blocked[positionKey(start.x, start.y)] = true;

    const healPos = chooseDistantFloor(floors, start, blocked);
    if (healPos) {
      mapData[healPos.y][healPos.x] = TILE.HEAL_POINT;
      blocked[positionKey(healPos.x, healPos.y)] = true;
    }

    const portalPos = chooseDistantFloor(floors, start, blocked);
    if (portalPos) {
      blocked[positionKey(portalPos.x, portalPos.y)] = true;
    }

    const encounterPool = {};
    const spawnCount = Math.min(randInt(meta.enemyCount[0], meta.enemyCount[1]), floors.length - 3);
    const enemySpawns = chooseEnemySpawns(floors, start, spawnCount, blocked);
    enemySpawns.forEach(function spawnEnemy(cell) {
      mapData[cell.y][cell.x] = TILE.ENEMY;
      encounterPool[positionKey(cell.x, cell.y)] = cloneEnemyTemplate(pickRandom(meta.enemyRoster));
    });

    mapData[start.y][start.x] = TILE.PLAYER_START;
    return {
      map: mapData,
      start: start,
      portalPos: portalPos,
      encounters: encounterPool,
    };
  }

  function generateBossStage(stageName) {
    const meta = getStageMeta(stageName);
    const mapData = createSolidMap();
    for (let y = 1; y < mapApi.MAP_ROWS - 1; y += 1) {
      for (let x = 1; x < mapApi.MAP_COLS - 1; x += 1) {
        mapData[y][x] = TILE.FLOOR;
      }
    }

    const pillarSets = {
      verdant_grove: [{ x: 8, y: 4 }, { x: 8, y: 10 }, { x: 12, y: 4 }, { x: 12, y: 10 }],
      sunken_archive: [{ x: 6, y: 4 }, { x: 6, y: 10 }, { x: 13, y: 4 }, { x: 13, y: 10 }],
      ember_hollow: [{ x: 7, y: 5 }, { x: 7, y: 9 }, { x: 12, y: 5 }, { x: 12, y: 9 }],
    };
    (pillarSets[stageName] || []).forEach(function placePillar(pillar) {
      mapData[pillar.y][pillar.x] = TILE.WALL;
    });

    const start = { x: 2, y: Math.floor(mapApi.MAP_ROWS / 2) };
    const healPos = { x: 4, y: Math.floor(mapApi.MAP_ROWS / 2) };
    const bossPos = { x: mapApi.MAP_COLS - 4, y: Math.floor(mapApi.MAP_ROWS / 2) };
    mapData[start.y][start.x] = TILE.PLAYER_START;
    mapData[healPos.y][healPos.x] = TILE.HEAL_POINT;
    mapData[bossPos.y][bossPos.x] = TILE.BOSS;

    const encounterPool = {};
    encounterPool[positionKey(bossPos.x, bossPos.y)] = cloneEnemyTemplate(meta.boss);

    return {
      map: mapData,
      start: start,
      portalPos: null,
      encounters: encounterPool,
    };
  }

  function appendLog(message) {
    if (!ui.battleLog) {
      return;
    }
    const line = document.createElement("p");
    line.textContent = message;
    ui.battleLog.appendChild(line);
    ui.battleLog.scrollTop = ui.battleLog.scrollHeight;
  }

  function syncTouchMoveButtons() {
    ui.touchMoveButtons.forEach(function syncButton(button) {
      const key = button.dataset.moveKey || "";
      button.classList.toggle("is-pressed", Boolean(heldKeys[key]));
    });
  }

  function clearHeldMoveKeys() {
    Object.keys(heldKeys).forEach(function clearKey(key) {
      heldKeys[key] = false;
    });
    preferredMoveKey = "";
    syncTouchMoveButtons();
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
    if (pressed && !movementState.active && gameState === GAME_STATE.EXPLORE && !isOverlayVisible()) {
      beginMove(movementByKey[key]);
    }
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
    showOverlay(eyebrow, title, text, buttonLabel || "鎴戠煡閬撲簡", action || hideOverlay);
  }

  function hideOverlay() {
    ui.sceneOverlay.classList.add("is-hidden");
    overlayAction = null;
    clearHeldMoveKeys();
  }

  function isOverlayVisible() {
    return !ui.sceneOverlay.classList.contains("is-hidden");
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
    if (!ui.touchControls) {
      return;
    }
    ui.touchControls.classList.toggle("is-hidden", !visible);
    ui.touchControls.setAttribute("aria-hidden", visible ? "false" : "true");
    if (!visible) {
      clearHeldMoveKeys();
    }
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

  function updateSkillMenuVisibility() {
    ui.skillButtons.classList.toggle("is-hidden", !skillMenuOpen);
    ui.btnSkillMenu.textContent = skillMenuOpen ? "收起技能" : "技能";
  }

  function syncEnemyPanel(enemy) {
    if (!enemy) {
      ui.enemyPanel.classList.add("is-hidden");
      return;
    }
    ui.enemyPanel.classList.remove("is-hidden");
    ui.enemyName.textContent = enemy.name;
    ui.enemyHpText.textContent = enemy.hp + " / " + enemy.maxHp;
    ui.enemyHpBar.style.width = toPercent(enemy.hp, enemy.maxHp) + "%";
  }

  function syncStatusPanel() {
    ui.hp.textContent = player.hp + " / " + player.maxHp;
    ui.mp.textContent = player.mp + " / " + player.maxMp;
    if (ui.classValue) {
      ui.classValue.textContent = "职业：" + (player.className || "-");
    }
    if (ui.stageValue) {
      ui.stageValue.textContent = "区域：" + getCurrentStageLabel();
    }
    if (ui.gold) {
      ui.gold.textContent = String(player.gold);
    }
    if (ui.skillPoints) {
      ui.skillPoints.textContent = String(player.skillPoints);
    }
    ui.classSummary.textContent = player.className
      ? player.className + "，当前位于 " + getCurrentStageLabel() + "。" + getCurrentStageDescription()
      : "在城镇中选择职业，确认你这轮的成长路线。";
    ui.level.textContent = String(player.level);
    ui.exp.textContent = player.exp + " / " + player.expToNext;
    if (ui.pos) {
      ui.pos.textContent = "坐标：(" + player.position.x + ", " + player.position.y + ")";
    }
    ui.hpBar.style.width = toPercent(player.hp, player.maxHp) + "%";
    ui.mpBar.style.width = toPercent(player.mp, player.maxMp) + "%";
    ui.expBar.style.width = toPercent(player.exp, player.expToNext) + "%";
    Array.from(ui.skillButtons.querySelectorAll("button")).forEach(function updateButton(button) {
      const skill = skills[button.dataset.skillId];
      button.disabled = !skill || player.mp < skill.cost || gameState !== GAME_STATE.COMBAT;
    });
  }

  function showDetailStatsOverlay() {
    const equippedNames = player.equipment.length > 0
      ? player.equipment.map(function mapEquipment(id) {
          const item = SHOP_ITEMS.find(function findItem(entry) {
            return entry.id === id;
          });
          return item ? item.name : id;
        }).join("、")
      : "暂无";
    const learnedSkills = getPlayerSkills().map(function mapSkill(skill) {
      return skill.name;
    }).join("、") || "暂无";
    const detailHtml = [
      "<div class=\"detail-stats\">",
      "<p><strong>姓名：</strong>" + player.name + "</p>",
      "<p><strong>职业：</strong>" + (player.className || "未选择") + "</p>",
      "<p><strong>职业特性：</strong>" + (player.classDescription || "尚未选择职业") + "</p>",
      "<p><strong>区域：</strong>" + getCurrentStageLabel() + "</p>",
      "<p><strong>等级：</strong>Lv." + player.level + "</p>",
      "<p><strong>生命：</strong>" + player.hp + " / " + player.maxHp + "</p>",
      "<p><strong>法力：</strong>" + player.mp + " / " + player.maxMp + "</p>",
      "<p><strong>经验：</strong>" + player.exp + " / " + player.expToNext + "</p>",
      "<p><strong>攻击：</strong>" + player.attack + "</p>",
      "<p><strong>防御：</strong>" + player.defense + "</p>",
      "<p><strong>速度：</strong>" + player.speed + "</p>",
      "<p><strong>金币：</strong>" + player.gold + "</p>",
      "<p><strong>技能点：</strong>" + player.skillPoints + "</p>",
      "<p><strong>坐标：</strong>(" + player.position.x + ", " + player.position.y + ")</p>",
      "<p><strong>已学技能：</strong>" + learnedSkills + "</p>",
      "<p><strong>已装备：</strong>" + equippedNames + "</p>",
      "<p><strong>终极技：</strong>" + (player.learnedUltimate ? "已解锁" : "尚未解锁") + "</p>",
      "</div>",
    ].join("");
    showOverlay("详细属性", player.className || "冒险者信息", detailHtml, "关闭", hideOverlay);
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
    const meta = STAGE_META.azure_town;
    const npcImage = getMapAsset("npc");
    const houseImage = getMapAsset("house");
    meta.houses.forEach(function drawHouse(house) {
      if (houseImage && houseImage.complete) {
        ctx.drawImage(houseImage, house.x * TILE_SIZE - 8, house.y * TILE_SIZE - 8, 64, 64);
      }
    });
    meta.npcs.forEach(function drawNpc(npc) {
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
    ctx.fillText(enemy && enemy.isBoss ? "首领战" : "战斗中", 24, 34);
    ctx.font = "15px Consolas, monospace";
    ctx.fillText((enemy ? enemy.name : "鏁屼汉") + "  " + (enemy ? enemy.hp + "/" + enemy.maxHp : ""), 28, 66);
    ctx.fillText(player.name + "  " + player.hp + "/" + player.maxHp, canvas.width - 250, canvas.height - 30);
  }

  function easeOutCubic(value) {
    return 1 - Math.pow(1 - value, 3);
  }

  function loadStage(stageName, options) {
    const settings = options || {};
    const generatedStage = stageName === "azure_town"
      ? { map: cloneMap(STAGE_MAPS.azure_town), encounters: {}, portalPos: null }
      : (settings.mode === "boss" ? generateBossStage(stageName) : generateFieldStage(stageName));

    currentStageName = stageName;
    currentStageMode = stageName === "azure_town" ? "town" : (settings.mode === "boss" ? "boss" : "field");
    currentMap = generatedStage.map;
    currentPortalPos = generatedStage.portalPos || null;
    currentEncounterPool = generatedStage.encounters || {};

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

  function renderSkillButtons() {
    ui.skillButtons.innerHTML = "";
    getPlayerSkills().filter(function filterSkill(skill) {
      return skill.id !== "attack";
    }).forEach(function renderSkill(skill) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.skillId = skill.id;
      button.textContent = skill.name + "（消耗 " + skill.cost + " 法力）";
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
      { label: "强化攻击（消耗 1 技能点）", onClick: function spendAtk() { handleSpendSkillPoint("attack", "攻击提升。") ; } },
      { label: "强化防御（消耗 1 技能点）", onClick: function spendDef() { handleSpendSkillPoint("defense", "防御提升。") ; } },
      { label: "强化生命（消耗 1 技能点）", onClick: function spendHp() { handleSpendSkillPoint("maxHp", "生命上限提升。") ; } },
      { label: "强化法力（消耗 1 技能点）", onClick: function spendMp() { handleSpendSkillPoint("maxMp", "法力上限提升。") ; } },
    ];
    showOverlay("职业导师", "分配成长", "导师会帮你重选职业，或者把技能点投入到属性成长上。" + showChoiceButtons(choices), "离开", hideOverlay);
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
          showNotice("交易失败", "无法购买", player.equipment.includes(item.id) ? "这件装备你已经拥有了，不需要重复购买。" : "你的金币不足，先去刷怪赚些金币再来。", "继续查看", showMerchantOverlay);
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
          loadStage(stageId);
          appendLog("你前往了 " + meta.label + "。");
        },
      };
    });
    showOverlay("守门人", "选择试炼路线", "每次进入关卡都会重新生成地图与怪物，清光小怪后才会开启 Boss 传送门。" + showChoiceButtons(choices), "留下", hideOverlay);
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
    if (countTiles(TILE.ENEMY) > 0 || currentMap[currentPortalPos.y][currentPortalPos.x] === TILE.PORTAL) {
      return;
    }
    currentMap[currentPortalPos.y][currentPortalPos.x] = TILE.PORTAL;
    appendLog("区域小怪已清理完毕，Boss 传送门开启。");
  }

  function beginBossIntro(x, y) {
    const meta = getStageMeta(currentStageName);
    encounterPos = { x: x, y: y };
    gameState = GAME_STATE.BOSS_INTRO;
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
    const npcs = STAGE_META.azure_town.npcs;
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
    if (tile === TILE.ENEMY) {
      encounterPos = { x: x, y: y };
      if (combatController) {
        combatController.startCombat({
          tile: TILE.ENEMY,
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
      if (gameState === GAME_STATE.EXPLORE && !isOverlayVisible()) {
        const heldVector = getHeldMoveVector();
        if (heldVector) {
          beginMove(heldVector);
        }
      }
    }
  }

  function onLevelUp() {
    player.skillPoints += 1;
    const unlocked = unlockClassSkillIfNeeded();
    if (unlocked && skills[unlocked]) {
      appendLog("你掌握了新技能：" + skills[unlocked].name + "。");
    }
    renderSkillButtons();
    syncStatusPanel();
  }

  function onActionButton(actionName) {
    if (!combatController || gameState !== GAME_STATE.COMBAT) {
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
      if (gameState !== GAME_STATE.COMBAT) {
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
    ui.touchMoveButtons.forEach(function bindTouchButton(button) {
      const key = button.dataset.moveKey || "";
      if (!movementByKey[key]) {
        return;
      }

      function press(event) {
        event.preventDefault();
        if (typeof button.setPointerCapture === "function") {
          button.setPointerCapture(event.pointerId);
        }
        setHeldMoveState(key, true);
      }

      function release(event) {
        event.preventDefault();
        if (typeof button.releasePointerCapture === "function" && button.hasPointerCapture && button.hasPointerCapture(event.pointerId)) {
          button.releasePointerCapture(event.pointerId);
        }
        setHeldMoveState(key, false);
      }

      button.addEventListener("pointerdown", press);
      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("pointerleave", release);
      button.addEventListener("contextmenu", function preventMenu(event) {
        event.preventDefault();
      });
      button.addEventListener("selectstart", function preventSelection(event) {
        event.preventDefault();
      });
      button.addEventListener("dragstart", function preventDrag(event) {
        event.preventDefault();
      });
    });

    window.addEventListener("blur", clearHeldMoveKeys);
    document.addEventListener("visibilitychange", function onVisibilityChange() {
      if (document.hidden) {
        clearHeldMoveKeys();
      }
    });
  }

  function handleMoveInput(event) {
    if (isOverlayVisible()) {
      return;
    }
    if (gameState !== GAME_STATE.EXPLORE) {
      return;
    }
    const rawKey = event.key || "";
    const key = rawKey.length === 1 ? rawKey.toLowerCase() : rawKey;
    const vector = movementByKey[key];
    if (!vector) {
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

  const combatController = combatApi.createCombatController
    ? combatApi.createCombatController({
        player: player,
        skills: skills,
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
            gameState = GAME_STATE.COMBAT;
            setExploreControlsVisible(false);
            syncEnemyPanel(snapshot.enemy);
            setActionMenu(true, Boolean(snapshot.playerTurn));
            setCombatBanner(true, snapshot.playerTurn ? "你的回合" : "敌方回合");
          } else {
            syncEnemyPanel(null);
            setActionMenu(false, false);
            setCombatBanner(false, "");
            if (gameState !== GAME_STATE.GAME_OVER) {
              gameState = GAME_STATE.EXPLORE;
              setExploreControlsVisible(true);
            } else {
              setExploreControlsVisible(false);
            }
          }
        },
        onCombatEnd: function onCombatEnd(payload) {
          const result = payload.result;
          const bossWin = Boolean(payload.enemy && payload.enemy.isBoss);
          if (result === "victory") {
            if (encounterPos) {
              currentMap[encounterPos.y][encounterPos.x] = TILE.FLOOR;
              delete currentEncounterPool[positionKey(encounterPos.x, encounterPos.y)];
            }
            player.gold += payload.enemy.gold || 0;
            appendLog("获得金币 " + (payload.enemy.gold || 0) + "。");
            unlockPortalIfNeeded();
            if (bossWin) {
              progress.clearedBosses[currentStageName] = true;
              const currentStageIndex = STAGE_SEQUENCE.indexOf(currentStageName);
              const nextStage = STAGE_SEQUENCE[currentStageIndex + 1];
              if (nextStage) {
                unlockStage(nextStage, "你解锁了新区域：" + getStageMeta(nextStage).label + "。");
              }
              showOverlay("首领击破", "凯旋而归", "首领已被击败。现在你会返回城镇进行补给、成长和下一轮挑战。", "返回城镇", function returnTown() {
                hideOverlay();
                loadStage("azure_town");
                gameState = GAME_STATE.EXPLORE;
              });
            } else {
              showOverlay("战斗胜利", "继续推进", "这一战让你的职业构筑更扎实了。继续推进，或者回城补给。", "继续", function resume() {
                hideOverlay();
                gameState = GAME_STATE.EXPLORE;
              });
            }
          } else if (result === "flee") {
            appendLog("你撤离了当前战斗。");
            gameState = GAME_STATE.EXPLORE;
          } else if (result === "defeat") {
            gameState = GAME_STATE.GAME_OVER;
            setExploreControlsVisible(false);
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

    if (gameState === GAME_STATE.COMBAT || gameState === GAME_STATE.GAME_OVER) {
      drawCombatView();
    } else if (typeof drawMap === "function") {
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
