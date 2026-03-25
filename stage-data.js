(function exposeStageData() {
  const mapApi = window.GameMap || {};
  const TILE = mapApi.TILE || { FLOOR: 0, WALL: 1, PLAYER_START: 2, ENEMY: 3, HEAL_POINT: 4, BOSS: 5, PORTAL: 6, ELITE: 7, EVENT: 8 };
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

  const RELIC_POOLS = {
    verdant_relics: [
      { id: "fang_totem", name: "狼牙图腾", tags: ["bleed", "burst"], rarity: "common" },
      { id: "trail_boots", name: "巡林靴", tags: ["speed", "tempo"], rarity: "common" },
    ],
    archive_relics: [
      { id: "echo_quill", name: "回响羽笔", tags: ["spell", "combo"], rarity: "common" },
      { id: "seal_fragment", name: "封印碎片", tags: ["shield", "control"], rarity: "rare" },
    ],
    ember_relics: [
      { id: "slag_core", name: "炉渣核心", tags: ["burn", "power"], rarity: "common" },
      { id: "tyrant_horn", name: "暴君之角", tags: ["berserk", "risk"], rarity: "rare" },
    ],
  };

  const EVENT_POOLS = {
    verdant_events: [
      {
        id: "hunter_trap",
        name: "猎人陷阱",
        type: "risk_reward",
        weight: 3,
        tags: ["damage", "loot"],
        prompt: "一处被藤蔓遮掩的猎人陷阱卡在古树之间。你可以冒险拆开它，也可以稳妥绕路。",
        choices: [
          {
            label: "拆开陷阱（失去 14 生命，获得金币与材料）",
            effects: [
              { type: "damage", value: 14 },
              { type: "gold", min: 28, max: 40 },
              { type: "material", itemId: "fang_material", label: "狼牙素材", amount: 1 },
            ],
          },
          {
            label: "谨慎绕开（恢复 10 法力）",
            effects: [
              { type: "mp", value: 10 },
            ],
          },
        ],
      },
      {
        id: "spirit_spring",
        name: "林泉祝福",
        type: "recovery",
        weight: 2,
        tags: ["heal", "mana"],
        prompt: "月色落在泉眼上，灵泉泛起淡青色的光。你可以直接饮下，也可以收集泉滴作储备。",
        choices: [
          {
            label: "饮下泉水（恢复生命与法力）",
            effects: [
              { type: "heal", value: 28 },
              { type: "mp", value: 12 },
            ],
          },
          {
            label: "收集泉滴（获得技能点）",
            effects: [
              { type: "skill_point", value: 1 },
            ],
          },
        ],
      },
    ],
    archive_events: [
      {
        id: "sealed_shelf",
        name: "封印书架",
        type: "skill_test",
        weight: 3,
        tags: ["knowledge", "choice"],
        prompt: "书库深处的封印书架仍在嗡鸣。你可以破解封印学习心得，也可以只取走周围散落的补给。",
        choices: [
          {
            label: "破解封印（获得技能点与法力）",
            effects: [
              { type: "skill_point", value: 1 },
              { type: "mp", value: 8 },
            ],
          },
          {
            label: "收集残页（获得金币与墨卷）",
            effects: [
              { type: "gold", min: 24, max: 36 },
              { type: "material", itemId: "ink_scroll", label: "墨卷残页", amount: 1 },
            ],
          },
        ],
      },
      {
        id: "memory_echo",
        name: "残响回廊",
        type: "story",
        weight: 2,
        tags: ["lore", "buff"],
        prompt: "回廊里残留着古代施法者的低语。你可以静听它们的节奏，让自己进入更专注的状态。",
        choices: [
          {
            label: "聆听残响（获得经验与法力）",
            effects: [
              { type: "exp", value: 16 },
              { type: "mp", value: 10 },
            ],
          },
          {
            label: "记录咒痕（法力上限 +4）",
            effects: [
              { type: "stat", stat: "maxMp", amount: 4, label: "咒痕储能" },
            ],
          },
        ],
      },
    ],
    ember_events: [
      {
        id: "molten_shrine",
        name: "熔火祭坛",
        type: "sacrifice",
        weight: 3,
        tags: ["hp_cost", "power"],
        prompt: "裂谷深处的祭坛仍在喷涌余火。只要献上鲜血，就能换来更强的斩杀力量。",
        choices: [
          {
            label: "献上血祭（失去 18 生命，攻击 +2）",
            effects: [
              { type: "damage", value: 18 },
              { type: "stat", stat: "attack", amount: 2, label: "余火狂热" },
            ],
          },
          {
            label: "稳妥取火（获得金币与余烬碎片）",
            effects: [
              { type: "gold", min: 30, max: 44 },
              { type: "material", itemId: "ember_shard", label: "余烬碎片", amount: 1 },
            ],
          },
        ],
      },
      {
        id: "war_drum",
        name: "战鼓余响",
        type: "ambush",
        weight: 2,
        tags: ["elite", "burst"],
        prompt: "旧战鼓仍在岩壁间回响。你可以顺着鼓点逼迫自己进入战斗姿态，也可以趁机收集战场遗物。",
        choices: [
          {
            label: "回应战鼓（失去 10 生命，速度 +1，获得技能点）",
            effects: [
              { type: "damage", value: 10 },
              { type: "stat", stat: "speed", amount: 1, label: "战鼓疾行" },
              { type: "skill_point", value: 1 },
            ],
          },
          {
            label: "搜刮遗物（获得金币与材料）",
            effects: [
              { type: "gold", min: 26, max: 38 },
              { type: "material", itemId: "ember_shard", label: "余烬碎片", amount: 1 },
            ],
          },
        ],
      },
    ],
  };

  const DROP_TABLES = {
    verdant_common: [
      { id: "gold_small", type: "gold", min: 10, max: 18, weight: 5 },
      { id: "fang_material", type: "material", label: "狼牙素材", amount: 1, weight: 3 },
    ],
    verdant_boss: [
      { id: "gold_large", type: "gold", min: 48, max: 72, weight: 5 },
      { id: "relic_pick", type: "relic", poolId: "verdant_relics", weight: 3 },
    ],
    archive_common: [
      { id: "gold_small", type: "gold", min: 12, max: 20, weight: 5 },
      { id: "ink_scroll", type: "material", label: "墨卷残页", amount: 1, weight: 3 },
    ],
    archive_boss: [
      { id: "gold_large", type: "gold", min: 58, max: 84, weight: 5 },
      { id: "relic_pick", type: "relic", poolId: "archive_relics", weight: 3 },
    ],
    ember_common: [
      { id: "gold_small", type: "gold", min: 14, max: 24, weight: 5 },
      { id: "ember_shard", type: "material", label: "余烬碎片", amount: 1, weight: 3 },
    ],
    ember_boss: [
      { id: "gold_large", type: "gold", min: 72, max: 104, weight: 5 },
      { id: "relic_pick", type: "relic", poolId: "ember_relics", weight: 3 },
    ],
  };

  const ELITE_TEMPLATES = {
    verdant_grove: [
      { id: "alpha_stalker", name: "林冠追猎者", hp: 68, attack: 13, defense: 4, speed: 11, exp: 42, gold: 28, role: "swift", encounterType: "elite", assetKey: "grove_enemy", dropTableId: "verdant_common" },
    ],
    sunken_archive: [
      { id: "silent_curator", name: "缄默馆长", hp: 76, attack: 14, defense: 5, speed: 8, exp: 48, gold: 34, role: "caster", encounterType: "elite", assetKey: "archive_enemy", dropTableId: "archive_common" },
    ],
    ember_hollow: [
      { id: "magma_reaver", name: "熔岩收割者", hp: 84, attack: 16, defense: 5, speed: 9, exp: 54, gold: 38, role: "berserker", encounterType: "elite", assetKey: "ember_enemy", dropTableId: "ember_common" },
    ],
  };

  STAGE_META.azure_town.eventPoolId = "";
  STAGE_META.azure_town.relicPoolId = "";
  STAGE_META.azure_town.dropTableId = "";
  STAGE_META.azure_town.elitePoolId = "";
  STAGE_META.azure_town.tempoBias = "safe_hub";
  STAGE_META.azure_town.classPressureTags = [];

  STAGE_META.verdant_grove.eventPoolId = "verdant_events";
  STAGE_META.verdant_grove.relicPoolId = "verdant_relics";
  STAGE_META.verdant_grove.dropTableId = "verdant_common";
  STAGE_META.verdant_grove.bossDropTableId = "verdant_boss";
  STAGE_META.verdant_grove.elitePoolId = "verdant_grove";
  STAGE_META.verdant_grove.tempoBias = "tempo_pressure";
  STAGE_META.verdant_grove.classPressureTags = ["持续输出", "移动压制", "中毒应对"];

  STAGE_META.sunken_archive.eventPoolId = "archive_events";
  STAGE_META.sunken_archive.relicPoolId = "archive_relics";
  STAGE_META.sunken_archive.dropTableId = "archive_common";
  STAGE_META.sunken_archive.bossDropTableId = "archive_boss";
  STAGE_META.sunken_archive.elitePoolId = "sunken_archive";
  STAGE_META.sunken_archive.tempoBias = "control_drag";
  STAGE_META.sunken_archive.classPressureTags = ["爆发窗口", "法力循环", "减速处理"];

  STAGE_META.ember_hollow.eventPoolId = "ember_events";
  STAGE_META.ember_hollow.relicPoolId = "ember_relics";
  STAGE_META.ember_hollow.dropTableId = "ember_common";
  STAGE_META.ember_hollow.bossDropTableId = "ember_boss";
  STAGE_META.ember_hollow.elitePoolId = "ember_hollow";
  STAGE_META.ember_hollow.tempoBias = "high_risk_burst";
  STAGE_META.ember_hollow.classPressureTags = ["高压生存", "斩杀窗口", "持续灼烧"];

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

  function pickWeighted(list) {
    if (!Array.isArray(list) || list.length === 0) {
      return null;
    }
    const totalWeight = list.reduce(function sum(total, item) {
      return total + (item.weight || 1);
    }, 0);
    if (totalWeight <= 0) {
      return list[0];
    }
    let cursor = Math.random() * totalWeight;
    for (let i = 0; i < list.length; i += 1) {
      cursor -= list[i].weight || 1;
      if (cursor <= 0) {
        return list[i];
      }
    }
    return list[list.length - 1];
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
      encounterType: template.encounterType || (template.isBoss ? "boss" : "normal"),
      dropTableId: template.dropTableId || "",
      rewardProfile: template.rewardProfile || "",
      eventHooks: template.eventHooks ? template.eventHooks.slice() : [],
    };
  }

  function createEncounterRuntime(template, stageMeta, options) {
    const encounter = cloneEnemyTemplate(template);
    const settings = options || {};
    encounter.encounterType = settings.encounterType || encounter.encounterType;
    encounter.dropTableId = encounter.dropTableId || (encounter.isBoss ? stageMeta.bossDropTableId : stageMeta.dropTableId) || "";
    encounter.relicPoolId = stageMeta.relicPoolId || "";
    encounter.eventPoolId = stageMeta.eventPoolId || "";
    encounter.rewardProfile = encounter.rewardProfile || (encounter.encounterType === "elite" ? "elite_reward" : "standard_reward");
    return encounter;
  }

  function createEventRuntime(template, stageMeta) {
    return {
      id: template.id,
      name: template.name,
      type: template.type || "event",
      tags: template.tags ? template.tags.slice() : [],
      prompt: template.prompt || "",
      choices: (template.choices || []).map(function mapChoice(choice) {
        return {
          label: choice.label,
          effects: (choice.effects || []).map(function copyEffect(effect) {
            return Object.assign({}, effect);
          }),
        };
      }),
      eventPoolId: stageMeta.eventPoolId || "",
      relicPoolId: stageMeta.relicPoolId || "",
      dropTableId: stageMeta.dropTableId || "",
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

  function chooseNodeSpawns(cells, start, count, blocked, minDistance) {
    const blockedKeys = blocked || {};
    const threshold = minDistance || 4;
    const pool = shuffle(cells.filter(function filterCell(cell) {
      return manhattanDistance(cell, start) >= threshold && !blockedKeys[positionKey(cell.x, cell.y)];
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
    const eventNodes = {};
    const spawnCount = Math.min(randInt(meta.enemyCount[0], meta.enemyCount[1]), floors.length - 3);
    const enemySpawns = chooseEnemySpawns(floors, start, spawnCount, blocked);
    enemySpawns.forEach(function spawnEnemy(cell) {
      mapData[cell.y][cell.x] = TILE.ENEMY;
      encounterPool[positionKey(cell.x, cell.y)] = createEncounterRuntime(pickRandom(meta.enemyRoster), meta, {
        encounterType: "normal",
      });
    });

    const elitePool = ELITE_TEMPLATES[meta.elitePoolId] || [];
    const eliteSpawns = chooseNodeSpawns(floors, start, elitePool.length ? 1 : 0, blocked, 6);
    eliteSpawns.forEach(function spawnElite(cell) {
      mapData[cell.y][cell.x] = TILE.ELITE;
      encounterPool[positionKey(cell.x, cell.y)] = createEncounterRuntime(pickRandom(elitePool), meta, {
        encounterType: "elite",
      });
    });

    const eventPool = EVENT_POOLS[meta.eventPoolId] || [];
    const eventTarget = Math.min(eventPool.length, randInt(1, Math.min(2, Math.max(1, eventPool.length))));
    const eventSpawns = chooseNodeSpawns(floors, start, eventTarget, blocked, 3);
    eventSpawns.forEach(function spawnEvent(cell) {
      const eventTemplate = pickWeighted(eventPool);
      if (!eventTemplate) {
        return;
      }
      mapData[cell.y][cell.x] = TILE.EVENT;
      eventNodes[positionKey(cell.x, cell.y)] = createEventRuntime(eventTemplate, meta);
    });

    mapData[start.y][start.x] = TILE.PLAYER_START;
    return {
      map: mapData,
      start: start,
      portalPos: portalPos,
      encounters: encounterPool,
      events: eventNodes,
      contentPools: {
        eventPoolId: meta.eventPoolId || "",
        relicPoolId: meta.relicPoolId || "",
        dropTableId: meta.dropTableId || "",
        elitePoolId: meta.elitePoolId || "",
      },
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
    encounterPool[positionKey(bossPos.x, bossPos.y)] = createEncounterRuntime(meta.boss, meta, {
      encounterType: "boss",
    });

    return {
      map: mapData,
      start: start,
      portalPos: null,
      encounters: encounterPool,
      events: {},
      contentPools: {
        eventPoolId: meta.eventPoolId || "",
        relicPoolId: meta.relicPoolId || "",
        dropTableId: meta.bossDropTableId || meta.dropTableId || "",
        elitePoolId: meta.elitePoolId || "",
      },
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
        events: {},
        portalPos: null,
        contentPools: {
          eventPoolId: "",
          relicPoolId: "",
          dropTableId: "",
          elitePoolId: "",
        },
      };
    }
    return settings.mode === "boss" ? generateBossStage(stageName) : generateFieldStage(stageName);
  }

  window.GameStageData = {
    RELIC_POOLS: RELIC_POOLS,
    EVENT_POOLS: EVENT_POOLS,
    DROP_TABLES: DROP_TABLES,
    ELITE_TEMPLATES: ELITE_TEMPLATES,
    STAGE_MAPS: STAGE_MAPS,
    STAGE_META: STAGE_META,
    STAGE_SEQUENCE: STAGE_SEQUENCE,
    SHOP_ITEMS: SHOP_ITEMS,
    cloneMap: cloneMap,
    positionKey: positionKey,
    getStageMeta: getStageMeta,
    createStageProgress: createStageProgress,
    createStageInstance: createStageInstance,
    createEncounterRuntime: createEncounterRuntime,
    createEventRuntime: createEventRuntime,
  };
})();
