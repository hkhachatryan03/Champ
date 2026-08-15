import { neon } from "@neondatabase/serverless";

// This is a real, hosted Postgres database (via Neon) — not a local file.
// Every query goes over the network, which is why every function in
// lib/queries.ts is async now (it wasn't when this was a local SQLite file).
//
// The fallback placeholder below only exists so `next build` can evaluate
// this module without a real database configured yet (e.g. before you've
// set DATABASE_URL locally or in Vercel). It is never actually queried at
// build time — Next.js only imports the module to check its shape. At
// runtime, if DATABASE_URL is genuinely missing, any real query will fail
// with a clear connection error instead of a vague crash.
const connectionString =
  process.env.DATABASE_URL || "postgres://placeholder:placeholder@localhost:5432/placeholder";

const sql = neon(connectionString);

export default sql;
