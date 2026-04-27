// Public auth route group. No sidebar, no auth gate.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
