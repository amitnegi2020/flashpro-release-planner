/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: false,
  webpack: (config, { isServer }) => {
    // jsPDF references canvg/html2canvas at module level but we load them
    // dynamically (import()) at runtime so they are never needed server-side.
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvg: false,
        html2canvas: false,
        dompurify: false,
      }
    }
    return config
  },
}
