// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;
import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Add any other custom config here
};

export default withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // optional safeguard
  scope: '/',
  sw: 'sw.js',
})(nextConfig);
