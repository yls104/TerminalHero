const PLAYER_TEMPLATE = {
  name: "勇者",
  level: 1,
  hp: 100,
  maxHp: 100,
  mp: 24,
  maxMp: 24,
  attack: 14,
  defense: 5,
  speed: 10,
  exp: 0,
  expToNext: 50,
  gold: 60,
  skillPoints: 0,
  position: { x: 1, y: 1 },
  classId: "",
  className: "",
  classDescription: "",
  classBuildNote: "",
  classResource: {
    id: "",
    label: "",
    shortLabel: "",
    current: 0,
    max: 0,
    colorClass: "resource-neutral",
    description: "",
  },
  specialization: {
    unlockedNodeIds: [],
    spentPoints: 0,
  },
  buildSnapshot: {
    activeTrackNames: [],
    unlockedNodeNames: [],
    unlockedSkillIds: [],
    relicTags: [],
  },
  unlockedSkills: [],
  learnedUltimate: false,
  equipment: [],
  relics: [],
  materials: {},
  runBlessings: [],
};

const skills = {
  attack: { id: "attack", name: "普通攻击", type: "physical", cost: 0, power: 1.0, effect: "damage", description: "稳定输出。", resourceGain: 1, inspectTags: ["基础", "稳定输出"] },
  defend: { id: "defend", name: "防御姿态", type: "utility", cost: 0, effect: "guard", guard: 0.45, description: "减伤并稳住回合。", resourceGain: 1, inspectTags: ["防守", "过渡"] },
  slash: { id: "slash", name: "裂风斩", type: "physical", cost: 3, power: 1.35, effect: "damage", description: "战士的高威力斩击。", resourceGain: 1, inspectTags: ["战士", "爆发准备"] },
  battle_cry: { id: "battle_cry", name: "战吼", type: "utility", cost: 5, effect: "buff_attack", buff: 0.3, turns: 2, description: "短时间提升攻击。", resourceCost: 2, inspectTags: ["战士", "增益", "窗口"] },
  earthshatter: { id: "earthshatter", name: "裂地猛击", type: "physical", cost: 8, power: 1.8, effect: "damage", splash: 0.15, description: "战士的终结重击。", resourceCost: 4, inspectTags: ["战士", "终结", "爆发"] },
  guard_break: { id: "guard_break", name: "崩山断", type: "physical", cost: 6, power: 1.55, effect: "damage", resourceCost: 3, description: "破军专精的强力终结斩击。", inspectTags: ["战士", "专精", "终结"] },
  unyielding_roar: { id: "unyielding_roar", name: "不屈战吼", type: "utility", cost: 6, power: -0.42, effect: "guard_heal", guard: 0.32, description: "稳住血线后再压回去。", resourceGain: 1, inspectTags: ["战士", "专精", "续战"] },
  arcane_bolt: { id: "arcane_bolt", name: "奥术飞弹", type: "magic", cost: 4, power: 1.25, effect: "damage", description: "法师的稳定魔法输出。", resourceGain: 1, inspectTags: ["法师", "循环"] },
  frost_nova: { id: "frost_nova", name: "冰环", type: "magic", cost: 6, power: 1.1, effect: "damage", slow: 2, description: "造成伤害并压低敌方节奏。", resourceGain: 1, inspectTags: ["法师", "控场"] },
  meditate: { id: "meditate", name: "冥想", type: "utility", cost: 0, effect: "restore_mp", restoreMp: 8, guard: 0.2, description: "恢复法力并稍微减伤。", resourceGain: 2, inspectTags: ["法师", "回蓝"] },
  meteor: { id: "meteor", name: "陨星术", type: "magic", cost: 10, power: 1.95, effect: "damage", description: "高消耗高爆发。", resourceCost: 4, inspectTags: ["法师", "终结", "高耗"] },
  chain_lightning: { id: "chain_lightning", name: "连锁闪击", type: "magic", cost: 7, power: 1.55, effect: "damage", resourceCost: 2, description: "炽星专精的爆发法术。", inspectTags: ["法师", "专精", "爆发"] },
  ice_barrier: { id: "ice_barrier", name: "冰棱壁垒", type: "utility", cost: 6, power: -0.36, effect: "guard_heal", guard: 0.38, description: "霜织专精的回稳手段。", resourceGain: 1, inspectTags: ["法师", "专精", "防守"] },
  aimed_shot: { id: "aimed_shot", name: "瞄准射击", type: "physical", cost: 3, power: 1.4, effect: "damage", description: "游侠的精准输出。", resourceGain: 1, inspectTags: ["游侠", "单点"] },
  poison_arrow: { id: "poison_arrow", name: "毒箭", type: "physical", cost: 5, power: 0.95, effect: "poison", poisonDamage: 6, poisonTurns: 3, description: "挂毒持续耗血。", resourceCost: 2, inspectTags: ["游侠", "持续伤害"] },
  first_aid: { id: "first_aid", name: "应急包扎", type: "utility", cost: 4, effect: "heal", power: -0.7, description: "轻量恢复，适合拉扯。", resourceGain: 1, inspectTags: ["游侠", "续航"] },
  volley: { id: "volley", name: "箭雨", type: "physical", cost: 9, power: 1.7, effect: "damage", description: "游侠的爆发技能。", resourceCost: 4, inspectTags: ["游侠", "爆发"] },
  piercing_shot: { id: "piercing_shot", name: "贯心矢", type: "physical", cost: 6, power: 1.6, effect: "damage", resourceCost: 2, description: "鹰眼专精的精确处决。", inspectTags: ["游侠", "专精", "狙击"] },
  serpent_trail: { id: "serpent_trail", name: "蛇影追猎", type: "physical", cost: 6, power: 1.05, effect: "poison", poisonDamage: 8, poisonTurns: 3, description: "狩猎专精的持续压制技。", resourceCost: 2, inspectTags: ["游侠", "专精", "持续伤害"] },
  smite: { id: "smite", name: "圣击", type: "magic", cost: 3, power: 1.15, effect: "damage", description: "牧师的惩戒法术。", resourceGain: 1, inspectTags: ["牧师", "惩戒"] },
  heal: { id: "heal", name: "恢复术", type: "magic", cost: 5, power: -1.15, effect: "heal", description: "稳定高效的回复技能。", resourceGain: 1, inspectTags: ["牧师", "恢复"] },
  sanctuary: { id: "sanctuary", name: "庇护", type: "utility", cost: 6, effect: "guard_heal", guard: 0.35, power: -0.45, description: "回复并获得减伤。", resourceGain: 1, inspectTags: ["牧师", "庇护"] },
  judgment: { id: "judgment", name: "圣裁", type: "magic", cost: 9, power: 1.75, effect: "damage", description: "牧师终结技。", resourceCost: 3, inspectTags: ["牧师", "审判", "爆发"] },
  sacred_lance: { id: "sacred_lance", name: "圣枪裁决", type: "magic", cost: 6, power: 1.45, effect: "damage", resourceCost: 2, description: "审判专精的高压追击。", inspectTags: ["牧师", "专精", "惩戒"] },
  grace_tide: { id: "grace_tide", name: "恩典潮汐", type: "magic", cost: 7, power: -1.3, effect: "heal", resourceCost: 1, description: "护誓专精的高额恢复。", inspectTags: ["牧师", "专精", "恢复"] },
  backstab: { id: "backstab", name: "背刺", type: "physical", cost: 4, power: 1.55, effect: "damage", bonusFirst: 0.25, description: "先手收益更高。", resourceGain: 2, inspectTags: ["盗贼", "先手"] },
  smoke_step: { id: "smoke_step", name: "烟幕步", type: "utility", cost: 5, effect: "guard", guard: 0.55, description: "规避大量伤害。", resourceGain: 1, inspectTags: ["盗贼", "保节奏"] },
  venom_cut: { id: "venom_cut", name: "淬毒刃", type: "physical", cost: 5, power: 1.0, effect: "poison", poisonDamage: 7, poisonTurns: 2, description: "伤害不高但持续逼迫。", resourceGain: 1, inspectTags: ["盗贼", "挂毒"] },
  shadow_flurry: { id: "shadow_flurry", name: "影袭乱舞", type: "physical", cost: 9, power: 2.0, effect: "damage", description: "盗贼爆发核心。", resourceCost: 4, inspectTags: ["盗贼", "连击终结"] },
  ambush: { id: "ambush", name: "潜袭处决", type: "physical", cost: 6, power: 1.7, effect: "damage", bonusFirst: 0.2, resourceCost: 2, description: "暗刃专精的抢节奏技能。", inspectTags: ["盗贼", "专精", "斩杀"] },
  trick_step: { id: "trick_step", name: "戏法步", type: "utility", cost: 4, effect: "guard", guard: 0.7, resourceGain: 2, description: "诡道专精的节奏重建手段。", inspectTags: ["盗贼", "专精", "回合修复"] },
  radiant_slash: { id: "radiant_slash", name: "光耀斩", type: "physical", cost: 4, power: 1.25, effect: "damage", description: "圣骑士的稳健输出。", resourceGain: 1, inspectTags: ["圣骑士", "稳定输出"] },
  aegis: { id: "aegis", name: "神圣壁垒", type: "utility", cost: 6, effect: "guard", guard: 0.65, description: "极强减伤回合。", resourceGain: 2, inspectTags: ["圣骑士", "防守"] },
  holy_heal: { id: "holy_heal", name: "圣光恢复", type: "magic", cost: 6, power: -0.9, effect: "heal", description: "圣骑士的自疗手段。", resourceGain: 1, inspectTags: ["圣骑士", "恢复"] },
  execution_seal: { id: "execution_seal", name: "处决印记", type: "magic", cost: 8, power: 1.85, effect: "damage", description: "高压单体爆发。", resourceCost: 4, inspectTags: ["圣骑士", "处决"] },
  verdict_blade: { id: "verdict_blade", name: "圣誓裁刃", type: "physical", cost: 7, power: 1.6, effect: "damage", resourceCost: 3, description: "圣罚专精的高压处决。", inspectTags: ["圣骑士", "专精", "终结"] },
  holy_bulwark: { id: "holy_bulwark", name: "圣域堡垒", type: "utility", cost: 7, power: -0.55, effect: "guard_heal", guard: 0.45, resourceGain: 1, description: "壁垒专精的稳态回复。", inspectTags: ["圣骑士", "专精", "稳态"] },
  thorn_whip: { id: "thorn_whip", name: "藤蔓鞭笞", type: "magic", cost: 3, power: 1.2, effect: "damage", description: "德鲁伊的基础输出。", resourceGain: 1, inspectTags: ["德鲁伊", "铺垫"] },
  rejuvenation: { id: "rejuvenation", name: "回春", type: "magic", cost: 5, power: -0.85, effect: "regen", regenValue: 8, regenTurns: 2, description: "持续恢复。", resourceGain: 1, inspectTags: ["德鲁伊", "持续恢复"] },
  barkskin: { id: "barkskin", name: "树肤", type: "utility", cost: 5, effect: "guard", guard: 0.45, description: "自然护甲。", resourceGain: 1, inspectTags: ["德鲁伊", "护甲"] },
  lunar_bloom: { id: "lunar_bloom", name: "月华绽放", type: "magic", cost: 9, power: -1.3, effect: "heal", splashGuard: 0.2, description: "强力回复并附少量护盾。", resourceCost: 4, inspectTags: ["德鲁伊", "爆发恢复"] },
  sporeburst: { id: "sporeburst", name: "孢群爆发", type: "magic", cost: 6, power: 1.0, effect: "poison", poisonDamage: 8, poisonTurns: 3, resourceCost: 2, description: "繁花专精的状态引爆。", inspectTags: ["德鲁伊", "专精", "状态转化"] },
  wild_pounce: { id: "wild_pounce", name: "野性扑击", type: "physical", cost: 5, power: 1.5, effect: "damage", resourceGain: 1, description: "兽性专精的主动压制。", inspectTags: ["德鲁伊", "专精", "压迫"] },
};

