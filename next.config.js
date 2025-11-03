/** @type {import('next').NextConfig} */
const nextConfig = {
  // Note: Static export doesn't support middleware
  // For production, you may want to remove 'output: export' to enable middleware
  output: 'export',
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
  trailingSlash: true,
};

module.exports = nextConfig;
