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

// Extract known IDs from index.ts, keeping track of MULTIPLE names per ID
const idToNames = {}; // id -> [name1, name2, ...]
const idRegex1 = /^\s*"([^"]+)"\s*:\s*(\d+)/gm;
const idRegex2 = /^\s*([A-Za-z0-9_]+)\s*:\s*(\d+)/gm;
let match;
while ((match = idRegex1.exec(indexTs)) !== null) {
  const name = match[1]; const id = match[2];
  if (!idToNames[id]) idToNames[id] = [];
  idToNames[id].push(name);
}
while ((match = idRegex2.exec(indexTs)) !== null) {
  const name = match[1]; const id = match[2];
  if (!idToNames[id]) idToNames[id] = [];
  idToNames[id].push(name);
}

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

// Extract API Collectibles IDs
const apiItems = apiData.data.reports["2026-07-04"].items;
const apiCollectibleIds = new Set();
for (const key in apiItems) {
  if (key.startsWith('collectibles-')) {
    apiCollectibleIds.add(key.split('-')[1]);
  }
}

// Now build the list with duplicates exposed
const correctCollectibles = {};
let count = 0;
let dupCount = 0;

for (const id of apiCollectibleIds) {
  // Must not be in resources
  if (resourcesData[id]) continue;
  
  // Must not be in powerups
  if (powerupsData.power_ups.collectibles && powerupsData.power_ups.collectibles[id]) continue;
  if (powerupsData.power_ups.wearables && powerupsData.power_ups.wearables[id]) continue;
  
  const namesForId = idToNames[id] || [];
  
  // We want any name that maps to this ID, but we only include those that are in cosmeticNames OR if we just expose them all
  // User said: "si encuentras varias coincidencias con un mismo ID los pongas todos"
  // Let's filter names by ones that actually exist in cosmeticNames (DECORATIONS / COLLECTIBLES)
  // Or actually, let's just expose ALL names for this ID from index.ts so user can pick!
  
  let validNames = namesForId;
  // If we have no valid names but the ID is in API, maybe we should skip it, but let's keep going.
  if (validNames.length === 0) continue;

  for (let i = 0; i < validNames.length; i++) {
    const name = validNames[i];
    
    // Only include if at least ONE of the names is in cosmeticNames, 
    // OR if the user wants all API items that aren't resources/powerups.
    // The user specifically mentioned flowers that are mutant are tradable. 
    // "hay flores que son mutantes y si son comerciables como black hole flower, no tiene boost entonces aplica para ser collectible cosmetics"
    
    // Since some flowers ARE cosmetics according to user (like mutant flowers), 
    // we should include ANY item that is in API and NOT in resources/powerups!
    // We shouldn't strictly restrict to `cosmeticNames` anymore!
    
    const key = (i === 0) ? id.toString() : `${id}_DUP${i}`;
    let imageStr = name.toLowerCase().replace(/ /g, '_').replace(/'/g, '') + '.webp';
    
    // Keep existing image if available
    if (cosmeticsData.cosmetics.collectibles && cosmeticsData.cosmetics.collectibles[id]) {
      // only if name matches exactly or it's the primary
      if (cosmeticsData.cosmetics.collectibles[id].name === name) {
        imageStr = cosmeticsData.cosmetics.collectibles[id].image;
      }
    }

    correctCollectibles[key] = {
      name: name,
      image: imageStr
    };
    
    if (i === 0) count++;
    else dupCount++;
  }
}

// Keep the old items that we manually filtered, but rewrite with correctCollectibles.
cosmeticsData.cosmetics.collectibles = correctCollectibles;
fs.writeFileSync(cosmeticsPath, JSON.stringify(cosmeticsData, null, 2) + '\n', 'utf8');

console.log(`Exported cosmetics! Base items: ${count}, Duplicates: ${dupCount}`);
