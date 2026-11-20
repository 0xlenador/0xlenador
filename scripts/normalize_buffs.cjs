const fs = require('fs');
const path = require('path');

const powerupsPath = path.resolve(__dirname, '../src/content/data/sfl/powerups.json');
const skillsPath = path.resolve(__dirname, '../src/content/data/sfl/skills.json');
const buffsPath = path.resolve(__dirname, '../src/content/data/sfl/calculo_buffs.json');

const powerupsData = JSON.parse(fs.readFileSync(powerupsPath, 'utf8'));
const skillsData = JSON.parse(fs.readFileSync(skillsPath, 'utf8'));
const buffsData = JSON.parse(fs.readFileSync(buffsPath, 'utf8'));

// 1. Definición exacta de Collectibles de Cocina, Cueva y Oil
const specialCollectibles = {
  // Cocina
  '472': {
    m1: { category: 'cooking', subcategory: 'bakery', effect_type: 'xp', target: 'Cakes', mathematics_operation: 'multiply', calc: 1.2 }
  },
  '485': {
    m1: { category: 'cooking', subcategory: 'kitchen', effect_type: 'xp', target: 'Fish', mathematics_operation: 'multiply', calc: 1.2 }
  },
  '911': {
    m1: { category: 'cooking', subcategory: 'all', effect_type: 'xp', target: 'all', mathematics_operation: 'multiply', calc: 1.05 }
  },
  '938': {
    m1: { category: 'cooking', subcategory: 'deli', effect_type: 'xp', target: 'Fermented Carrots', mathematics_operation: 'multiply', calc: 2 }
  },
  '2156': {
    m1: { category: 'cooking', subcategory: 'deli', effect_type: 'xp', target: 'Cheese Recipes', mathematics_operation: 'add', calc: 500 }
  },
  '3046': {
    m1: { category: 'cooking', subcategory: 'aging_shed', effect_type: 'xp', target: 'Aged Fish', mathematics_operation: 'multiply', calc: 1.05 },
    m2: { category: 'cooking', subcategory: 'aging_shed', effect_type: 'yield', target: 'Fermentation', mathematics_operation: 'critical_chance', calc: 2, chance: 15 }
  },
  '3054': {
    m1: { category: 'cooking', subcategory: 'aging_shed', effect_type: 'prime', target: 'Aged Fish', mathematics_operation: 'add_percentage', calc: 14 }
  },
  // Cueva
  '456': {
    m1: { category: 'cave', subcategory: 'mushroom', effect_type: 'yield', target: 'Wild Mushroom', mathematics_operation: 'add', calc: 0.2 }
  },
  // Oil
  '500': {
    m1: { category: 'oil', subcategory: '', effect_type: 'yield', target: 'Oil', mathematics_operation: 'add', calc: 0.1 }
  }
};

// 2. Definición exacta de Wearables de Cocina y Cueva
const specialWearables = {
  // Cocina
  '58': {
    m1: { category: 'cooking', subcategory: 'all', effect_type: 'xp', target: 'all', mathematics_operation: 'multiply', calc: 1.1 }
  },
  '161': {
    m1: { category: 'cooking', subcategory: 'all', effect_type: 'time', target: 'all', mathematics_operation: 'multiply', calc: 0.5 }
  },
  '314': {
    m1: { category: 'cooking', subcategory: 'all', effect_type: 'xp', target: 'all', mathematics_operation: 'multiply', calc: 1.25 }
  },
  '500': {
    m1: { category: 'cooking', subcategory: 'all', effect_type: 'time', target: 'all', mathematics_operation: 'multiply', calc: 0.85 },
    m2: { category: 'cooking', subcategory: 'all', effect_type: 'yield', target: 'all', mathematics_operation: 'chance', calc: 1, chance: 10 }
  },
  // Cueva
  '128': {
    m1: { category: 'cave', subcategory: 'mushroom', effect_type: 'yield', target: 'Wild Mushroom', mathematics_operation: 'add', calc: 0.1 }
  }
};

