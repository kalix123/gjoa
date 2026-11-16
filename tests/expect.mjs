// Minimal Jest-style `expect` on top of node:assert, so the unit tests run on
// Node's built-in test runner (`node --test tests/`) with no dependencies.
import assert from "node:assert/strict";

export { describe, test } from "node:test";

export function expect(actual) {
  const m = {
    toBe: (v) => assert.ok(Object.is(actual, v), `expected ${String(actual)} to be ${String(v)}`),
    toEqual: (v) => assert.deepStrictEqual(actual, v),
    toBeNull: () => assert.equal(actual, null),
    toContain: (v) => assert.ok(actual.includes(v), `expected value to contain ${JSON.stringify(v)}`),
    toBeGreaterThan: (v) => assert.ok(actual > v, `expected ${actual} > ${v}`),
    toBeGreaterThanOrEqual: (v) => assert.ok(actual >= v, `expected ${actual} >= ${v}`),
    toBeLessThan: (v) => assert.ok(actual < v, `expected ${actual} < ${v}`),
    toBeLessThanOrEqual: (v) => assert.ok(actual <= v, `expected ${actual} <= ${v}`),
  };
  m.not = {
    toBe: (v) => assert.ok(!Object.is(actual, v), `expected ${String(actual)} not to be ${String(v)}`),
    toBeNull: () => assert.notEqual(actual, null),
    toContain: (v) => assert.ok(!actual.includes(v), `expected value not to contain ${JSON.stringify(v)}`),
  };
  return m;
}
