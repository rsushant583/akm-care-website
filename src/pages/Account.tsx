import { Navigate } from "react-router-dom";

/** Legacy single-page account route — nested /account/* replaced this in Phase 6. */
export default function AccountPage() {
  return <Navigate to="/account" replace />;
}
