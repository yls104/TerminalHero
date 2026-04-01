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
  professionProfile: {
    mechanicName: "",
    mechanicSummary: "",
    battleLoop: [],
    decisionAxes: [],
    uiSignals: [],
    runtime: {
      label: "",
      shortLabel: "",
      max: 0,
      gainSkills: [],
      spendSkills: [],
      empoweredSkills: {},
      statuses: {},
      readyHint: "",
    },
  },
  professionState: {
    label: "",
    shortLabel: "",
    current: 0,
    max: 0,
    ready: false,
    previewOnly: true,
    valueText: "",
    statusText: "",
    hintText: "",
    activeSkillIds: [],
  },
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
    combatFocuses: [],
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
  slash: { id: "slash", name: "裂风斩", type: "physical", cost: 3, power: 1.42, effect: "damage", poiseDamage: 5, delayTarget: 6, bonusVsChargingRatio: 0.22, poiseBonusVsCharging: 3, description: "战士的起手压制技，适合先把敌人推进到失衡边缘。", resourceGain: 2, inspectTags: ["战士", "起手压制", "打断", "压制推进"] },
  battle_cry: { id: "battle_cry", name: "战吼", type: "utility", cost: 4, effect: "buff_attack", buff: 0.35, turns: 2, advanceSelf: 6, description: "消耗少量压制值立起爆发窗口，让下一轮重击更值钱。", resourceCost: 1, inspectTags: ["战士", "窗口启动", "爆发准备"] },
  earthshatter: { id: "earthshatter", name: "裂地猛击", type: "physical", cost: 7, power: 1.95, effect: "damage", poiseDamage: 7, breakBonusDamageRatio: 0.58, bonusVsBrokenRatio: 0.24, splash: 0.1, description: "战士的核心处决技，把攒好的压制值一次性兑现成重击收益。", resourceCost: 3, inspectTags: ["战士", "终结", "处决", "爆发收尾"] },
  guard_break: { id: "guard_break", name: "崩山断", type: "physical", cost: 6, power: 1.45, effect: "damage", poiseDamage: 9, delayTarget: 12, breakBonusDamageRatio: 0.42, bonusVsChargingRatio: 0.32, bonusVsBrokenRatio: 0.18, poiseBonusVsCharging: 4, resourceCost: 2, description: "破军专精的架势击穿技，专门用来拆蓄力、开失衡、接处决。", inspectTags: ["战士", "专精", "打断", "处决", "压制推进"] },
  unyielding_roar: { id: "unyielding_roar", name: "不屈战吼", type: "utility", cost: 5, power: -0.6, effect: "guard_heal", guard: 0.4, advanceSelf: 8, description: "坚城专精的回稳手段，先稳住血线，再重建下一轮压制。", resourceGain: 2, inspectTags: ["战士", "专精", "回稳换压", "续战"] },
  arcane_bolt: { id: "arcane_bolt", name: "奥术飞弹", type: "magic", cost: 4, power: 1.3, effect: "damage", advanceSelf: 6, description: "法师的起手过载技，用较轻的施法成本把后续爆发窗口铺出来。", resourceGain: 2, inspectTags: ["法师", "起手过载", "慢轴铺垫"] },
  frost_nova: { id: "frost_nova", name: "冰环", type: "magic", cost: 5, power: 1.08, effect: "damage", poiseDamage: 4, delayTarget: 16, bonusVsChargingRatio: 0.22, poiseBonusVsCharging: 3, slow: 2, description: "法师的控场拖轴技，既能拆蓄力，也能把下一拍危险往后拖。", resourceGain: 2, inspectTags: ["法师", "反蓄力", "控场拖轴"] },
  meditate: { id: "meditate", name: "冥想", type: "utility", cost: 0, effect: "restore_mp", restoreMp: 10, guard: 0.24, advanceSelf: 10, description: "回蓝并重新起势，把慢轴法师重新送回能开窗的节奏。", resourceGain: 1, inspectTags: ["法师", "回蓝起窗", "慢轴铺垫"] },
  meteor: { id: "meteor", name: "陨星术", type: "magic", cost: 9, power: 2.08, effect: "damage", poiseDamage: 6, breakBonusDamageRatio: 0.58, bonusVsChargingRatio: 0.24, bonusVsBrokenRatio: 0.22, description: "法师的核心高耗终结技，专门把过载和窗口一起兑现成一记重砸。", resourceCost: 3, inspectTags: ["法师", "终结", "高耗终结", "窗口爆发"] },
  chain_lightning: { id: "chain_lightning", name: "连锁闪击", type: "magic", cost: 6, power: 1.6, effect: "damage", advanceSelf: 8, resourceCost: 1, description: "炽星专精的连锁爆发法术，适合在窗口中连续追伤。", inspectTags: ["法师", "专精", "窗口爆发", "慢轴铺垫"] },
  ice_barrier: { id: "ice_barrier", name: "冰棱壁垒", type: "utility", cost: 5, power: -0.42, effect: "guard_heal", guard: 0.42, resourceGain: 2, description: "霜织专精的回稳护壁，让法师能一边回稳一边继续储备下一轮施法。", inspectTags: ["法师", "专精", "回蓝起窗", "控场拖轴"] },
  aimed_shot: { id: "aimed_shot", name: "瞄准射击", type: "physical", cost: 3, power: 1.34, effect: "damage", poiseDamage: 4, delayTarget: 12, bonusVsChargingRatio: 0.22, poiseBonusVsCharging: 2, description: "游侠的起手拖轴技，先把敌人的下一拍压后，再决定继续拉开还是追着点杀。", resourceGain: 2, inspectTags: ["游侠", "起手拖轴", "拖轴控场"] },
  poison_arrow: { id: "poison_arrow", name: "毒箭", type: "physical", cost: 4, power: 0.92, effect: "poison", poisonDamage: 8, poisonTurns: 3, delayTarget: 6, description: "游侠的持续压制技，边挂毒边拖节奏，把对手一步步逼进收割线。", resourceGain: 2, inspectTags: ["游侠", "持续压制", "拖轴控场"] },
  first_aid: { id: "first_aid", name: "应急包扎", type: "utility", cost: 3, effect: "heal", power: -0.78, advanceSelf: 8, description: "拉扯中的回稳手段，让游侠能在修血线的同时继续维持自己的回合质量。", resourceGain: 1, inspectTags: ["游侠", "拉扯回稳", "拖轴控场"] },
  volley: { id: "volley", name: "箭雨", type: "physical", cost: 8, power: 1.82, effect: "damage", breakBonusDamageRatio: 0.4, bonusVsBrokenRatio: 0.22, delayTarget: 8, description: "游侠的核心终结技，适合在敌人被拖乱节奏或进入失衡窗口时直接远程收割。", resourceCost: 3, inspectTags: ["游侠", "终结", "收割处决", "爆发收尾"] },
  piercing_shot: { id: "piercing_shot", name: "贯心矢", type: "physical", cost: 5, power: 1.62, effect: "damage", poiseDamage: 6, delayTarget: 10, breakBonusDamageRatio: 0.48, bonusVsBrokenRatio: 0.26, bonusVsChargingRatio: 0.14, resourceCost: 2, description: "鹰眼专精的精确收割技，专门盯住失衡和蓄力破绽做远程点杀。", inspectTags: ["游侠", "专精", "收割处决", "拖轴控场"] },
  serpent_trail: { id: "serpent_trail", name: "蛇影追猎", type: "physical", cost: 5, power: 0.96, effect: "poison", poisonDamage: 9, poisonTurns: 4, delayTarget: 8, resourceCost: 1, description: "狩猎专精的长线压制技，把中毒、拖轴和资源滚动串成一整套猎场循环。", inspectTags: ["游侠", "专精", "持续压制", "拖轴控场"] },
  smite: { id: "smite", name: "圣击", type: "magic", cost: 3, power: 1.2, effect: "damage", description: "牧师的稳态惩戒技，用来在稳定回合里持续积攒审判印记。", resourceGain: 2, inspectTags: ["牧师", "稳态惩戒", "审判积蓄"] },
  heal: { id: "heal", name: "恢复术", type: "magic", cost: 4, power: -1.08, effect: "heal", description: "把恢复直接转成后续收益的基础法术，既保命也为审判做准备。", resourceGain: 2, inspectTags: ["牧师", "恢复转收益", "稳态推进"] },
  sanctuary: { id: "sanctuary", name: "庇护", type: "utility", cost: 5, effect: "guard_heal", guard: 0.42, power: -0.42, description: "庇护回稳技，让牧师在安全回合中稳定攒出下一轮裁决资源。", resourceGain: 2, inspectTags: ["牧师", "庇护回稳", "恢复转收益"] },
  judgment: { id: "judgment", name: "圣裁", type: "magic", cost: 8, power: 1.9, effect: "damage", poiseDamage: 5, breakBonusDamageRatio: 0.52, bonusVsBrokenRatio: 0.24, description: "牧师的核心终结技，把前面铺出来的稳态和审判印记一次收成高额裁决。", resourceCost: 3, inspectTags: ["牧师", "终结", "审判处决", "爆发收尾"] },
  sacred_lance: { id: "sacred_lance", name: "圣枪裁决", type: "magic", cost: 5, power: 1.5, effect: "damage", bonusVsBrokenRatio: 0.22, resourceCost: 2, description: "审判专精的高压追击，用来把审判窗口压得更狠。", inspectTags: ["牧师", "专精", "审判处决", "稳态惩戒"] },
  grace_tide: { id: "grace_tide", name: "恩典潮汐", type: "magic", cost: 6, power: -1.36, effect: "heal", resourceGain: 1, description: "护誓专精的高额恢复浪潮，适合把残局重新稳回自己的节奏。", inspectTags: ["牧师", "专精", "恢复转收益", "庇护回稳"] },
  backstab: { id: "backstab", name: "背刺", type: "physical", cost: 3, power: 1.45, effect: "damage", bonusFirst: 0.22, advanceSelf: 12, description: "盗贼的起手抢轴技，适合先手切入并迅速压近下一拍。", resourceGain: 2, inspectTags: ["盗贼", "起手抢轴", "连段起手", "抢轴连动"] },
  smoke_step: { id: "smoke_step", name: "烟幕步", type: "utility", cost: 3, effect: "guard", guard: 0.62, advanceSelf: 10, description: "用更短的代价换回行动节奏，保证盗贼不会一拍掉速。", resourceGain: 2, inspectTags: ["盗贼", "回合修复", "抢轴连动"] },
  venom_cut: { id: "venom_cut", name: "淬毒刃", type: "physical", cost: 4, power: 0.92, effect: "poison", poisonDamage: 8, poisonTurns: 3, delayTarget: 6, description: "盗贼的连段续压技，用持续伤害和延后收益把对手逼进斩杀线。", resourceGain: 2, inspectTags: ["盗贼", "持续压血", "连段续压"] },
  shadow_flurry: { id: "shadow_flurry", name: "影袭乱舞", type: "physical", cost: 8, power: 1.85, effect: "damage", advanceSelf: 16, breakBonusDamageRatio: 0.44, bonusVsBrokenRatio: 0.24, description: "盗贼的核心终结技，顺着失衡窗口连打两拍，把连击点直接兑现成斩杀。", resourceCost: 3, inspectTags: ["盗贼", "终结", "连击终结", "斩杀处决", "抢轴连动"] },
  ambush: { id: "ambush", name: "潜袭处决", type: "physical", cost: 5, power: 1.6, effect: "damage", advanceSelf: 18, breakBonusDamageRatio: 0.36, bonusFirst: 0.24, bonusVsChargingRatio: 0.2, bonusVsBrokenRatio: 0.24, resourceCost: 2, description: "暗刃专精的高节奏斩杀技，擅长扑向蓄力破绽与失衡残线。", inspectTags: ["盗贼", "专精", "斩杀处决", "抢轴连动"] },
  trick_step: { id: "trick_step", name: "戏法步", type: "utility", cost: 3, effect: "guard", guard: 0.66, advanceSelf: 16, resourceGain: 2, description: "诡道专精的高机动修复技，用一次规避把节奏和连击点一起拿回来。", inspectTags: ["盗贼", "专精", "回合修复", "抢轴连动"] },
  radiant_slash: { id: "radiant_slash", name: "光耀斩", type: "physical", cost: 4, power: 1.28, effect: "damage", poiseDamage: 4, description: "圣骑士的稳态推进技，在安全交换里持续把誓能往上堆。", resourceGain: 2, inspectTags: ["圣骑士", "稳态推进", "誓能积蓄"] },
  aegis: { id: "aegis", name: "神圣壁垒", type: "utility", cost: 4, effect: "guard", guard: 0.62, advanceSelf: 8, description: "防反起势技，用低风险回合把自己送进下一轮更强的誓能窗口。", resourceGain: 2, inspectTags: ["圣骑士", "防反起势", "稳态推进"] },
  holy_heal: { id: "holy_heal", name: "圣光恢复", type: "magic", cost: 5, power: -0.96, effect: "heal", description: "圣骑士的回稳换势技，稳住血线的同时继续累计下一次裁决所需资源。", resourceGain: 2, inspectTags: ["圣骑士", "回稳换势", "誓能积蓄"] },
  execution_seal: { id: "execution_seal", name: "处决印记", type: "magic", cost: 7, power: 1.95, effect: "damage", poiseDamage: 7, breakBonusDamageRatio: 0.62, bonusVsBrokenRatio: 0.28, description: "圣骑士的核心终结技，专门把稳态积蓄的誓能变成一记厚重的处决爆发。", resourceCost: 3, inspectTags: ["圣骑士", "终结", "处决爆发", "稳态推进"] },
  verdict_blade: { id: "verdict_blade", name: "圣誓裁刃", type: "physical", cost: 6, power: 1.68, effect: "damage", poiseDamage: 8, breakBonusDamageRatio: 0.68, bonusVsChargingRatio: 0.2, bonusVsBrokenRatio: 0.3, resourceCost: 2, description: "圣罚专精的高压裁刃，对蓄力和失衡目标都会形成更强的收头压制。", inspectTags: ["圣骑士", "专精", "终结", "处决爆发", "防反起势"] },
  holy_bulwark: { id: "holy_bulwark", name: "圣域堡垒", type: "utility", cost: 6, power: -0.62, effect: "guard_heal", guard: 0.5, resourceGain: 2, description: "壁垒专精的稳态堡垒，让圣骑士能在更厚的防线里继续滚动誓能。", inspectTags: ["圣骑士", "专精", "回稳换势", "防反起势"] },
  thorn_whip: { id: "thorn_whip", name: "藤蔓鞭笞", type: "magic", cost: 3, power: 1.22, effect: "damage", delayTarget: 6, description: "德鲁伊的状态铺场技，用自然牵制先把战场节奏拖进自己的循环。", resourceGain: 2, inspectTags: ["德鲁伊", "状态铺场", "自然牵制"] },
  rejuvenation: { id: "rejuvenation", name: "回春", type: "magic", cost: 4, power: -0.88, effect: "regen", regenValue: 9, regenTurns: 2, description: "持续恢复技能，为德鲁伊的状态轮转提供稳定底座。", resourceGain: 2, inspectTags: ["德鲁伊", "持续恢复", "状态铺场"] },
  barkskin: { id: "barkskin", name: "树肤", type: "utility", cost: 4, effect: "guard", guard: 0.52, advanceSelf: 8, description: "树肤回稳技，让德鲁伊能一边顶住压力，一边继续转动自然印记。", resourceGain: 2, inspectTags: ["德鲁伊", "树肤回稳", "状态铺场"] },
  lunar_bloom: { id: "lunar_bloom", name: "月华绽放", type: "magic", cost: 8, power: 1.8, effect: "damage", poiseDamage: 5, breakBonusDamageRatio: 0.46, bonusVsBrokenRatio: 0.24, description: "德鲁伊的终结转化技，把前面铺开的状态和印记一起炸成一记绽放伤害。", resourceCost: 3, inspectTags: ["德鲁伊", "终结", "转化绽放", "爆发收尾"] },
  sporeburst: { id: "sporeburst", name: "孢群爆发", type: "magic", cost: 5, power: 1.02, effect: "poison", poisonDamage: 9, poisonTurns: 4, resourceCost: 1, description: "繁花专精的状态引爆技，让持续压制真正长成会滚雪球的收益。", inspectTags: ["德鲁伊", "专精", "状态引爆", "持续恢复"] },
  wild_pounce: { id: "wild_pounce", name: "野性扑击", type: "physical", cost: 4, power: 1.56, effect: "damage", advanceSelf: 10, resourceGain: 2, description: "兽性专精的野性追击技，让德鲁伊也能在轮转之外主动扑上去抢节奏。", inspectTags: ["德鲁伊", "专精", "野性追击", "自然牵制"] },
};

