const fs = require('fs');
const path = require('path');

const apiFile = 'D:\\proyectos\\sunflower-land-recursos\\api-marketplace.txt';
const apiData = JSON.parse(fs.readFileSync(apiFile, 'utf8'));

const powerupsPath = path.join(__dirname, '../src/content/data/sfl/powerups.json');
const resourcesPath = path.join(__dirname, '../src/content/data/sfl/resources.json');
const cosmeticsPath = path.join(__dirname, '../src/content/data/sfl/cosmetics.json');

const indexTs = fs.readFileSync(path.join(__dirname, '../temp_index.ts'), 'utf8');
const decorationsTs = fs.readFileSync(path.join(__dirname, '../temp_decorations.ts'), 'utf8');
const collectiblesTs = fs.readFileSync(path.join(__dirname, '../temp_collectibles.ts'), 'utf8');

const powerupsData = JSON.parse(fs.readFileSync(powerupsPath, 'utf8'));
const resourcesData = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
const cosmeticsData = JSON.parse(fs.readFileSync(cosmeticsPath, 'utf8'));

// Extract known IDs from index.ts
const knownIds = {}; // name -> id
const idToName = {}; // id -> name
const idRegex1 = /^\s*"([^"]+)"\s*:\s*(\d+)/gm;
const idRegex2 = /^\s*([A-Za-z0-9_]+)\s*:\s*(\d+)/gm;
let match;
while ((match = idRegex1.exec(indexTs)) !== null) { knownIds[match[1]] = match[2]; idToName[match[2]] = match[1]; }
while ((match = idRegex2.exec(indexTs)) !== null) { knownIds[match[1]] = match[2]; idToName[match[2]] = match[1]; }

// Parse Decorations and Collectibles keys
const cosmeticNames = new Set();
const keyRegex1 = /^\s*"([^"]+)"\s*:/gm;
const keyRegex2 = /^\s*([A-Za-z0-9_]+)\s*:/gm;

while ((match = keyRegex1.exec(decorationsTs)) !== null) cosmeticNames.add(match[1]);
while ((match = keyRegex2.exec(decorationsTs)) !== null) {
  if (!['export', 'import', 'const', 'type'].includes(match[1])) cosmeticNames.add(match[1]);
}
while ((match = keyRegex1.exec(collectiblesTs)) !== null) cosmeticNames.add(match[1]);
while ((match = keyRegex2.exec(collectiblesTs)) !== null) {
  if (!['export', 'import', 'const', 'type'].includes(match[1])) cosmeticNames.add(match[1]);
}

// Convert cosmeticNames to cosmeticIDs
const cosmeticIDs = new Set();
for (const name of cosmeticNames) {
  const id = knownIds[name];
  if (id) cosmeticIDs.add(id);
}

// Extract API Collectibles IDs
const apiItems = apiData.data.reports["2026-07-04"].items;
const apiCollectibleIds = new Set();
for (const key in apiItems) {
  if (key.startsWith('collectibles-')) {
    apiCollectibleIds.add(key.split('-')[1]);
  }
}

// Now build the correct list
const correctCollectibles = {};
let count = 0;

for (const id of apiCollectibleIds) {
  // Must be in DECORATIONS or COLLECTIBLES
  if (!cosmeticIDs.has(id)) continue;
  
  // Must not be in resources
  if (resourcesData[id]) continue;
  
  // Must not be in powerups
  if (powerupsData.power_ups.collectibles && powerupsData.power_ups.collectibles[id]) continue;
  if (powerupsData.power_ups.wearables && powerupsData.power_ups.wearables[id]) continue;
  
  const name = idToName[id];
  if (name) {
    // Preserve old image if it exists
    let oldImage = name.toLowerCase().replace(/ /g, '_').replace(/'/g, '') + '.webp';
    if (cosmeticsData.cosmetics.collectibles && cosmeticsData.cosmetics.collectibles[id]) {
       oldImage = cosmeticsData.cosmetics.collectibles[id].image;
    }
    
    correctCollectibles[id] = {
      name: name,
      image: oldImage
    };
    count++;
  }
}

cosmeticsData.cosmetics.collectibles = correctCollectibles;
fs.writeFileSync(cosmeticsPath, JSON.stringify(cosmeticsData, null, 2) + '\n', 'utf8');

console.log(`Re-filtered cosmetics! Resulting items: ${count}`);
// Check if Rod or Red Pansy is still there
console.log(`Rod present? ${!!correctCollectibles[knownIds['Rod']]}`);
console.log(`Red Pansy present? ${!!correctCollectibles[knownIds['Red Pansy']]}`);