const classes = {
  warrior: {
    id: "warrior",
    name: "战士",
    description: "高生命高爆发，适合硬碰硬。",
    buildNote: "通过压制值堆高重击窗口，适合走爆发终结路线。",
    statBonus: { maxHp: 28, maxMp: -4, attack: 5, defense: 3, speed: -1 },
    starterSkills: ["attack", "slash", "defend", "battle_cry"],
    unlockSkill: "earthshatter",
    resourceConfig: { id: "pressure", label: "压制值", shortLabel: "压制", max: 4, colorClass: "resource-warrior", description: "普通攻击与基础技会积累压制值，终结技会大量消耗它。" },
  },
  mage: {
    id: "mage",
    name: "法师",
    description: "法力充足，技能爆发很强，但比较脆。",
    buildNote: "通过过载层数把回蓝和高耗法术串成完整爆发循环。",
    statBonus: { maxHp: -10, maxMp: 20, attack: 1, defense: -1, speed: 0 },
    starterSkills: ["attack", "arcane_bolt", "frost_nova", "meditate"],
    unlockSkill: "meteor",
    resourceConfig: { id: "overload", label: "过载层数", shortLabel: "过载", max: 4, colorClass: "resource-mage", description: "施法与冥想会积累过载层数，高阶法术会消耗它换取更强爆发。" },
  },
  ranger: {
    id: "ranger",
    name: "游侠",
    description: "节奏灵活，擅长持续输出与消耗。",
    buildNote: "围绕专注值安排挂毒、拉扯与箭雨收割，适合长期压制。",
    statBonus: { maxHp: 4, maxMp: 6, attack: 3, defense: 0, speed: 2 },
    starterSkills: ["attack", "aimed_shot", "poison_arrow", "first_aid"],
    unlockSkill: "volley",
    resourceConfig: { id: "focus", label: "专注值", shortLabel: "专注", max: 4, colorClass: "resource-ranger", description: "精准动作会积累专注值，高压输出技能会消耗它。" },
  },
  cleric: {
    id: "cleric",
    name: "牧师",
    description: "回复能力最稳，容错极高。",
    buildNote: "通过恢复与庇护积攒审判印记，再用圣裁打出稳定收尾。",
    statBonus: { maxHp: 10, maxMp: 14, attack: 0, defense: 1, speed: 0 },
    starterSkills: ["smite", "heal", "sanctuary", "defend"],
    unlockSkill: "judgment",
    resourceConfig: { id: "judgment", label: "审判印记", shortLabel: "审判", max: 4, colorClass: "resource-cleric", description: "惩戒与护持会积累审判印记，终结圣裁会消耗它。" },
  },
  rogue: {
    id: "rogue",
    name: "盗贼",
    description: "高速度高爆发，适合先手压制。",
    buildNote: "围绕连击点与先手收益设计斩杀节奏，适合抓窗口爆发。",
    statBonus: { maxHp: -4, maxMp: 4, attack: 4, defense: 0, speed: 4 },
    starterSkills: ["attack", "backstab", "smoke_step", "venom_cut"],
    unlockSkill: "shadow_flurry",
    resourceConfig: { id: "combo", label: "连击点", shortLabel: "连击", max: 5, colorClass: "resource-rogue", description: "快速出手会积累连击点，乱舞与斩杀技能会消耗它。" },
  },
  paladin: {
    id: "paladin",
    name: "圣骑士",
    description: "半坦半奶，适合稳定推进 Boss 战。",
    buildNote: "通过神圣充能在稳态推进中酝酿防反爆发，适合 Boss 战。",
    statBonus: { maxHp: 20, maxMp: 8, attack: 3, defense: 4, speed: -1 },
    starterSkills: ["radiant_slash", "holy_heal", "aegis", "defend"],
    unlockSkill: "execution_seal",
    resourceConfig: { id: "charge", label: "神圣充能", shortLabel: "充能", max: 4, colorClass: "resource-paladin", description: "防守与稳态输出会积累神圣充能，处决技会消耗它。" },
  },
  druid: {
    id: "druid",
    name: "德鲁伊",
    description: "持续恢复和防守兼备，擅长拉长战线。",
    buildNote: "利用自然印记维持持续恢复与护甲，再在窗口中转化收益。",
    statBonus: { maxHp: 12, maxMp: 12, attack: 1, defense: 2, speed: 1 },
    starterSkills: ["thorn_whip", "rejuvenation", "barkskin", "defend"],
    unlockSkill: "lunar_bloom",
    resourceConfig: { id: "growth", label: "自然印记", shortLabel: "印记", max: 4, colorClass: "resource-druid", description: "自然技能会积累印记，绽放类技能会消耗它放大收益。" },
  },
};

