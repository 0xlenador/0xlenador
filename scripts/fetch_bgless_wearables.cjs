const fs = require('fs');
const path = require('path');
const https = require('https');

const powerupsPath = path.join(__dirname, '../src/content/data/sfl/powerups.json');
const cosmeticsPath = path.join(__dirname, '../src/content/data/sfl/cosmetics.json');

const powerupsData = JSON.parse(fs.readFileSync(powerupsPath, 'utf8'));
const cosmeticsData = JSON.parse(fs.readFileSync(cosmeticsPath, 'utf8'));

const powerupsDir = path.join(__dirname, '../public/img/sunflowerland/powerups/wearables');
const cosmeticsDir = path.join(__dirname, '../public/img/sunflowerland/cosmetics/wearables');

async function downloadImage(id, destDir) {
  const url = `https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/assets/wearables/${id}.webp`;
  const destPath = path.join(destDir, `${id}.webp`);
  const oldPath = path.join(destDir, `${id}.png`);
  
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 200) {
        const file = fs.createWriteStream(destPath);
        res.pipe(file);
        file.on('finish', () => {
          file.close();
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
          resolve(true);
        });
      } else if (res.statusCode === 301 || res.statusCode === 302) {
        // Handle redirect if needed
        https.get(res.headers.location, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res2) => {
            if (res2.statusCode === 200) {
                const file = fs.createWriteStream(destPath);
                res2.pipe(file);
                file.on('finish', () => {
                file.close();
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
                resolve(true);
                });
            } else {
                resolve(false);
            }
        });
      } else {
        resolve(false);
      }
    }).on('error', () => {
      resolve(false);
    });
  });
}

async function processWearables(wearablesObj, destDir) {
  if (!wearablesObj) return;
  for (const id in wearablesObj) {
    const success = await downloadImage(id, destDir);
    if (success) {
      wearablesObj[id].image = `${id}.webp`;
      console.log(`[OK] Downloaded ${id}.webp`);
    } else {
      console.log(`[FAIL] Could not find ${id}.webp`);
    }
    // Small delay to prevent rate limit
    await new Promise(r => setTimeout(r, 100));
  }
}

async function run() {
  console.log("Processing Powerups...");
  await processWearables(powerupsData.power_ups.wearables, powerupsDir);
  
  console.log("Processing Cosmetics...");
  await processWearables(cosmeticsData.cosmetics.wearables, cosmeticsDir);
  
  fs.writeFileSync(powerupsPath, JSON.stringify(powerupsData, null, 2) + '\n', 'utf8');
  fs.writeFileSync(cosmeticsPath, JSON.stringify(cosmeticsData, null, 2) + '\n', 'utf8');
  console.log("Done!");
}

run();
