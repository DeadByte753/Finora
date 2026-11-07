/** @type {import('next').NextConfig} */
const nextConfig = {
  // The shared package ships TypeScript source, so Next compiles it.
  transpilePackages: ['@finora/core'],
  // Lets you open the dev server from other devices on your LAN.
  allowedDevOrigins: ['192.168.254.108']
};

export default nextConfig;
