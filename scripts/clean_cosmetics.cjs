const fs = require('fs');
const path = require('path');

const cosmeticsPath = path.join(__dirname, '../src/content/data/sfl/cosmetics.json');
const resourcesPath = path.join(__dirname, '../src/content/data/sfl/resources.json');
const powerupsPath = path.join(__dirname, '../src/content/data/sfl/powerups.json');

const cosmeticsData = JSON.parse(fs.readFileSync(cosmeticsPath, 'utf8'));
const resourcesData = JSON.parse(fs.readFileSync(resourcesPath, 'utf8'));
const powerupsData = JSON.parse(fs.readFileSync(powerupsPath, 'utf8'));

let deletedCount = 0;

if (cosmeticsData.cosmetics && cosmeticsData.cosmetics.collectibles) {
  for (const id in cosmeticsData.cosmetics.collectibles) {
    // If it's in resources.json, delete it from cosmetics
    if (resourcesData[id] || (powerupsData.power_ups.collectibles && powerupsData.power_ups.collectibles[id]) || (powerupsData.power_ups.wearables && powerupsData.power_ups.wearables[id])) {
      console.log(`[DELETED] ${cosmeticsData.cosmetics.collectibles[id].name} (${id})`);
      delete cosmeticsData.cosmetics.collectibles[id];
      deletedCount++;
    }
  }
}

fs.writeFileSync(cosmeticsPath, JSON.stringify(cosmeticsData, null, 2) + '\n', 'utf8');

console.log(`Deleted ${deletedCount} overlapping items from cosmetics.json`);
