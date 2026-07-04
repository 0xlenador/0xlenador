const fs = require('fs');
const path = require('path');

const powerupsPath = path.join(__dirname, '../src/content/data/sfl/powerups.json');
const cosmeticsPath = path.join(__dirname, '../src/content/data/sfl/cosmetics.json');

const powerupsData = JSON.parse(fs.readFileSync(powerupsPath, 'utf8'));
const cosmeticsData = JSON.parse(fs.readFileSync(cosmeticsPath, 'utf8'));

const powerupsImagesDir = path.join(__dirname, '../public/img/sunflowerland/powerups/collectibles');
const cosmeticsImagesDir = path.join(__dirname, '../public/img/sunflowerland/cosmetics/collectibles');

if (!fs.existsSync(cosmeticsImagesDir)) {
  fs.mkdirSync(cosmeticsImagesDir, { recursive: true });
}

if (!cosmeticsData.cosmetics) cosmeticsData.cosmetics = {};
if (!cosmeticsData.cosmetics.collectibles) cosmeticsData.cosmetics.collectibles = {};

let movedCount = 0;
const pCollectibles = powerupsData.power_ups.collectibles;

for (const id in pCollectibles) {
  const item = pCollectibles[id];
  // If boost is empty, undefined, or just spaces
  if (!item.boost || item.boost.trim() === '') {
    // It's a cosmetic
    cosmeticsData.cosmetics.collectibles[id] = item;
    
    // Move image if it exists
    if (item.image) {
      const oldPath = path.join(powerupsImagesDir, item.image);
      const newPath = path.join(cosmeticsImagesDir, item.image);
      
      if (fs.existsSync(oldPath)) {
        fs.renameSync(oldPath, newPath);
        console.log(`[MOVED IMG] ${item.image}`);
      } else {
        console.log(`[WARN] Image not found: ${oldPath}`);
      }
    }
    
    delete powerupsData.power_ups.collectibles[id];
    console.log(`[MOVED DATA] ${item.name} (${id})`);
    movedCount++;
  }
}

fs.writeFileSync(powerupsPath, JSON.stringify(powerupsData, null, 2) + '\n', 'utf8');
fs.writeFileSync(cosmeticsPath, JSON.stringify(cosmeticsData, null, 2) + '\n', 'utf8');

console.log(`Moved ${movedCount} cosmetic collectibles successfully.`);
