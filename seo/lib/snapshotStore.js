const fs = require('fs');
const path = require('path');

function slugify(target) {
  return target.replace(/[^a-z0-9]+/gi, '_').toLowerCase();
}

// Flat-file JSON history per target. A prototype, like runGovernor: no
// locking, so concurrent writers to the same target can race. Fine for a
// single-process free-tier agent; revisit before running multiple workers.
class SnapshotStore {
  constructor({ dir }) {
    if (!dir) throw new TypeError('dir is required');
    this.dir = dir;
    fs.mkdirSync(this.dir, { recursive: true });
  }

  filePathFor(target) {
    return path.join(this.dir, `${slugify(target)}.json`);
  }

  loadHistory(target) {
    const file = this.filePathFor(target);
    if (!fs.existsSync(file)) return [];
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }

  loadLatest(target) {
    const history = this.loadHistory(target);
    return history.length ? history[history.length - 1] : null;
  }

  append(target, record) {
    const history = this.loadHistory(target);
    history.push(record);
    fs.writeFileSync(this.filePathFor(target), JSON.stringify(history, null, 2));
    return history;
  }
}

module.exports = { SnapshotStore, slugify };
