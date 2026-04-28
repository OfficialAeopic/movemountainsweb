import { redirect } from "next/navigation";

// Back-compat shim. The canonical login page lives at /login under the (auth) route group.
// Anything still pointing at /admin/login lands here and forwards on.
export default function AdminLoginRedirect() {
  redirect("/login");
}
