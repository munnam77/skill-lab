function grade(expect, run) {
  const failures = [];
  if (!run.ok) {
    return { pass: false, failures: [`run failed: ${run.error}`] };
  }
  const out = (run.output || '').toString();

  if (expect.contains) {
    for (const needle of expect.contains) {
      if (!out.toLowerCase().includes(needle.toLowerCase())) {
        failures.push(`missing required string: "${needle}"`);
      }
    }
  }
  if (expect.not_contains) {
    for (const needle of expect.not_contains) {
      if (out.toLowerCase().includes(needle.toLowerCase())) {
        failures.push(`forbidden string present: "${needle}"`);
      }
    }
  }
  if (expect.matches) {
    const re = new RegExp(expect.matches);
    if (!re.test(out)) failures.push(`output did not match regex: /${expect.matches}/`);
  }
  if (expect.max_cost !== undefined && run.cost > expect.max_cost) {
    failures.push(`cost $${run.cost.toFixed(2)} exceeded max $${expect.max_cost}`);
  }
  if (expect.max_seconds !== undefined && run.elapsed > expect.max_seconds) {
    failures.push(`elapsed ${run.elapsed.toFixed(1)}s exceeded max ${expect.max_seconds}s`);
  }
  // Custom assertions can be loaded from .skill-lab/assertions/ — omitted in MVP.

  return { pass: failures.length === 0, failures };
}

module.exports = { grade };
