/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker / Google Cloud Run
  reactStrictMode: true,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  images: {
    domains: ['fonts.googleapis.com'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', 'recharts'],
  },
}

module.exports = nextConfig
