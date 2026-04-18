const fs = require('fs');
const path = require('path');

function diffCommand() {
  const basePath = path.join('.skill-lab', 'baseline.json');
  const lastPath = path.join('.skill-lab', 'last.json');

  if (!fs.existsSync(basePath)) {
    console.error('No baseline. Run: skill-lab run --baseline');
    process.exit(1);
  }
  if (!fs.existsSync(lastPath)) {
    console.error('No recent run. Run: skill-lab run');
    process.exit(1);
  }

  const base = JSON.parse(fs.readFileSync(basePath, 'utf8'));
  const last = JSON.parse(fs.readFileSync(lastPath, 'utf8'));

  const baseByName = Object.fromEntries(base.map((r) => [r.spec?.name, r]));
  const lastByName = Object.fromEntries(last.map((r) => [r.spec?.name, r]));

  const names = new Set([...Object.keys(baseByName), ...Object.keys(lastByName)]);
  let changed = 0;

  for (const name of names) {
    const b = baseByName[name];
    const l = lastByName[name];
    if (b && !l) { console.log(`  - ${name}  (removed)`); changed++; continue; }
    if (!b && l) { console.log(`  + ${name}  (added)`);   changed++; continue; }

    const bPass = b.graded?.pass;
    const lPass = l.graded?.pass;
    if (bPass && !lPass) { console.log(`  ✗ ${name}  regressed (was passing)`); changed++; }
    else if (!bPass && lPass) { console.log(`  ✓ ${name}  fixed (was failing)`); changed++; }
    else if (b.run?.output !== l.run?.output) {
      console.log(`  ~ ${name}  output changed`);
      changed++;
    }
  }

  if (changed === 0) console.log('  no changes since baseline');
}

module.exports = { diffCommand };
