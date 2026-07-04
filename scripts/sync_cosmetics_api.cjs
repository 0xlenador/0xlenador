const fs = require('fs');
const path = require('path');
const https = require('https');

const apiFile = 'D:\\proyectos\\sunflower-land-recursos\\api-marketplace.txt';
const apiData = JSON.parse(fs.readFileSync(apiFile, 'utf8'));

const powerupsPath = path.join(__dirname, '../src/content/data/sfl/powerups.json');
const resourcesPath = path.join(__dirname, '../src/content/data/sfl/resources.json');
const cosmeticsPath = path.join(__dirname, '../src/content/data/sfl/cosmetics.json');
const indexTs = fs.readFileSync(path.join(__dirname, '../temp_index.ts'), 'utf8');
const imgsPaths = JSON.parse(fs.readFileSync(path.join(__dirname, '../temp_imgs.json'), 'utf8'));

const powerupsData = JSON.parse(fs.readFileSync(powerupsPath, 'utf8'));
const resourcesData = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
const cosmeticsData = JSON.parse(fs.readFileSync(cosmeticsPath, 'utf8'));

// Extract known IDs from index.ts
const knownIds = {}; // id -> name
const idRegex1 = /^\s*"([^"]+)"\s*:\s*(\d+)/gm;
const idRegex2 = /^\s*([A-Za-z0-9_]+)\s*:\s*(\d+)/gm;
let match;
while ((match = idRegex1.exec(indexTs)) !== null) knownIds[match[2]] = match[1];
while ((match = idRegex2.exec(indexTs)) !== null) knownIds[match[2]] = match[1];

// Extract API Collectibles IDs
const apiItems = apiData.data.reports["2026-07-04"].items;
const apiCollectibleIds = [];
for (const key in apiItems) {
  if (key.startsWith('collectibles-')) {
    apiCollectibleIds.push(key.split('-')[1]);
  }
}

console.log(`Found ${apiCollectibleIds.length} collectibles in the API.`);

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

  const newCollectibles = {};
  let addedCount = 0;

  for (const id of apiCollectibleIds) {
    // Priority 3: Not in resources.json and not in powerups.json
    if (resourcesData[id]) continue;
    if (powerupsData.power_ups.collectibles && powerupsData.power_ups.collectibles[id]) continue;
    if (powerupsData.power_ups.wearables && powerupsData.power_ups.wearables[id]) continue; // just in case
    
    // Priority 2: Must be in SFL repo (to have a name)
    const name = knownIds[id];
    if (!name) {
      console.log(`[WARN] ID ${id} is in API but has no name in index.ts! Skipping.`);
      continue;
    }

    // Prepare image
    const imgPathInRepo = findImagePath(name);
    let finalImageName = "";
    
    if (imgPathInRepo) {
      finalImageName = path.basename(imgPathInRepo);
      const dest = path.join(cosmeticsImagesDir, finalImageName);
      if (!fs.existsSync(dest)) {
        const url = `https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/${imgPathInRepo}`;
        try {
          await fetchUrl(url, dest);
          console.log(`Downloaded image for ${name}: ${finalImageName}`);
        } catch (err) {
          console.log(`Failed to download ${url}: ${err.message}`);
        }
      }
    } else {
      finalImageName = name.toLowerCase().replace(/ /g, '_').replace(/'/g, '') + '.webp';
      console.log(`[WARN] No image found in repo for ${name}, using placeholder ${finalImageName}`);
    }

    newCollectibles[id] = {
      name: name,
      image: finalImageName
    };
    addedCount++;
  }

  // Replace cosmetics.json collectibles with ONLY these
  cosmeticsData.cosmetics.collectibles = newCollectibles;
  fs.writeFileSync(cosmeticsPath, JSON.stringify(cosmeticsData, null, 2) + '\n', 'utf8');

  console.log(`Successfully built cosmetics.json with exactly ${addedCount} valid cosmetic collectibles from the API!`);
}

run().catch(console.error);
