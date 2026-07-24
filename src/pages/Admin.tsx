import { Navigate } from "react-router-dom";

/**
 * Legacy PIN admin removed. All admin product/order/CMS writes go through
 * /admin/* with Supabase Auth + admin_users RLS (no service-role key in browser).
 */
export default function Admin() {
  return <Navigate to="/admin/login" replace />;
}
