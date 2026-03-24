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
  unlockedSkills: [],
  learnedUltimate: false,
  equipment: [],
};

const skills = {
  attack: { id: "attack", name: "普通攻击", type: "physical", cost: 0, power: 1.0, effect: "damage", description: "稳定输出。" },
  defend: { id: "defend", name: "防御姿态", type: "utility", cost: 0, effect: "guard", guard: 0.45, description: "减伤并稳住回合。" },
  slash: { id: "slash", name: "裂风斩", type: "physical", cost: 3, power: 1.35, effect: "damage", description: "战士的高威力斩击。" },
  battle_cry: { id: "battle_cry", name: "战吼", type: "utility", cost: 5, effect: "buff_attack", buff: 0.3, turns: 2, description: "短时间提升攻击。" },
  earthshatter: { id: "earthshatter", name: "裂地猛击", type: "physical", cost: 8, power: 1.8, effect: "damage", splash: 0.15, description: "战士的终结重击。" },
  arcane_bolt: { id: "arcane_bolt", name: "奥术飞弹", type: "magic", cost: 4, power: 1.25, effect: "damage", description: "法师的稳定魔法输出。" },
  frost_nova: { id: "frost_nova", name: "冰环", type: "magic", cost: 6, power: 1.1, effect: "damage", slow: 2, description: "造成伤害并压低敌方节奏。" },
  meditate: { id: "meditate", name: "冥想", type: "utility", cost: 0, effect: "restore_mp", restoreMp: 8, guard: 0.2, description: "恢复法力并稍微减伤。" },
  meteor: { id: "meteor", name: "陨星术", type: "magic", cost: 10, power: 1.95, effect: "damage", description: "高消耗高爆发。" },
  aimed_shot: { id: "aimed_shot", name: "瞄准射击", type: "physical", cost: 3, power: 1.4, effect: "damage", description: "游侠的精准输出。" },
  poison_arrow: { id: "poison_arrow", name: "毒箭", type: "physical", cost: 5, power: 0.95, effect: "poison", poisonDamage: 6, poisonTurns: 3, description: "挂毒持续耗血。" },
  first_aid: { id: "first_aid", name: "应急包扎", type: "utility", cost: 4, effect: "heal", power: -0.7, description: "轻量恢复，适合拉扯。" },
  volley: { id: "volley", name: "箭雨", type: "physical", cost: 9, power: 1.7, effect: "damage", description: "游侠的爆发技能。" },
  smite: { id: "smite", name: "圣击", type: "magic", cost: 3, power: 1.15, effect: "damage", description: "牧师的惩戒法术。" },
  heal: { id: "heal", name: "恢复术", type: "magic", cost: 5, power: -1.15, effect: "heal", description: "稳定高效的回复技能。" },
  sanctuary: { id: "sanctuary", name: "庇护", type: "utility", cost: 6, effect: "guard_heal", guard: 0.35, power: -0.45, description: "回复并获得减伤。" },
  judgment: { id: "judgment", name: "圣裁", type: "magic", cost: 9, power: 1.75, effect: "damage", description: "牧师终结技。" },
  backstab: { id: "backstab", name: "背刺", type: "physical", cost: 4, power: 1.55, effect: "damage", bonusFirst: 0.25, description: "先手收益更高。" },
  smoke_step: { id: "smoke_step", name: "烟幕步", type: "utility", cost: 5, effect: "guard", guard: 0.55, description: "规避大量伤害。" },
  venom_cut: { id: "venom_cut", name: "淬毒刃", type: "physical", cost: 5, power: 1.0, effect: "poison", poisonDamage: 7, poisonTurns: 2, description: "伤害不高但持续逼迫。" },
  shadow_flurry: { id: "shadow_flurry", name: "影袭乱舞", type: "physical", cost: 9, power: 2.0, effect: "damage", description: "盗贼爆发核心。" },
  radiant_slash: { id: "radiant_slash", name: "光耀斩", type: "physical", cost: 4, power: 1.25, effect: "damage", description: "圣骑士的稳健输出。" },
  aegis: { id: "aegis", name: "神圣壁垒", type: "utility", cost: 6, effect: "guard", guard: 0.65, description: "极强减伤回合。" },
  holy_heal: { id: "holy_heal", name: "圣光恢复", type: "magic", cost: 6, power: -0.9, effect: "heal", description: "圣骑士的自疗手段。" },
  execution_seal: { id: "execution_seal", name: "处决印记", type: "magic", cost: 8, power: 1.85, effect: "damage", description: "高压单体爆发。" },
  thorn_whip: { id: "thorn_whip", name: "藤蔓鞭笞", type: "magic", cost: 3, power: 1.2, effect: "damage", description: "德鲁伊的基础输出。" },
  rejuvenation: { id: "rejuvenation", name: "回春", type: "magic", cost: 5, power: -0.85, effect: "regen", regenValue: 8, regenTurns: 2, description: "持续恢复。" },
  barkskin: { id: "barkskin", name: "树肤", type: "utility", cost: 5, effect: "guard", guard: 0.45, description: "自然护甲。" },
  lunar_bloom: { id: "lunar_bloom", name: "月华绽放", type: "magic", cost: 9, power: -1.3, effect: "heal", splashGuard: 0.2, description: "强力回复并附少量护盾。" },
};

