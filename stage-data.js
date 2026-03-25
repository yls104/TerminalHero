(function exposeStageData() {
  const mapApi = window.GameMap || {};
  const TILE = mapApi.TILE || { FLOOR: 0, WALL: 1, PLAYER_START: 2, ENEMY: 3, HEAL_POINT: 4, BOSS: 5, PORTAL: 6 };
  const MAP_COLS = mapApi.MAP_COLS || 20;
  const MAP_ROWS = mapApi.MAP_ROWS || 15;

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

  function cloneMap(mapData) {
    return mapData.map(function copyRow(row) {
      return row.slice();
    });
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
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

  function createSolidMap() {
    const map = [];
    for (let y = 0; y < MAP_ROWS; y += 1) {
      const row = [];
      for (let x = 0; x < MAP_COLS; x += 1) {
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
      walker.x = clamp(walker.x + direction.dx, 1, MAP_COLS - 2);
      walker.y = clamp(walker.y + direction.dy, 1, MAP_ROWS - 2);
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
    for (let y = 1; y < MAP_ROWS - 1; y += 1) {
      for (let x = 1; x < MAP_COLS - 1; x += 1) {
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

    const start = { x: 2, y: Math.floor(MAP_ROWS / 2) };
    const healPos = { x: 4, y: Math.floor(MAP_ROWS / 2) };
    const bossPos = { x: MAP_COLS - 4, y: Math.floor(MAP_ROWS / 2) };
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

  function createStageProgress() {
    return {
      availableStages: [STAGE_SEQUENCE[0]],
      clearedBosses: {},
    };
  }

  function createStageInstance(stageName, options) {
    const settings = options || {};
    if (stageName === "azure_town") {
      return {
        map: cloneMap(STAGE_MAPS.azure_town),
        encounters: {},
        portalPos: null,
      };
    }
    return settings.mode === "boss" ? generateBossStage(stageName) : generateFieldStage(stageName);
  }

  window.GameStageData = {
    STAGE_MAPS: STAGE_MAPS,
    STAGE_META: STAGE_META,
    STAGE_SEQUENCE: STAGE_SEQUENCE,
    SHOP_ITEMS: SHOP_ITEMS,
    cloneMap: cloneMap,
    positionKey: positionKey,
    getStageMeta: getStageMeta,
    createStageProgress: createStageProgress,
    createStageInstance: createStageInstance,
  };
})();