const specializationTrees = {
  warrior: {
    tracks: [
      {
        id: "warrior_breaker",
        name: "破军路线",
        summary: "专注于更快地积累压制值，再把窗口换成高额斩杀。",
        nodes: [
          { id: "warrior_breaker_edge", name: "裂甲训练", cost: 1, summary: "攻击 +2，压制上限 +1。", effects: [{ type: "stat", stat: "attack", amount: 2 }, { type: "resource_max", amount: 1 }] },
          { id: "warrior_breaker_skill", name: "崩山断", cost: 1, requires: ["warrior_breaker_edge"], summary: "解锁主动技能「崩山断」。", effects: [{ type: "unlock_skill", skillId: "guard_break" }] },
          { id: "warrior_breaker_mastery", name: "破军宗师", cost: 2, requires: ["warrior_breaker_skill"], summary: "裂风斩与裂地猛击更强，更适合一波带走敌人。", effects: [{ type: "skill_mod", skillId: "slash", changes: { power: 0.2 }, inspectNote: "专精强化：伤害倍率提高。" }, { type: "skill_mod", skillId: "earthshatter", changes: { power: 0.25, resourceCost: -1 }, inspectNote: "专精强化：终结威力提高且压制消耗降低 1。" }] },
        ],
      },
      {
        id: "warrior_juggernaut",
        name: "坚城路线",
        summary: "通过回稳与减伤保证自己始终能活到下一个爆发窗口。",
        nodes: [
          { id: "warrior_juggernaut_body", name: "铁壁体魄", cost: 1, summary: "生命上限 +18，防御 +2。", effects: [{ type: "stat", stat: "maxHp", amount: 18 }, { type: "stat", stat: "defense", amount: 2 }] },
          { id: "warrior_juggernaut_skill", name: "不屈战吼", cost: 1, requires: ["warrior_juggernaut_body"], summary: "解锁主动技能「不屈战吼」。", effects: [{ type: "unlock_skill", skillId: "unyielding_roar" }] },
          { id: "warrior_juggernaut_mastery", name: "铜墙斗志", cost: 2, requires: ["warrior_juggernaut_skill"], summary: "防御姿态与战吼提供更稳定的前置收益。", effects: [{ type: "skill_mod", skillId: "defend", changes: { guard: 0.15 }, inspectNote: "专精强化：减伤提高 15%。" }, { type: "skill_mod", skillId: "battle_cry", changes: { buff: 0.1, turns: 1 }, inspectNote: "专精强化：攻击提升更高，持续时间 +1 回合。" }] },
        ],
      },
    ],
  },
  mage: {
    tracks: [
      {
        id: "mage_ember",
        name: "炽星路线",
        summary: "强化高耗法术的爆发上限，追求更短时间内蒸发敌人。",
        nodes: [
          { id: "mage_ember_core", name: "灼流增幅", cost: 1, summary: "攻击 +2，法力上限 +4。", effects: [{ type: "stat", stat: "attack", amount: 2 }, { type: "stat", stat: "maxMp", amount: 4 }] },
          { id: "mage_ember_skill", name: "连锁闪击", cost: 1, requires: ["mage_ember_core"], summary: "解锁主动技能「连锁闪击」。", effects: [{ type: "unlock_skill", skillId: "chain_lightning" }] },
          { id: "mage_ember_mastery", name: "陨火专精", cost: 2, requires: ["mage_ember_skill"], summary: "奥术飞弹与陨星术的爆发更高。", effects: [{ type: "skill_mod", skillId: "arcane_bolt", changes: { power: 0.2 }, inspectNote: "专精强化：伤害倍率提高。" }, { type: "skill_mod", skillId: "meteor", changes: { power: 0.3, cost: -1 }, inspectNote: "专精强化：伤害倍率提高，法力消耗降低 1。" }] },
        ],
      },
      {
        id: "mage_frostweave",
        name: "霜织路线",
        summary: "让控场和回蓝更稳，把爆发节奏拉得更长。",
        nodes: [
          { id: "mage_frostweave_mind", name: "寒思维系", cost: 1, summary: "法力上限 +8，防御 +1。", effects: [{ type: "stat", stat: "maxMp", amount: 8 }, { type: "stat", stat: "defense", amount: 1 }] },
          { id: "mage_frostweave_skill", name: "冰棱壁垒", cost: 1, requires: ["mage_frostweave_mind"], summary: "解锁主动技能「冰棱壁垒」。", effects: [{ type: "unlock_skill", skillId: "ice_barrier" }] },
          { id: "mage_frostweave_mastery", name: "霜境支配", cost: 2, requires: ["mage_frostweave_skill"], summary: "冰环更强，冥想更容易把法力和节奏同时拉回。", effects: [{ type: "skill_mod", skillId: "frost_nova", changes: { power: 0.18, slow: 1 }, inspectNote: "专精强化：伤害更高且减速更强。" }, { type: "skill_mod", skillId: "meditate", changes: { restoreMp: 3, guard: 0.1 }, inspectNote: "专精强化：额外回复法力并提高减伤。" }] },
        ],
      },
    ],
  },
  ranger: {
    tracks: [
      {
        id: "ranger_marksman",
        name: "鹰眼路线",
        summary: "强化精准打点和窗口爆发，适合更主动的收割打法。",
        nodes: [
          { id: "ranger_marksman_eye", name: "精准校准", cost: 1, summary: "攻击 +2，专注上限 +1。", effects: [{ type: "stat", stat: "attack", amount: 2 }, { type: "resource_max", amount: 1 }] },
          { id: "ranger_marksman_skill", name: "贯心矢", cost: 1, requires: ["ranger_marksman_eye"], summary: "解锁主动技能「贯心矢」。", effects: [{ type: "unlock_skill", skillId: "piercing_shot" }] },
          { id: "ranger_marksman_mastery", name: "终点压制", cost: 2, requires: ["ranger_marksman_skill"], summary: "瞄准射击和箭雨在收尾时更有威胁。", effects: [{ type: "skill_mod", skillId: "aimed_shot", changes: { power: 0.25 }, inspectNote: "专精强化：伤害倍率提高。" }, { type: "skill_mod", skillId: "volley", changes: { power: 0.2, resourceCost: -1 }, inspectNote: "专精强化：箭雨更强且专注消耗降低 1。" }] },
        ],
      },
      {
        id: "ranger_trapper",
        name: "狩猎路线",
        summary: "把战斗拖进持续压制和拉扯节奏，让毒和续航都更有价值。",
        nodes: [
          { id: "ranger_trapper_field", name: "野外求生", cost: 1, summary: "生命上限 +10，速度 +1。", effects: [{ type: "stat", stat: "maxHp", amount: 10 }, { type: "stat", stat: "speed", amount: 1 }] },
          { id: "ranger_trapper_skill", name: "蛇影追猎", cost: 1, requires: ["ranger_trapper_field"], summary: "解锁主动技能「蛇影追猎」。", effects: [{ type: "unlock_skill", skillId: "serpent_trail" }] },
          { id: "ranger_trapper_mastery", name: "猎场经营", cost: 2, requires: ["ranger_trapper_skill"], summary: "毒箭与应急包扎更适合打长线。", effects: [{ type: "skill_mod", skillId: "poison_arrow", changes: { poisonDamage: 3, poisonTurns: 1 }, inspectNote: "专精强化：中毒更痛且持续更久。" }, { type: "skill_mod", skillId: "first_aid", changes: { power: -0.2 }, inspectNote: "专精强化：恢复倍率提高。" }] },
        ],
      },
    ],
  },
  cleric: {
    tracks: [
      {
        id: "cleric_zealot",
        name: "审判路线",
        summary: "让惩戒技能更快进入高压区间，稳住后立刻转输出。",
        nodes: [
          { id: "cleric_zealot_fire", name: "神圣锋芒", cost: 1, summary: "攻击 +2，审判印记上限 +1。", effects: [{ type: "stat", stat: "attack", amount: 2 }, { type: "resource_max", amount: 1 }] },
          { id: "cleric_zealot_skill", name: "圣枪裁决", cost: 1, requires: ["cleric_zealot_fire"], summary: "解锁主动技能「圣枪裁决」。", effects: [{ type: "unlock_skill", skillId: "sacred_lance" }] },
          { id: "cleric_zealot_mastery", name: "重审之刻", cost: 2, requires: ["cleric_zealot_skill"], summary: "圣击和圣裁在终结阶段更有压迫力。", effects: [{ type: "skill_mod", skillId: "smite", changes: { power: 0.2 }, inspectNote: "专精强化：伤害倍率提高。" }, { type: "skill_mod", skillId: "judgment", changes: { power: 0.25, resourceCost: -1 }, inspectNote: "专精强化：圣裁更强且印记消耗降低 1。" }] },
        ],
      },
      {
        id: "cleric_sanctuary",
        name: "护誓路线",
        summary: "强化回复和庇护，把战斗拖进自己最舒适的稳定区。",
        nodes: [
          { id: "cleric_sanctuary_grace", name: "恩典积蓄", cost: 1, summary: "生命上限 +12，法力上限 +6。", effects: [{ type: "stat", stat: "maxHp", amount: 12 }, { type: "stat", stat: "maxMp", amount: 6 }] },
          { id: "cleric_sanctuary_skill", name: "恩典潮汐", cost: 1, requires: ["cleric_sanctuary_grace"], summary: "解锁主动技能「恩典潮汐」。", effects: [{ type: "unlock_skill", skillId: "grace_tide" }] },
          { id: "cleric_sanctuary_mastery", name: "静誓赐福", cost: 2, requires: ["cleric_sanctuary_skill"], summary: "恢复术与庇护更容易把节奏拉回来。", effects: [{ type: "skill_mod", skillId: "heal", changes: { power: -0.25 }, inspectNote: "专精强化：恢复倍率提高。" }, { type: "skill_mod", skillId: "sanctuary", changes: { guard: 0.15, power: -0.12 }, inspectNote: "专精强化：减伤和恢复同时提高。" }] },
        ],
      },
    ],
  },
  rogue: {
    tracks: [
      {
        id: "rogue_assassin",
        name: "暗刃路线",
        summary: "把先手和斩杀能力推到极致，追求最短窗口内结束战斗。",
        nodes: [
          { id: "rogue_assassin_edge", name: "致命身法", cost: 1, summary: "攻击 +2，连击点上限 +1。", effects: [{ type: "stat", stat: "attack", amount: 2 }, { type: "resource_max", amount: 1 }] },
          { id: "rogue_assassin_skill", name: "潜袭处决", cost: 1, requires: ["rogue_assassin_edge"], summary: "解锁主动技能「潜袭处决」。", effects: [{ type: "unlock_skill", skillId: "ambush" }] },
          { id: "rogue_assassin_mastery", name: "影中裁断", cost: 2, requires: ["rogue_assassin_skill"], summary: "背刺与影袭乱舞更适合一击收尾。", effects: [{ type: "skill_mod", skillId: "backstab", changes: { power: 0.25, bonusFirst: 0.1 }, inspectNote: "专精强化：伤害和先手收益提高。" }, { type: "skill_mod", skillId: "shadow_flurry", changes: { power: 0.2 }, inspectNote: "专精强化：终结伤害提高。" }] },
        ],
      },
      {
        id: "rogue_trickster",
        name: "诡道路线",
        summary: "通过规避和中毒维持主动权，失误后也能迅速把节奏拉回。",
        nodes: [
          { id: "rogue_trickster_flow", name: "诡步循环", cost: 1, summary: "速度 +2，法力上限 +4。", effects: [{ type: "stat", stat: "speed", amount: 2 }, { type: "stat", stat: "maxMp", amount: 4 }] },
          { id: "rogue_trickster_skill", name: "戏法步", cost: 1, requires: ["rogue_trickster_flow"], summary: "解锁主动技能「戏法步」。", effects: [{ type: "unlock_skill", skillId: "trick_step" }] },
          { id: "rogue_trickster_mastery", name: "毒幕经营", cost: 2, requires: ["rogue_trickster_skill"], summary: "烟幕步与淬毒刃在拉扯战里更有价值。", effects: [{ type: "skill_mod", skillId: "smoke_step", changes: { guard: 0.15 }, inspectNote: "专精强化：减伤提高。" }, { type: "skill_mod", skillId: "venom_cut", changes: { poisonDamage: 3, poisonTurns: 1 }, inspectNote: "专精强化：持续伤害更高且持续更久。" }] },
        ],
      },
    ],
  },
  paladin: {
    tracks: [
      {
        id: "paladin_crusader",
        name: "圣罚路线",
        summary: "通过更强的输出和更短的充能消耗，把稳态优势转成更快斩杀。",
        nodes: [
          { id: "paladin_crusader_fervor", name: "裁决热忱", cost: 1, summary: "攻击 +2，神圣充能上限 +1。", effects: [{ type: "stat", stat: "attack", amount: 2 }, { type: "resource_max", amount: 1 }] },
          { id: "paladin_crusader_skill", name: "圣誓裁刃", cost: 1, requires: ["paladin_crusader_fervor"], summary: "解锁主动技能「圣誓裁刃」。", effects: [{ type: "unlock_skill", skillId: "verdict_blade" }] },
          { id: "paladin_crusader_mastery", name: "誓言追击", cost: 2, requires: ["paladin_crusader_skill"], summary: "光耀斩和处决印记的输出价值更高。", effects: [{ type: "skill_mod", skillId: "radiant_slash", changes: { power: 0.2 }, inspectNote: "专精强化：伤害倍率提高。" }, { type: "skill_mod", skillId: "execution_seal", changes: { power: 0.25, resourceCost: -1 }, inspectNote: "专精强化：处决威力提高且充能消耗降低 1。" }] },
        ],
      },
      {
        id: "paladin_templar",
        name: "壁垒路线",
        summary: "通过更强的减伤和回复稳住长线，把每回合都变成能接受的交换。",
        nodes: [
          { id: "paladin_templar_wall", name: "神圣壁障", cost: 1, summary: "生命上限 +14，防御 +2。", effects: [{ type: "stat", stat: "maxHp", amount: 14 }, { type: "stat", stat: "defense", amount: 2 }] },
          { id: "paladin_templar_skill", name: "圣域堡垒", cost: 1, requires: ["paladin_templar_wall"], summary: "解锁主动技能「圣域堡垒」。", effects: [{ type: "unlock_skill", skillId: "holy_bulwark" }] },
          { id: "paladin_templar_mastery", name: "持誓守护", cost: 2, requires: ["paladin_templar_skill"], summary: "神圣壁垒与圣光恢复更适合拖进稳态优势。", effects: [{ type: "skill_mod", skillId: "aegis", changes: { guard: 0.15 }, inspectNote: "专精强化：减伤提高。" }, { type: "skill_mod", skillId: "holy_heal", changes: { power: -0.2 }, inspectNote: "专精强化：恢复倍率提高。" }] },
        ],
      },
    ],
  },
  druid: {
    tracks: [
      {
        id: "druid_bloom",
        name: "繁花路线",
        summary: "围绕持续恢复和状态转化做文章，让整场战斗都在滚雪球。",
        nodes: [
          { id: "druid_bloom_seed", name: "生机萌发", cost: 1, summary: "法力上限 +6，自然印记上限 +1。", effects: [{ type: "stat", stat: "maxMp", amount: 6 }, { type: "resource_max", amount: 1 }] },
          { id: "druid_bloom_skill", name: "孢群爆发", cost: 1, requires: ["druid_bloom_seed"], summary: "解锁主动技能「孢群爆发」。", effects: [{ type: "unlock_skill", skillId: "sporeburst" }] },
          { id: "druid_bloom_mastery", name: "月潮回响", cost: 2, requires: ["druid_bloom_skill"], summary: "回春和月华绽放在长线中更值钱。", effects: [{ type: "skill_mod", skillId: "rejuvenation", changes: { regenValue: 4, regenTurns: 1 }, inspectNote: "专精强化：持续恢复更高且持续更久。" }, { type: "skill_mod", skillId: "lunar_bloom", changes: { power: -0.25, resourceCost: -1 }, inspectNote: "专精强化：治疗更强且印记消耗降低 1。" }] },
        ],
      },
      {
        id: "druid_wild",
        name: "兽性路线",
        summary: "让德鲁伊在铺垫之外也拥有更主动的压迫手段。",
        nodes: [
          { id: "druid_wild_hide", name: "坚木躯壳", cost: 1, summary: "生命上限 +12，攻击 +1，防御 +1。", effects: [{ type: "stat", stat: "maxHp", amount: 12 }, { type: "stat", stat: "attack", amount: 1 }, { type: "stat", stat: "defense", amount: 1 }] },
          { id: "druid_wild_skill", name: "野性扑击", cost: 1, requires: ["druid_wild_hide"], summary: "解锁主动技能「野性扑击」。", effects: [{ type: "unlock_skill", skillId: "wild_pounce" }] },
          { id: "druid_wild_mastery", name: "林野压制", cost: 2, requires: ["druid_wild_skill"], summary: "藤蔓鞭笞和树肤在正面交换里更有统治力。", effects: [{ type: "skill_mod", skillId: "thorn_whip", changes: { power: 0.2 }, inspectNote: "专精强化：伤害倍率提高。" }, { type: "skill_mod", skillId: "barkskin", changes: { guard: 0.15 }, inspectNote: "专精强化：减伤提高。" }] },
        ],
      },
    ],
  },
};

