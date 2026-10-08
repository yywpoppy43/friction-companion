import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // libsql ships native bindings for file: databases; keep it out of the bundle.
  serverExternalPackages: ['@libsql/client', 'libsql'],
  // Migrations are applied at runtime from ./drizzle; make sure the folder travels with every route.
  outputFileTracingIncludes: { '**': ['./drizzle/**/*'] },
  poweredByHeader: false,
  // This app lives in a subfolder of a larger repository; keep the bundler rooted here.
  turbopack: { root: path.resolve(import.meta.dirname) },
};

export default nextConfig;
