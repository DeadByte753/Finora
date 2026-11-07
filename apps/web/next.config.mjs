/** @type {import('next').NextConfig} */
const nextConfig = {
  // The shared package ships TypeScript source, so Next compiles it.
  transpilePackages: ['@finora/core']
};

export default nextConfig;
