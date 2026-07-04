const fs = require('fs');
const path = require('path');
const https = require('https');

const powerupsPath = path.join(__dirname, '../src/content/data/sfl/powerups.json');
const cosmeticsPath = path.join(__dirname, '../src/content/data/sfl/cosmetics.json');

const powerupsData = JSON.parse(fs.readFileSync(powerupsPath, 'utf8'));
const cosmeticsData = JSON.parse(fs.readFileSync(cosmeticsPath, 'utf8'));

if (!cosmeticsData.cosmetics) cosmeticsData.cosmetics = {};
if (!cosmeticsData.cosmetics.collectibles) cosmeticsData.cosmetics.collectibles = {};

const indexTs = fs.readFileSync(path.join(__dirname, '../temp_index.ts'), 'utf8');
const decorationsTs = fs.readFileSync(path.join(__dirname, '../temp_decorations.ts'), 'utf8');
const collectiblesTs = fs.readFileSync(path.join(__dirname, '../temp_collectibles.ts'), 'utf8');
const imgsPaths = JSON.parse(fs.readFileSync(path.join(__dirname, '../temp_imgs.json'), 'utf8'));

// Parse KNOWN_IDS
const knownIds = {};
const idRegex1 = /^\s*"([^"]+)"\s*:\s*(\d+)/gm;
const idRegex2 = /^\s*([A-Za-z0-9_]+)\s*:\s*(\d+)/gm;

let match;
while ((match = idRegex1.exec(indexTs)) !== null) knownIds[match[1]] = match[2];
while ((match = idRegex2.exec(indexTs)) !== null) knownIds[match[1]] = match[2];

// Parse Decorations and Collectibles keys
const cosmeticKeys = new Set();
const keyRegex1 = /^\s*"([^"]+)"\s*:/gm;
const keyRegex2 = /^\s*([A-Za-z0-9_]+)\s*:/gm;

while ((match = keyRegex1.exec(decorationsTs)) !== null) cosmeticKeys.add(match[1]);
while ((match = keyRegex2.exec(decorationsTs)) !== null) {
  if (!['export', 'import', 'const', 'type'].includes(match[1])) cosmeticKeys.add(match[1]);
}

while ((match = keyRegex1.exec(collectiblesTs)) !== null) cosmeticKeys.add(match[1]);
while ((match = keyRegex2.exec(collectiblesTs)) !== null) {
  if (!['export', 'import', 'const', 'type'].includes(match[1])) cosmeticKeys.add(match[1]);
}

console.log(`Found ${cosmeticKeys.size} potential cosmetics.`);

const existingIds = new Set(Object.keys(powerupsData.power_ups.collectibles));

// Find image path in temp_imgs.json
function findImagePath(itemName) {
  const baseName = itemName.toLowerCase().replace(/ /g, '_').replace(/'/g, '');
  for (const ext of ['.webp', '.png', '.gif']) {
    for (const p of imgsPaths) {
      if (p.endsWith(`/${baseName}${ext}`) || p === `src/assets/decorations/${baseName}${ext}` || p === `src/assets/sfts/${baseName}${ext}`) {
        return p;
      }
    }
  }
  return null;
}

function fetchUrl(url, dest) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode !== 200) return reject(new Error(`Status ${res.statusCode}`));
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', err => reject(err));
  });
}

async function run() {
  const cosmeticsImagesDir = path.join(__dirname, '../public/img/sunflowerland/cosmetics/collectibles');
  if (!fs.existsSync(cosmeticsImagesDir)) {
    fs.mkdirSync(cosmeticsImagesDir, { recursive: true });
  }

  let addedCount = 0;
  
  for (const name of cosmeticKeys) {
    const id = knownIds[name];
    if (!id) continue;
    
    // If it's already in powerups or cosmetics, skip (or maybe update cosmetics)
    if (existingIds.has(id.toString())) continue;
    
    // We add to cosmetics
    const imgPathInRepo = findImagePath(name);
    let finalImageName = "";
    
    if (imgPathInRepo) {
      finalImageName = path.basename(imgPathInRepo);
      const url = `https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/${imgPathInRepo}`;
      const dest = path.join(cosmeticsImagesDir, finalImageName);
      
      try {
        await fetchUrl(url, dest);
        console.log(`Downloaded image for ${name}: ${finalImageName}`);
      } catch (err) {
        console.log(`Failed to download ${url}: ${err.message}`);
      }
    } else {
      // Missing image
      finalImageName = name.toLowerCase().replace(/ /g, '_').replace(/'/g, '') + '.webp';
      console.log(`[WARN] No image found in repo for ${name}, using placeholder name ${finalImageName}`);
    }
    
    cosmeticsData.cosmetics.collectibles[id] = {
      name: name,
      image: finalImageName
    };
    
    addedCount++;
  }
  
  fs.writeFileSync(cosmeticsPath, JSON.stringify(cosmeticsData, null, 2) + '\n', 'utf8');
  console.log(`Added ${addedCount} cosmetic collectibles to cosmetics.json!`);
}

run().catch(console.error);