// Normalizar powerups.json (Collectibles)
for (const [id, item] of Object.entries(powerupsData.power_ups.collectibles || {})) {
  if (specialCollectibles[id]) {
    const spec = specialCollectibles[id];
    item.mathematics_1 = spec.m1;
    if (spec.m2) {
      item.mathematics_2 = spec.m2;
    } else {
      delete item.mathematics_2;
    }
  } else {
    // Para todos los demás: vaciar category y target, añadir subcategory: '' y effect_type: ''
    for (let i = 1; i <= 6; i++) {
      const key = `mathematics_${i}`;
      if (item[key]) {
        const m = item[key];
        item[key] = {
          category: '',
          subcategory: '',
          effect_type: '',
          target: '',
          mathematics_operation: m.mathematics_operation || 'multiply',
          calc: m.calc !== undefined ? m.calc : null,
          ...(m.calc_by_rank ? { calc_by_rank: m.calc_by_rank } : {}),
          ...(m.chance !== undefined ? { chance: m.chance } : {})
        };
      }
    }
  }
}

// Normalizar powerups.json (Wearables)
for (const [id, item] of Object.entries(powerupsData.power_ups.wearables || {})) {
  if (specialWearables[id]) {
    const spec = specialWearables[id];
    item.mathematics_1 = spec.m1;
    if (spec.m2) {
      item.mathematics_2 = spec.m2;
    } else {
      delete item.mathematics_2;
    }
  } else {
    for (let i = 1; i <= 6; i++) {
      const key = `mathematics_${i}`;
      if (item[key]) {
        const m = item[key];
        item[key] = {
          category: '',
          subcategory: '',
          effect_type: '',
          target: '',
          mathematics_operation: m.mathematics_operation || 'multiply',
          calc: m.calc !== undefined ? m.calc : null,
          ...(m.calc_by_rank ? { calc_by_rank: m.calc_by_rank } : {}),
          ...(m.chance !== undefined ? { chance: m.chance } : {})
        };
      }
    }
  }
}

// 3. Normalizar skills.json
const cookingSkillsSubcat = {
  'Fast Feasts': { subcategory: 'all', effect_type: 'time', target: 'all' },
  'Nom Nom': { subcategory: 'all', effect_type: 'xp', target: 'all' },
  'Munching Mastery': { subcategory: 'all', effect_type: 'xp', target: 'all' },
  'Swift Sizzle': { subcategory: 'kitchen', effect_type: 'time', target: 'all' },
  'Frosted Cakes': { subcategory: 'bakery', effect_type: 'xp', target: 'Cakes' },
  'Juicy Boost': { subcategory: 'smoothie_shack', effect_type: 'xp', target: 'Juice' },
  'Turbo Fry': { subcategory: 'fire_pit', effect_type: 'time', target: 'all' },
  'Instant Gratification': { subcategory: 'all', effect_type: 'time', target: 'all' },
  'Double Nom': { subcategory: 'all', effect_type: 'yield', target: 'all' },
  'Fiery Jackpot': { subcategory: 'fire_pit', effect_type: 'yield', target: 'all' },
  'Fry Frenzy': { subcategory: 'fire_pit', effect_type: 'time', target: 'all' },
  'Buzzworthy Treats': { subcategory: 'bakery', effect_type: 'xp', target: 'Honey Foods' },
  'Drive-Through Deli': { subcategory: 'deli', effect_type: 'time', target: 'all' },
};

const caveSkillsSubcat = {
  'Lean Compost': { subcategory: 'bin', effect_type: 'cost', target: 'myco_bin' },
  'Rapid Mycelium': { subcategory: 'bin', effect_type: 'time', target: 'myco_bin' },
  'Mushroom Bloom': { subcategory: 'patch', effect_type: 'yield', target: 'patch' },
  'Muddy Bounty': { subcategory: 'mud', effect_type: 'yield', target: 'mud' },
  'Sturdy Shovel': { subcategory: 'shovel', effect_type: 'cost', target: 'shovel' },
  'Fungal Harvest': { subcategory: 'mushroom', effect_type: 'yield', target: 'mushrooms' },
  'Beetle Nest': { subcategory: 'beetle', effect_type: 'yield', target: 'beetles' },
  'Sturdy Drill': { subcategory: 'drill', effect_type: 'cost', target: 'drill' },
  'Tool Hoarder': { subcategory: 'tools', effect_type: 'capacity', target: 'tools' },
  'Rare Breeds': { subcategory: 'beetle', effect_type: 'chance', target: 'beetle_rarity' },
  'Twin Beetles': { subcategory: 'beetle', effect_type: 'chance', target: 'beetles' }
};

