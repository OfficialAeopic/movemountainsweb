// Default stub for next/navigation used by the test loader. Tests that need
// to assert on redirect calls override this with mock.module.

export class RedirectError extends Error {
  constructor(public readonly to: string) {
    super(`NEXT_REDIRECT:${to}`);
    this.name = "RedirectError";
  }
}

export function redirect(to: string): never {
  throw new RedirectError(to);
}

export function notFound(): never {
  throw new Error("NEXT_NOT_FOUND");
}
