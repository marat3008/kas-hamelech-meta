// PROTOTYPE ONLY. In-memory, single-process, non-durable, non-atomic.
// Not production-grade cost protection: a crash loses all reservation state,
// and concurrent workers would race on the same counters. Durable, atomic,
// multi-worker reservations and recovery are not implemented.
class RunGovernor {
  constructor({ hardCapUnits, safetyMarginUnits = 0 } = {}) {
    if (typeof hardCapUnits !== 'number' || hardCapUnits <= 0) {
      throw new TypeError('hardCapUnits must be a positive number');
    }
    this.hardCapUnits = hardCapUnits;
    this.safetyMarginUnits = safetyMarginUnits;
    this.reservedUnits = 0;
    this.settledUnits = 0;
    this.reservations = new Map();
  }

  availableUnits() {
    return this.hardCapUnits - this.safetyMarginUnits - this.reservedUnits;
  }

  reserve(id, estimatedUnits) {
    if (this.reservations.has(id)) throw new Error(`duplicate reservation id: ${id}`);
    if (estimatedUnits > this.availableUnits()) {
      return { ok: false, reason: 'skipped_budget', available: this.availableUnits() };
    }
    this.reservedUnits += estimatedUnits;
    this.reservations.set(id, { estimatedUnits, settled: false });
    return { ok: true };
  }

  settle(id, actualUnits) {
    const reservation = this.reservations.get(id);
    if (!reservation) throw new Error(`unknown reservation id: ${id}`);
    if (reservation.settled) throw new Error(`reservation already settled: ${id}`);
    this.reservedUnits -= reservation.estimatedUnits;
    this.settledUnits += actualUnits;
    reservation.settled = true;
    return { settledUnits: this.settledUnits };
  }

  release(id) {
    const reservation = this.reservations.get(id);
    if (!reservation || reservation.settled) return;
    this.reservedUnits -= reservation.estimatedUnits;
    reservation.settled = true;
  }
}

module.exports = { RunGovernor };
