// Value helpers carried over from the Beagle port.
//
// Beagle compiled Clojure semantics into JS: only null/undefined/false are
// falsy (0 and "" are truthy) and `=` compares plain objects/arrays/sets by
// value. Ported modules use these helpers where that difference could matter;
// as each module is cleaned up, uses are replaced with plain JS where the
// operand types make the two semantics identical.

// Clojure truthiness: everything except null, undefined and false.
export const truthy = (v) => v !== false && v != null;

function isPlainObject(x) {
  if (x === null || typeof x !== "object") return false;
  const proto = Object.getPrototypeOf(x);
  return proto === Object.prototype || proto === null;
}

// Clojure `=`: scalars by value, arrays/sets/plain objects structurally,
// anything else (DOM nodes, XPCOM objects, class instances) by identity.
export function equiv(a, b) {
  if (a == null || b == null) return a == null && b == null;
  if (a === b) return true;
  if (typeof a === "number" && typeof b === "number") return a === b;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((x, i) => equiv(x, b[i]));
  }
  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set) || !(b instanceof Set) || a.size !== b.size) return false;
    const rest = [...b];
    outer: for (const x of a) {
      for (let i = 0; i < rest.length; i++) {
        if (equiv(x, rest[i])) { rest.splice(i, 1); continue outer; }
      }
      return false;
    }
    return true;
  }
  if (!isPlainObject(a) || !isPlainObject(b)) return false;
  const ak = Object.keys(a);
  const bk = Object.keys(b);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => Object.prototype.hasOwnProperty.call(b, k) && equiv(a[k], b[k]));
}

// Clojure `get`: nil-safe lookup with a default.
export function get(coll, k, notFound = null) {
  if (coll == null) return notFound;
  if (Array.isArray(coll)) {
    return Number.isInteger(k) && k >= 0 && k < coll.length ? coll[k] : notFound;
  }
  if (coll instanceof Map) return coll.has(k) ? coll.get(k) : notFound;
  const v = coll[k];
  return v === undefined ? notFound : v;
}
