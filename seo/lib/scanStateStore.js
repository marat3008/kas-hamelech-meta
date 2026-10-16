const fs = require('fs');
const path = require('path');

function loadState(file, factory) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return factory();
    throw err;
  }
}

// Atomic: write to a temp file in the same directory, then rename — a crash
// mid-write can never leave a half-written state file behind.
function saveStateAtomic(file, state) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const tempFile = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(state, null, 2), 'utf8');
  fs.renameSync(tempFile, file);
}

// Advisory lock via exclusive file creation ('wx' fails if the file already
// exists) — stops two concurrent runs from reserving the same batch.
function acquireLock(lockFile) {
  try {
    const fd = fs.openSync(lockFile, 'wx');
    fs.writeFileSync(fd, String(process.pid));
    fs.closeSync(fd);
    return true;
  } catch (err) {
    if (err.code === 'EEXIST') return false;
    throw err;
  }
}

function releaseLock(lockFile) {
  try {
    fs.unlinkSync(lockFile);
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

module.exports = { loadState, saveStateAtomic, acquireLock, releaseLock };
