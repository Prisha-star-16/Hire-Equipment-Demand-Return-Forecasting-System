/** @type {import('next').NextConfig} */
const nextConfig = {
  // Optimise for static export on Vercel
  output: 'standalone',
  reactStrictMode: true,
  swcMinify: true,
  // Ensure public/data directory is served correctly
  async headers() {
    return [
      {
        source: '/data/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=3600, s-maxage=3600' }
        ]
      }
    ]
  }
}

module.exports = nextConfig
