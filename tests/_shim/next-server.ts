// Default stub for next/server used by the test loader. Provides the minimum
// surface authorizeCron and cron route handlers touch. Both NextRequest and
// NextResponse are exported as classes so source code that imports them as
// values (not types) resolves at runtime.

export class NextRequest {
  headers: { get(name: string): string | null };
  url: string;
  constructor(input: { headers?: Record<string, string>; url?: string } = {}) {
    const map = input.headers ?? {};
    this.headers = {
      get(name: string): string | null {
        return map[name.toLowerCase()] ?? map[name] ?? null;
      },
    };
    this.url = input.url ?? "http://localhost/test";
  }
}

interface JsonResponse {
  body: unknown;
  status: number;
}

export const NextResponse = {
  json(body: unknown, init?: { status?: number }): JsonResponse {
    return { body, status: init?.status ?? 200 };
  },
};

export type NextResponse = JsonResponse;