const classes = {
  warrior: {
    id: "warrior",
    name: "战士",
    selectable: true,
    refactorStatus: "active",
    refactorLabel: "重构试行",
    refactorSummary: "当前职业系统重构从战士开始，优先验证压制、失衡、处决与资源窗口的统一承接。",
    description: "把敌人压进失衡窗口，再用重击一波带走的正面压迫职业。",
    buildNote: "先用普通攻击、裂风斩与防御姿态积累压制值，再用战吼或裂地猛击把窗口兑现。",
    statBonus: { maxHp: 28, maxMp: -4, attack: 5, defense: 3, speed: -1 },
    starterSkills: ["attack", "slash", "defend", "battle_cry"],
    unlockSkill: "earthshatter",
    resourceConfig: { id: "pressure", label: "压制值", shortLabel: "压制", max: 5, colorClass: "resource-warrior", description: "战士通过稳扎稳打与起手压制积累压制值，再把它换成爆发准备或处决重击。" },
    secondPassProfile: {
      mechanicName: "破军势",
      mechanicSummary: "通过起手压制与守势过渡积势，等成势后把处决技能推入更高收益窗口。",
      battleLoop: ["裂风斩、战吼或防御姿态负责积势", "成势后用裂地猛击或崩山断兑现重击", "兑现后回到回稳换压，准备下一轮窗口"],
      decisionAxes: ["这一拍应该继续积势，还是直接进入处决？", "当前窗口值不值得交掉破军势？", "残局里要不要先靠防御姿态把势补满再出手？"],
      uiSignals: ["详细属性显示破军势当前层数与状态", "构筑手册解释积势、成势与兑现三段循环", "技能检视会在成势时提示裂地猛击与崩山断已被强化"],
      runtime: {
        label: "破军势",
        shortLabel: "势",
        max: 2,
        gainSkills: ["slash", "battle_cry", "defend", "unyielding_roar"],
        spendSkills: ["earthshatter", "guard_break"],
        empoweredSkills: {
          earthshatter: {
            changes: { power: 0.42, poiseDamage: 2, advanceSelf: 8, bonusVsBrokenRatio: 0.1 },
            inspectNote: "破军势已成：裂地猛击获得额外伤害、压制与抢轴收益。",
          },
          guard_break: {
            changes: { power: 0.22, poiseDamage: 2, delayTarget: 6, bonusVsChargingRatio: 0.08 },
            inspectNote: "破军势已成：崩山断的破势、压制与拖轴能力更强。",
          },
        },
        statuses: {
          empty: "尚未成势",
          building: "正在积势",
          ready: "破军势已成",
        },
        readyHint: "现在适合用裂地猛击或崩山断兑现这一轮窗口。",
      },
    },
  },
  mage: {
    id: "mage",
    name: "法师",
    selectable: true,
    refactorStatus: "active",
    refactorLabel: "重构试行",
    refactorSummary: "法师重构试行版已开放，当前围绕起手过载、控场拖轴、回蓝起窗与高耗终结形成闭环。",
    description: "通过慢轴铺垫和高耗爆发把窗口价值放到最大的施法职业。",
    buildNote: "先用奥术飞弹、冰环和冥想把过载与法力调好，再用陨星术在窗口里砸出最大收益。",
    statBonus: { maxHp: -10, maxMp: 20, attack: 1, defense: -1, speed: 0 },
    starterSkills: ["attack", "arcane_bolt", "frost_nova", "meditate"],
    unlockSkill: "meteor",
    resourceConfig: { id: "overload", label: "过载层数", shortLabel: "过载", max: 5, colorClass: "resource-mage", description: "法师通过轻施法、控场和冥想积累过载层数，再把它换成高耗终结与窗口爆发。" },
    secondPassProfile: {
      mechanicName: "过载点火",
      mechanicSummary: "围绕过载层数与高耗兑现建立更清晰的爆发准备节奏。",
      battleLoop: ["轻施法先铺过载", "控场与回蓝把节奏拉到安全窗口", "用高耗终结把点火收益一次性兑现"],
      decisionAxes: ["现在该继续铺过载，还是直接交爆发？", "什么时候值得先冥想而不是继续压输出？", "面对高压敌方意图时要不要牺牲爆发节奏先拖轴？"],
      uiSignals: ["详情面板显示过载点火阶段", "构筑手册解释慢轴铺垫与高耗兑现关系", "后续会在技能检视中提示点火后的高耗强化"],
      runtime: { label: "点火", shortLabel: "火", max: 0, gainSkills: [], spendSkills: [], empoweredSkills: {}, statuses: {}, readyHint: "" },
    },
  },
  ranger: {
    id: "ranger",
    name: "游侠",
    selectable: true,
    refactorStatus: "active",
    refactorLabel: "重构试行",
    refactorSummary: "游侠重构试行版已开放，当前围绕拖轴控场、持续压制、拉扯回稳与远程收割形成闭环。",
    description: "擅长拖乱敌方节奏，再用持续压血和远程收割结束战斗的拉扯型职业。",
    buildNote: "先用瞄准射击和毒箭拖慢敌人，再视血线选择包扎续航或用箭雨直接远程收割。",
    statBonus: { maxHp: 4, maxMp: 6, attack: 3, defense: 0, speed: 2 },
    starterSkills: ["attack", "aimed_shot", "poison_arrow", "first_aid"],
    unlockSkill: "volley",
    resourceConfig: { id: "focus", label: "专注值", shortLabel: "专注", max: 5, colorClass: "resource-ranger", description: "游侠通过拖轴、挂毒和稳定拉扯积累专注值，再把它换成远程收割与精准点杀。" },
    secondPassProfile: {
      mechanicName: "猎线",
      mechanicSummary: "让游侠围绕拖轴、压血与收割窗口形成更强的线路经营感。",
      battleLoop: ["先拖轴并挂持续压制", "观察敌人血线与行动顺位", "在线路成熟时远程收割"],
      decisionAxes: ["继续拉扯还是立刻收割？", "敌人节奏已经被拖慢到什么程度？", "是否需要为了安全先交回稳手段？"],
      uiSignals: ["详情面板显示猎线阶段", "构筑手册解释拖轴与收割的连接点", "后续会在收割技能上提示猎线成熟状态"],
      runtime: { label: "猎线", shortLabel: "线", max: 0, gainSkills: [], spendSkills: [], empoweredSkills: {}, statuses: {}, readyHint: "" },
    },
  },
  cleric: {
    id: "cleric",
    name: "牧师",
    selectable: true,
    refactorStatus: "active",
    refactorLabel: "重构试行",
    refactorSummary: "牧师重构试行版已开放，当前围绕稳态惩戒、恢复转收益、庇护回稳与审判处决形成闭环。",
    description: "先稳住局面，再把恢复和庇护转成裁决收益的稳定推进职业。",
    buildNote: "先用圣击、恢复术和庇护把审判印记堆起来，再找机会用圣裁完成收尾。",
    statBonus: { maxHp: 10, maxMp: 14, attack: 0, defense: 1, speed: 0 },
    starterSkills: ["smite", "heal", "sanctuary", "defend"],
    unlockSkill: "judgment",
    resourceConfig: { id: "judgment", label: "审判印记", shortLabel: "审判", max: 5, colorClass: "resource-cleric", description: "牧师通过惩戒、恢复与庇护积累审判印记，再把它转成高价值的裁决收尾。" },
    secondPassProfile: {
      mechanicName: "审判回响",
      mechanicSummary: "围绕回稳与蓄印后的多段裁决收益继续深化牧师的收束节奏。",
      battleLoop: ["先靠惩戒与恢复稳定蓄印", "在安全回合维持局面", "把回响后的审判收益转成收尾"],
      decisionAxes: ["这一拍先稳态还是先裁决？", "当前印记是否值得立刻兑现？", "是否需要先用庇护换来下一轮更大的裁决窗口？"],
      uiSignals: ["详情面板显示审判回响阶段", "构筑手册解释恢复如何转收益", "后续会提示裁决技能是否进入高收益状态"],
      runtime: { label: "回响", shortLabel: "响", max: 0, gainSkills: [], spendSkills: [], empoweredSkills: {}, statuses: {}, readyHint: "" },
    },
  },
  rogue: {
    id: "rogue",
    name: "盗贼",
    selectable: true,
    refactorStatus: "active",
    refactorLabel: "重构试行",
    refactorSummary: "盗贼重构试行版已开放，当前围绕抢轴、连段续压、回合修复与斩杀处决形成闭环。",
    description: "靠抢轴、续压和斩杀阈值连续滚动优势的高速爆发职业。",
    buildNote: "先用背刺、烟幕步和淬毒刃把行动节奏与连击点滚起来，再用影袭乱舞或潜袭处决收头。",
    statBonus: { maxHp: -4, maxMp: 4, attack: 4, defense: 0, speed: 4 },
    starterSkills: ["attack", "backstab", "smoke_step", "venom_cut"],
    unlockSkill: "shadow_flurry",
    resourceConfig: { id: "combo", label: "连击点", shortLabel: "连击", max: 6, colorClass: "resource-rogue", description: "盗贼通过抢轴、规避与续压积累连击点，再把它换成高速斩杀和连段终结。" },
    secondPassProfile: {
      mechanicName: "夺拍窗口",
      mechanicSummary: "把盗贼的抢轴、连段与斩杀阈值整合成更明显的夺拍节奏。",
      battleLoop: ["先抢拍并累积连段优势", "用规避与续压保住主动权", "在敌方失序时连续兑现斩杀"],
      decisionAxes: ["当前应该继续抢拍还是直接斩杀？", "连段要不要留给下一次更好的窗口？", "残局里是否值得先交保命换主动权？"],
      uiSignals: ["详情面板显示夺拍窗口阶段", "构筑手册解释连段和斩杀的闭环", "后续会在高节奏技能上提示夺拍成熟状态"],
      runtime: { label: "夺拍", shortLabel: "拍", max: 0, gainSkills: [], spendSkills: [], empoweredSkills: {}, statuses: {}, readyHint: "" },
    },
  },
  paladin: {
    id: "paladin",
    name: "圣骑士",
    selectable: true,
    refactorStatus: "active",
    refactorLabel: "重构试行",
    refactorSummary: "圣骑士重构试行版已开放，当前围绕稳态推进、防反起势、回稳换势与处决爆发形成闭环。",
    description: "在稳态交换里越打越厚，再用誓能把优势转成处决爆发的稳压职业。",
    buildNote: "先靠光耀斩、神圣壁垒和圣光恢复稳稳滚誓能，再用处决印记或圣誓裁刃完成收头。",
    statBonus: { maxHp: 20, maxMp: 8, attack: 3, defense: 4, speed: -1 },
    starterSkills: ["radiant_slash", "holy_heal", "aegis", "defend"],
    unlockSkill: "execution_seal",
    resourceConfig: { id: "charge", label: "神圣充能", shortLabel: "充能", max: 5, colorClass: "resource-paladin", description: "圣骑士通过稳态推进、防守和回稳动作积累神圣充能，再把它换成厚重的处决爆发。" },
    secondPassProfile: {
      mechanicName: "誓能裁决",
      mechanicSummary: "继续强化圣骑士在稳态推进后以厚重裁决收尾的职业辨识度。",
      battleLoop: ["稳态推进积蓄誓能", "守反与回稳保证节奏不丢", "在窗口中把誓能压成裁决爆发"],
      decisionAxes: ["现在要继续稳态，还是转入裁决？", "该先守反起势还是先厚重推进？", "誓能是否已经足够支撑收尾？"],
      uiSignals: ["详情面板显示誓能裁决阶段", "构筑手册解释稳态到裁决的转换", "后续会在裁决技能上提示誓能爆发状态"],
      runtime: { label: "裁决", shortLabel: "裁", max: 0, gainSkills: [], spendSkills: [], empoweredSkills: {}, statuses: {}, readyHint: "" },
    },
  },
  druid: {
    id: "druid",
    name: "德鲁伊",
    selectable: true,
    refactorStatus: "active",
    refactorLabel: "重构试行",
    refactorSummary: "德鲁伊重构试行版已开放，当前围绕状态铺场、持续恢复、树肤回稳与转化绽放形成闭环。",
    description: "靠状态轮转和资源转化慢慢接管战场，再在窗口里绽放输出的循环职业。",
    buildNote: "先用藤蔓、回春和树肤把自然印记与战场状态铺开，再用月华绽放做转化收尾。",
    statBonus: { maxHp: 12, maxMp: 12, attack: 1, defense: 2, speed: 1 },
    starterSkills: ["thorn_whip", "rejuvenation", "barkskin", "defend"],
    unlockSkill: "lunar_bloom",
    resourceConfig: { id: "growth", label: "自然印记", shortLabel: "印记", max: 5, colorClass: "resource-druid", description: "德鲁伊通过铺场、持续恢复和树肤回稳积累自然印记，再把它转成绽放输出与状态引爆。" },
    secondPassProfile: {
      mechanicName: "生长轮转",
      mechanicSummary: "把德鲁伊的铺场、轮转与转化时机继续拉开成更清晰的节奏层次。",
      battleLoop: ["先铺场并维持持续恢复", "用树肤与状态轮转稳住局面", "在时机成熟时把铺好的状态转成绽放收益"],
      decisionAxes: ["当前应该继续铺场还是转化输出？", "回稳动作要不要提前交？", "是否已经到达最值得绽放的轮次？"],
      uiSignals: ["详情面板显示生长轮转阶段", "构筑手册解释铺场到绽放的关系", "后续会在转化技能上提示轮转成熟状态"],
      runtime: { label: "轮转", shortLabel: "轮", max: 0, gainSkills: [], spendSkills: [], empoweredSkills: {}, statuses: {}, readyHint: "" },
    },
  },
};

