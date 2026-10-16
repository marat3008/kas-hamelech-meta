const fs = require('fs');
const path = require('path');
const { startScheduler } = require('./lib/scheduler');

const TARGETS_FILE = path.join(__dirname, 'config', 'targets.json');
const CRON_EXPRESSION = process.env.SEO_SCAN_CRON || '0 6 * * *'; // daily, 06:00 local time, by default

function loadTargets() {
  if (!fs.existsSync(TARGETS_FILE)) return [];
  return JSON.parse(fs.readFileSync(TARGETS_FILE, 'utf8'));
}

function main() {
  const targets = loadTargets();
  if (targets.length === 0) {
    console.log(`No targets configured in ${TARGETS_FILE}. Add competitor/owned-site URLs (one per array entry) and re-run.`);
    return;
  }

  console.log(`Scheduling ${targets.length} target(s) on "${CRON_EXPRESSION}": ${targets.join(', ')}`);
  startScheduler({
    cronExpression: CRON_EXPRESSION,
    targets,
    onResult: (results) => {
      for (const result of results) {
        if (!result.ok) {
          console.log(`[${result.target}] fetch failed: ${result.reason}`);
        } else if (result.diff.isFirstObservation) {
          console.log(`[${result.target}] baseline recorded.`);
        } else if (result.diff.changed) {
          console.log(`[${result.target}] changed: ${result.diff.changedFields.join(', ')}`);
        } else {
          console.log(`[${result.target}] no change.`);
        }
      }
    },
  });
}

main();
