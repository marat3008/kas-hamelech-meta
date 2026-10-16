// Runs automatically after `npm install` (see package.json "postinstall"),
// so the Grisha intelligence agent starts working right after setup instead
// of waiting for a separate manual command. Never fails the install itself:
// any problem here is logged, not thrown — `npm install` must still succeed
// even if a scan batch errors.
// Skip with SEO_SKIP_POSTINSTALL_SCAN=1 (e.g. in CI, or a fresh clone where
// an immediate live network scan to real competitor/designer sites isn't wanted).
const { spawnSync } = require('child_process');
const path = require('path');

if (process.env.SEO_SKIP_POSTINSTALL_SCAN === '1') {
  console.log('[postinstall] SEO_SKIP_POSTINSTALL_SCAN=1 - skipping the first Grisha intelligence run.');
  process.exit(0);
}

console.log('[postinstall] Running the Grisha intelligence agent once (set SEO_SKIP_POSTINSTALL_SCAN=1 to skip this on future installs).');

const result = spawnSync(process.execPath, [path.join(__dirname, 'run-designer-scan.js')], { stdio: 'inherit' });

if (result.error) {
  console.warn('[postinstall] Could not run the intelligence agent:', result.error.message);
} else if (result.status !== 0) {
  console.warn(`[postinstall] The intelligence agent exited with code ${result.status} (see log above). npm install itself still succeeded.`);
}

process.exit(0); // this bonus step must never fail `npm install`
