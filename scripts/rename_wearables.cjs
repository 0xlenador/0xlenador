const fs = require('fs');
const path = require('path');

const powerupsPath = path.join(__dirname, '../src/content/data/sfl/powerups.json');
const cosmeticsPath = path.join(__dirname, '../src/content/data/sfl/cosmetics.json');

const powerupsData = JSON.parse(fs.readFileSync(powerupsPath, 'utf8'));
const cosmeticsData = JSON.parse(fs.readFileSync(cosmeticsPath, 'utf8'));

const powerupsDir = path.join(__dirname, '../public/img/sunflowerland/powerups/wearables');
const cosmeticsDir = path.join(__dirname, '../public/img/sunflowerland/cosmetics/wearables');

function sanitizeFilename(name) {
  // Safe filename replacement for windows
  return name.replace(/[<>:"/\\|?*]/g, '_');
}

function processWearables(wearablesObj, destDir) {
  if (!wearablesObj) return;
  for (const id in wearablesObj) {
    const item = wearablesObj[id];
    if (!item.image) continue;
    
    const name = item.name;
    const sanitizedName = sanitizeFilename(name);
    const oldFileName = item.image;
    const newFileName = `${sanitizedName}.webp`;
    
    const oldPath = path.join(destDir, oldFileName);
    const newPath = path.join(destDir, newFileName);
    
    if (fs.existsSync(oldPath)) {
      if (oldPath !== newPath) {
        fs.renameSync(oldPath, newPath);
        console.log(`[OK] Renamed ${oldFileName} to ${newFileName}`);
      }
      wearablesObj[id].image = newFileName;
    } else {
      if (fs.existsSync(newPath)) {
         wearablesObj[id].image = newFileName;
      } else {
         console.log(`[WARN] File not found: ${oldPath} or ${newPath}`);
      }
    }
  }
}

function run() {
  console.log("Processing Powerups...");
  processWearables(powerupsData.power_ups.wearables, powerupsDir);
  
  console.log("Processing Cosmetics...");
  processWearables(cosmeticsData.cosmetics.wearables, cosmeticsDir);
  
  fs.writeFileSync(powerupsPath, JSON.stringify(powerupsData, null, 2) + '\n', 'utf8');
  fs.writeFileSync(cosmeticsPath, JSON.stringify(cosmeticsData, null, 2) + '\n', 'utf8');
  console.log("Done!");
}

run();
