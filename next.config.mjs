/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export -> plain HTML/CSS/JS in ./out, loaded by Electron via file://
  output: 'export',
  distDir: 'out',
  // Relative asset paths so the export works under Electron's file:// loadFile()
  assetPrefix: './',
};

export default nextConfig;