const player = JSON.parse(JSON.stringify(PLAYER_TEMPLATE));
let externalRelicResolver = null;

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setRelicResolver(resolver) {
  externalRelicResolver = typeof resolver === "function" ? resolver : null;
  refreshBuildSnapshot();
}

function resetPlayerToTemplate() {
  Object.assign(player, deepClone(PLAYER_TEMPLATE));
}

function createClassResourceState(classDef) {
  if (!classDef || !classDef.resourceConfig) {
    return deepClone(PLAYER_TEMPLATE.classResource);
  }
  return {
    id: classDef.resourceConfig.id,
    label: classDef.resourceConfig.label,
    shortLabel: classDef.resourceConfig.shortLabel || classDef.resourceConfig.label,
    current: 0,
    max: classDef.resourceConfig.max || 0,
    colorClass: classDef.resourceConfig.colorClass || "resource-neutral",
    description: classDef.resourceConfig.description || "",
  };
}

function createSpecializationState() {
  return deepClone(PLAYER_TEMPLATE.specialization);
}

function getSpecializationTree(classId) {
  return specializationTrees[classId] || { tracks: [] };
}

function findSpecializationTrack(trackId, classId) {
  const tree = getSpecializationTree(classId || player.classId);
  return (tree.tracks || []).find(function findTrack(track) {
    return track.id === trackId;
  }) || null;
}

