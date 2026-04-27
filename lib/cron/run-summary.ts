// Standard JSON shape returned by every cron route.
// Routes accumulate counts and errors, then return a RunSummary at the end.
// Errors are surfaced as strings so the cron job log in Vercel is readable.

export interface RunSummary {
  ok: boolean;
  route: string;
  ranAt: string;
  durationMs: number;
  counts: Record<string, number>;
  errors: string[];
  notes?: string[];
}

export class RunTracker {
  private readonly start: number;
  private readonly route: string;
  private counts: Record<string, number> = {};
  private errors: string[] = [];
  private notes: string[] = [];

  constructor(route: string) {
    this.route = route;
    this.start = Date.now();
  }

  inc(key: string, by: number = 1): void {
    this.counts[key] = (this.counts[key] ?? 0) + by;
  }

  err(message: string): void {
    this.errors.push(message);
  }

  note(message: string): void {
    this.notes.push(message);
  }

  summary(): RunSummary {
    return {
      ok: this.errors.length === 0,
      route: this.route,
      ranAt: new Date(this.start).toISOString(),
      durationMs: Date.now() - this.start,
      counts: this.counts,
      errors: this.errors,
      notes: this.notes.length > 0 ? this.notes : undefined,
    };
  }
}
