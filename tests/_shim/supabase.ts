// Thin in-memory shim of the subset of Supabase JS used by the CRM.
// Supports: from(table).select / .insert / .update / .delete chained with
// .eq / .in / .lte / .gte / .neq / .not / .maybeSingle / .single / .limit.
// Intentionally minimal: enough surface for the server actions and cron logic
// to exercise without a real database. Behavior diverges from real Supabase
// when chained filters use unsupported predicates; tests should stick to the
// supported predicates listed above.

export type Row = Record<string, unknown>;

interface Filter {
  kind: "eq" | "in" | "lte" | "gte" | "neq" | "not";
  column: string;
  value: unknown;
}

interface Mutation {
  type: "insert" | "update" | "delete";
  payload?: Row | Row[];
}

export interface DbState {
  tables: Record<string, Row[]>;
  // Auto-generated id counter for inserts that omit id.
  idSeq: number;
}

export function createMemoryDb(initial: Record<string, Row[]> = {}): DbState {
  return { tables: structuredClone(initial), idSeq: 1 };
}

function rowMatches(row: Row, filters: Filter[]): boolean {
  for (const f of filters) {
    const v = row[f.column];
    switch (f.kind) {
      case "eq":
        if (v !== f.value) return false;
        break;
      case "neq":
        if (v === f.value) return false;
        break;
      case "in":
        if (!(Array.isArray(f.value) && (f.value as unknown[]).includes(v)))
          return false;
        break;
      case "lte":
        if (!(typeof v === "string" || typeof v === "number") || v > (f.value as never))
          return false;
        break;
      case "gte":
        if (!(typeof v === "string" || typeof v === "number") || v < (f.value as never))
          return false;
        break;
      case "not":
        // Only "is null" form supported.
        if (f.value === null) {
          if (v === null || v === undefined) return false;
        } else if (v === f.value) {
          return false;
        }
        break;
    }
  }
  return true;
}

class QueryBuilder {
  private filters: Filter[] = [];
  private mutation: Mutation | null = null;
  private selectCols: string | null = null;
  private limitN: number | null = null;

  constructor(private state: DbState, private table: string) {
    if (!this.state.tables[this.table]) this.state.tables[this.table] = [];
  }

  select(cols: string = "*"): this {
    this.selectCols = cols;
    return this;
  }
  insert(payload: Row | Row[]): this {
    this.mutation = { type: "insert", payload };
    return this;
  }
  update(payload: Row): this {
    this.mutation = { type: "update", payload };
    return this;
  }
  delete(): this {
    this.mutation = { type: "delete" };
    return this;
  }

  eq(column: string, value: unknown): this {
    this.filters.push({ kind: "eq", column, value });
    return this;
  }
  neq(column: string, value: unknown): this {
    this.filters.push({ kind: "neq", column, value });
    return this;
  }
  in(column: string, value: unknown[]): this {
    this.filters.push({ kind: "in", column, value });
    return this;
  }
  lte(column: string, value: unknown): this {
    this.filters.push({ kind: "lte", column, value });
    return this;
  }
  gte(column: string, value: unknown): this {
    this.filters.push({ kind: "gte", column, value });
    return this;
  }
  not(column: string, _op: string, value: unknown): this {
    this.filters.push({ kind: "not", column, value });
    return this;
  }
  limit(n: number): this {
    this.limitN = n;
    return this;
  }

  // Run + resolve to single row.
  async single(): Promise<{ data: Row | null; error: { message: string } | null }> {
    const r = await this.run();
    if (r.error) return { data: null, error: r.error };
    const rows = (r.data ?? []) as Row[];
    if (rows.length === 0) return { data: null, error: { message: "no rows" } };
    return { data: rows[0], error: null };
  }
  async maybeSingle(): Promise<{ data: Row | null; error: { message: string } | null }> {
    const r = await this.run();
    if (r.error) return { data: null, error: r.error };
    const rows = (r.data ?? []) as Row[];
    return { data: rows[0] ?? null, error: null };
  }

  // Executes when awaited. Mirrors Supabase JS thenable behavior.
  then<TResult1 = { data: Row[] | null; error: { message: string } | null }>(
    resolve: (value: { data: Row[] | null; error: { message: string } | null }) => TResult1
  ): Promise<TResult1> {
    return this.run().then(resolve);
  }

  private async run(): Promise<{
    data: Row[] | null;
    error: { message: string } | null;
  }> {
    const tbl = this.state.tables[this.table] ?? [];

    if (this.mutation) {
      if (this.mutation.type === "insert") {
        const incoming = Array.isArray(this.mutation.payload)
          ? this.mutation.payload
          : [this.mutation.payload!];
        const inserted: Row[] = incoming.map((r) => {
          const id = (r as Row).id ?? `auto-${this.state.idSeq++}`;
          const created = { ...(r as Row), id };
          tbl.push(created);
          return created;
        });
        this.state.tables[this.table] = tbl;
        return { data: inserted, error: null };
      }
      if (this.mutation.type === "update") {
        const updated: Row[] = [];
        for (const row of tbl) {
          if (rowMatches(row, this.filters)) {
            Object.assign(row, this.mutation.payload as Row);
            updated.push(row);
          }
        }
        return { data: updated, error: null };
      }
      if (this.mutation.type === "delete") {
        const remaining: Row[] = [];
        const removed: Row[] = [];
        for (const row of tbl) {
          if (rowMatches(row, this.filters)) removed.push(row);
          else remaining.push(row);
        }
        this.state.tables[this.table] = remaining;
        return { data: removed, error: null };
      }
    }

    let rows = tbl.filter((r) => rowMatches(r, this.filters));
    if (this.limitN !== null) rows = rows.slice(0, this.limitN);
    return { data: rows, error: null };
  }
}

export interface MemorySupabase {
  state: DbState;
  from(table: string): QueryBuilder;
}

export function createSupabaseStub(initial: Record<string, Row[]> = {}): MemorySupabase {
  const state = createMemoryDb(initial);
  return {
    state,
    from(table: string) {
      return new QueryBuilder(state, table);
    },
  };
}
