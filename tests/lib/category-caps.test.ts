// Pure category cap calculator tests.

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateCapFill,
  categoriesNearCap,
  WARNING_THRESHOLD,
} from "../../lib/cron/category-caps.ts";

const CANDLES = "cat-candles";
const JEWELRY = "cat-jewelry";
const BAKED = "cat-baked";

describe("category-caps calculator", () => {
  it("counts assignments per category correctly", () => {
    const fill = calculateCapFill(
      [
        { vendorId: "v1", productCategoryIds: [CANDLES] },
        { vendorId: "v2", productCategoryIds: [CANDLES, JEWELRY] },
        { vendorId: "v3", productCategoryIds: [JEWELRY] },
      ],
      [
        { productCategoryId: CANDLES, cap: 5 },
        { productCategoryId: JEWELRY, cap: 5 },
        { productCategoryId: BAKED, cap: 5 },
      ]
    );
    const byId = Object.fromEntries(fill.map((f) => [f.productCategoryId, f]));
    assert.equal(byId[CANDLES].count, 2);
    assert.equal(byId[JEWELRY].count, 2);
    assert.equal(byId[BAKED].count, 0);
  });

  it("flags warning at 80% fill", () => {
    const fill = calculateCapFill(
      [
        { vendorId: "v1", productCategoryIds: [CANDLES] },
        { vendorId: "v2", productCategoryIds: [CANDLES] },
        { vendorId: "v3", productCategoryIds: [CANDLES] },
        { vendorId: "v4", productCategoryIds: [CANDLES] },
      ],
      [{ productCategoryId: CANDLES, cap: 5 }]
    );
    assert.equal(fill[0].count, 4);
    assert.equal(fill[0].fillPct, 0.8);
    assert.equal(fill[0].warning, true);
    assert.equal(fill[0].exceeded, false);
  });

  it("flags exceeded when count exceeds cap", () => {
    const fill = calculateCapFill(
      [
        { vendorId: "v1", productCategoryIds: [CANDLES] },
        { vendorId: "v2", productCategoryIds: [CANDLES] },
        { vendorId: "v3", productCategoryIds: [CANDLES] },
        { vendorId: "v4", productCategoryIds: [CANDLES] },
        { vendorId: "v5", productCategoryIds: [CANDLES] },
        { vendorId: "v6", productCategoryIds: [CANDLES] },
      ],
      [{ productCategoryId: CANDLES, cap: 5 }]
    );
    assert.equal(fill[0].count, 6);
    assert.equal(fill[0].exceeded, true);
  });

  it("does not flag below the threshold", () => {
    const fill = calculateCapFill(
      [
        { vendorId: "v1", productCategoryIds: [CANDLES] },
        { vendorId: "v2", productCategoryIds: [CANDLES] },
      ],
      [{ productCategoryId: CANDLES, cap: 5 }]
    );
    assert.equal(fill[0].warning, false);
    assert.equal(fill[0].exceeded, false);
    assert.equal(fill[0].fillPct, 0.4);
  });

  it("categoriesNearCap includes both warning and exceeded entries", () => {
    const fill = calculateCapFill(
      [
        { vendorId: "v1", productCategoryIds: [CANDLES] },
        { vendorId: "v2", productCategoryIds: [CANDLES] },
        { vendorId: "v3", productCategoryIds: [CANDLES] },
        { vendorId: "v4", productCategoryIds: [CANDLES] },
        { vendorId: "v5", productCategoryIds: [JEWELRY] },
        { vendorId: "v6", productCategoryIds: [JEWELRY] },
        { vendorId: "v7", productCategoryIds: [JEWELRY] },
        { vendorId: "v8", productCategoryIds: [JEWELRY] },
        { vendorId: "v9", productCategoryIds: [JEWELRY] },
        { vendorId: "v10", productCategoryIds: [JEWELRY] },
      ],
      [
        { productCategoryId: CANDLES, cap: 5 },
        { productCategoryId: JEWELRY, cap: 5 },
      ]
    );
    const hot = categoriesNearCap(fill);
    assert.equal(hot.length, 2);
    assert.ok(hot.find((h) => h.productCategoryId === CANDLES)?.warning);
    assert.ok(hot.find((h) => h.productCategoryId === JEWELRY)?.exceeded);
  });

  it("WARNING_THRESHOLD is exported as 0.8", () => {
    assert.equal(WARNING_THRESHOLD, 0.8);
  });
});