function findSpecializationNode(trackId, nodeId, classId) {
  const track = findSpecializationTrack(trackId, classId);
  if (!track) {
    return null;
  }
  return (track.nodes || []).find(function findNode(node) {
    return node.id === nodeId;
  }) || null;
}

function hasUnlockedNode(nodeId) {
  return Array.isArray(player.specialization && player.specialization.unlockedNodeIds)
    && player.specialization.unlockedNodeIds.includes(nodeId);
}

function unlockSkillById(skillId) {
  if (!skillId || player.unlockedSkills.includes(skillId)) {
    return false;
  }
  player.unlockedSkills.push(skillId);
  return true;
}

function applyImmediateSpecializationEffect(effect) {
  if (!effect) {
    return;
  }
  if (effect.type === "stat" && effect.stat && typeof player[effect.stat] === "number") {
    player[effect.stat] += effect.amount || 0;
    if (effect.stat === "maxHp") {
      player.hp = clamp(player.hp + (effect.amount || 0), 1, player.maxHp);
    } else if (effect.stat === "maxMp") {
      player.mp = clamp(player.mp + (effect.amount || 0), 0, player.maxMp);
    }
    return;
  }
  if (effect.type === "resource_max" && player.classResource && player.classResource.id) {
    player.classResource.max += effect.amount || 0;
    player.classResource.current = clamp(player.classResource.current, 0, player.classResource.max);
    return;
  }
  if (effect.type === "unlock_skill") {
    unlockSkillById(effect.skillId);
  }
}

