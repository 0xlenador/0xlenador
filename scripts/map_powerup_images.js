import fs from 'fs';
import path from 'path';

const powerupsJsonPath = path.join(process.cwd(), 'src/data/sfl_powerups.json');
const powerupsJson = JSON.parse(fs.readFileSync(powerupsJsonPath, 'utf8'));

const imagesDir = path.join(process.cwd(), 'public/img/sunflowerland/powerups');
const files = fs.readdirSync(imagesDir);

const imageMap = {};
for (const file of files) {
  const nameWithoutExt = file.substring(0, file.lastIndexOf('.'));
  imageMap[nameWithoutExt] = file;
}

const items = powerupsJson.power_ups.collectibles;
for (const id of Object.keys(items)) {
  const item = items[id];
  const cleanName = item.name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  if (imageMap[cleanName]) {
    item.image = imageMap[cleanName];
  } else {
    // maybe try replacing quotes or something, or it doesn't exist
    // let's try replacing Grinx's Hammer
    const altCleanName = item.name.toLowerCase().replace(/'/g, '_').replace(/[^a-z0-9_]+/g, '_').replace(/_+/g, '_');
    if (imageMap[altCleanName]) {
       item.image = imageMap[altCleanName];
    } else {
       console.log(`Image not found for: ${item.name} (${cleanName})`);
       item.image = `${cleanName}.png`; // fallback
    }
  }
}

fs.writeFileSync(powerupsJsonPath, JSON.stringify(powerupsJson, null, 2));
console.log("Updated sfl_powerups.json with image filenames.");