const classes = {
  warrior: {
    id: "warrior",
    name: "战士",
    description: "高生命高爆发，适合硬碰硬。",
    statBonus: { maxHp: 28, maxMp: -4, attack: 5, defense: 3, speed: -1 },
    starterSkills: ["attack", "slash", "defend", "battle_cry"],
    unlockSkill: "earthshatter",
  },
  mage: {
    id: "mage",
    name: "法师",
    description: "法力充足，技能爆发很强，但比较脆。",
    statBonus: { maxHp: -10, maxMp: 20, attack: 1, defense: -1, speed: 0 },
    starterSkills: ["attack", "arcane_bolt", "frost_nova", "meditate"],
    unlockSkill: "meteor",
  },
  ranger: {
    id: "ranger",
    name: "游侠",
    description: "节奏灵活，擅长持续输出与消耗。",
    statBonus: { maxHp: 4, maxMp: 6, attack: 3, defense: 0, speed: 2 },
    starterSkills: ["attack", "aimed_shot", "poison_arrow", "first_aid"],
    unlockSkill: "volley",
  },
  cleric: {
    id: "cleric",
    name: "牧师",
    description: "回复能力最稳，容错极高。",
    statBonus: { maxHp: 10, maxMp: 14, attack: 0, defense: 1, speed: 0 },
    starterSkills: ["smite", "heal", "sanctuary", "defend"],
    unlockSkill: "judgment",
  },
  rogue: {
    id: "rogue",
    name: "盗贼",
    description: "高速度高爆发，适合先手压制。",
    statBonus: { maxHp: -4, maxMp: 4, attack: 4, defense: 0, speed: 4 },
    starterSkills: ["attack", "backstab", "smoke_step", "venom_cut"],
    unlockSkill: "shadow_flurry",
  },
  paladin: {
    id: "paladin",
    name: "圣骑士",
    description: "半坦半奶，适合稳定推进 Boss 战。",
    statBonus: { maxHp: 20, maxMp: 8, attack: 3, defense: 4, speed: -1 },
    starterSkills: ["radiant_slash", "holy_heal", "aegis", "defend"],
    unlockSkill: "execution_seal",
  },
  druid: {
    id: "druid",
    name: "德鲁伊",
    description: "持续恢复和防守兼备，擅长拉长战线。",
    statBonus: { maxHp: 12, maxMp: 12, attack: 1, defense: 2, speed: 1 },
    starterSkills: ["thorn_whip", "rejuvenation", "barkskin", "defend"],
    unlockSkill: "lunar_bloom",
  },
};

const player = JSON.parse(JSON.stringify(PLAYER_TEMPLATE));

function resetPlayerToTemplate() {
  Object.assign(player, JSON.parse(JSON.stringify(PLAYER_TEMPLATE)));
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
  spendSkillPoint,
  buyEquipment,
};
