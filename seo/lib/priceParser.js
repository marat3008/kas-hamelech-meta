const CURRENCY_RE = /₪|ש["׳]?ח/;
const CURRENCY_STRIP_RE = /₪|ש["׳]?ח/g;

const COMMA_THOUSANDS_RE = /^\d{1,3}(,\d{3})+(\.\d+)?$/;
// "1.299" is ambiguous: could be thousands-grouped (1299) or a decimal (1.299).
// Without page/locale context confirming which, we never guess.
const DOT_GROUPED_RE = /^\d{1,3}(\.\d{3})+$/;
const PLAIN_INT_RE = /^\d+$/;
const DECIMAL_RE = /^\d+\.\d{1,2}$/;

function parseIsraeliPrice(raw) {
  if (typeof raw !== 'string') throw new TypeError('parseIsraeliPrice expects a string');
  const result = { raw, currency: null, value: null, ambiguous: false, reason: null };
  if (CURRENCY_RE.test(raw)) result.currency = 'ILS';

  const numeric = raw.replace(CURRENCY_STRIP_RE, '').trim();

  if (COMMA_THOUSANDS_RE.test(numeric)) {
    result.value = Number(numeric.replace(/,/g, ''));
  } else if (DOT_GROUPED_RE.test(numeric)) {
    result.ambiguous = true;
    result.reason = 'ambiguous_thousands_separator';
  } else if (DECIMAL_RE.test(numeric)) {
    result.value = Number(numeric);
  } else if (PLAIN_INT_RE.test(numeric)) {
    result.value = Number(numeric);
  } else {
    result.ambiguous = true;
    result.reason = 'unparseable';
  }

  if (!result.currency && !result.reason) {
    result.reason = 'missing_currency_context';
  }
  return result;
}

module.exports = { parseIsraeliPrice };
