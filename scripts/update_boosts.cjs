const fs = require('fs');
const path = require('path');
const https = require('https');

const powerupsPath = path.join(__dirname, '../src/content/data/sfl/powerups.json');
const powerupsData = JSON.parse(fs.readFileSync(powerupsPath, 'utf8'));

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', err => reject(err));
  });
}

async function run() {
  console.log("Downloading bumpkinItemBuffs.ts...");
  const buffsTs = await fetchUrl("https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/features/game/types/bumpkinItemBuffs.ts");
  
  console.log("Downloading en.json...");
  const enJsonStr = await fetchUrl("https://raw.githubusercontent.com/sunflower-land/sunflower-land/main/src/lib/i18n/dictionaries/en.json");
  const enJson = JSON.parse(enJsonStr);
  
  // Extract dictionary
  const buffsMap = {};
  
  // We look for patterns like: "Item Name": [ { shortDescription: translate("key.name")
  // Or: "Item Name": [ { shortDescription: "literal text"
  // Let's use a regex to match block by block
  
  const regex = /"([^"]+)"\s*:\s*\[\s*\{\s*shortDescription\s*:\s*(?:translate\(\s*"([^"]+)"\s*\)|"([^"]+)")/g;
  let match;
  while ((match = regex.exec(buffsTs)) !== null) {
      const itemName = match[1];
      const transKey = match[2];
      const literal = match[3];
      
      if (transKey) {
          buffsMap[itemName] = enJson[transKey] || `[Missing translation: ${transKey}]`;
      } else if (literal) {
          buffsMap[itemName] = literal;
      }
  }

  // Also match unquoted keys like: Parsnip: [ { shortDescription: translate("key")
  const regexUnquoted = /([A-Za-z0-9_]+)\s*:\s*\[\s*\{\s*shortDescription\s*:\s*(?:translate\(\s*"([^"]+)"\s*\)|"([^"]+)")/g;
  while ((match = regexUnquoted.exec(buffsTs)) !== null) {
      const itemName = match[1];
      // Exclude keywords like export, const, etc
      if (['export', 'const', 'import', 'return'].includes(itemName)) continue;
      
      const transKey = match[2];
      const literal = match[3];
      
      if (transKey) {
          buffsMap[itemName] = enJson[transKey] || `[Missing translation: ${transKey}]`;
      } else if (literal) {
          buffsMap[itemName] = literal;
      }
  }
  
  console.log(`Extracted ${Object.keys(buffsMap).length} buffs from source.`);
  
  let updatedCount = 0;
  const wearables = powerupsData.power_ups.wearables;
  for (const id in wearables) {
      const item = wearables[id];
      if (buffsMap[item.name]) {
          if (item.boost !== buffsMap[item.name]) {
              console.log(`[UPDATE] ${item.name}: "${item.boost}" -> "${buffsMap[item.name]}"`);
              item.boost = buffsMap[item.name];
              updatedCount++;
          }
      } else {
          console.log(`[WARN] No buff found in source for: ${item.name} (Current: ${item.boost})`);
      }
  }
  
  console.log(`Updated ${updatedCount} items.`);
  
  fs.writeFileSync(powerupsPath, JSON.stringify(powerupsData, null, 2) + '\n', 'utf8');
}

run().catch(console.error);
