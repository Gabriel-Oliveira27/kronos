import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Evita que o Turbopack tente empacotar o client do Prisma e o adapter do
  // Neon — eles devem ser resolvidos em runtime via node_modules.
  serverExternalPackages: ["@prisma/client", "@prisma/adapter-neon"],

  images: {
    remotePatterns: [
      {
        // Cloudinary — domínio das fotos de perfil
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },

  // Headers de segurança aplicados a todas as respostas.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "X-DNS-Prefetch-Control", value: "off" },
        ],
      },
    ];
  },
};

export default nextConfig;
