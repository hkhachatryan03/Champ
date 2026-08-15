import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ["pdf-parse", "@napi-rs/canvas"],
  // Fixes a warning some setups hit when there's a package-lock.json
  // anywhere else in the user's home directory tree — Next.js's
  // auto-detected project root gets confused and warns about it. This
  // pins the root explicitly to this project folder.
  outputFileTracingRoot: path.join(__dirname),
  // Without this, Next.js can reuse a cached snapshot of a page for up to
  // 30 seconds after you navigate away and back — which looked like real
  // bugs (unread counts not clearing, status changes not showing, the
  // candidate pool undercounting) but was actually just stale client-side
  // cache, not stale data in the database.
  experimental: {
    staleTimes: {
      dynamic: 0,
    },
  },
};

export default nextConfig;
