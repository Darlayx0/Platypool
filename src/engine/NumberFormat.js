// Shared integer formatter.
// `Number.prototype.toLocaleString()` builds a brand-new ICU formatter on every call, which is
// slow (and the very first call stalls for several ms while ICU data is initialised).
// A single cached `Intl.NumberFormat` yields byte-identical output (same default locale/options)
// while costing a fraction of that, and `warmNumberFormat()` lets us pay the one-time ICU cost
// during boot instead of at the moment the player grabs a pickup.

const FORMATTER = (typeof Intl !== 'undefined' && Intl.NumberFormat) ? new Intl.NumberFormat() : null;

export function formatInt(n) {
  return FORMATTER ? FORMATTER.format(n) : Number(n).toLocaleString();
}

export function warmNumberFormat() {
  formatInt(1234567.89);
}

/**
 * Memoised label: re-formats only when the numeric value changes.
 * Intended for per-frame HUD text where the value is stable for many consecutive frames.
 */
export class CachedNumberLabel {
  constructor(prefix = '') {
    this.prefix = prefix;
    this._value = NaN;
    this._text = prefix;
  }

  get(value) {
    if (value !== this._value) {
      this._value = value;
      this._text = this.prefix + formatInt(value);
    }
    return this._text;
  }
}
