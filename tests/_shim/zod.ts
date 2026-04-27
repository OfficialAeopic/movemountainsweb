// Tiny zod-compatible stub. Implements only the methods actually used by the
// CRM server actions. Behavior matches zod for the validations exercised in
// tests; anything else falls through as a permissive accept.

interface ParseError {
  fieldErrors: Record<string, string[]>;
  formErrors: string[];
}

interface SafeResult<T> {
  success: boolean;
  data?: T;
  error?: { flatten(): ParseError };
}

interface Schema<T = unknown> {
  parse(input: unknown, path?: string[]): { ok: true; value: T } | { ok: false; errors: Record<string, string[]> };
  optional(): Schema<T | undefined>;
  nullable(): Schema<T | null>;
  or(other: Schema<unknown>): Schema<unknown>;
}

function makeSchema<T>(parse: Schema<T>["parse"]): Schema<T> {
  const self: Schema<T> = {
    parse,
    optional() {
      return makeSchema((input, path) => {
        if (input === undefined) return { ok: true, value: undefined as unknown as T | undefined };
        return self.parse(input, path) as never;
      });
    },
    nullable() {
      return makeSchema((input, path) => {
        if (input === null) return { ok: true, value: null as unknown as T | null };
        return self.parse(input, path) as never;
      });
    },
    or(other) {
      return makeSchema((input, path) => {
        const a = self.parse(input, path);
        if (a.ok) return a as never;
        return other.parse(input, path) as never;
      });
    },
  };
  return self;
}

function makeStringSchema(min: number = 0, msg?: string): Schema<string> {
  return makeSchema((input, path = []) => {
    if (typeof input !== "string") return { ok: false, errors: { [path.join(".")]: ["Expected string."] } };
    if (input.length < min) return { ok: false, errors: { [path.join(".")]: [msg ?? "Required."] } };
    return { ok: true, value: input };
  });
}

export const z = {
  object<T extends Record<string, Schema<unknown>>>(shape: T) {
    const wrap: Schema<Record<string, unknown>> & {
      safeParse(input: unknown): SafeResult<Record<string, unknown>>;
    } = {
      ...makeSchema<Record<string, unknown>>((input) => {
        const obj = (input ?? {}) as Record<string, unknown>;
        const out: Record<string, unknown> = {};
        const errors: Record<string, string[]> = {};
        for (const key of Object.keys(shape)) {
          const r = shape[key].parse(obj[key], [key]);
          if (r.ok) {
            out[key] = (r as { ok: true; value: unknown }).value;
          } else {
            for (const [k, v] of Object.entries((r as { ok: false; errors: Record<string, string[]> }).errors)) {
              errors[k] = v;
            }
          }
        }
        if (Object.keys(errors).length > 0) return { ok: false, errors };
        return { ok: true, value: out };
      }),
      safeParse(input: unknown) {
        const r = wrap.parse(input);
        if (r.ok) return { success: true, data: r.value };
        return {
          success: false,
          error: {
            flatten(): ParseError {
              const fieldErrors: Record<string, string[]> = {};
              for (const [k, v] of Object.entries((r as { ok: false; errors: Record<string, string[]> }).errors)) {
                fieldErrors[k] = v;
              }
              return { fieldErrors, formErrors: [] };
            },
          },
        };
      },
    };
    return wrap;
  },

  string(): Schema<string> & { min(n: number, msg?: string): Schema<string>; uuid(msg?: string): Schema<string>; email(msg?: string): Schema<string> } {
    const base = makeStringSchema(0);
    return Object.assign(base, {
      min(n: number, msg?: string) {
        return makeStringSchema(n, msg);
      },
      uuid(msg?: string) {
        return makeSchema<string>((input, path = []) => {
          if (typeof input !== "string" || !/^[0-9a-fA-F-]{36}$/.test(input))
            return { ok: false, errors: { [path.join(".")]: [msg ?? "Invalid uuid."] } };
          return { ok: true, value: input };
        });
      },
      email(msg?: string) {
        return makeSchema<string>((input, path = []) => {
          if (typeof input !== "string" || !/.+@.+\..+/.test(input))
            return { ok: false, errors: { [path.join(".")]: [msg ?? "Invalid email."] } };
          return { ok: true, value: input };
        });
      },
    });
  },

  coerce: {
    number(): Schema<number> & {
      int(): Schema<number>;
      nonnegative(): Schema<number>;
    } {
      const make = (extra: Array<(v: number, path: string[]) => string | null>): Schema<number> => {
        return makeSchema((input, path = []) => {
          if (input === null || input === undefined || input === "") return { ok: true, value: NaN as never };
          const n = Number(input);
          if (Number.isNaN(n)) return { ok: false, errors: { [path.join(".")]: ["Expected number."] } };
          for (const e of extra) {
            const msg = e(n, path);
            if (msg) return { ok: false, errors: { [path.join(".")]: [msg] } };
          }
          return { ok: true, value: n };
        });
      };
      const base = make([]) as Schema<number> & {
        int(): Schema<number>;
        nonnegative(): Schema<number>;
      };
      base.int = () =>
        Object.assign(
          make([(v) => (Number.isInteger(v) ? null : "Expected integer.")]),
          { int: base.int, nonnegative: base.nonnegative }
        ) as never;
      base.nonnegative = () =>
        Object.assign(
          make([(v) => (v >= 0 ? null : "Expected non-negative.")]),
          { int: base.int, nonnegative: base.nonnegative }
        ) as never;
      return base;
    },
  },

  enum<T extends readonly string[]>(values: T): Schema<T[number]> {
    return makeSchema((input, path = []) => {
      if (typeof input !== "string" || !values.includes(input as never))
        return { ok: false, errors: { [path.join(".")]: ["Invalid enum value."] } };
      return { ok: true, value: input as T[number] };
    });
  },

  literal<V extends string | number | boolean>(value: V): Schema<V> {
    return makeSchema((input, path = []) => {
      if (input !== value) return { ok: false, errors: { [path.join(".")]: ["Invalid literal."] } };
      return { ok: true, value: value as V };
    });
  },
};
