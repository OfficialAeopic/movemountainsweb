// Pure category-cap calculator. No DB calls. Given the assigned vendors and
// their product categories, plus the configured caps for an event, returns
// the per-category fill counts and any over-cap warnings.

export interface AssignedVendor {
  vendorId: string;
  productCategoryIds: string[];
}

export interface CategoryCap {
  productCategoryId: string;
  cap: number;
  // Display name for messaging. Optional.
  name?: string;
}

export interface CapFill {
  productCategoryId: string;
  name?: string;
  cap: number;
  count: number;
  fillPct: number;
  warning: boolean; // true if count >= 80% of cap
  exceeded: boolean; // true if count > cap
}

export const WARNING_THRESHOLD = 0.8;

export function calculateCapFill(
  assigned: AssignedVendor[],
  caps: CategoryCap[]
): CapFill[] {
  const counts = new Map<string, number>();
  for (const a of assigned) {
    for (const cat of a.productCategoryIds) {
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
  }
  return caps.map((c) => {
    const count = counts.get(c.productCategoryId) ?? 0;
    const fillPct = c.cap > 0 ? count / c.cap : 0;
    return {
      productCategoryId: c.productCategoryId,
      name: c.name,
      cap: c.cap,
      count,
      fillPct,
      warning: fillPct >= WARNING_THRESHOLD && count <= c.cap,
      exceeded: count > c.cap,
    };
  });
}

export function categoriesNearCap(fill: CapFill[]): CapFill[] {
  return fill.filter((f) => f.warning || f.exceeded);
}