const specializationTrees = {
  warrior: {
    tracks: [
      {
        id: "warrior_breaker",
        name: "破军路线",
        summary: "把每一次压制都尽量推成失衡，再靠更狠的终结技直接收头。",
        nodes: [
          { id: "warrior_breaker_edge", name: "裂甲训练", cost: 1, summary: "攻击 +2，压制上限 +1。", effects: [{ type: "stat", stat: "attack", amount: 2 }, { type: "resource_max", amount: 1 }] },
          { id: "warrior_breaker_skill", name: "崩山断", cost: 1, requires: ["warrior_breaker_edge"], summary: "解锁主动技能「崩山断」。", effects: [{ type: "unlock_skill", skillId: "guard_break" }] },
          { id: "warrior_breaker_mastery", name: "破军宗师", cost: 2, requires: ["warrior_breaker_skill"], summary: "裂风斩更容易开失衡，裂地猛击更适合顺着窗口直接斩杀。", effects: [{ type: "skill_mod", skillId: "slash", changes: { power: 0.16, poiseDamage: 1 }, inspectNote: "专精强化：裂风斩伤害与韧性削减提高。" }, { type: "skill_mod", skillId: "earthshatter", changes: { power: 0.25, resourceCost: -1 }, inspectNote: "专精强化：裂地猛击更强且压制消耗降低 1。" }] },
        ],
      },
      {
        id: "warrior_juggernaut",
        name: "坚城路线",
        summary: "通过回稳换压与减伤站稳正面，把战斗拖进自己更强的窗口。",
        nodes: [
          { id: "warrior_juggernaut_body", name: "铁壁体魄", cost: 1, summary: "生命上限 +18，防御 +2。", effects: [{ type: "stat", stat: "maxHp", amount: 18 }, { type: "stat", stat: "defense", amount: 2 }] },
          { id: "warrior_juggernaut_skill", name: "不屈战吼", cost: 1, requires: ["warrior_juggernaut_body"], summary: "解锁主动技能「不屈战吼」。", effects: [{ type: "unlock_skill", skillId: "unyielding_roar" }] },
          { id: "warrior_juggernaut_mastery", name: "铜墙斗志", cost: 2, requires: ["warrior_juggernaut_skill"], summary: "防御姿态让你更稳地等到窗口，不屈战吼则能把喘息回合重新变回压制回合。", effects: [{ type: "skill_mod", skillId: "defend", changes: { guard: 0.15, resourceGain: 1 }, inspectNote: "专精强化：减伤提高 15%，并额外积累 1 点压制。" }, { type: "skill_mod", skillId: "unyielding_roar", changes: { power: -0.2, resourceGain: 1 }, inspectNote: "专精强化：恢复更高，且额外积累 1 点压制。" }] },
        ],
      },
    ],
  },
  mage: {
    tracks: [
      {
        id: "mage_ember",
        name: "炽星路线",
        summary: "强化高耗法术与窗口爆发，让法师的每一次开窗都更接近秒杀。",
        nodes: [
          { id: "mage_ember_core", name: "灼流增幅", cost: 1, summary: "攻击 +2，法力上限 +4。", effects: [{ type: "stat", stat: "attack", amount: 2 }, { type: "stat", stat: "maxMp", amount: 4 }] },
          { id: "mage_ember_skill", name: "连锁闪击", cost: 1, requires: ["mage_ember_core"], summary: "解锁主动技能「连锁闪击」。", effects: [{ type: "unlock_skill", skillId: "chain_lightning" }] },
          { id: "mage_ember_mastery", name: "陨火专精", cost: 2, requires: ["mage_ember_skill"], summary: "奥术飞弹更快把过载推上去，陨星术则更狠地兑现窗口。", effects: [{ type: "skill_mod", skillId: "arcane_bolt", changes: { power: 0.18, resourceGain: 1 }, inspectNote: "专精强化：伤害提高，并额外积累 1 层过载。" }, { type: "skill_mod", skillId: "meteor", changes: { power: 0.3, cost: -1 }, inspectNote: "专精强化：伤害倍率提高，法力消耗降低 1。" }] },
        ],
      },
      {
        id: "mage_frostweave",
        name: "霜织路线",
        summary: "让控场和回蓝更稳，把慢轴法师的节奏真正拉成自己的主场。",
        nodes: [
          { id: "mage_frostweave_mind", name: "寒思维系", cost: 1, summary: "法力上限 +8，防御 +1。", effects: [{ type: "stat", stat: "maxMp", amount: 8 }, { type: "stat", stat: "defense", amount: 1 }] },
          { id: "mage_frostweave_skill", name: "冰棱壁垒", cost: 1, requires: ["mage_frostweave_mind"], summary: "解锁主动技能「冰棱壁垒」。", effects: [{ type: "unlock_skill", skillId: "ice_barrier" }] },
          { id: "mage_frostweave_mastery", name: "霜境支配", cost: 2, requires: ["mage_frostweave_skill"], summary: "冰环更擅长拖轴，冥想也更容易把法力和回合质量一起拉回。", effects: [{ type: "skill_mod", skillId: "frost_nova", changes: { power: 0.18, delayTarget: 4 }, inspectNote: "专精强化：伤害更高，且额外延后目标 4 点行动值。" }, { type: "skill_mod", skillId: "meditate", changes: { restoreMp: 3, guard: 0.1 }, inspectNote: "专精强化：额外回复法力并提高减伤。" }] },
        ],
      },
    ],
  },
  ranger: {
    tracks: [
      {
        id: "ranger_marksman",
        name: "鹰眼路线",
        summary: "强化远程点杀和窗口收割，让每个破绽都能被你准时打中。",
        nodes: [
          { id: "ranger_marksman_eye", name: "精准校准", cost: 1, summary: "攻击 +2，专注上限 +1。", effects: [{ type: "stat", stat: "attack", amount: 2 }, { type: "resource_max", amount: 1 }] },
          { id: "ranger_marksman_skill", name: "贯心矢", cost: 1, requires: ["ranger_marksman_eye"], summary: "解锁主动技能「贯心矢」。", effects: [{ type: "unlock_skill", skillId: "piercing_shot" }] },
          { id: "ranger_marksman_mastery", name: "终点压制", cost: 2, requires: ["ranger_marksman_skill"], summary: "瞄准射击更会拖轴，箭雨则更像真正的远程收头。", effects: [{ type: "skill_mod", skillId: "aimed_shot", changes: { power: 0.18, delayTarget: 4 }, inspectNote: "专精强化：瞄准射击伤害提高，且额外延后目标 4 点行动值。" }, { type: "skill_mod", skillId: "volley", changes: { power: 0.2, resourceCost: -1 }, inspectNote: "专精强化：箭雨更强且专注消耗降低 1。" }] },
        ],
      },
      {
        id: "ranger_trapper",
        name: "狩猎路线",
        summary: "把战斗拖进持续压制和猎场经营，让对手一直走不出你的射程。",
        nodes: [
          { id: "ranger_trapper_field", name: "野外求生", cost: 1, summary: "生命上限 +10，速度 +1。", effects: [{ type: "stat", stat: "maxHp", amount: 10 }, { type: "stat", stat: "speed", amount: 1 }] },
          { id: "ranger_trapper_skill", name: "蛇影追猎", cost: 1, requires: ["ranger_trapper_field"], summary: "解锁主动技能「蛇影追猎」。", effects: [{ type: "unlock_skill", skillId: "serpent_trail" }] },
          { id: "ranger_trapper_mastery", name: "猎场经营", cost: 2, requires: ["ranger_trapper_skill"], summary: "毒箭和包扎都更适合长线拉扯，让你越拖越像在自己的主场。", effects: [{ type: "skill_mod", skillId: "poison_arrow", changes: { poisonDamage: 3, poisonTurns: 1 }, inspectNote: "专精强化：中毒更痛且持续更久。" }, { type: "skill_mod", skillId: "first_aid", changes: { power: -0.18, resourceGain: 1 }, inspectNote: "专精强化：恢复倍率提高，并额外积累 1 点专注。" }] },
        ],
      },
    ],
  },
  cleric: {
    tracks: [
      {
        id: "cleric_zealot",
        name: "审判路线",
        summary: "让惩戒和裁决更快进入高压区间，把稳态牧师打成真正会收头的职业。",
        nodes: [
          { id: "cleric_zealot_fire", name: "神圣锋芒", cost: 1, summary: "攻击 +2，审判印记上限 +1。", effects: [{ type: "stat", stat: "attack", amount: 2 }, { type: "resource_max", amount: 1 }] },
          { id: "cleric_zealot_skill", name: "圣枪裁决", cost: 1, requires: ["cleric_zealot_fire"], summary: "解锁主动技能「圣枪裁决」。", effects: [{ type: "unlock_skill", skillId: "sacred_lance" }] },
          { id: "cleric_zealot_mastery", name: "重审之刻", cost: 2, requires: ["cleric_zealot_skill"], summary: "圣击更会积印记，圣裁则更像真正的终结裁决。", effects: [{ type: "skill_mod", skillId: "smite", changes: { power: 0.18, resourceGain: 1 }, inspectNote: "专精强化：伤害提高，并额外积累 1 枚审判印记。" }, { type: "skill_mod", skillId: "judgment", changes: { power: 0.25, resourceCost: -1 }, inspectNote: "专精强化：圣裁更强且印记消耗降低 1。" }] },
        ],
      },
      {
        id: "cleric_sanctuary",
        name: "护誓路线",
        summary: "强化回复和庇护，把每次自救都转成下一次裁决的前置收益。",
        nodes: [
          { id: "cleric_sanctuary_grace", name: "恩典积蓄", cost: 1, summary: "生命上限 +12，法力上限 +6。", effects: [{ type: "stat", stat: "maxHp", amount: 12 }, { type: "stat", stat: "maxMp", amount: 6 }] },
          { id: "cleric_sanctuary_skill", name: "恩典潮汐", cost: 1, requires: ["cleric_sanctuary_grace"], summary: "解锁主动技能「恩典潮汐」。", effects: [{ type: "unlock_skill", skillId: "grace_tide" }] },
          { id: "cleric_sanctuary_mastery", name: "静誓赐福", cost: 2, requires: ["cleric_sanctuary_skill"], summary: "恢复术和庇护都更会把残局拉回自己的稳定区。", effects: [{ type: "skill_mod", skillId: "heal", changes: { power: -0.25, resourceGain: 1 }, inspectNote: "专精强化：恢复倍率提高，并额外积累 1 枚审判印记。" }, { type: "skill_mod", skillId: "sanctuary", changes: { guard: 0.15, power: -0.12 }, inspectNote: "专精强化：减伤和恢复同时提高。" }] },
        ],
      },
    ],
  },
  rogue: {
    tracks: [
      {
        id: "rogue_assassin",
        name: "暗刃路线",
        summary: "把抢轴和斩杀收益推到极致，让敌人还没站稳就被直接带走。",
        nodes: [
          { id: "rogue_assassin_edge", name: "致命身法", cost: 1, summary: "攻击 +2，连击点上限 +1。", effects: [{ type: "stat", stat: "attack", amount: 2 }, { type: "resource_max", amount: 1 }] },
          { id: "rogue_assassin_skill", name: "潜袭处决", cost: 1, requires: ["rogue_assassin_edge"], summary: "解锁主动技能「潜袭处决」。", effects: [{ type: "unlock_skill", skillId: "ambush" }] },
          { id: "rogue_assassin_mastery", name: "影中裁断", cost: 2, requires: ["rogue_assassin_skill"], summary: "背刺更像第一拍切口，影袭乱舞则更像真正的收头连斩。", effects: [{ type: "skill_mod", skillId: "backstab", changes: { power: 0.2, advanceSelf: 4 }, inspectNote: "专精强化：背刺伤害提高，且额外抢回 4 点行动值。" }, { type: "skill_mod", skillId: "shadow_flurry", changes: { power: 0.18, resourceCost: -1 }, inspectNote: "专精强化：终结伤害提高，连击点消耗降低 1。" }] },
        ],
      },
      {
        id: "rogue_trickster",
        name: "诡道路线",
        summary: "通过规避、续压和再起手，把一拍失误重新修成自己的回合。",
        nodes: [
          { id: "rogue_trickster_flow", name: "诡步循环", cost: 1, summary: "速度 +2，法力上限 +4。", effects: [{ type: "stat", stat: "speed", amount: 2 }, { type: "stat", stat: "maxMp", amount: 4 }] },
          { id: "rogue_trickster_skill", name: "戏法步", cost: 1, requires: ["rogue_trickster_flow"], summary: "解锁主动技能「戏法步」。", effects: [{ type: "unlock_skill", skillId: "trick_step" }] },
          { id: "rogue_trickster_mastery", name: "毒幕经营", cost: 2, requires: ["rogue_trickster_skill"], summary: "烟幕步更稳地修回合，淬毒刃则更擅长把敌人拖进你的节奏。", effects: [{ type: "skill_mod", skillId: "smoke_step", changes: { guard: 0.12, resourceGain: 1 }, inspectNote: "专精强化：减伤提高，并额外积累 1 点连击。" }, { type: "skill_mod", skillId: "venom_cut", changes: { poisonDamage: 3, poisonTurns: 1 }, inspectNote: "专精强化：持续伤害更高且持续更久。" }] },
        ],
      },
    ],
  },
  paladin: {
    tracks: [
      {
        id: "paladin_crusader",
        name: "圣罚路线",
        summary: "通过更强的输出和更短的充能消耗，把稳态优势更快变成裁决终结。",
        nodes: [
          { id: "paladin_crusader_fervor", name: "裁决热忱", cost: 1, summary: "攻击 +2，神圣充能上限 +1。", effects: [{ type: "stat", stat: "attack", amount: 2 }, { type: "resource_max", amount: 1 }] },
          { id: "paladin_crusader_skill", name: "圣誓裁刃", cost: 1, requires: ["paladin_crusader_fervor"], summary: "解锁主动技能「圣誓裁刃」。", effects: [{ type: "unlock_skill", skillId: "verdict_blade" }] },
          { id: "paladin_crusader_mastery", name: "誓言追击", cost: 2, requires: ["paladin_crusader_skill"], summary: "光耀斩更会攒誓能，处决印记则更能兑现厚重收头。", effects: [{ type: "skill_mod", skillId: "radiant_slash", changes: { power: 0.18, resourceGain: 1 }, inspectNote: "专精强化：伤害提高，并额外积累 1 点神圣充能。" }, { type: "skill_mod", skillId: "execution_seal", changes: { power: 0.25, resourceCost: -1 }, inspectNote: "专精强化：处决威力提高且充能消耗降低 1。" }] },
        ],
      },
      {
        id: "paladin_templar",
        name: "壁垒路线",
        summary: "通过更强的减伤和回复稳住长线，把每次挨打都变成下一次起势。",
        nodes: [
          { id: "paladin_templar_wall", name: "神圣壁障", cost: 1, summary: "生命上限 +14，防御 +2。", effects: [{ type: "stat", stat: "maxHp", amount: 14 }, { type: "stat", stat: "defense", amount: 2 }] },
          { id: "paladin_templar_skill", name: "圣域堡垒", cost: 1, requires: ["paladin_templar_wall"], summary: "解锁主动技能「圣域堡垒」。", effects: [{ type: "unlock_skill", skillId: "holy_bulwark" }] },
          { id: "paladin_templar_mastery", name: "持誓守护", cost: 2, requires: ["paladin_templar_skill"], summary: "神圣壁垒更稳，圣光恢复也更会把局面重新拉回自己的稳态。", effects: [{ type: "skill_mod", skillId: "aegis", changes: { guard: 0.15, resourceGain: 1 }, inspectNote: "专精强化：减伤提高，并额外积累 1 点神圣充能。" }, { type: "skill_mod", skillId: "holy_heal", changes: { power: -0.2 }, inspectNote: "专精强化：恢复倍率提高。" }] },
        ],
      },
    ],
  },
  druid: {
    tracks: [
      {
        id: "druid_bloom",
        name: "繁花路线",
        summary: "围绕持续恢复和状态引爆做文章，让整场战斗的收益不断滚大。",
        nodes: [
          { id: "druid_bloom_seed", name: "生机萌发", cost: 1, summary: "法力上限 +6，自然印记上限 +1。", effects: [{ type: "stat", stat: "maxMp", amount: 6 }, { type: "resource_max", amount: 1 }] },
          { id: "druid_bloom_skill", name: "孢群爆发", cost: 1, requires: ["druid_bloom_seed"], summary: "解锁主动技能「孢群爆发」。", effects: [{ type: "unlock_skill", skillId: "sporeburst" }] },
          { id: "druid_bloom_mastery", name: "月潮回响", cost: 2, requires: ["druid_bloom_skill"], summary: "回春更耐拖，月华绽放也更像状态转化后的真正收头。", effects: [{ type: "skill_mod", skillId: "rejuvenation", changes: { regenValue: 4, regenTurns: 1 }, inspectNote: "专精强化：持续恢复更高且持续更久。" }, { type: "skill_mod", skillId: "lunar_bloom", changes: { power: 0.22, resourceCost: -1 }, inspectNote: "专精强化：绽放伤害更高且印记消耗降低 1。" }] },
        ],
      },
      {
        id: "druid_wild",
        name: "兽性路线",
        summary: "让德鲁伊在铺场之外也有主动追节奏和正面压迫的能力。",
        nodes: [
          { id: "druid_wild_hide", name: "坚木躯壳", cost: 1, summary: "生命上限 +12，攻击 +1，防御 +1。", effects: [{ type: "stat", stat: "maxHp", amount: 12 }, { type: "stat", stat: "attack", amount: 1 }, { type: "stat", stat: "defense", amount: 1 }] },
          { id: "druid_wild_skill", name: "野性扑击", cost: 1, requires: ["druid_wild_hide"], summary: "解锁主动技能「野性扑击」。", effects: [{ type: "unlock_skill", skillId: "wild_pounce" }] },
          { id: "druid_wild_mastery", name: "林野压制", cost: 2, requires: ["druid_wild_skill"], summary: "藤蔓鞭笞更会牵制敌人，树肤也更会把回合修成自己的节奏。", effects: [{ type: "skill_mod", skillId: "thorn_whip", changes: { power: 0.18, delayTarget: 4 }, inspectNote: "专精强化：伤害提高，且额外延后目标 4 点行动值。" }, { type: "skill_mod", skillId: "barkskin", changes: { guard: 0.15, resourceGain: 1 }, inspectNote: "专精强化：减伤提高，并额外积累 1 枚自然印记。" }] },
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

function createEmptyProfessionProfile() {
  return deepClone(PLAYER_TEMPLATE.professionProfile);
}

function getClassProfessionProfile(classDef) {
  if (!classDef || !classDef.secondPassProfile) {
    return createEmptyProfessionProfile();
  }
  return deepClone(classDef.secondPassProfile);
}

function syncProfessionState(profile, state) {
  const runtime = profile && profile.runtime ? profile.runtime : {};
  const nextState = state || {};
  const max = Math.max(0, Number(nextState.max || runtime.max || 0));
  const current = max > 0 ? clamp(Number(nextState.current || 0), 0, max) : 0;
  nextState.label = runtime.label || profile.mechanicName || "";
  nextState.shortLabel = runtime.shortLabel || "";
  nextState.max = max;
  nextState.current = current;
  nextState.previewOnly = max <= 0;
  nextState.ready = max > 0 && current >= max;
  nextState.activeSkillIds = Object.keys(runtime.empoweredSkills || {});
  if (nextState.previewOnly) {
    nextState.valueText = "待接入";
    nextState.statusText = profile.mechanicSummary || "二轮机制待落地";
    nextState.hintText = (profile.battleLoop || [])[0] || "后续会在该职业的二轮深化中接入运行时机制。";
    return nextState;
  }
  nextState.valueText = current + " / " + max;
  if (nextState.ready) {
    nextState.statusText = runtime.statuses && runtime.statuses.ready
      ? runtime.statuses.ready
      : "已进入可兑现状态";
    nextState.hintText = runtime.readyHint || "当前适合交出强化技能兑现收益。";
  } else if (current > 0) {
    nextState.statusText = runtime.statuses && runtime.statuses.building
      ? runtime.statuses.building
      : "机制正在积累";
    nextState.hintText = (profile.battleLoop || [])[0] || "继续通过铺机制技能把职业节奏推到可兑现阶段。";
  } else {
    nextState.statusText = runtime.statuses && runtime.statuses.empty
      ? runtime.statuses.empty
      : "尚未进入机制循环";
    nextState.hintText = (profile.battleLoop || [])[0] || "先用起手技能开始搭建职业机制。";
  }
  return nextState;
}

function createProfessionState(classDef) {
  const profile = getClassProfessionProfile(classDef);
  return syncProfessionState(profile, {
    current: 0,
    max: profile.runtime && profile.runtime.max ? profile.runtime.max : 0,
  });
}

function getProfessionProfile() {
  return player.professionProfile || createEmptyProfessionProfile();
}

function getProfessionState() {
  return syncProfessionState(getProfessionProfile(), player.professionState || deepClone(PLAYER_TEMPLATE.professionState));
}

function applyProfessionEmpowerment(skillId, resolvedSkill, inspectNotes) {
  const profile = getProfessionProfile();
  const state = getProfessionState();
  const runtime = profile.runtime || {};
  const empowered = runtime.empoweredSkills && runtime.empoweredSkills[skillId];
  if (!state.ready || !empowered) {
    return;
  }
  const changes = empowered.changes || {};
  Object.keys(changes).forEach(function eachKey(key) {
    if (typeof changes[key] === "number") {
      const previous = typeof resolvedSkill[key] === "number" ? resolvedSkill[key] : 0;
      resolvedSkill[key] = previous + changes[key];
    } else {
      resolvedSkill[key] = changes[key];
    }
  });
  if (empowered.inspectNote) {
    inspectNotes.push(empowered.inspectNote);
  }
}

function applyProfessionAfterPlayerSkill(skillId) {
  const profile = getProfessionProfile();
  const runtime = profile.runtime || {};
  const state = player.professionState || createProfessionState(classes[player.classId]);
  const result = {
    label: runtime.label || profile.mechanicName || "职业机制",
    gained: 0,
    consumed: false,
    readied: false,
    state: state,
  };
  if (!skillId || !runtime || state.previewOnly || state.max <= 0) {
    player.professionState = syncProfessionState(profile, state);
    result.state = player.professionState;
    return result;
  }
  const wasReady = Boolean(state.ready);
  if (Array.isArray(runtime.gainSkills) && runtime.gainSkills.indexOf(skillId) !== -1) {
    const previous = state.current;
    state.current = clamp(state.current + 1, 0, state.max);
    result.gained = state.current - previous;
  }
  if (wasReady && Array.isArray(runtime.spendSkills) && runtime.spendSkills.indexOf(skillId) !== -1) {
    state.current = 0;
    result.consumed = true;
  }
  player.professionState = syncProfessionState(profile, state);
  result.readied = !wasReady && player.professionState.ready;
  result.state = player.professionState;
  return result;
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
  if (Array.isArray(skill.inspectTags) && skill.inspectTags.includes("终结")) {
    return "ultimate";
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
  if (inferActionType(skill) === "ultimate") {
    delay += 12;
  }
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
  if (inferActionType(skill) === "ultimate") {
    return 0;
  }
  if (skill.id === "attack" || skill.id === "defend") {
    return 1;
  }
  if (skill.resourceCost) {
    return 3;
  }
  return 2;
}

function inferUltimateChargeCost(skill) {
  if (typeof skill.ultimateChargeCost === "number") {
    return skill.ultimateChargeCost;
  }
  return inferActionType(skill) === "ultimate" ? 5 : 0;
}

function isUltimateSkill(skill) {
  if (!skill) {
    return false;
  }
  return inferActionType(skill) === "ultimate";
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
  const combatFocuses = [];
  const focusMap = {
    interrupt: "反蓄力 / 打断",
    pressure: "压制推进",
    execute: "失衡处决",
    tempo: "抢轴连动",
    control: "控场拖轴",
    combo: "连段循环",
    sustain: "稳态续航",
    guard: "防守反压",
    risk: "高风险收割",
    power: "正面爆压",
    spell: "法术连段",
    burst: "爆发收尾",
    "起手压制": "起手压制",
    "起手抢轴": "起手抢轴",
    "连段起手": "连段起手",
    "持续压血": "持续压血",
    "连段续压": "连段续压",
    "斩杀处决": "斩杀处决",
    "回合修复": "回合修复",
    "抢轴连动": "抢轴连动",
    "起手拖轴": "起手拖轴",
    "持续压制": "持续压制",
    "拉扯回稳": "拉扯回稳",
    "收割处决": "收割处决",
    "拖轴控场": "拖轴控场",
    "起手过载": "起手过载",
    "慢轴铺垫": "慢轴铺垫",
    "回蓝起窗": "回蓝起窗",
    "高耗终结": "高耗终结",
    "稳态惩戒": "稳态惩戒",
    "审判积蓄": "审判积蓄",
    "恢复转收益": "恢复转收益",
    "庇护回稳": "庇护回稳",
    "审判处决": "审判处决",
    "稳态推进": "稳态推进",
    "誓能积蓄": "誓能积蓄",
    "防反起势": "防反起势",
    "回稳换势": "回稳换势",
    "处决爆发": "处决爆发",
    "状态铺场": "状态铺场",
    "自然牵制": "自然牵制",
    "树肤回稳": "树肤回稳",
    "转化绽放": "转化绽放",
    "状态引爆": "状态引爆",
    "野性追击": "野性追击",
    "打断": "反蓄力 / 打断",
    "压制推进": "压制推进",
    "窗口启动": "窗口启动",
    "爆发准备": "爆发准备",
    "处决": "失衡处决",
    "爆发收尾": "爆发收尾",
    "回稳换压": "回稳换压",
    "续战": "稳态续航",
  };

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
        if (focusMap[tag] && !combatFocuses.includes(focusMap[tag])) {
          combatFocuses.push(focusMap[tag]);
        }
      });
    });
  }

  getResolvedPlayerSkills().forEach(function eachSkill(skill) {
    (skill.inspectTags || []).forEach(function eachTag(tag) {
      if (focusMap[tag] && !combatFocuses.includes(focusMap[tag])) {
        combatFocuses.push(focusMap[tag]);
      }
    });
  });

  player.buildSnapshot = {
    activeTrackNames: trackNames,
    unlockedNodeNames: unlockedNodes.map(function mapNode(node) {
      return node.name;
    }),
    unlockedSkillIds: unlockedSkillIds,
    relicTags: relicTags,
    combatFocuses: combatFocuses,
  };
}

function applyClassToPlayer(classId) {
  const classDef = classes[classId];
  if (!classDef) {
    return false;
  }
  if (classDef.selectable === false) {
    return false;
  }
  resetPlayerToTemplate();
  player.classId = classDef.id;
  player.className = classDef.name;
  player.classDescription = classDef.description;
  player.classBuildNote = classDef.buildNote || "";
  player.professionProfile = getClassProfessionProfile(classDef);
  player.professionState = createProfessionState(classDef);
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

  applyProfessionEmpowerment(skillId, resolvedSkill, inspectNotes);

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
  resolvedSkill.ultimateChargeCost = Math.max(0, inferUltimateChargeCost(resolvedSkill));
  resolvedSkill.canInsertUltimate = resolvedSkill.actionType === "ultimate";
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

function getResolvedUltimateSkills() {
  return getResolvedPlayerSkills().filter(function filterUltimate(skill) {
    return isUltimateSkill(skill);
  });
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
  getProfessionProfile,
  getProfessionState,
  applyProfessionAfterPlayerSkill,
  getPlayerSkills,
  getResolvedSkill,
  getResolvedPlayerSkills,
  getResolvedUltimateSkills,
  isUltimateSkill,
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
