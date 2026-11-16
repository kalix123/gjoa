import { describe, expect, test } from "../expect.mjs";
import { readFileSync } from "node:fs";
import { apcaBand, correctA2 } from "./colormath.cjs";

const patch12 = readFileSync(
  new URL("../../patches/0012-dark-mode-role-resolver.patch", import.meta.url),
  "utf8",
);
const patch13 = readFileSync(
  new URL("../../patches/0013-dark-mode-text-solve.patch", import.meta.url),
  "utf8",
);

const STRUCTURAL_FLOOR = 30;
const STRUCTURAL_CEILING = 60;

function resolveStructuralMark(color, backdrop, { inverted, opaque = true }) {
  if (!inverted || !opaque) {
    return color;
  }
  return correctA2(
    color,
    backdrop,
    STRUCTURAL_FLOOR,
    STRUCTURAL_CEILING,
    true,
  );
}

describe("native Border and Selection role routing", () => {
  test("the shared resolver owns both roles behind the master inversion gate", () => {
    expect(patch12).toContain("+    Border,");
    expect(patch12).toContain("+    Selection,");

    const gate = patch12.indexOf("!aFrame->PresContext()->ColorInversion()");
    const borderPolicy = patch12.indexOf("aRole == ColorRole::Border");
    const selectionPolicy = patch12.indexOf("aRole == ColorRole::Selection");
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(borderPolicy);
    expect(gate).toBeLessThan(selectionPolicy);
    expect(patch12).toContain(
      "+    return GjoaDarkText::Correct(aColor, aBackdrop, 30.0f, 60.0f, true);",
    );
  });

  test("solid border paint resolves through ColorRole::Border", () => {
    expect(patch12).toContain(
      "+    borderColors[i] = nsLayoutUtils::ResolveDarkModeRole(",
    );
    expect(patch12).toContain(
      "+        nsLayoutUtils::ColorRole::Border);",
    );
  });

  test("native selection keeps authored early returns and scheme-aware contrast ordering", () => {
    const nativeSelection = patch12.indexOf(
      "+    mSelectionBGColor = nsLayoutUtils::ResolveDarkModeRole(",
    );
    const existingContrast = patch12.lastIndexOf(
      "EnsureSufficientContrast(&mSelectionTextColor, &mSelectionBGColor);",
      nativeSelection,
    );
    expect(nativeSelection).toBeGreaterThan(existingContrast);
    expect(patch12).toContain(
      "+        mFrame, mSelectionBGColor, nsLayoutUtils::ColorRole::Selection);",
    );
    expect(patch12).toContain(
      "+        mFrame, mSelectionTextColor, nsLayoutUtils::ColorRole::Text,",
    );
    expect(patch12).toContain(
      "+    // Authored ::selection colors return above unchanged. Native selection",
    );
  });
});

describe("bounded structural-mark behavior", () => {
  const backdrop = [18, 18, 18];

  test("master switch off is byte-identity", () => {
    const color = [35, 35, 35];
    expect(
      resolveStructuralMark(color, backdrop, { inverted: false }),
    ).toBe(color);
  });

  test("translucent structural marks are left authored", () => {
    const color = [35, 35, 35];
    expect(
      resolveStructuralMark(color, backdrop, {
        inverted: true,
        opaque: false,
      }),
    ).toBe(color);
  });

  test("low contrast is raised and high contrast is capped inside [30, 60]", () => {
    for (const color of [
      [35, 35, 35],
      [255, 255, 255],
    ]) {
      const corrected = resolveStructuralMark(color, backdrop, {
        inverted: true,
      });
      expect(
        apcaBand(
          corrected,
          backdrop,
          STRUCTURAL_FLOOR,
          STRUCTURAL_CEILING,
        ).inBand,
      ).toBe(true);
    }
  });
});

describe("0013 is pinned to the modified 0012 postimage", () => {
  // Derived rather than hard-coded, so a Firefox rebase that regenerates both
  // patches keeps passing while a stale 0013 still fails.
  const indexFor = (patch, file) => {
    const m = patch.match(
      new RegExp(`diff --git a/${file} b/${file}\\n(?:.*\\n)*?index ([0-9a-f]{40})\\.\\.([0-9a-f]{40})`),
    );
    return m ? { pre: m[1], post: m[2] } : null;
  };
  test("0013's nsTextPaintStyle preimage is 0012's postimage", () => {
    const file = "layout/generic/nsTextPaintStyle.cpp";
    const in12 = indexFor(patch12, file);
    const in13 = indexFor(patch13, file);
    expect(in12).not.toBeNull();
    expect(in13).not.toBeNull();
    expect(in13.pre).toBe(in12.post);
  });
  test("0013's moz.build hunk carries a full index", () => {
    expect(indexFor(patch13, "layout/generic/moz.build")).not.toBeNull();
  });
});
