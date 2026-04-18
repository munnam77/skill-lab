#!/usr/bin/env node
// skill-lab CLI
const { runCommand } = require('../src/run');
const { diffCommand } = require('../src/diff');
const { reportCommand } = require('../src/report');

const args = process.argv.slice(2);
const cmd = args[0];

function usage() {
  console.log(`skill-lab v0.1

Usage:
  skill-lab run [path]          Run all evals under path (default: .)
  skill-lab run --filter <s>    Only run evals whose name contains <s>
  skill-lab run --baseline      Save this run as the baseline for future diffs
  skill-lab run --max-cost <n>  Stop when total estimated cost exceeds <n>
  skill-lab diff                Diff the last run against the baseline
  skill-lab report              Write a markdown report to .skill-lab/
  skill-lab version             Print version

Requires the 'claude' CLI to be on your PATH.
`);
}

(async () => {
  try {
    switch (cmd) {
      case 'run':
        await runCommand(args.slice(1));
        break;
      case 'diff':
        await diffCommand(args.slice(1));
        break;
      case 'report':
        await reportCommand(args.slice(1));
        break;
      case 'version':
      case '--version':
      case '-v':
        console.log('skill-lab v0.1.0');
        break;
      case 'help':
      case '--help':
      case '-h':
      case undefined:
        usage();
        break;
      default:
        console.error(`Unknown command: ${cmd}`);
        usage();
        process.exit(1);
    }
  } catch (e) {
    console.error(e.message || e);
    process.exit(1);
  }
})();