function getSpecializationTracks(classId) {
  const tree = getSpecializationTree(classId || player.classId);
  return (tree.tracks || []).map(function mapTrack(track) {
    return {
      id: track.id,
      name: track.name,
      summary: track.summary,
      nodes: (track.nodes || []).map(function mapNode(node) {
        const requirements = node.requires || [];
        const unlocked = hasUnlockedNode(node.id);
        const available = requirements.every(function meetsRequirement(requiredId) {
          return hasUnlockedNode(requiredId);
        });
        return {
          id: node.id,
          name: node.name,
          summary: node.summary,
          cost: node.cost || 1,
          requires: requirements.slice(),
          unlocked: unlocked,
          available: available,
          effects: deepClone(node.effects || []),
        };
      }),
    };
  });
}

function getUnlockedSpecializationNodes() {
  const tracks = getSpecializationTracks();
  const nodes = [];
  tracks.forEach(function eachTrack(track) {
    track.nodes.forEach(function eachNode(node) {
      if (node.unlocked) {
        nodes.push({
          id: node.id,
          name: node.name,
          summary: node.summary,
          cost: node.cost,
          trackId: track.id,
          trackName: track.name,
          effects: deepClone(node.effects || []),
        });
      }
    });
  });
  return nodes;
}

function collectSkillModifiers(skillId) {
  const modifiers = [];
  getUnlockedSpecializationNodes().forEach(function eachNode(node) {
    (node.effects || []).forEach(function eachEffect(effect) {
      if (effect.type === "skill_mod" && effect.skillId === skillId) {
        modifiers.push(effect);
      }
    });
  });
  return modifiers;
}

function createSkillTagSet(skill) {
  const tagSet = [];
  (skill.inspectTags || []).forEach(function eachTag(tag) {
    if (!tagSet.includes(tag)) {
      tagSet.push(tag);
    }
  });
  if (skill.type && !tagSet.includes(skill.type)) {
    tagSet.push(skill.type);
  }
  if (skill.effect && !tagSet.includes(skill.effect)) {
    tagSet.push(skill.effect);
  }
  return tagSet;
}

function inferActionType(skill) {
  if (skill.actionType) {
    return skill.actionType;
  }
  if (skill.id === "attack") {
    return "basic";
  }
  return "skill";
}

function inferBaseDelay(skill) {
  if (typeof skill.baseDelay === "number") {
    return skill.baseDelay;
  }
  if (skill.id === "attack") {
    return 52;
  }
  if (skill.id === "defend") {
    return 42;
  }
  let delay = 44;
  if (typeof skill.cost === "number") {
    delay += skill.cost * 2;
  }
  if (skill.type === "magic") {
    delay += 3;
  }
  if (skill.effect === "heal" || skill.effect === "guard_heal" || skill.effect === "regen") {
    delay += 2;
  }
  if (skill.effect === "guard" || skill.effect === "restore_mp" || skill.effect === "buff_attack") {
    delay -= 2;
  }
  if (typeof skill.power === "number" && skill.power >= 1.6) {
    delay += 8;
  }
  return clamp(Math.round(delay), 36, 88);
}

