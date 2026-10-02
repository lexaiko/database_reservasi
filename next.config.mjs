/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Optimasi serverless bundling untuk Vercel
  serverExternalPackages: ['googleapis'],
};

export default nextConfig;