for (const [treeName, treeSkills] of Object.entries(skillsData)) {
  for (const [skillName, skill] of Object.entries(treeSkills)) {
    const isCookingTree = treeName === 'Cooking';
    const isCaveTree = treeName === 'Cave';
    const isFishyFeast = skillName === 'Fishy Feast';
    const isSpeedyAging = skillName === 'Speedy Aging';

    if (isCookingTree) {
      const meta = cookingSkillsSubcat[skillName] || { subcategory: 'all', effect_type: 'xp', target: 'all' };
      if (skill.mathematics_1) {
        skill.mathematics_1.category = 'cooking';
        skill.mathematics_1.subcategory = meta.subcategory;
        skill.mathematics_1.effect_type = meta.effect_type;
        skill.mathematics_1.target = meta.target;
      }
      if (skill.mathematics_2) {
        skill.mathematics_2.category = 'cooking';
        skill.mathematics_2.subcategory = meta.subcategory;
        skill.mathematics_2.effect_type = meta.effect_type;
        skill.mathematics_2.target = meta.target;
      }
    } else if (isFishyFeast) {
      if (skill.mathematics_1) {
        skill.mathematics_1.category = 'cooking';
        skill.mathematics_1.subcategory = 'kitchen';
        skill.mathematics_1.effect_type = 'xp';
        skill.mathematics_1.target = 'Fish';
      }
    } else if (isSpeedyAging) {
      if (skill.mathematics_1) {
        skill.mathematics_1.category = 'cooking';
        skill.mathematics_1.subcategory = 'aging_shed';
        skill.mathematics_1.effect_type = 'time';
        skill.mathematics_1.target = 'all';
      }
    } else if (isCaveTree) {
      const meta = caveSkillsSubcat[skillName] || { subcategory: '', effect_type: 'yield', target: 'cave' };
      if (skill.mathematics_1) {
        skill.mathematics_1.category = 'cave';
        skill.mathematics_1.subcategory = meta.subcategory;
        skill.mathematics_1.effect_type = meta.effect_type;
        skill.mathematics_1.target = meta.target;
      }
      if (skill.mathematics_2) {
        skill.mathematics_2.category = 'cave';
        skill.mathematics_2.subcategory = meta.subcategory;
        skill.mathematics_2.effect_type = meta.effect_type;
        skill.mathematics_2.target = meta.target;
      }
    } else {
      // Otros árboles: vaciar category y target, agregar subcategory: ''
      for (let i = 1; i <= 6; i++) {
        const key = `mathematics_${i}`;
        if (skill[key]) {
          const m = skill[key];
          skill[key] = {
            category: '',
            subcategory: '',
            effect_type: '',
            target: '',
            mathematics_operation: m.mathematics_operation || 'multiply',
            calc: m.calc !== undefined ? m.calc : null,
            ...(m.calc_by_rank ? { calc_by_rank: m.calc_by_rank } : {}),
            ...(m.chance !== undefined ? { chance: m.chance } : {})
          };
        }
      }
    }
  }
}

// 4. Normalizar calculo_buffs.json
// Consumables: Gourmet Hourglass, Time Warp Totem, Super Totem son de cocina
const cookingConsumables = new Set(['Gourmet Hourglass', 'Time Warp Totem', 'Super Totem']);
for (const [name, item] of Object.entries(buffsData.consumables || {})) {
  if (cookingConsumables.has(name)) {
    if (item.mathematics_1) {
      item.mathematics_1.category = 'cooking';
      item.mathematics_1.subcategory = 'all';
      item.mathematics_1.effect_type = 'time';
      item.mathematics_1.target = 'all';
    }
  } else {
    for (let i = 1; i <= 6; i++) {
      const key = `mathematics_${i}`;
      if (item[key]) {
        const m = item[key];
        item[key] = {
          category: '',
          subcategory: '',
          effect_type: '',
          target: '',
          mathematics_operation: m.mathematics_operation || 'multiply',
          calc: m.calc !== undefined ? m.calc : null,
          ...(m.calc_by_rank ? { calc_by_rank: m.calc_by_rank } : {})
        };
      }
    }
  }
}