function inferAdvanceSelf(skill) {
  if (typeof skill.advanceSelf === "number") {
    return skill.advanceSelf;
  }
  if (skill.effect === "guard" || skill.effect === "restore_mp") {
    return 8;
  }
  if (skill.effect === "buff_attack") {
    return 5;
  }
  if (skill.bonusFirst) {
    return 6;
  }
  return 0;
}

function inferDelayTarget(skill) {
  if (typeof skill.delayTarget === "number") {
    return skill.delayTarget;
  }
  if (typeof skill.slow === "number" && skill.slow > 0) {
    return skill.slow * 6;
  }
  if (skill.effect === "poison") {
    return 4;
  }
  return 0;
}

function inferUltimateChargeGain(skill) {
  if (typeof skill.ultimateChargeGain === "number") {
    return skill.ultimateChargeGain;
  }
  if (skill.id === "attack" || skill.id === "defend") {
    return 1;
  }
  if (skill.resourceCost) {
    return 3;
  }
  return 2;
}

function collectRelicSkillModifiers(skill) {
  if (!externalRelicResolver) {
    return [];
  }
  const skillTags = createSkillTagSet(skill);
  const modifiers = [];
  (player.relics || []).forEach(function eachRelic(relicId) {
    const relic = externalRelicResolver(relicId);
    if (!relic || !Array.isArray(relic.synergies)) {
      return;
    }
    relic.synergies.forEach(function eachSynergy(synergy) {
      const matchAny = synergy.matchAnyTags || [];
      const matches = matchAny.length === 0 || matchAny.some(function matchTag(tag) {
        return skillTags.includes(tag);
      });
      if (matches) {
        modifiers.push(synergy);
      }
    });
  });
  return modifiers;
}

function refreshBuildSnapshot() {
  const unlockedNodes = getUnlockedSpecializationNodes();
  const trackNames = [];
  const unlockedSkillIds = [];
  const relicTags = [];

  unlockedNodes.forEach(function eachNode(node) {
    if (!trackNames.includes(node.trackName)) {
      trackNames.push(node.trackName);
    }
    (node.effects || []).forEach(function eachEffect(effect) {
      if (effect.type === "unlock_skill" && effect.skillId && !unlockedSkillIds.includes(effect.skillId)) {
        unlockedSkillIds.push(effect.skillId);
      }
    });
  });

  if (externalRelicResolver) {
    (player.relics || []).forEach(function eachRelic(relicId) {
      const relic = externalRelicResolver(relicId);
      (relic && relic.tags ? relic.tags : []).forEach(function eachTag(tag) {
        if (!relicTags.includes(tag)) {
          relicTags.push(tag);
        }
      });
    });
  }

  player.buildSnapshot = {
    activeTrackNames: trackNames,
    unlockedNodeNames: unlockedNodes.map(function mapNode(node) {
      return node.name;
    }),
    unlockedSkillIds: unlockedSkillIds,
    relicTags: relicTags,
  };
}

function applyClassToPlayer(classId) {
  const classDef = classes[classId];
  if (!classDef) {
    return false;
  }
  resetPlayerToTemplate();
  player.classId = classDef.id;
  player.className = classDef.name;
  player.classDescription = classDef.description;
  player.classBuildNote = classDef.buildNote || "";
  player.classResource = createClassResourceState(classDef);
  player.specialization = createSpecializationState();
  player.maxHp += classDef.statBonus.maxHp;
  player.maxMp += classDef.statBonus.maxMp;
  player.attack += classDef.statBonus.attack;
  player.defense += classDef.statBonus.defense;
  player.speed += classDef.statBonus.speed;
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  player.unlockedSkills = classDef.starterSkills.slice();
  player.learnedUltimate = false;
  refreshBuildSnapshot();
  return true;
}

function unlockClassSkillIfNeeded() {
  if (!player.classId) {
    return null;
  }
  const classDef = classes[player.classId];
  if (!classDef || player.learnedUltimate || player.level < 3) {
    return null;
  }
  if (!player.unlockedSkills.includes(classDef.unlockSkill)) {
    player.unlockedSkills.push(classDef.unlockSkill);
  }
  player.learnedUltimate = true;
  refreshBuildSnapshot();
  return classDef.unlockSkill;
}

function getPlayerSkills() {
  return player.unlockedSkills.map(function mapSkill(skillId) {
    return skills[skillId];
  }).filter(Boolean);
}

function getResolvedSkill(skillId) {
  const baseSkill = skills[skillId];
  if (!baseSkill) {
    return null;
  }
  const resolvedSkill = deepClone(baseSkill);
  const inspectNotes = [];

  collectSkillModifiers(skillId).forEach(function applyModifier(modifier) {
    const changes = modifier.changes || {};
    Object.keys(changes).forEach(function eachKey(key) {
      if (typeof changes[key] === "number") {
        const previous = typeof resolvedSkill[key] === "number" ? resolvedSkill[key] : 0;
        resolvedSkill[key] = previous + changes[key];
      } else {
        resolvedSkill[key] = changes[key];
      }
    });
    if (modifier.inspectNote) {
      inspectNotes.push(modifier.inspectNote);
    }
  });

  collectRelicSkillModifiers(resolvedSkill).forEach(function applyRelicModifier(modifier) {
    const changes = modifier.changes || {};
    Object.keys(changes).forEach(function eachKey(key) {
      if (typeof changes[key] === "number") {
        const previous = typeof resolvedSkill[key] === "number" ? resolvedSkill[key] : 0;
        resolvedSkill[key] = previous + changes[key];
      } else {
        resolvedSkill[key] = changes[key];
      }
    });
    if (modifier.inspectNote) {
      inspectNotes.push(modifier.inspectNote);
    }
  });

  resolvedSkill.cost = Math.max(0, resolvedSkill.cost || 0);
  if (typeof resolvedSkill.resourceCost === "number") {
    resolvedSkill.resourceCost = Math.max(0, resolvedSkill.resourceCost);
  }
  if (typeof resolvedSkill.resourceGain === "number") {
    resolvedSkill.resourceGain = Math.max(0, resolvedSkill.resourceGain);
  }
  resolvedSkill.actionType = inferActionType(resolvedSkill);
  resolvedSkill.baseDelay = inferBaseDelay(resolvedSkill);
  resolvedSkill.advanceSelf = Math.max(0, inferAdvanceSelf(resolvedSkill));
  resolvedSkill.delayTarget = Math.max(0, inferDelayTarget(resolvedSkill));
  resolvedSkill.speedScale = typeof resolvedSkill.speedScale === "number" ? resolvedSkill.speedScale : 1;
  resolvedSkill.ultimateChargeGain = Math.max(0, inferUltimateChargeGain(resolvedSkill));
  resolvedSkill.ultimateChargeCost = Math.max(0, typeof resolvedSkill.ultimateChargeCost === "number" ? resolvedSkill.ultimateChargeCost : 0);
  if (inspectNotes.length) {
    resolvedSkill.inspectNotes = inspectNotes;
  }
  return resolvedSkill;
}

