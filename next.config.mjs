/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["@mediapipe/tasks-vision"],
  allowedDevOrigins: [
    "https://5259f52b-9e57-4ea9-8fec-c704560fe3b3-00-10h27h3vrqbyx.janeway.replit.dev",
    "http://127.0.0.1:5000",
    "http://0.0.0.0:5000",
  ],
}

export default nextConfig
