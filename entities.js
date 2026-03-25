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
  arcane_bolt: { id: "arcane_bolt", name: "奥术飞弹", type: "magic", cost: 4, power: 1.25, effect: "damage", description: "法师的稳定魔法输出。", resourceGain: 1, inspectTags: ["法师", "循环"] },
  frost_nova: { id: "frost_nova", name: "冰环", type: "magic", cost: 6, power: 1.1, effect: "damage", slow: 2, description: "造成伤害并压低敌方节奏。", resourceGain: 1, inspectTags: ["法师", "控场"] },
  meditate: { id: "meditate", name: "冥想", type: "utility", cost: 0, effect: "restore_mp", restoreMp: 8, guard: 0.2, description: "恢复法力并稍微减伤。", resourceGain: 2, inspectTags: ["法师", "回蓝"] },
  meteor: { id: "meteor", name: "陨星术", type: "magic", cost: 10, power: 1.95, effect: "damage", description: "高消耗高爆发。", resourceCost: 4, inspectTags: ["法师", "终结", "高耗"] },
  aimed_shot: { id: "aimed_shot", name: "瞄准射击", type: "physical", cost: 3, power: 1.4, effect: "damage", description: "游侠的精准输出。", resourceGain: 1, inspectTags: ["游侠", "单点"] },
  poison_arrow: { id: "poison_arrow", name: "毒箭", type: "physical", cost: 5, power: 0.95, effect: "poison", poisonDamage: 6, poisonTurns: 3, description: "挂毒持续耗血。", resourceCost: 2, inspectTags: ["游侠", "持续伤害"] },
  first_aid: { id: "first_aid", name: "应急包扎", type: "utility", cost: 4, effect: "heal", power: -0.7, description: "轻量恢复，适合拉扯。", resourceGain: 1, inspectTags: ["游侠", "续航"] },
  volley: { id: "volley", name: "箭雨", type: "physical", cost: 9, power: 1.7, effect: "damage", description: "游侠的爆发技能。", resourceCost: 4, inspectTags: ["游侠", "爆发"] },
  smite: { id: "smite", name: "圣击", type: "magic", cost: 3, power: 1.15, effect: "damage", description: "牧师的惩戒法术。", resourceGain: 1, inspectTags: ["牧师", "惩戒"] },
  heal: { id: "heal", name: "恢复术", type: "magic", cost: 5, power: -1.15, effect: "heal", description: "稳定高效的回复技能。", resourceGain: 1, inspectTags: ["牧师", "恢复"] },
  sanctuary: { id: "sanctuary", name: "庇护", type: "utility", cost: 6, effect: "guard_heal", guard: 0.35, power: -0.45, description: "回复并获得减伤。", resourceGain: 1, inspectTags: ["牧师", "庇护"] },
  judgment: { id: "judgment", name: "圣裁", type: "magic", cost: 9, power: 1.75, effect: "damage", description: "牧师终结技。", resourceCost: 3, inspectTags: ["牧师", "审判", "爆发"] },
  backstab: { id: "backstab", name: "背刺", type: "physical", cost: 4, power: 1.55, effect: "damage", bonusFirst: 0.25, description: "先手收益更高。", resourceGain: 2, inspectTags: ["盗贼", "先手"] },
  smoke_step: { id: "smoke_step", name: "烟幕步", type: "utility", cost: 5, effect: "guard", guard: 0.55, description: "规避大量伤害。", resourceGain: 1, inspectTags: ["盗贼", "保节奏"] },
  venom_cut: { id: "venom_cut", name: "淬毒刃", type: "physical", cost: 5, power: 1.0, effect: "poison", poisonDamage: 7, poisonTurns: 2, description: "伤害不高但持续逼迫。", resourceGain: 1, inspectTags: ["盗贼", "挂毒"] },
  shadow_flurry: { id: "shadow_flurry", name: "影袭乱舞", type: "physical", cost: 9, power: 2.0, effect: "damage", description: "盗贼爆发核心。", resourceCost: 4, inspectTags: ["盗贼", "连击终结"] },
  radiant_slash: { id: "radiant_slash", name: "光耀斩", type: "physical", cost: 4, power: 1.25, effect: "damage", description: "圣骑士的稳健输出。", resourceGain: 1, inspectTags: ["圣骑士", "稳定输出"] },
  aegis: { id: "aegis", name: "神圣壁垒", type: "utility", cost: 6, effect: "guard", guard: 0.65, description: "极强减伤回合。", resourceGain: 2, inspectTags: ["圣骑士", "防守"] },
  holy_heal: { id: "holy_heal", name: "圣光恢复", type: "magic", cost: 6, power: -0.9, effect: "heal", description: "圣骑士的自疗手段。", resourceGain: 1, inspectTags: ["圣骑士", "恢复"] },
  execution_seal: { id: "execution_seal", name: "处决印记", type: "magic", cost: 8, power: 1.85, effect: "damage", description: "高压单体爆发。", resourceCost: 4, inspectTags: ["圣骑士", "处决"] },
  thorn_whip: { id: "thorn_whip", name: "藤蔓鞭笞", type: "magic", cost: 3, power: 1.2, effect: "damage", description: "德鲁伊的基础输出。", resourceGain: 1, inspectTags: ["德鲁伊", "铺垫"] },
  rejuvenation: { id: "rejuvenation", name: "回春", type: "magic", cost: 5, power: -0.85, effect: "regen", regenValue: 8, regenTurns: 2, description: "持续恢复。", resourceGain: 1, inspectTags: ["德鲁伊", "持续恢复"] },
  barkskin: { id: "barkskin", name: "树肤", type: "utility", cost: 5, effect: "guard", guard: 0.45, description: "自然护甲。", resourceGain: 1, inspectTags: ["德鲁伊", "护甲"] },
  lunar_bloom: { id: "lunar_bloom", name: "月华绽放", type: "magic", cost: 9, power: -1.3, effect: "heal", splashGuard: 0.2, description: "强力回复并附少量护盾。", resourceCost: 4, inspectTags: ["德鲁伊", "爆发恢复"] },
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

