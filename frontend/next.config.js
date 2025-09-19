/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8000',
  },
  // Amplify configuration
  trailingSlash: true,
  images: {
    unoptimized: true
  },
  // Environment variables for build time
  publicRuntimeConfig: {
    API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:8000',
  },
}

module.exports = nextConfig