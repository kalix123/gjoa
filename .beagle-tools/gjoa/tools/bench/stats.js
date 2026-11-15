import { equivV as $$bc$equiv, get as $$bc$get } from 'beagle/core.js';

const T_CRITICAL_95 = {[2]: 4.303, [3]: 3.182, [4]: 2.776, [5]: 2.571, [6]: 2.447, [7]: 2.365, [8]: 2.306, [9]: 2.262, [10]: 2.228, [11]: 2.201, [12]: 2.179, [13]: 2.16, [14]: 2.145, [15]: 2.131, [16]: 2.12, [17]: 2.11, [18]: 2.101, [19]: 2.093, [20]: 2.086, [21]: 2.08, [22]: 2.074, [23]: 2.069, [24]: 2.064, [25]: 2.06, [26]: 2.056, [27]: 2.052, [28]: 2.048, [29]: 2.045};

function tCritical(df) {
  const v = $$bc$get(T_CRITICAL_95, df);
  return (((v != null)) ? v : ((df < 2)) ? 12.706 : 1.96);
}

export function geometric_mean(values) {
  if (($$bc$equiv(values.length, 0))) {
    return 0.0;
  } else {
    const logSum = values.reduce((acc, v) => (acc + Math.log(v)), 0);
    const n = values.length;
    return Math.exp((logSum / n));
  }
}

export function arithmetic_mean(values) {
  if (($$bc$equiv(values.length, 0))) {
    return 0.0;
  } else {
    const total = values.reduce((a, b) => (a + b), 0);
    const n = values.length;
    return (total / n);
  }
}

export function standard_deviation(values) {
  if ((values.length < 2)) {
    return 0.0;
  } else {
    const mean = arithmetic_mean(values);
    const squaredDiffs = values.map((v) => Math.pow((v - mean), 2));
    const sum_sq = squaredDiffs.reduce((a, b) => (a + b), 0);
    const n = values.length;
    const variance = (sum_sq / (n - 1));
    return Math.sqrt(variance);
  }
}

export function confidence_interval95(values) {
  const n = values.length;
  const mean = arithmetic_mean(values);
  if ((n < 2)) {
    return {mean: mean, ci: 0, low: mean, high: mean};
  } else {
    const sd = standard_deviation(values);
    const df = (n - 1);
    const t = tCritical(df);
    const se = (sd / Math.sqrt(n));
    const ci = (t * se);
    return {mean: mean, ci: ci, low: (mean - ci), high: (mean + ci)};
  }
}

export function median(values) {
  if (($$bc$equiv(values.length, 0))) {
    return 0.0;
  } else {
    const sorted = [...values].sort((a, b) => (a - b));
    const sample_count = sorted.length;
    const mid = Math.floor((sample_count / 2));
    if (($$bc$equiv((sample_count % 2), 0))) {
      const lo = $$bc$get(sorted, (mid - 1));
      const hi = $$bc$get(sorted, mid);
      return ((lo + hi) / 2);
    } else {
      return $$bc$get(sorted, mid);
    }
  }
}

export function format_result(label, gjoa, firefox, unit) {
  const gjoaCI = confidence_interval95(gjoa);
  const firefoxCI = confidence_interval95(firefox);
  const lines = [];
  lines.push(("".concat("  ", label)));
  lines.push(("".concat("    Gjoa:    ", gjoaCI.mean.toFixed(1), " ", unit, "  ", "[", gjoaCI.low.toFixed(1), " .. ", gjoaCI.high.toFixed(1), "] ", "(95% CI, n=", gjoa.length, ")")));
  lines.push(("".concat("    Firefox: ", firefoxCI.mean.toFixed(1), " ", unit, "  ", "[", firefoxCI.low.toFixed(1), " .. ", firefoxCI.high.toFixed(1), "] ", "(95% CI, n=", firefox.length, ")")));
  if (((_truthy) => _truthy !== false && _truthy != null)(((gjoa.length < 1) || ((firefox.length < 1) || (($$bc$equiv(gjoaCI.mean, 0)) || ($$bc$equiv(firefoxCI.mean, 0))))))) {
    lines.push("    Ratio:   n/a (insufficient samples)");
    return lines.join("\n");
  } else {
    const firefox_mean = firefoxCI.mean;
    const gjoa_mean = gjoaCI.mean;
    const speedup = (firefox_mean / gjoa_mean);
    const pct = ((speedup - 1) * 100).toFixed(1);
    const dir = ((speedup >= 1) ? "faster" : "slower");
    const absPct = Math.abs(parseFloat(pct)).toFixed(1);
    lines.push(("".concat("    Ratio:   ", speedup.toFixed(3), "x — Gjoa is ", absPct, "% ", dir)));
    return lines.join("\n");
  }
}