function getResolvedPlayerSkills() {
  return player.unlockedSkills.map(function mapSkill(skillId) {
    return getResolvedSkill(skillId);
  }).filter(Boolean);
}

function canUnlockSpecializationNode(trackId, nodeId) {
  if (!player.classId) {
    return { ok: false, reason: "请先选择职业。" };
  }
  const node = findSpecializationNode(trackId, nodeId);
  if (!node) {
    return { ok: false, reason: "未找到对应的专精节点。" };
  }
  if (hasUnlockedNode(node.id)) {
    return { ok: false, reason: "该专精节点已经解锁。" };
  }
  const requirements = node.requires || [];
  const unmet = requirements.find(function findRequirement(requiredId) {
    return !hasUnlockedNode(requiredId);
  });
  if (unmet) {
    return { ok: false, reason: "还没有解锁前置专精节点。" };
  }
  if (player.skillPoints < (node.cost || 1)) {
    return { ok: false, reason: "技能点不足。" };
  }
  return { ok: true, node: node };
}

function unlockSpecializationNode(trackId, nodeId) {
  const check = canUnlockSpecializationNode(trackId, nodeId);
  if (!check.ok) {
    return check;
  }
  const track = findSpecializationTrack(trackId);
  const node = check.node;
  const cost = node.cost || 1;
  player.skillPoints -= cost;
  player.specialization.spentPoints += cost;
  player.specialization.unlockedNodeIds.push(node.id);
  (node.effects || []).forEach(applyImmediateSpecializationEffect);
  refreshBuildSnapshot();
  return {
    ok: true,
    track: { id: track.id, name: track.name, summary: track.summary },
    node: { id: node.id, name: node.name, summary: node.summary, cost: cost },
  };
}

function gainClassResource(amount) {
  if (!player.classResource || !player.classResource.id) {
    return 0;
  }
  const delta = amount || 0;
  if (delta <= 0) {
    return 0;
  }
  const previous = player.classResource.current;
  player.classResource.current = clamp(player.classResource.current + delta, 0, player.classResource.max);
  return player.classResource.current - previous;
}

function spendClassResource(amount) {
  if (!player.classResource || !player.classResource.id) {
    return false;
  }
  const delta = amount || 0;
  if (delta <= 0) {
    return true;
  }
  if (player.classResource.current < delta) {
    return false;
  }
  player.classResource.current -= delta;
  return true;
}

function getClassResource() {
  return player.classResource || deepClone(PLAYER_TEMPLATE.classResource);
}

function spendSkillPoint(statKey) {
  if (player.skillPoints <= 0) {
    return false;
  }
  if (statKey === "maxHp") {
    player.maxHp += 14;
    player.hp += 14;
  } else if (statKey === "maxMp") {
    player.maxMp += 8;
    player.mp += 8;
  } else if (statKey === "attack") {
    player.attack += 3;
  } else if (statKey === "defense") {
    player.defense += 2;
  } else if (statKey === "speed") {
    player.speed += 1;
  } else {
    return false;
  }
  player.skillPoints -= 1;
  return true;
}

function applyStatBonus(bonus) {
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

function removeStatBonus(bonus) {
  if (!bonus) {
    return;
  }
  player.maxHp -= bonus.maxHp || 0;
  player.maxHp = Math.max(1, player.maxHp);
  player.hp = clamp(player.hp, 1, player.maxHp);
  player.maxMp -= bonus.maxMp || 0;
  player.maxMp = Math.max(0, player.maxMp);
  player.mp = clamp(player.mp, 0, player.maxMp);
  player.attack -= bonus.attack || 0;
  player.defense -= bonus.defense || 0;
  player.speed -= bonus.speed || 0;
}

function buyEquipment(item) {
  if (!item || player.gold < item.cost) {
    return false;
  }
  if (player.equipment.some(function hasEquipment(entry) {
    return typeof entry === "string" ? entry === item.baseId : entry && entry.baseId === item.baseId;
  })) {
    return false;
  }
  player.gold -= item.cost;
  player.equipment.push(deepClone(item));
  applyStatBonus(item.bonus);
  refreshBuildSnapshot();
  return true;
}

function canAffordMaterialCost(materials) {
  const costs = materials || {};
  return Object.keys(costs).every(function everyMaterial(name) {
    return (player.materials[name] || 0) >= costs[name];
  });
}

function spendMaterialCost(materials) {
  Object.keys(materials || {}).forEach(function eachMaterial(name) {
    player.materials[name] = Math.max(0, (player.materials[name] || 0) - materials[name]);
    if (player.materials[name] <= 0) {
      delete player.materials[name];
    }
  });
}

function upgradeEquipment(instanceId, nextItem) {
  const equipmentIndex = player.equipment.findIndex(function findEquipment(entry) {
    return entry && entry.instanceId === instanceId;
  });
  if (equipmentIndex === -1) {
    return { ok: false, reason: "未找到要强化的装备。" };
  }
  const currentItem = player.equipment[equipmentIndex];
  if (!currentItem.upgradeCost) {
    return { ok: false, reason: "这件装备已经强化到上限。" };
  }
  if (player.gold < currentItem.upgradeCost.gold) {
    return { ok: false, reason: "金币不足。" };
  }
  if (!canAffordMaterialCost(currentItem.upgradeCost.materials)) {
    return { ok: false, reason: "强化材料不足。" };
  }
  if (!nextItem || nextItem.instanceId !== currentItem.instanceId) {
    return { ok: false, reason: "强化结果无效。" };
  }

  player.gold -= currentItem.upgradeCost.gold;
  spendMaterialCost(currentItem.upgradeCost.materials);
  removeStatBonus(currentItem.bonus);
  player.equipment[equipmentIndex] = deepClone(nextItem);
  applyStatBonus(nextItem.bonus);
  refreshBuildSnapshot();
  return { ok: true, item: deepClone(nextItem) };
}

window.GameEntities = {
  player,
  skills,
  classes,
  specializationTrees,
  PLAYER_TEMPLATE,
  applyClassToPlayer,
  unlockClassSkillIfNeeded,
  getPlayerSkills,
  getResolvedSkill,
  getResolvedPlayerSkills,
  setRelicResolver,
  refreshBuildSnapshot,
  getSpecializationTracks,
  getUnlockedSpecializationNodes,
  unlockSpecializationNode,
  gainClassResource,
  spendClassResource,
  getClassResource,
  spendSkillPoint,
  buyEquipment,
  upgradeEquipment,
};
