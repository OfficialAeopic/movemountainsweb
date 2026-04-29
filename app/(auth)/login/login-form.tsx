"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { signInAction, type LoginFormState } from "./actions";

const initialState: LoginFormState = { status: "idle" };

export function LoginForm({ initialError }: { initialError: string | null }) {
  const [state, formAction] = useActionState(signInAction, initialState);
  const errorMessage = state.status === "error" ? state.message : initialError;

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-background"
        />
      </div>
      <div>
        <label htmlFor="password" className="text-sm font-medium">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          minLength={8}
          className="mt-1 w-full px-3 py-2 border rounded-md text-sm bg-background"
        />
      </div>
      {errorMessage && (
        <p role="alert" className="text-sm text-destructive">{errorMessage}</p>
      )}
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium disabled:opacity-50"
    >
      {pending ? "Signing in..." : "Sign in"}
    </button>
  );
}