// Shrines: vaciar por ahora (hasta llegar a su módulo)
for (const [name, item] of Object.entries(buffsData.shrines || {})) {
  for (let i = 1; i <= 6; i++) {
    const key = `mathematics_${i}`;
    if (item[key]) {
      const m = item[key];
      item[key] = {
        category: '',
        subcategory: '',
        effect_type: '',
        target: '',
        mathematics_operation: m.mathematics_operation || 'multiply',
        calc: m.calc !== undefined ? m.calc : null,
        ...(m.calc_by_rank ? { calc_by_rank: m.calc_by_rank } : {})
      };
    }
  }
}

// Others: VIP Pass, Blossom Beard, Faction Pet, Oil, Luminous Anglerfish, Faction Medallion -> cooking. Fairy Circle -> cave.
for (const [name, item] of Object.entries(buffsData.others || {})) {
  if (['VIP Pass', 'Blossom Beard', 'Faction Pet'].includes(name)) {
    if (item.mathematics_1) {
      item.mathematics_1.category = 'cooking';
      item.mathematics_1.subcategory = 'all';
      item.mathematics_1.effect_type = 'xp';
      item.mathematics_1.target = 'all';
    }
  } else if (name === 'Luminous Anglerfish') {
    if (item.mathematics_1) {
      item.mathematics_1.category = 'cooking';
      item.mathematics_1.subcategory = 'kitchen';
      item.mathematics_1.effect_type = 'xp';
      item.mathematics_1.target = 'Fish';
      item.mathematics_1.mathematics_operation = 'multiply';
      item.mathematics_1.calc = 1.5;
    }
  } else if (name === 'Faction Medallion') {
    if (item.mathematics_1) {
      item.mathematics_1.category = 'cooking';
      item.mathematics_1.subcategory = 'all';
      item.mathematics_1.effect_type = 'time';
      item.mathematics_1.target = 'all';
      item.mathematics_1.mathematics_operation = 'multiply';
      item.mathematics_1.calc = 0.75;
    }
  } else if (name === 'Oil') {
    if (item.mathematics_1) {
      item.mathematics_1.category = 'cooking';
      item.mathematics_1.subcategory = 'all';
      item.mathematics_1.effect_type = 'time';
      item.mathematics_1.target = 'all';
      item.mathematics_1.mathematics_operation = 'speed_multiplier';
      item.mathematics_1.calc = 2.0;
    }
  } else if (name === 'Fairy Circle') {
    if (item.mathematics_1) {
      item.mathematics_1.category = 'cave';
      item.mathematics_1.subcategory = 'mushroom';
      item.mathematics_1.effect_type = 'yield';
      item.mathematics_1.target = 'Wild Mushroom';
      item.mathematics_1.mathematics_operation = 'add';
      item.mathematics_1.calc = 0.2;
    }
  } else {
    for (let i = 1; i <= 6; i++) {
      const key = `mathematics_${i}`;
      if (item[key]) {
        const m = item[key];
        item[key] = {
          category: '',
          subcategory: '',
          effect_type: '',
          target: '',
          mathematics_operation: m.mathematics_operation || 'multiply',
          calc: m.calc !== undefined ? m.calc : null,
          ...(m.calc_by_rank ? { calc_by_rank: m.calc_by_rank } : {})
        };
      }
    }
  }
}

// Guardar los 3 archivos JSON formateados con 2 espacios
fs.writeFileSync(powerupsPath, JSON.stringify(powerupsData, null, 2) + '\n', 'utf8');
fs.writeFileSync(skillsPath, JSON.stringify(skillsData, null, 2) + '\n', 'utf8');
fs.writeFileSync(buffsPath, JSON.stringify(buffsData, null, 2) + '\n', 'utf8');

console.log('Migración completada con éxito.');
