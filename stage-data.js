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
      bossDescription: "清掉书库守卫后，通往封印藏室的法阵才会出现。",
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
      bossDescription: "只有扫平裂谷里的余烬军团，熔核祭坛的大门才会开启。",
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
  };

  const STAGE_SEQUENCE = ["verdant_grove", "sunken_archive", "ember_hollow"];

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
    ],
    archive_relics: [
      { id: "echo_quill", name: "回响羽笔", tags: ["spell", "combo"], rarity: "common", bonus: { attack: 1, maxMp: 6 }, summary: "攻击 +1，法力上限 +6。", synergies: [{ matchAnyTags: ["循环", "爆发", "惩戒"], changes: { power: 0.16 }, inspectNote: "遗物联动：法术输出与惩戒类技能伤害倍率提高。" }], inspect: ["攻击 +1", "法力上限 +6", "适合法术爆发与技能连段构筑。", "联动：循环 / 爆发 / 惩戒标签技能伤害倍率 +16%。"] },
      { id: "seal_fragment", name: "封印碎片", tags: ["guard", "control"], rarity: "rare", bonus: { defense: 1, maxHp: 8 }, summary: "防御 +1，生命上限 +8。", synergies: [{ matchAnyTags: ["防守", "庇护"], changes: { guard: 0.12 }, inspectNote: "遗物联动：防守与庇护技能的减伤提高。" }, { matchAnyTags: ["恢复"], changes: { power: -0.12 }, inspectNote: "遗物联动：恢复类技能的治疗倍率提高。" }], inspect: ["防御 +1", "生命上限 +8", "适合需要稳住节奏的防守型构筑。", "联动：防守 / 庇护标签技能减伤提高，恢复标签技能治疗倍率提高。"] },
    ],
    ember_relics: [
      { id: "slag_core", name: "炉渣核心", tags: ["power", "tempo"], rarity: "common", bonus: { attack: 2, maxHp: 6 }, summary: "攻击 +2，生命上限 +6。", synergies: [{ matchAnyTags: ["爆发", "压迫", "稳定输出"], changes: { power: 0.14 }, inspectNote: "遗物联动：高压输出技能伤害倍率提高。" }], inspect: ["攻击 +2", "生命上限 +6", "适合高压输出构筑。", "联动：爆发 / 压迫 / 稳定输出标签技能伤害倍率 +14%。"] },
      { id: "tyrant_horn", name: "暴君之角", tags: ["risk", "execute"], rarity: "rare", bonus: { attack: 3, defense: -1 }, summary: "攻击 +3，防御 -1。", synergies: [{ matchAnyTags: ["终结", "斩杀", "处决"], changes: { power: 0.26, resourceCost: -1 }, inspectNote: "遗物联动：终结类技能更强，且职业资源消耗降低 1。" }], inspect: ["攻击 +3", "防御 -1", "高风险高回报的极端爆发遗物。", "联动：终结 / 斩杀 / 处决标签技能伤害倍率 +26%，职业资源消耗 -1。"] },
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
    CHAPTERS: CHAPTERS,
    SHOP_ITEMS: SHOP_ITEMS,
    TOWN_UPGRADES: TOWN_UPGRADES,
    cloneMap: cloneMap,
    mergeBonusPackages: mergeBonusPackages,
    positionKey: positionKey,
    getStageMeta: getStageMeta,
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
