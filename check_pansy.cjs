const fs = require('fs');
const indexTs = fs.readFileSync('temp_index.ts', 'utf8');
const r1 = /^\s*"([^"]+)"\s*:\s*(\d+)/gm;
const r2 = /^\s*([A-Za-z0-9_]+)\s*:\s*(\d+)/gm;
let m;
const ids = {};
while(m = r1.exec(indexTs)) ids[m[2]] = m[1];
while(m = r2.exec(indexTs)) ids[m[2]] = m[1];

console.log('218 is:', ids['218']);
for (const [k,v] of Object.entries(ids)) {
  if (v.includes('Pansy')) {
    console.log(v, k);
  }
}
