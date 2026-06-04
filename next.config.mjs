/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.myshopify.com' },
      { protocol: 'https', hostname: 'cdn.shopify.com' },
      { protocol: 'https', hostname: '**.cjdropshipping.com' },
      { protocol: 'https', hostname: 'cjdropshipping.com' },
      { protocol: 'https', hostname: '**.aliexpress.com' },
      { protocol: 'https', hostname: '**.alibaba.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Content-Type, Authorization' },
        ],
      },
    ];
  },
  async redirects() {
    return [
      { source: '/dashboard', destination: '/', permanent: true },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false, net: false, tls: false, crypto: false,
      };
    }
    return config;
  },
  experimental: {
    serverComponentsExternalPackages: ['shopify-api-node', 'groq-sdk', '@google/generative-ai'],
    serverActions: { bodySizeLimit: '10mb' },
  },
};

export default nextConfig;