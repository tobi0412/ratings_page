/**
 * migrate.mjs — Runs Supabase SQL migrations.
 * Uses the pgmeta endpoint that Supabase Studio uses internally.
 * Usage: node scripts/migrate.mjs
 */

import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = join(__dirname, "..", ".env.local");
  const raw = readFileSync(envPath, "utf-8");
  const env = {};
  for (const line of raw.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const [key, ...rest] = trimmed.split("=");
    env[key.trim()] = rest.join("=").trim();
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env["NEXT_PUBLIC_SUPABASE_URL"];
const SERVICE_ROLE_KEY = env["SUPABASE_SERVICE_ROLE_KEY"];

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local",
  );
  process.exit(1);
}

const projectRef = new URL(SUPABASE_URL).hostname.split(".")[0];

async function runSQL(query) {
  // Supabase pgmeta endpoint (used by Supabase Studio internally)
  const url = `${SUPABASE_URL}/rest/v1/rpc/query`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  if (res.ok) return { ok: true };

  // Try the pg endpoint
  const url2 = `${SUPABASE_URL}/pg/query`;
  const res2 = await fetch(url2, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query }),
  });

  if (res2.ok) return { ok: true };

  const errText = await res.text();
  return { ok: false, error: errText };
}

function splitStatements(sql) {
  // Split on semicolons followed by newline or end of string
  // but keep multi-line statements (like CREATE FUNCTION) together
  const statements = [];
  let current = "";
  let dollarDepth = 0;

  const lines = sql.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("--")) continue; // skip comment-only lines

    // Track $$ blocks (for PL/pgSQL functions)
    const dollarMatches = line.match(/\$\$/g) || [];
    dollarDepth += dollarMatches.length;

    current += line + "\n";

    // Only split on semicolon if we're not inside a $$ block
    if (trimmed.endsWith(";") && dollarDepth % 2 === 0) {
      const stmt = current.trim();
      if (stmt && stmt !== ";") {
        statements.push(stmt);
      }
      current = "";
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements;
}

async function runMigration(filePath, label) {
  console.log(`\n📄 ${label}`);
  const sql = readFileSync(filePath, "utf-8");
  const statements = splitStatements(sql);
  let allOk = true;

  for (const stmt of statements) {
    const preview = stmt.replace(/\n/g, " ").substring(0, 70);
    process.stdout.write(`  → ${preview}...\n`);
    const result = await runSQL(stmt);
    if (result.ok) {
      console.log("    ✅ OK");
    } else {
      console.log("    ❌ Failed");
      allOk = false;
    }
  }
  return allOk;
}

async function main() {
  console.log(`🚀 Supabase Migration Runner`);
  console.log(`   Project: ${projectRef}`);
  console.log(`   URL: ${SUPABASE_URL}\n`);

  const migrationsDir = join(__dirname, "..", "supabase", "migrations");

  const ok1 = await runMigration(
    join(migrationsDir, "001_create_tables.sql"),
    "001_create_tables.sql",
  );

  const ok2 = await runMigration(
    join(migrationsDir, "002_create_rls_policies.sql"),
    "002_create_rls_policies.sql",
  );

  if (!ok1 || !ok2) {
    console.log("\n⚠️  Some statements could not run automatically.");
    console.log(
      "   This is expected — the service_role key cannot execute DDL via REST.",
    );
    console.log("\n📋 Run migrations manually in the Supabase SQL Editor:");
    console.log(
      `   → https://supabase.com/dashboard/project/${projectRef}/sql/new`,
    );
    console.log(
      "\n   Step 1: Paste and run: supabase/migrations/001_create_tables.sql",
    );
    console.log(
      "   Step 2: Paste and run: supabase/migrations/002_create_rls_policies.sql",
    );
  } else {
    console.log("\n✅ All migrations executed successfully!");
  }
}

main().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
