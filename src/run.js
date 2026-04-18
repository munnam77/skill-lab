const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const yaml = require('js-yaml');
const { grade } = require('./grade');

const PRICING = {
  'claude-opus-4-7':   { input: 15, output: 75 },
  'claude-sonnet-4-6': { input: 3,  output: 15 },
  'claude-haiku-4-5':  { input: 1,  output: 5 },
  'default':           { input: 3,  output: 15 },
};

function findEvals(root) {
  const results = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(p);
      else if (entry.isFile() && /\.(ya?ml)$/.test(entry.name) && dir.endsWith('evals')) {
        results.push(p);
      }
    }
  };
  walk(root);
  return results;
}

function runClaude(input, skill) {
  return new Promise((resolve) => {
    const args = ['-p', input, '--output-format', 'json'];
    if (skill) args.push('--skill', skill);
    const t0 = Date.now();
    execFile('claude', args, { maxBuffer: 50 * 1024 * 1024 }, (err, stdout) => {
      const elapsed = (Date.now() - t0) / 1000;
      if (err) {
        resolve({ ok: false, error: err.message, elapsed });
        return;
      }
      try {
        const data = JSON.parse(stdout);
        const usage = data.usage || {};
        const model = data.model || 'default';
        const price = PRICING[model] || PRICING.default;
        const cost = (usage.input_tokens || 0) * price.input / 1e6
                   + (usage.output_tokens || 0) * price.output / 1e6;
        resolve({
          ok: true,
          output: data.result || data.text || stdout,
          model, usage, cost, elapsed,
        });
      } catch (e) {
        resolve({ ok: true, output: stdout, elapsed, cost: 0, usage: {}, model: 'unknown' });
      }
    });
  });
}

async function runCommand(argv) {
  let target = '.';
  let filter = null;
  let baseline = false;
  let maxCost = Infinity;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--filter') filter = argv[++i];
    else if (a === '--baseline') baseline = true;
    else if (a === '--max-cost') maxCost = parseFloat(argv[++i]);
    else if (!a.startsWith('--')) target = a;
  }

  if (!fs.existsSync(target)) {
    console.error(`No such path: ${target}`);
    process.exit(1);
  }

  const evalFiles = findEvals(target);
  if (evalFiles.length === 0) {
    console.error(`No evals found under ${target}. Looking for YAML files in evals/ directories.`);
    process.exit(1);
  }

  console.log('skill-lab v0.1');
  console.log('─'.repeat(40));

  const results = [];
  let totalCost = 0;
  let lastSkill = null;

  for (const file of evalFiles) {
    const spec = yaml.load(fs.readFileSync(file, 'utf8'));
    if (filter && !spec.name.includes(filter)) continue;
    if (totalCost >= maxCost) {
      console.log(`  — skipping (--max-cost ${maxCost} exceeded)`);
      results.push({ file, skipped: true });
      continue;
    }

    if (spec.skill !== lastSkill) {
      console.log(`${spec.skill}`);
      lastSkill = spec.skill;
    }

    const run = await runClaude(spec.input, spec.skill);
    const graded = grade(spec.expect || {}, run);
    totalCost += run.cost || 0;

    const status = graded.pass ? '✓' : '✗';
    const label = graded.pass ? 'pass' : 'FAIL';
    const meta = `(${run.elapsed.toFixed(1)}s  $${(run.cost || 0).toFixed(2)})`;
    console.log(`  ${status} ${spec.name.padEnd(38)} ${label.padEnd(5)}  ${meta}`);
    if (!graded.pass) {
      graded.failures.forEach((f) => console.log(`     ${f}`));
    }

    results.push({ file, spec, run, graded });
  }

  const passed = results.filter((r) => r.graded && r.graded.pass).length;
  const failed = results.filter((r) => r.graded && !r.graded.pass).length;
  console.log('─'.repeat(40));
  console.log(`${results.length} tests • ${passed} passed • ${failed} failed • $${totalCost.toFixed(2)} total`);

  const runsDir = path.join('.skill-lab', 'runs');
  fs.mkdirSync(runsDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(runsDir, `${stamp}.json`), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join('.skill-lab', 'last.json'), JSON.stringify(results, null, 2));
  if (baseline) {
    fs.writeFileSync(path.join('.skill-lab', 'baseline.json'), JSON.stringify(results, null, 2));
    console.log('→ saved as baseline');
  }

  if (failed > 0) process.exit(1);
}

module.exports = { runCommand };
