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
  webpack: (config, { isServer }) => {
    // Suppress Supabase critical dependency warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@supabase/ },
    ];
    return config;
  },
};

module.exports = nextConfig;
