const fs = require('fs');
const path = require('path');

function reportCommand() {
  const lastPath = path.join('.skill-lab', 'last.json');
  if (!fs.existsSync(lastPath)) {
    console.error('No run found. Run: skill-lab run');
    process.exit(1);
  }
  const last = JSON.parse(fs.readFileSync(lastPath, 'utf8'));

  const bySkill = {};
  for (const r of last) {
    const skill = r.spec?.skill || '(unknown)';
    (bySkill[skill] ||= []).push(r);
  }

  const totalCost = last.reduce((a, r) => a + (r.run?.cost || 0), 0);
  const passed = last.filter((r) => r.graded?.pass).length;
  const failed = last.length - passed;

  const lines = [];
  lines.push(`# skill-lab report`);
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  lines.push(`- **Total evals**: ${last.length}`);
  lines.push(`- **Passed**: ${passed}`);
  lines.push(`- **Failed**: ${failed}`);
  lines.push(`- **Total cost**: $${totalCost.toFixed(2)}`);
  lines.push('');

  for (const [skill, rows] of Object.entries(bySkill)) {
    lines.push(`## ${skill}`);
    lines.push('');
    lines.push('| Test | Status | Time | Cost |');
    lines.push('|---|---|---|---|');
    for (const r of rows) {
      const status = r.graded?.pass ? '✓ pass' : '✗ fail';
      lines.push(`| ${r.spec?.name} | ${status} | ${(r.run?.elapsed || 0).toFixed(1)}s | $${(r.run?.cost || 0).toFixed(2)} |`);
    }
    lines.push('');
  }

  const out = path.join('.skill-lab', 'report.md');
  fs.writeFileSync(out, lines.join('\n'));
  console.log(`→ ${out}`);
}

module.exports = { reportCommand };
