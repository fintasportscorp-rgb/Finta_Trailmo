/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  serverExternalPackages: ["@mediapipe/tasks-vision"],
  allowedDevOrigins: ["*"],
}

export default nextConfig
