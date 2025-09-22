/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'https://wm8h6yjgim.us-east-1.awsapprunner.com',
  },
  // Amplify configuration
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Environment variables for build time
  publicRuntimeConfig: {
    API_BASE_URL: process.env.API_BASE_URL || 'https://wm8h6yjgim.us-east-1.awsapprunner.com',
  },
  // Static export for Amplify
  output: 'export',
  distDir: 'out',
}

module.exports = nextConfig