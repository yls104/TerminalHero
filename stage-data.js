(function exposeStageData() {
  const mapApi = window.GameMap || {};
  const TILE = mapApi.TILE || { FLOOR: 0, WALL: 1, PLAYER_START: 2, ENEMY: 3, HEAL_POINT: 4, BOSS: 5, PORTAL: 6, ELITE: 7, EVENT: 8 };
  const MAP_COLS = mapApi.MAP_COLS || 20;
  const MAP_ROWS = mapApi.MAP_ROWS || 15;
  const ENDLESS_TRIAL_STAGE_ID = "abyss_corridor";

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
      bossDescription: "狼王巢穴的传送门会直接显现，你可以随时决定先清场还是直面首领。",
      assetTheme: "verdant_grove",
      layoutProfile: "grove_clearings",
      routeLabel: "开阔林间与多岔清剿",
      pressureLabel: "高机动突袭 / 中毒消耗",
      rewardLabel: "遗物与机动型构筑材料",
      floorTarget: [84, 108],
      enemyCount: [5, 7],
      eventCountRange: [2, 3],
      eliteCount: 1,
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
      bossDescription: "通往封印藏室的法阵会直接显现，你可以先闯首领，也可以先处理守卫。",
      assetTheme: "sunken_archive",
      layoutProfile: "archive_corridors",
      routeLabel: "回廊接房间 / 视野压迫",
      pressureLabel: "控场拖节奏 / 法力消耗",
      rewardLabel: "法术联动与稳态资源",
      floorTarget: [78, 102],
      enemyCount: [6, 8],
      eventCountRange: [2, 2],
      eliteCount: 1,
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
      bossDescription: "熔核祭坛的大门会直接开启，你可以自由决定何时挑战暴君。",
      assetTheme: "ember_hollow",
      layoutProfile: "ember_chokepoints",
      routeLabel: "主脉冲锋 / 狭路决战",
      pressureLabel: "高压伤害 / 精英夹击",
      rewardLabel: "高风险高收益材料与爆发遗物",
      floorTarget: [74, 96],
      enemyCount: [7, 9],
      eventCountRange: [1, 2],
      eliteCount: 2,
      enemyRoster: [
        { id: "ash_raider", name: "炽袭者", hp: 40, attack: 11, defense: 2, speed: 8, exp: 29, gold: 22, role: "berserker", assetKey: "ember_enemy" },
        { id: "cinder_mage", name: "余火术士", hp: 34, attack: 12, defense: 2, speed: 7, exp: 31, gold: 24, role: "caster", assetKey: "ember_enemy" },
        { id: "slag_guard", name: "炉渣守卫", hp: 52, attack: 10, defense: 6, speed: 4, exp: 33, gold: 26, role: "guardian", assetKey: "ember_enemy" },
      ],
      boss: { id: "ember_tyrant", name: "熔焰暴君", hp: 172, attack: 18, defense: 7, speed: 9, exp: 126, gold: 104, isBoss: true, role: "inferno_tyrant", assetKey: "ember_boss" },
    },
    abyss_corridor: {
      label: "无尽回廊",
      bossLabel: "回廊首领层",
      description: "构筑成型后的极限挑战模式。每层只保留最核心的战斗和补给节点，让你持续把 build 推向更深处。",
      bossDescription: "每逢首领层，回廊会把当前主题区域的首领机制推到更高强度。击破后可以继续冲层，也可以立刻见好就收。",
      assetTheme: "verdant_grove",
      routeLabel: "单战层推进 / 每 5 层首领考核",
      pressureLabel: "逐层成长 / 不断抬升数值与压制",
      rewardLabel: "纪录刷新 / 传承印记沉淀",
      floorTarget: [0, 0],
      enemyCount: [0, 0],
      eventCountRange: [0, 0],
      eliteCount: 0,
      enemyRoster: [],
      boss: null,
    },
  };

  const STAGE_SEQUENCE = ["verdant_grove", "sunken_archive", "ember_hollow"];

  const CORRIDOR_AFFIX_CATALOG = {
    tempo_pressure: {
      id: "tempo_pressure",
      name: "抢轴压迫",
      shortLabel: "抢轴压迫",
      tier: "基础词缀",
      family: "timeline_pressure",
      targetScope: "enemy_team",
      triggerTiming: "battle_open",
      mechanicAxis: ["时间轴", "先手", "节奏压迫"],
      effectPayload: {
        timeline: {
          enemyStartAvBonus: 8,
          enemySpeedRatio: 0.08,
        },
      },
      ui: {
        summary: "敌方更容易抢到开局节奏。",
        briefing: "本层敌人会以更激进的时间轴优势开局，拖节奏的代价会更高。",
        inspect: [
          "作用对象：敌方单位",
          "触发时机：战斗开场",
          "机制方向：时间轴 / 抢轴",
          "后续原型阶段会把该词缀正式接入 AV 与先手结算。",
        ],
      },
    },
    resilience_regen: {
      id: "resilience_regen",
      name: "韧性再生",
      shortLabel: "韧性再生",
      tier: "基础词缀",
      family: "poise_regen",
      targetScope: "enemy_team",
      triggerTiming: "turn_cycle",
      mechanicAxis: ["韧性", "打断", "拖节奏惩罚"],
      effectPayload: {
        pressure: {
          poiseRegenRatio: 0.18,
          regenTurnInterval: 2,
        },
      },
      ui: {
        summary: "敌方会周期性恢复部分韧性。",
        briefing: "如果你不能尽快打穿韧性，本层敌人的抗压能力会在战斗中持续回弹。",
        inspect: [
          "作用对象：敌方单位",
          "触发时机：战斗轮转阶段",
          "机制方向：韧性回复 / 打断惩罚",
          "后续原型阶段会把该词缀正式接入压制轴恢复逻辑。",
        ],
      },
    },
    execution_dead_zone: {
      id: "execution_dead_zone",
      name: "处决禁区",
      shortLabel: "处决禁区",
      tier: "高压词缀",
      family: "execution_window",
      targetScope: "player_vs_boss",
      triggerTiming: "execution_window",
      mechanicAxis: ["处决", "爆发窗口", "首领考核"],
      effectPayload: {
        execution: {
          offWindowRatio: 0.55,
          favoredWindow: "stagger_only",
        },
      },
      ui: {
        summary: "错误时机会显著降低处决收益。",
        briefing: "首领层会压缩你的爆发容错，只有真正踩准处决窗口才值得交出高价值技能。",
        inspect: [
          "作用对象：玩家对首领的处决收益",
          "触发时机：处决与爆发结算阶段",
          "机制方向：窗口考题 / 首领压力",
          "后续原型阶段会把该词缀正式接入处决收益修正。",
        ],
      },
    },
  };

  const CORRIDOR_FLOOR_AFFIX_RULES = {
    normal: {
      floorType: "normal",
      label: "试炼层规则",
      selectionMode: "single_pressure",
      selectionProfile: { base: 1, max: 1 },
      poolIds: ["tempo_pressure", "resilience_regen"],
      requiredIds: [],
      summary: "普通层只挂接 1 个基础压力词缀，用于稳定测试构筑的基础适应能力。",
    },
    elite: {
      floorType: "elite",
      label: "精英层规则",
      selectionMode: "stacked_pressure",
      selectionProfile: { base: 1, bonusFromFloor: 9, max: 2 },
      poolIds: ["tempo_pressure", "resilience_regen"],
      requiredIds: [],
      summary: "精英层会在高层追加第二个词缀，把节奏干扰和压制压力叠上来。",
    },
    boss: {
      floorType: "boss",
      label: "首领层规则",
      selectionMode: "execution_exam",
      selectionProfile: { base: 2, bonusFromFloor: 15, max: 3 },
      poolIds: ["tempo_pressure", "resilience_regen", "execution_dead_zone"],
      requiredIds: ["execution_dead_zone"],
      summary: "首领层默认叠加 2 个词缀，并强制包含首领考核词缀，避免只剩纯数值放大。",
    },
  };

  const CHAPTERS = [
    { id: 1, label: "第一章：林地试炼", stageId: "verdant_grove", requiredRenown: 0, summary: "从青藤密林开始，学会在高机动和中毒压力里建立自己的第一套节奏。" },
    { id: 2, label: "第二章：书库回响", stageId: "sunken_archive", requiredRenown: 2, summary: "深入沉没书库，在控场和法力消耗中磨出更完整的 build。" },
    { id: 3, label: "第三章：余烬终局", stageId: "ember_hollow", requiredRenown: 4, summary: "在余烬裂谷迎接最终高压，检验整套构筑是否真正成型。" },
  ];

  function getChapterByStageId(stageId) {
    return CHAPTERS.find(function findChapter(chapter) {
      return chapter.stageId === stageId;
    }) || null;
  }

  const SHOP_ITEMS = [
    {
      id: "iron_blade",
      name: "铁刃护手",
      slot: "武器",
      tags: ["burst", "tempo"],
      rarity: "普通",
      cost: 42,
      bonus: { attack: 2 },
      growthBonus: { attack: 1 },
      maxLevel: 3,
      description: "提高稳定输出。",
      inspect: ["基础攻击 +2", "适合依赖稳定普攻与技能补刀的构筑。"],
      affixPool: [
        {
          id: "keen",
          name: "锋锐",
          rarity: "精良",
          tags: ["burst", "execute"],
          bonus: { attack: 1 },
          inspect: ["词条：攻击 +1", "更适合爆发和终结路线。"],
          synergies: [{ matchAnyTags: ["爆发", "终结", "处决"], changes: { power: 0.1 }, inspectNote: "装备词条联动：爆发/终结类技能伤害倍率提高。" }],
        },
        {
          id: "tempo",
          name: "追击",
          rarity: "精良",
          tags: ["tempo", "combo"],
          bonus: { speed: 1 },
          inspect: ["词条：速度 +1", "更适合连段与拉扯构筑。"],
          synergies: [{ matchAnyTags: ["稳定输出", "循环", "连击"], changes: { cost: -1 }, inspectNote: "装备词条联动：循环与连段技能法力消耗降低 1。" }],
        },
      ],
      upgradeCosts: [
        { gold: 28, materials: { "狼牙素材": 1 } },
        { gold: 44, materials: { "余烬碎片": 1 } },
      ],
    },
    {
      id: "guard_mail",
      name: "守备胸甲",
      slot: "护甲",
      tags: ["guard", "survive"],
      rarity: "普通",
      cost: 48,
      bonus: { defense: 1, maxHp: 8 },
      growthBonus: { defense: 1, maxHp: 4 },
      maxLevel: 3,
      description: "提升生存能力。",
      inspect: ["基础防御 +1", "基础生命上限 +8", "适合需要站场换输出窗口的构筑。"],
      affixPool: [
        {
          id: "warded",
          name: "壁垒",
          rarity: "精良",
          tags: ["guard", "sanctuary"],
          bonus: { defense: 1, maxHp: 4 },
          inspect: ["词条：防御 +1", "词条：生命上限 +4", "偏向稳态推进。"],
          synergies: [{ matchAnyTags: ["防守", "庇护"], changes: { guard: 0.12 }, inspectNote: "装备词条联动：防守与庇护技能减伤提高。" }],
        },
        {
          id: "vital",
          name: "复苏",
          rarity: "精良",
          tags: ["survive", "heal"],
          bonus: { maxHp: 8, maxMp: 4 },
          inspect: ["词条：生命上限 +8", "词条：法力上限 +4", "偏向续航恢复。"],
          synergies: [{ matchAnyTags: ["恢复", "续航"], changes: { power: -0.12 }, inspectNote: "装备词条联动：恢复类技能治疗倍率提高。" }],
        },
      ],
      upgradeCosts: [
        { gold: 30, materials: { "狼牙素材": 1 } },
        { gold: 46, materials: { "墨卷残页": 1 } },
      ],
    },
    {
      id: "aether_band",
      name: "以太指环",
      slot: "饰品",
      tags: ["spell", "combo"],
      rarity: "普通",
      cost: 44,
      bonus: { maxMp: 8, speed: 1 },
      growthBonus: { maxMp: 4, attack: 1 },
      maxLevel: 3,
      description: "提升法力循环。",
      inspect: ["基础法力上限 +8", "基础速度 +1", "适合法术循环与高频技能构筑。"],
      affixPool: [
        {
          id: "echoing",
          name: "回响",
          rarity: "精良",
          tags: ["spell", "burst"],
          bonus: { maxMp: 4, attack: 1 },
          inspect: ["词条：法力上限 +4", "词条：攻击 +1", "偏向法术爆发。"],
          synergies: [{ matchAnyTags: ["magic", "爆发", "惩戒"], changes: { power: 0.1 }, inspectNote: "装备词条联动：法术与惩戒类技能伤害倍率提高。" }],
        },
        {
          id: "flowing",
          name: "流转",
          rarity: "精良",
          tags: ["combo", "tempo"],
          bonus: { maxMp: 4, speed: 1 },
          inspect: ["词条：法力上限 +4", "词条：速度 +1", "偏向循环与连段。"],
          synergies: [{ matchAnyTags: ["循环", "控场", "连击"], changes: { cost: -1 }, inspectNote: "装备词条联动：循环与控场技能法力消耗降低 1。" }],
        },
      ],
      upgradeCosts: [
        { gold: 26, materials: { "墨卷残页": 1 } },
        { gold: 42, materials: { "余烬碎片": 1 } },
      ],
    },
  ];

  const TOWN_UPGRADES = {
    training_ground: {
      id: "training_ground",
      name: "训练场扩建",
      maxLevel: 3,
      costs: [2, 4, 6],
      summary: "永久提高所有职业的生命上限。",
      effectText: "每级生命上限 +10",
    },
    arcane_archive: {
      id: "arcane_archive",
      name: "奥术档案",
      maxLevel: 3,
      costs: [2, 4, 6],
      summary: "永久提高所有职业的法力上限。",
      effectText: "每级法力上限 +6",
    },
    supply_caravan: {
      id: "supply_caravan",
      name: "补给车队",
      maxLevel: 3,
      costs: [2, 5, 8],
      summary: "精英与 Boss 胜利时获得更多金币。",
      effectText: "每级精英额外 +6 金币，Boss 额外 +18 金币",
    },
  };

  let equipmentInstanceSeed = 1;

  function cloneValue(value) {
    if (Array.isArray(value)) {
      return value.map(cloneValue);
    }
    if (value && typeof value === "object") {
      const clone = {};
      Object.keys(value).forEach(function eachKey(key) {
        clone[key] = cloneValue(value[key]);
      });
      return clone;
    }
    return value;
  }

  function mergeBonusPackages(list) {
    const merged = {};
    (list || []).forEach(function eachBonus(bonus) {
      if (!bonus || typeof bonus !== "object") {
        return;
      }
      Object.keys(bonus).forEach(function eachKey(key) {
        merged[key] = (merged[key] || 0) + (bonus[key] || 0);
      });
    });
    return merged;
  }

  function scaleBonusPackage(baseBonus, growthBonus, level) {
    const scaled = {};
    const bonus = baseBonus || {};
    const growth = growthBonus || {};
    Object.keys(bonus).forEach(function eachKey(key) {
      scaled[key] = bonus[key];
    });
    const growthLevel = Math.max(0, (level || 1) - 1);
    Object.keys(growth).forEach(function eachKey(key) {
      scaled[key] = (scaled[key] || 0) + growth[key] * growthLevel;
    });
    return scaled;
  }

  function formatBonusText(bonus) {
    const labelMap = {
      attack: "攻击",
      defense: "防御",
      maxHp: "生命上限",
      maxMp: "法力上限",
      speed: "速度",
    };
    return Object.keys(bonus || {}).map(function mapKey(key) {
      const amount = bonus[key] || 0;
      const sign = amount > 0 ? "+" : "";
      return (labelMap[key] || key) + " " + sign + amount;
    });
  }

  function formatMaterialCost(materials) {
    return Object.keys(materials || {}).map(function mapMaterial(name) {
      return name + " x" + materials[name];
    }).join("，");
  }

  function buildEquipmentInspect(instance) {
    const lines = [];
    lines.push("等级：" + instance.level + " / " + instance.maxLevel);
    if (instance.affixName) {
      lines.push("词条：" + instance.affixName);
    }
    formatBonusText(instance.bonus).forEach(function eachLine(line) {
      lines.push(line);
    });
    (instance.baseInspect || []).forEach(function eachBaseLine(line) {
      lines.push(line);
    });
    (instance.affixInspect || []).forEach(function eachAffixLine(line) {
      lines.push(line);
    });
    if (instance.level < instance.maxLevel) {
      const nextGrowth = formatBonusText(instance.growthBonus || {});
      if (nextGrowth.length) {
        lines.push("下一级成长：" + nextGrowth.join("，"));
      }
      if (instance.upgradeCost) {
        lines.push("强化消耗：" + instance.upgradeCost.gold + " 金币" + (formatMaterialCost(instance.upgradeCost.materials) ? "，" + formatMaterialCost(instance.upgradeCost.materials) : ""));
      }
    } else {
      lines.push("已达到最大强化等级。");
    }
    return lines;
  }

  function finalizeEquipmentInstance(instance) {
    const level = instance.level || 1;
    const scaledBase = scaleBonusPackage(instance.baseBonus, instance.growthBonus, level);
    instance.bonus = mergeBonusPackages([scaledBase, instance.affixBonus]);
    instance.upgradeCost = level < instance.maxLevel ? cloneValue((instance.upgradeCosts || [])[level - 1] || null) : null;
    instance.inspect = buildEquipmentInspect(instance);
    return instance;
  }

  function createEquipmentOffer(template) {
    if (!template) {
      return null;
    }
    const affixPool = template.affixPool || [];
    const affix = affixPool.length ? cloneValue(pickRandom(affixPool)) : null;
    const instance = {
      instanceId: "equip_" + equipmentInstanceSeed,
      baseId: template.id,
      name: affix ? (template.name + "·" + affix.name) : template.name,
      slot: template.slot || "装备",
      rarity: affix && affix.rarity ? affix.rarity : (template.rarity || "普通"),
      cost: template.cost || 0,
      level: 1,
      maxLevel: template.maxLevel || 1,
      description: template.description || "",
      tags: []
        .concat(template.tags || [])
        .concat(affix && affix.tags ? affix.tags : [])
        .filter(function filterTag(tag, index, list) {
          return tag && list.indexOf(tag) === index;
        }),
      baseBonus: cloneValue(template.bonus || {}),
      growthBonus: cloneValue(template.growthBonus || {}),
      affixBonus: cloneValue(affix && affix.bonus ? affix.bonus : {}),
      affixId: affix ? affix.id : "",
      affixName: affix ? affix.name : "",
      baseInspect: cloneValue(template.inspect || []),
      affixInspect: cloneValue(affix && affix.inspect ? affix.inspect : []),
      synergies: cloneValue(affix && affix.synergies ? affix.synergies : []),
      upgradeCosts: cloneValue(template.upgradeCosts || []),
    };
    equipmentInstanceSeed += 1;
    return finalizeEquipmentInstance(instance);
  }

  function upgradeEquipmentInstance(instance) {
    if (!instance) {
      return null;
    }
    const nextInstance = cloneValue(instance);
    if ((nextInstance.level || 1) >= (nextInstance.maxLevel || 1)) {
      return finalizeEquipmentInstance(nextInstance);
    }
    nextInstance.level += 1;
    return finalizeEquipmentInstance(nextInstance);
  }

  const RELIC_POOLS = {
    verdant_relics: [
      { id: "fang_totem", name: "狼牙图腾", tags: ["burst", "execute"], rarity: "common", bonus: { attack: 1 }, summary: "攻击 +1，强化终结倾向。", synergies: [{ matchAnyTags: ["爆发", "终结", "斩杀"], changes: { power: 0.18 }, inspectNote: "遗物联动：爆发/终结类技能伤害倍率提高。" }], inspect: ["攻击 +1", "适合偏爆发和斩杀的 build。", "联动：爆发 / 终结 / 斩杀标签技能伤害倍率 +18%。"] },
      { id: "trail_boots", name: "巡林靴", tags: ["tempo", "sustain"], rarity: "common", bonus: { speed: 1, maxMp: 4 }, summary: "速度 +1，法力上限 +4。", synergies: [{ matchAnyTags: ["持续伤害", "控场", "续航"], changes: { cost: -1 }, inspectNote: "遗物联动：拉扯与续航技能的法力消耗降低 1。" }], inspect: ["速度 +1", "法力上限 +4", "适合拉扯与频繁出手构筑。", "联动：持续伤害 / 控场 / 续航标签技能法力消耗 -1。"] },
      { id: "wolf_fang_badge", name: "破阵狼徽", tags: ["interrupt", "pressure"], rarity: "rare", bonus: { attack: 1, speed: 1 }, summary: "攻击 +1，速度 +1。更适合围绕打断蓄力与压制窗口出手。", synergies: [{ matchAnyTags: ["打断", "反蓄力", "压制"], changes: { bonusVsChargingRatio: 0.16, poiseBonusVsCharging: 2, poiseDamage: 1 }, inspectNote: "遗物联动：打断/压制类技能对蓄力目标更强，韧性削减提高。" }], inspect: ["攻击 +1", "速度 +1", "适合主动寻找打断窗口的构筑。", "联动：打断 / 反蓄力 / 压制标签技能获得蓄力特攻，并额外削减韧性。"] },
      { id: "moon_hunt_clasp", name: "逐月猎扣", tags: ["execute", "tempo"], rarity: "rare", bonus: { speed: 1, maxHp: 6 }, summary: "速度 +1，生命上限 +6。更适合顺着失衡窗口收尾。", synergies: [{ matchAnyTags: ["处决", "斩杀", "终结"], changes: { bonusVsBrokenRatio: 0.18, breakBonusDamageRatio: 0.1, advanceSelf: 4 }, inspectNote: "遗物联动：处决类技能对失衡目标的收益更高，并更容易顺势抢轴。" }], inspect: ["速度 +1", "生命上限 +6", "适合围绕失衡窗口连续追击。", "联动：处决 / 斩杀 / 终结标签技能处决收益提高，并额外获得抢轴。"] },
    ],
    archive_relics: [
      { id: "echo_quill", name: "回响羽笔", tags: ["spell", "combo"], rarity: "common", bonus: { attack: 1, maxMp: 6 }, summary: "攻击 +1，法力上限 +6。", synergies: [{ matchAnyTags: ["循环", "爆发", "惩戒"], changes: { power: 0.16 }, inspectNote: "遗物联动：法术输出与惩戒类技能伤害倍率提高。" }], inspect: ["攻击 +1", "法力上限 +6", "适合法术爆发与技能连段构筑。", "联动：循环 / 爆发 / 惩戒标签技能伤害倍率 +16%。"] },
      { id: "seal_fragment", name: "封印碎片", tags: ["guard", "control"], rarity: "rare", bonus: { defense: 1, maxHp: 8 }, summary: "防御 +1，生命上限 +8。", synergies: [{ matchAnyTags: ["防守", "庇护"], changes: { guard: 0.12 }, inspectNote: "遗物联动：防守与庇护技能的减伤提高。" }, { matchAnyTags: ["恢复"], changes: { power: -0.12 }, inspectNote: "遗物联动：恢复类技能的治疗倍率提高。" }], inspect: ["防御 +1", "生命上限 +8", "适合需要稳住节奏的防守型构筑。", "联动：防守 / 庇护标签技能减伤提高，恢复标签技能治疗倍率提高。"] },
      { id: "time_locked_ink", name: "时锁墨滴", tags: ["tempo", "combo"], rarity: "rare", bonus: { maxMp: 6, speed: 1 }, summary: "法力上限 +6，速度 +1。让循环型 build 更容易抢轴。", synergies: [{ matchAnyTags: ["抢轴", "循环", "连击"], changes: { advanceSelf: 6, cost: -1 }, inspectNote: "遗物联动：抢轴/循环类技能更快衔接，且法力消耗降低 1。" }], inspect: ["法力上限 +6", "速度 +1", "适合频繁出手与连段法术构筑。", "联动：抢轴 / 循环 / 连击标签技能额外抢轴，并降低法力消耗。"] },
      { id: "warden_glyph", name: "典狱刻印", tags: ["interrupt", "control"], rarity: "epic", bonus: { defense: 1, maxMp: 4 }, summary: "防御 +1，法力上限 +4。专门强化蓄力打断与控场压制。", synergies: [{ matchAnyTags: ["打断", "反蓄力", "控场"], changes: { poiseDamage: 2, delayTarget: 4, bonusVsChargingRatio: 0.12 }, inspectNote: "遗物联动：打断/控场技能的韧性削减和压制能力提高。" }], inspect: ["防御 +1", "法力上限 +4", "适合围绕打断和控场建立节奏优势。", "联动：打断 / 反蓄力 / 控场标签技能韧性削减提高、压后更强，并获得蓄力特攻。"] },
    ],
    ember_relics: [
      { id: "slag_core", name: "炉渣核心", tags: ["power", "tempo"], rarity: "common", bonus: { attack: 2, maxHp: 6 }, summary: "攻击 +2，生命上限 +6。", synergies: [{ matchAnyTags: ["爆发", "压迫", "稳定输出"], changes: { power: 0.14 }, inspectNote: "遗物联动：高压输出技能伤害倍率提高。" }], inspect: ["攻击 +2", "生命上限 +6", "适合高压输出构筑。", "联动：爆发 / 压迫 / 稳定输出标签技能伤害倍率 +14%。"] },
      { id: "tyrant_horn", name: "暴君之角", tags: ["risk", "execute"], rarity: "rare", bonus: { attack: 3, defense: -1 }, summary: "攻击 +3，防御 -1。", synergies: [{ matchAnyTags: ["终结", "斩杀", "处决"], changes: { power: 0.26, resourceCost: -1 }, inspectNote: "遗物联动：终结类技能更强，且职业资源消耗降低 1。" }], inspect: ["攻击 +3", "防御 -1", "高风险高回报的极端爆发遗物。", "联动：终结 / 斩杀 / 处决标签技能伤害倍率 +26%，职业资源消耗 -1。"] },
      { id: "crucible_spike", name: "熔压棱刺", tags: ["pressure", "power"], rarity: "rare", bonus: { attack: 2, defense: 1 }, summary: "攻击 +2，防御 +1。让高压技能更容易击穿韧性。", synergies: [{ matchAnyTags: ["压迫", "爆发", "稳定输出"], changes: { poiseDamage: 2, delayTarget: 3 }, inspectNote: "遗物联动：高压技能会造成更高韧性削减并追加压后。" }], inspect: ["攻击 +2", "防御 +1", "适合正面压制型 build。", "联动：压迫 / 爆发 / 稳定输出标签技能额外削减韧性，并小幅压后目标。"] },
      { id: "execution_crown", name: "处刑王冠", tags: ["execute", "risk"], rarity: "epic", bonus: { attack: 2, maxHp: 10 }, summary: "攻击 +2，生命上限 +10。把失衡窗口的收益推到极致。", synergies: [{ matchAnyTags: ["处决", "终结", "斩杀"], changes: { bonusVsBrokenRatio: 0.22, breakBonusDamageRatio: 0.12, resourceCost: -1 }, inspectNote: "遗物联动：处决/终结类技能在失衡窗口中更致命，且职业资源消耗降低 1。" }], inspect: ["攻击 +2", "生命上限 +10", "适合围绕失衡处决打造极限收尾构筑。", "联动：处决 / 终结 / 斩杀标签技能处决收益提高，职业资源消耗 -1。"] },
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
      {
        id: "predator_tracks",
        name: "掠食踪迹",
        type: "hunt",
        weight: 2,
        tags: ["pressure", "loot"],
        prompt: "泥地上留着新鲜的兽爪痕迹。你可以顺着踪迹主动狩猎，也可以布下诱饵稳稳回收战利品。",
        choices: [
          {
            label: "主动追猎（失去 12 生命，攻击 +1，获得狼牙素材）",
            effects: [
              { type: "damage", value: 12 },
              { type: "stat", stat: "attack", amount: 1, label: "林间追猎" },
              { type: "material", itemId: "fang_material", label: "狼牙素材", amount: 1 },
            ],
          },
          {
            label: "布下诱饵（恢复生命并获得金币）",
            effects: [
              { type: "heal", value: 20 },
              { type: "gold", min: 18, max: 28 },
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
      {
        id: "quiet_scriptorium",
        name: "静默抄写间",
        type: "study",
        weight: 2,
        tags: ["resource", "relic"],
        prompt: "一间尚未完全坍塌的抄写间藏着旧时代的术式页。你可以潜心研读，也可以拆解书架里的封印部件。",
        choices: [
          {
            label: "研读术式（经验 +18，法力上限 +4）",
            effects: [
              { type: "exp", value: 18 },
              { type: "stat", stat: "maxMp", amount: 4, label: "抄写间感悟" },
            ],
          },
          {
            label: "拆解封印（获得遗物或金币补偿）",
            effects: [
              { type: "relic", poolId: "archive_relics" },
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
      {
        id: "slag_cache",
        name: "炉渣军械堆",
        type: "armory",
        weight: 2,
        tags: ["power", "materials"],
        prompt: "崩塌的军械堆里还埋着烧红的锻材。你可以冒险撬开它们，也可以就地借火淬炼兵器。",
        choices: [
          {
            label: "撬开军械堆（失去 10 生命，获得金币与余烬碎片）",
            effects: [
              { type: "damage", value: 10 },
              { type: "gold", min: 28, max: 42 },
              { type: "material", itemId: "ember_shard", label: "余烬碎片", amount: 1 },
            ],
          },
          {
            label: "借火淬兵（攻击 +1，恢复 12 法力）",
            effects: [
              { type: "stat", stat: "attack", amount: 1, label: "余火淬炼" },
              { type: "mp", value: 12 },
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
    verdant_elite: [
      { id: "gold_mid", type: "gold", min: 20, max: 32, weight: 4 },
      { id: "fang_material", type: "material", label: "狼牙素材", amount: 1, weight: 4 },
      { id: "fang_bundle", type: "material", label: "狼牙素材", amount: 2, weight: 2 },
      { id: "grove_relic_pick", type: "relic", poolId: "verdant_relics", weight: 2 },
    ],
    verdant_boss: [
      { id: "gold_large", type: "gold", min: 48, max: 72, weight: 5 },
      { id: "relic_pick", type: "relic", poolId: "verdant_relics", weight: 3 },
      { id: "fang_bundle_boss", type: "material", label: "狼牙素材", amount: 2, weight: 2 },
    ],
    archive_common: [
      { id: "gold_small", type: "gold", min: 12, max: 20, weight: 5 },
      { id: "ink_scroll", type: "material", label: "墨卷残页", amount: 1, weight: 3 },
    ],
    archive_elite: [
      { id: "gold_mid", type: "gold", min: 22, max: 34, weight: 4 },
      { id: "ink_scroll", type: "material", label: "墨卷残页", amount: 1, weight: 4 },
      { id: "ink_bundle", type: "material", label: "墨卷残页", amount: 2, weight: 2 },
      { id: "archive_relic_pick", type: "relic", poolId: "archive_relics", weight: 2 },
    ],
    archive_boss: [
      { id: "gold_large", type: "gold", min: 58, max: 84, weight: 5 },
      { id: "relic_pick", type: "relic", poolId: "archive_relics", weight: 3 },
      { id: "ink_bundle_boss", type: "material", label: "墨卷残页", amount: 2, weight: 2 },
    ],
    ember_common: [
      { id: "gold_small", type: "gold", min: 14, max: 24, weight: 5 },
      { id: "ember_shard", type: "material", label: "余烬碎片", amount: 1, weight: 3 },
    ],
    ember_elite: [
      { id: "gold_mid", type: "gold", min: 24, max: 38, weight: 4 },
      { id: "ember_shard", type: "material", label: "余烬碎片", amount: 1, weight: 4 },
      { id: "ember_bundle", type: "material", label: "余烬碎片", amount: 2, weight: 2 },
      { id: "ember_relic_pick", type: "relic", poolId: "ember_relics", weight: 2 },
    ],
    ember_boss: [
      { id: "gold_large", type: "gold", min: 72, max: 104, weight: 5 },
      { id: "relic_pick", type: "relic", poolId: "ember_relics", weight: 3 },
      { id: "ember_bundle_boss", type: "material", label: "余烬碎片", amount: 2, weight: 2 },
    ],
  };

  const REWARD_PROFILES = {
    verdant_grove: {
      normal: [
        { label: "林间补给（恢复 22 生命 / 12 法力）", effects: [{ type: "heal", value: 22 }, { type: "mp", value: 12 }] },
        { label: "追猎步调（速度 +1）", effects: [{ type: "stat", stat: "speed", amount: 1, label: "追猎步调" }] },
        { useDropTable: true },
      ],
      elite: [
        { label: "猎团战术（+1 技能点，攻击 +1）", effects: [{ type: "skill_point", value: 1 }, { type: "stat", stat: "attack", amount: 1, label: "猎团战术" }] },
        { label: "林泉回稳（恢复 30 生命 / 16 法力）", effects: [{ type: "heal", value: 30 }, { type: "mp", value: 16 }] },
        { useDropTable: true, dropTableId: "verdant_elite" },
      ],
      boss: [
        { label: "狼王遗产（获得遗物）", effects: [{ type: "relic", poolId: "verdant_relics" }] },
        { label: "荒野成长（+1 技能点，速度 +1，生命上限 +8）", effects: [{ type: "skill_point", value: 1 }, { type: "stat", stat: "speed", amount: 1, label: "荒野成长" }, { type: "stat", stat: "maxHp", amount: 8, label: "狼王余韵" }] },
        { useDropTable: true, dropTableId: "verdant_boss" },
      ],
    },
    sunken_archive: {
      normal: [
        { label: "奥术回补（恢复 18 法力，获得 12 经验）", effects: [{ type: "mp", value: 18 }, { type: "exp", value: 12 }] },
        { label: "抄录心得（法力上限 +4）", effects: [{ type: "stat", stat: "maxMp", amount: 4, label: "抄录心得" }] },
        { useDropTable: true },
      ],
      elite: [
        { label: "封印解析（+1 技能点，法力上限 +4）", effects: [{ type: "skill_point", value: 1 }, { type: "stat", stat: "maxMp", amount: 4, label: "封印解析" }] },
        { label: "回响灌注（恢复 18 法力，攻击 +1）", effects: [{ type: "mp", value: 18 }, { type: "stat", stat: "attack", amount: 1, label: "回响灌注" }] },
        { useDropTable: true, dropTableId: "archive_elite" },
      ],
      boss: [
        { label: "禁书馈赠（获得遗物）", effects: [{ type: "relic", poolId: "archive_relics" }] },
        { label: "书库契机（+1 技能点，法力上限 +6，获得 20 经验）", effects: [{ type: "skill_point", value: 1 }, { type: "stat", stat: "maxMp", amount: 6, label: "书库契机" }, { type: "exp", value: 20 }] },
        { useDropTable: true, dropTableId: "archive_boss" },
      ],
    },
    ember_hollow: {
      normal: [
        { label: "余火狂热（攻击 +1）", effects: [{ type: "stat", stat: "attack", amount: 1, label: "余火狂热" }] },
        { label: "焦炉补给（恢复 24 生命 / 8 法力）", effects: [{ type: "heal", value: 24 }, { type: "mp", value: 8 }] },
        { useDropTable: true },
      ],
      elite: [
        { label: "裂谷压制（+1 技能点，攻击 +1）", effects: [{ type: "skill_point", value: 1 }, { type: "stat", stat: "attack", amount: 1, label: "裂谷压制" }] },
        { label: "熔渣淬炼（生命上限 +8，恢复 10 法力）", effects: [{ type: "stat", stat: "maxHp", amount: 8, label: "熔渣淬炼" }, { type: "mp", value: 10 }] },
        { useDropTable: true, dropTableId: "ember_elite" },
      ],
      boss: [
        { label: "暴君战利（获得遗物）", effects: [{ type: "relic", poolId: "ember_relics" }] },
        { label: "熔核蜕变（+1 技能点，攻击 +2，生命上限 +6）", effects: [{ type: "skill_point", value: 1 }, { type: "stat", stat: "attack", amount: 2, label: "熔核蜕变" }, { type: "stat", stat: "maxHp", amount: 6, label: "暴君余焰" }] },
        { useDropTable: true, dropTableId: "ember_boss" },
      ],
    },
  };

  const ELITE_TEMPLATES = {
    verdant_grove: [
      { id: "alpha_stalker", name: "林冠追猎者", hp: 68, attack: 13, defense: 4, speed: 11, exp: 42, gold: 28, role: "swift", encounterType: "elite", assetKey: "grove_enemy", dropTableId: "verdant_elite" },
      { id: "venom_matriarch", name: "毒沼兽母", hp: 74, attack: 12, defense: 4, speed: 9, exp: 46, gold: 30, role: "stalker", encounterType: "elite", assetKey: "grove_enemy", dropTableId: "verdant_elite" },
      { id: "briar_ram", name: "棘冠蛮角兽", hp: 82, attack: 14, defense: 6, speed: 6, exp: 48, gold: 32, role: "bulwark", encounterType: "elite", assetKey: "grove_enemy", dropTableId: "verdant_elite" },
    ],
    sunken_archive: [
      { id: "silent_curator", name: "缄默馆长", hp: 76, attack: 14, defense: 5, speed: 8, exp: 48, gold: 34, role: "caster", encounterType: "elite", assetKey: "archive_enemy", dropTableId: "archive_elite" },
      { id: "seal_siphoner", name: "封缄汲能者", hp: 70, attack: 13, defense: 4, speed: 9, exp: 50, gold: 36, role: "mana_drain", encounterType: "elite", assetKey: "archive_enemy", dropTableId: "archive_elite" },
      { id: "libram_sentinel", name: "圣匣书卫", hp: 86, attack: 13, defense: 7, speed: 5, exp: 54, gold: 38, role: "bulwark", encounterType: "elite", assetKey: "archive_enemy", dropTableId: "archive_elite" },
    ],
    ember_hollow: [
      { id: "magma_reaver", name: "熔岩收割者", hp: 84, attack: 16, defense: 5, speed: 9, exp: 54, gold: 38, role: "berserker", encounterType: "elite", assetKey: "ember_enemy", dropTableId: "ember_elite" },
      { id: "cinder_howler", name: "余火哀嚎者", hp: 72, attack: 15, defense: 4, speed: 10, exp: 52, gold: 36, role: "pyromancer", encounterType: "elite", assetKey: "ember_enemy", dropTableId: "ember_elite" },
      { id: "slag_phalanx", name: "炉渣方阵长", hp: 90, attack: 14, defense: 7, speed: 5, exp: 58, gold: 40, role: "bulwark", encounterType: "elite", assetKey: "ember_enemy", dropTableId: "ember_elite" },
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
  STAGE_META.verdant_grove.rewardProfileId = "verdant_grove";
  STAGE_META.verdant_grove.tempoBias = "tempo_pressure";
  STAGE_META.verdant_grove.classPressureTags = ["持续输出", "移动压制", "中毒应对"];

  STAGE_META.sunken_archive.eventPoolId = "archive_events";
  STAGE_META.sunken_archive.relicPoolId = "archive_relics";
  STAGE_META.sunken_archive.dropTableId = "archive_common";
  STAGE_META.sunken_archive.bossDropTableId = "archive_boss";
  STAGE_META.sunken_archive.elitePoolId = "sunken_archive";
  STAGE_META.sunken_archive.rewardProfileId = "sunken_archive";
  STAGE_META.sunken_archive.tempoBias = "control_drag";
  STAGE_META.sunken_archive.classPressureTags = ["爆发窗口", "法力循环", "减速处理"];

  STAGE_META.ember_hollow.eventPoolId = "ember_events";
  STAGE_META.ember_hollow.relicPoolId = "ember_relics";
  STAGE_META.ember_hollow.dropTableId = "ember_common";
  STAGE_META.ember_hollow.bossDropTableId = "ember_boss";
  STAGE_META.ember_hollow.elitePoolId = "ember_hollow";
  STAGE_META.ember_hollow.rewardProfileId = "ember_hollow";
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
      scoreValue: template.scoreValue || 0,
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
    encounter.rewardProfile = encounter.rewardProfile || stageMeta.rewardProfileId || "";
    return encounter;
  }

  function getRelicCatalog() {
    const catalog = {};
    Object.keys(RELIC_POOLS).forEach(function eachPool(poolId) {
      (RELIC_POOLS[poolId] || []).forEach(function eachRelic(relic) {
        catalog[relic.id] = relic;
        catalog[relic.name] = relic;
      });
    });
    return catalog;
  }

  function findRelicByName(relicKey) {
    const catalog = getRelicCatalog();
    return catalog[relicKey] || null;
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

  function createRewardChoices(profileId, encounterType) {
    const profile = REWARD_PROFILES[profileId] || null;
    if (!profile) {
      return [];
    }
    return cloneValue(profile[encounterType] || []);
  }

  function getStageMeta(stageName) {
    return STAGE_META[stageName] || STAGE_META.azure_town;
  }

  function getEndlessThemeStageId(floor) {
    const groupIndex = Math.max(0, Math.floor((Math.max(1, floor) - 1) / 5));
    return STAGE_SEQUENCE[groupIndex % STAGE_SEQUENCE.length] || STAGE_SEQUENCE[0];
  }

  function getEndlessFloorDescriptor(floor) {
    const safeFloor = Math.max(1, floor);
    return {
      floor: safeFloor,
      themeStageId: getEndlessThemeStageId(safeFloor),
      bossFloor: safeFloor % 5 === 0,
      eliteFloor: safeFloor % 5 !== 0 && safeFloor % 3 === 0,
    };
  }

  function getCorridorFloorType(floorDescriptor) {
    if (floorDescriptor && floorDescriptor.bossFloor) {
      return "boss";
    }
    if (floorDescriptor && floorDescriptor.eliteFloor) {
      return "elite";
    }
    return "normal";
  }

  function resolveCorridorAffixCount(floorDescriptor, rule) {
    const profile = rule && rule.selectionProfile ? rule.selectionProfile : {};
    let count = Math.max(0, Number(profile.base) || 0);
    if (profile.bonusFromFloor && floorDescriptor.floor >= profile.bonusFromFloor) {
      count += 1;
    }
    const requiredCount = Array.isArray(rule && rule.requiredIds) ? rule.requiredIds.length : 0;
    const maxCount = Math.max(requiredCount, Number(profile.max) || count || 1);
    return clamp(Math.max(requiredCount, count || 1), 1, maxCount);
  }

  function createCorridorAffixSnapshot(affix, floorDescriptor, floorType) {
    const data = affix || {};
    const ui = data.ui || {};
    return {
      id: data.id || "",
      name: data.name || "",
      shortLabel: ui.shortLabel || data.shortLabel || data.name || "",
      tier: data.tier || "基础词缀",
      family: data.family || "",
      targetScope: data.targetScope || "",
      triggerTiming: data.triggerTiming || "",
      mechanicAxis: cloneValue(data.mechanicAxis || []),
      effectPayload: cloneValue(data.effectPayload || {}),
      summary: ui.summary || "",
      briefing: ui.briefing || "",
      inspect: cloneValue(ui.inspect || []),
      floorType: floorType,
      floor: floorDescriptor ? floorDescriptor.floor : 0,
      themeStageId: floorDescriptor ? floorDescriptor.themeStageId : "",
    };
  }

  function pickUniqueCorridorAffixIds(poolIds, count, requiredIds) {
    const selected = [];
    (requiredIds || []).forEach(function eachRequired(id) {
      if (poolIds.indexOf(id) >= 0 && selected.indexOf(id) < 0) {
        selected.push(id);
      }
    });
    shuffle(poolIds || []).forEach(function eachId(id) {
      if (selected.length >= count) {
        return;
      }
      if (selected.indexOf(id) < 0) {
        selected.push(id);
      }
    });
    return selected.slice(0, count);
  }

  function createCorridorAffixBundle(floorDescriptor) {
    const floorType = getCorridorFloorType(floorDescriptor);
    const baseRule = CORRIDOR_FLOOR_AFFIX_RULES[floorType] || CORRIDOR_FLOOR_AFFIX_RULES.normal;
    const selectionCount = resolveCorridorAffixCount(floorDescriptor, baseRule);
    const selectedIds = pickUniqueCorridorAffixIds(baseRule.poolIds || [], selectionCount, baseRule.requiredIds || []);
    const selectionProfile = baseRule.selectionProfile || {};
    const baseCount = Math.max(
      Array.isArray(baseRule.requiredIds) ? baseRule.requiredIds.length : 0,
      Number(selectionProfile.base) || 1
    );
    return {
      rule: {
        floorType: floorType,
        label: baseRule.label || "",
        selectionMode: baseRule.selectionMode || "",
        selectionCount: selectionCount,
        poolIds: cloneValue(baseRule.poolIds || []),
        requiredIds: cloneValue(baseRule.requiredIds || []),
        escalated: selectionCount > baseCount,
        summary: baseRule.summary || "",
      },
      affixIds: selectedIds.slice(),
      affixes: selectedIds.map(function mapAffix(id) {
        return createCorridorAffixSnapshot(CORRIDOR_AFFIX_CATALOG[id], floorDescriptor, floorType);
      }),
    };
  }

  function scaleEndlessEnemy(template, floorDescriptor, themeMeta) {
    const base = cloneEnemyTemplate(template);
    const floor = floorDescriptor.floor;
    const bossBonus = floorDescriptor.bossFloor ? 1 : 0;
    const eliteBonus = floorDescriptor.eliteFloor ? 1 : 0;
    const hpRatio = 1 + (floor - 1) * 0.18 + bossBonus * 0.42 + eliteBonus * 0.2;
    const attackRatio = 1 + (floor - 1) * 0.11 + bossBonus * 0.24 + eliteBonus * 0.1;
    const defenseBonus = Math.floor((floor - 1) / 2) + bossBonus * 2 + eliteBonus;
    const speedBonus = Math.floor((floor - 1) / 3) + bossBonus + (eliteBonus ? 1 : 0);
    const expRatio = 1 + (floor - 1) * 0.14 + bossBonus * 0.2 + eliteBonus * 0.12;
    const goldRatio = 1 + (floor - 1) * 0.16 + bossBonus * 0.24 + eliteBonus * 0.14;

    base.hp = Math.max(1, Math.round(base.hp * hpRatio));
    base.attack = Math.max(1, Math.round(base.attack * attackRatio));
    base.defense = Math.max(0, base.defense + defenseBonus);
    base.speed = Math.max(1, base.speed + speedBonus);
    base.exp = Math.max(1, Math.round(base.exp * expRatio));
    base.gold = Math.max(1, Math.round(base.gold * goldRatio));
    base.scoreValue = 90 + floor * 26 + (floorDescriptor.bossFloor ? 320 : floorDescriptor.eliteFloor ? 170 : 0);
    base.rewardProfile = themeMeta.rewardProfileId || "";
    base.dropTableId = floorDescriptor.bossFloor
      ? (themeMeta.bossDropTableId || themeMeta.dropTableId || "")
      : themeMeta.dropTableId || "";
    return base;
  }

  function createEndlessArena(themeStageId, bossFloor) {
    const mapData = createSolidMap();
    for (let y = 1; y < MAP_ROWS - 1; y += 1) {
      for (let x = 1; x < MAP_COLS - 1; x += 1) {
        mapData[y][x] = TILE.FLOOR;
      }
    }

    const obstacleSets = {
      verdant_grove: bossFloor
        ? [{ x: 7, y: 4 }, { x: 7, y: 10 }, { x: 12, y: 4 }, { x: 12, y: 10 }]
        : [{ x: 8, y: 5 }, { x: 8, y: 9 }, { x: 11, y: 5 }, { x: 11, y: 9 }],
      sunken_archive: bossFloor
        ? [{ x: 6, y: 4 }, { x: 6, y: 10 }, { x: 13, y: 4 }, { x: 13, y: 10 }]
        : [{ x: 7, y: 6 }, { x: 7, y: 8 }, { x: 12, y: 6 }, { x: 12, y: 8 }],
      ember_hollow: bossFloor
        ? [{ x: 8, y: 3 }, { x: 8, y: 11 }, { x: 11, y: 3 }, { x: 11, y: 11 }]
        : [{ x: 9, y: 5 }, { x: 9, y: 9 }, { x: 10, y: 5 }, { x: 10, y: 9 }],
    };

    (obstacleSets[themeStageId] || []).forEach(function placeObstacle(cell) {
      mapData[cell.y][cell.x] = TILE.WALL;
    });

    const start = { x: 2, y: Math.floor(MAP_ROWS / 2) };
    const healPos = { x: 4, y: Math.floor(MAP_ROWS / 2) };
    const enemyPos = { x: MAP_COLS - 4, y: Math.floor(MAP_ROWS / 2) };
    mapData[start.y][start.x] = TILE.PLAYER_START;
    mapData[healPos.y][healPos.x] = TILE.HEAL_POINT;
    mapData[enemyPos.y][enemyPos.x] = bossFloor ? TILE.BOSS : TILE.ENEMY;

    return {
      map: mapData,
      start: start,
      enemyPos: enemyPos,
    };
  }

  function generateEndlessStage(floor) {
    const descriptor = getEndlessFloorDescriptor(floor);
    const themeMeta = getStageMeta(descriptor.themeStageId);
    const affixBundle = createCorridorAffixBundle(descriptor);
    const arena = createEndlessArena(descriptor.themeStageId, descriptor.bossFloor);
    const encounterPool = {};
    const elitePool = ELITE_TEMPLATES[themeMeta.elitePoolId] || [];
    const baseTemplate = descriptor.bossFloor
      ? themeMeta.boss
      : descriptor.eliteFloor && elitePool.length
        ? pickRandom(elitePool)
        : pickRandom(themeMeta.enemyRoster);
    const endlessTemplate = scaleEndlessEnemy(baseTemplate, descriptor, themeMeta);
    endlessTemplate.encounterType = descriptor.bossFloor ? "boss" : descriptor.eliteFloor ? "elite" : "normal";
    endlessTemplate.isBoss = descriptor.bossFloor;

    encounterPool[positionKey(arena.enemyPos.x, arena.enemyPos.y)] = createEncounterRuntime(endlessTemplate, themeMeta, {
      encounterType: endlessTemplate.encounterType,
    });

    return {
      map: arena.map,
      start: arena.start,
      portalPos: null,
      encounters: encounterPool,
      events: {},
      contentPools: {
        eventPoolId: "",
        relicPoolId: themeMeta.relicPoolId || "",
        dropTableId: endlessTemplate.dropTableId || "",
        elitePoolId: themeMeta.elitePoolId || "",
        rewardProfileId: themeMeta.rewardProfileId || "",
        routeLabel: "第 " + descriptor.floor + " 层 / 单战突破",
        pressureLabel: (descriptor.bossFloor ? "首领层" : descriptor.eliteFloor ? "精英层" : "试炼层") + " / " + (themeMeta.pressureLabel || "持续加压"),
        rewardLabel: "见好就收或继续冲层",
        layoutProfile: "endless_arena",
        stageLabel: "无尽回廊·第 " + descriptor.floor + " 层",
        stageDescription: (descriptor.bossFloor
          ? "当前层为首领考核。"
          : descriptor.eliteFloor
            ? "当前层为精英压制。"
            : "当前层为常规试炼。")
          + " 主题区域：" + themeMeta.label + "。",
        assetTheme: themeMeta.assetTheme || descriptor.themeStageId,
        challenge: {
          floor: descriptor.floor,
          themeStageId: descriptor.themeStageId,
          themeLabel: themeMeta.label || descriptor.themeStageId,
          floorType: affixBundle.rule.floorType,
          bossFloor: descriptor.bossFloor,
          eliteFloor: descriptor.eliteFloor,
          scoreValue: endlessTemplate.scoreValue || 0,
          affixRule: affixBundle.rule,
          affixIds: affixBundle.affixIds,
          affixes: affixBundle.affixes,
          affixSummary: affixBundle.affixes.map(function mapAffix(affix) {
            return affix.shortLabel + "：" + affix.summary;
          }).join(" / "),
        },
      },
    };
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

  function carveRect(mapData, left, top, width, height) {
    let carved = 0;
    const maxY = Math.min(mapData.length - 2, top + height - 1);
    const maxX = Math.min(mapData[0].length - 2, left + width - 1);
    for (let y = Math.max(1, top); y <= maxY; y += 1) {
      for (let x = Math.max(1, left); x <= maxX; x += 1) {
        if (mapData[y][x] === TILE.WALL) {
          mapData[y][x] = TILE.FLOOR;
          carved += 1;
        }
      }
    }
    return carved;
  }

  function carveHorizontalTunnel(mapData, x1, x2, y, thickness) {
    const top = y - Math.floor((thickness || 1) / 2);
    const left = Math.min(x1, x2);
    const width = Math.abs(x2 - x1) + 1;
    return carveRect(mapData, left, top, width, thickness || 1);
  }

  function carveVerticalTunnel(mapData, y1, y2, x, thickness) {
    const left = x - Math.floor((thickness || 1) / 2);
    const top = Math.min(y1, y2);
    const height = Math.abs(y2 - y1) + 1;
    return carveRect(mapData, left, top, thickness || 1, height);
  }

  function carveLPath(mapData, from, to, thickness) {
    if (Math.random() < 0.5) {
      carveHorizontalTunnel(mapData, from.x, to.x, from.y, thickness);
      carveVerticalTunnel(mapData, from.y, to.y, to.x, thickness);
    } else {
      carveVerticalTunnel(mapData, from.y, to.y, from.x, thickness);
      carveHorizontalTunnel(mapData, from.x, to.x, to.y, thickness);
    }
  }

  function createLayoutProfile(stageName, meta) {
    const mapData = createSolidMap();
    if (meta.layoutProfile === "archive_corridors") {
      const start = { x: 2, y: Math.floor(MAP_ROWS / 2) };
      const chambers = [
        { x: 2, y: 2, w: 5, h: 4 },
        { x: 7, y: 8, w: 5, h: 4 },
        { x: 13, y: 2, w: 5, h: 4 },
        { x: 13, y: 8, w: 5, h: 4 },
      ];
      chambers.forEach(function carveChamber(chamber) {
        carveRect(mapData, chamber.x, chamber.y, chamber.w, chamber.h);
      });
      for (let i = 0; i < chambers.length - 1; i += 1) {
        const from = {
          x: chambers[i].x + Math.floor(chambers[i].w / 2),
          y: chambers[i].y + Math.floor(chambers[i].h / 2),
        };
        const to = {
          x: chambers[i + 1].x + Math.floor(chambers[i + 1].w / 2),
          y: chambers[i + 1].y + Math.floor(chambers[i + 1].h / 2),
        };
        carveLPath(mapData, from, to, 2);
      }
      carveLPath(mapData, start, { x: chambers[0].x + 1, y: chambers[0].y + 1 }, 2);
      return { map: mapData, start: start };
    }

    if (meta.layoutProfile === "ember_chokepoints") {
      const start = { x: 2, y: Math.floor(MAP_ROWS / 2) };
      carveHorizontalTunnel(mapData, 2, MAP_COLS - 4, start.y, 2);
      const branches = [
        { x: 6, y: 3, w: 4, h: 3 },
        { x: 6, y: 9, w: 4, h: 3 },
        { x: 12, y: 2, w: 5, h: 3 },
        { x: 12, y: 10, w: 5, h: 3 },
      ];
      branches.forEach(function carveBranch(branch) {
        carveRect(mapData, branch.x, branch.y, branch.w, branch.h);
        carveVerticalTunnel(mapData, start.y, branch.y + Math.floor(branch.h / 2), branch.x + 1, 1);
      });
      carveBrush(mapData, MAP_COLS - 5, start.y, 2);
      return { map: mapData, start: start };
    }

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
      carved += carveBrush(mapData, walker.x, walker.y, Math.random() < 0.28 ? 1 : 0);
      steps += 1;
    }

    for (let i = 0; i < 3; i += 1) {
      carveBrush(mapData, randInt(3, MAP_COLS - 4), randInt(3, MAP_ROWS - 4), 2);
    }
    return { map: mapData, start: start };
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

  function isGenerationWalkable(mapData, x, y) {
    return Boolean(mapData[y]) && mapData[y][x] !== TILE.WALL;
  }

  function collectReachableFloorCells(mapData, start) {
    const visited = {};
    const queue = [{ x: start.x, y: start.y }];
    const reachable = [];
    visited[positionKey(start.x, start.y)] = true;

    while (queue.length) {
      const current = queue.shift();
      const directions = [
        { x: current.x + 1, y: current.y },
        { x: current.x - 1, y: current.y },
        { x: current.x, y: current.y + 1 },
        { x: current.x, y: current.y - 1 },
      ];

      if (mapData[current.y] && mapData[current.y][current.x] === TILE.FLOOR) {
        reachable.push({ x: current.x, y: current.y });
      }

      directions.forEach(function eachDirection(next) {
        const key = positionKey(next.x, next.y);
        if (visited[key] || !isGenerationWalkable(mapData, next.x, next.y)) {
          return;
        }
        visited[key] = true;
        queue.push(next);
      });
    }

    return reachable;
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
    const layout = createLayoutProfile(stageName, meta);
    const mapData = layout.map;
    const start = layout.start;

    const floors = collectReachableFloorCells(mapData, start);
    const blocked = {};
    blocked[positionKey(start.x, start.y)] = true;

    const healPos = chooseDistantFloor(floors, start, blocked);
    if (healPos) {
      mapData[healPos.y][healPos.x] = TILE.HEAL_POINT;
      blocked[positionKey(healPos.x, healPos.y)] = true;
    }

    const portalPos = chooseDistantFloor(floors, start, blocked);
    if (portalPos) {
      mapData[portalPos.y][portalPos.x] = TILE.PORTAL;
      blocked[positionKey(portalPos.x, portalPos.y)] = true;
    }

    const encounterPool = {};
    const eventNodes = {};
    const spawnCount = Math.max(0, Math.min(randInt(meta.enemyCount[0], meta.enemyCount[1]), floors.length - 3));
    const enemySpawns = chooseEnemySpawns(floors, start, spawnCount, blocked);
    enemySpawns.forEach(function spawnEnemy(cell) {
      mapData[cell.y][cell.x] = TILE.ENEMY;
      encounterPool[positionKey(cell.x, cell.y)] = createEncounterRuntime(pickRandom(meta.enemyRoster), meta, {
        encounterType: "normal",
      });
    });

    const elitePool = ELITE_TEMPLATES[meta.elitePoolId] || [];
    const eliteTarget = elitePool.length ? (meta.eliteCount || 1) : 0;
    const eliteSpawns = chooseNodeSpawns(floors, start, eliteTarget, blocked, 6);
    eliteSpawns.forEach(function spawnElite(cell) {
      mapData[cell.y][cell.x] = TILE.ELITE;
      encounterPool[positionKey(cell.x, cell.y)] = createEncounterRuntime(pickRandom(elitePool), meta, {
        encounterType: "elite",
      });
    });

    const eventPool = EVENT_POOLS[meta.eventPoolId] || [];
    const eventRange = meta.eventCountRange || [1, Math.min(2, Math.max(1, eventPool.length))];
    const eventTarget = Math.min(eventPool.length, randInt(eventRange[0], Math.min(eventRange[1], Math.max(1, eventPool.length))));
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
        rewardProfileId: meta.rewardProfileId || "",
        routeLabel: meta.routeLabel || "",
        pressureLabel: meta.pressureLabel || "",
        rewardLabel: meta.rewardLabel || "",
        layoutProfile: meta.layoutProfile || "",
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
        rewardProfileId: meta.rewardProfileId || "",
      },
    };
  }

  function createStageProgress() {
    return {
      availableStages: [STAGE_SEQUENCE[0]],
      clearedBosses: {},
      chapterProgress: {
        unlockedChapterIds: [CHAPTERS[0].id],
        clearedStageIds: [],
        currentChapterId: CHAPTERS[0].id,
        campaignComplete: false,
      },
      longTerm: {
        legacyMarks: 0,
        townRenown: 0,
        townUpgrades: {
          training_ground: 0,
          arcane_archive: 0,
          supply_caravan: 0,
        },
        endlessTrial: {
          bestFloor: 0,
          bestScore: 0,
          totalRuns: 0,
          totalLegacyMarksEarned: 0,
          totalBossesDefeated: 0,
          lastFloor: 0,
          lastScore: 0,
          lastOutcome: "",
        },
      },
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
          rewardProfileId: "",
        },
      };
    }
    if (stageName === ENDLESS_TRIAL_STAGE_ID && settings.mode === "endless") {
      return generateEndlessStage(settings.floor || 1);
    }
    return settings.mode === "boss" ? generateBossStage(stageName) : generateFieldStage(stageName);
  }

  window.GameStageData = {
    RELIC_POOLS: RELIC_POOLS,
    EVENT_POOLS: EVENT_POOLS,
    DROP_TABLES: DROP_TABLES,
    REWARD_PROFILES: REWARD_PROFILES,
    ELITE_TEMPLATES: ELITE_TEMPLATES,
    STAGE_MAPS: STAGE_MAPS,
    STAGE_META: STAGE_META,
    STAGE_SEQUENCE: STAGE_SEQUENCE,
    CORRIDOR_AFFIX_CATALOG: CORRIDOR_AFFIX_CATALOG,
    CORRIDOR_FLOOR_AFFIX_RULES: CORRIDOR_FLOOR_AFFIX_RULES,
    CHAPTERS: CHAPTERS,
    SHOP_ITEMS: SHOP_ITEMS,
    TOWN_UPGRADES: TOWN_UPGRADES,
    ENDLESS_TRIAL_STAGE_ID: ENDLESS_TRIAL_STAGE_ID,
    cloneMap: cloneMap,
    mergeBonusPackages: mergeBonusPackages,
    positionKey: positionKey,
    getStageMeta: getStageMeta,
    getEndlessFloorDescriptor: getEndlessFloorDescriptor,
    getCorridorFloorType: getCorridorFloorType,
    createCorridorAffixBundle: createCorridorAffixBundle,
    getChapterByStageId: getChapterByStageId,
    createStageProgress: createStageProgress,
    createStageInstance: createStageInstance,
    createEncounterRuntime: createEncounterRuntime,
    createEventRuntime: createEventRuntime,
    createRewardChoices: createRewardChoices,
    createEquipmentOffer: createEquipmentOffer,
    upgradeEquipmentInstance: upgradeEquipmentInstance,
    getRelicCatalog: getRelicCatalog,
    findRelicByName: findRelicByName,
  };
})();
