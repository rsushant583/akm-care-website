/**
 * Bootstrap first Super Admin (service role — run locally / CI only).
 *
 * Usage:
 *   set SUPABASE_SERVICE_ROLE_KEY=...   (or rely on `supabase projects api-keys`)
 *   node --env-file=.env scripts/bootstrap-admin.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { execSync } from "node:child_process";

const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const email = process.env.ADMIN_EMAIL || "admin@akmcare.com";
const password = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PIN || "AKM2025";
const fullName = process.env.ADMIN_FULL_NAME || "AKM Super Admin";
const projectRef = process.env.SUPABASE_PROJECT_REF || "tdqepnmysycxklqcvpai";

function resolveServiceKey() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) return process.env.SUPABASE_SERVICE_ROLE_KEY;
  try {
    const raw = execSync(`npx --yes supabase@latest projects api-keys --project-ref ${projectRef}`, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
    });
    const parsed = JSON.parse(raw);
    const keys = parsed.keys || parsed;
    const list = Array.isArray(keys) ? keys : [];
    const legacy = list.find((k) => k.id === "service_role");
    if (legacy?.api_key) return legacy.api_key;
    const jwtService = list.find(
      (k) => typeof k.api_key === "string" && k.api_key.includes("service_role"),
    );
    return jwtService?.api_key || null;
  } catch (e) {
    console.warn("Could not auto-resolve service role key:", e.message);
    return null;
  }
}

const serviceKey = resolveServiceKey();
if (!url) {
  console.error("Missing SUPABASE_URL / VITE_SUPABASE_URL.");
  process.exit(1);
}
if (!serviceKey) {
  console.error(
    "Missing service role key. Set SUPABASE_SERVICE_ROLE_KEY in the environment (not VITE_) and re-run.",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { data: listed, error: listErr } = await admin.auth.admin.listUsers({ perPage: 200 });
if (listErr) {
  console.error(listErr.message);
  process.exit(1);
}

let user = (listed.users || []).find((u) => (u.email || "").toLowerCase() === email.toLowerCase());

if (!user) {
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) {
    console.error("createUser:", error.message);
    process.exit(1);
  }
  user = data.user;
  console.log("Created auth user", user.id, email);
} else {
  const { error } = await admin.auth.admin.updateUserById(user.id, {
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) {
    console.error("updateUser:", error.message);
    process.exit(1);
  }
  console.log("Updated auth user", user.id, email);
}

const { error: upsertErr } = await admin.from("admin_users").upsert(
  {
    user_id: user.id,
    role: "super_admin",
    full_name: fullName,
    is_active: true,
    updated_at: new Date().toISOString(),
  },
  { onConflict: "user_id" },
);

if (upsertErr) {
  console.error("admin_users upsert:", upsertErr.message);
  process.exit(1);
}

console.log("Promoted to super_admin. Sign in at /admin/login with:");
console.log("  email:", email);
console.log("  password: (ADMIN_PASSWORD or VITE_ADMIN_PIN)");