const player = JSON.parse(JSON.stringify(PLAYER_TEMPLATE));

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resetPlayerToTemplate() {
  Object.assign(player, JSON.parse(JSON.stringify(PLAYER_TEMPLATE)));
}

function createClassResourceState(classDef) {
  if (!classDef || !classDef.resourceConfig) {
    return JSON.parse(JSON.stringify(PLAYER_TEMPLATE.classResource));
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
  player.maxHp += classDef.statBonus.maxHp;
  player.maxMp += classDef.statBonus.maxMp;
  player.attack += classDef.statBonus.attack;
  player.defense += classDef.statBonus.defense;
  player.speed += classDef.statBonus.speed;
  player.hp = player.maxHp;
  player.mp = player.maxMp;
  player.unlockedSkills = classDef.starterSkills.slice();
  player.learnedUltimate = false;
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
  return classDef.unlockSkill;
}

function getPlayerSkills() {
  return player.unlockedSkills.map(function mapSkill(skillId) {
    return skills[skillId];
  }).filter(Boolean);
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
  return player.classResource || JSON.parse(JSON.stringify(PLAYER_TEMPLATE.classResource));
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

function buyEquipment(item) {
  if (!item || player.gold < item.cost) {
    return false;
  }
  if (player.equipment.includes(item.id)) {
    return false;
  }
  player.gold -= item.cost;
  player.equipment.push(item.id);
  player.maxHp += item.bonus.maxHp || 0;
  player.hp += item.bonus.maxHp || 0;
  player.maxMp += item.bonus.maxMp || 0;
  player.mp += item.bonus.maxMp || 0;
  player.attack += item.bonus.attack || 0;
  player.defense += item.bonus.defense || 0;
  player.speed += item.bonus.speed || 0;
  return true;
}

window.GameEntities = {
  player,
  skills,
  classes,
  PLAYER_TEMPLATE,
  applyClassToPlayer,
  unlockClassSkillIfNeeded,
  getPlayerSkills,
  gainClassResource,
  spendClassResource,
  getClassResource,
  spendSkillPoint,
  buyEquipment,
};
