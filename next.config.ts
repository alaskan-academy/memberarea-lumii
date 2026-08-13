import type { NextConfig } from "next";
import withPWA from "@ducanh2912/next-pwa";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Precisa acompanhar o limite de 50MB validado em uploadMaterialForLesson/
      // uploadMaterial (course-content-manager e aulas/[lessonId] actions.ts) —
      // um limite menor aqui faz o Next.js rejeitar o request antes mesmo de
      // chegar nessa validação, com o erro genérico "unexpected response".
      bodySizeLimit: "50mb",
    },
    // O proxy (src/proxy.ts, matcher abrangente cobre as rotas admin) roda em
    // toda request. O Next.js limita em 10MB o corpo que o proxy deixa passar
    // adiante por padrão — mesmo o proxy.ts nunca lendo o body — truncando
    // uploads de PDF grandes antes de chegar na Server Action ("Unexpected end
    // of form"). Precisa acompanhar o mesmo limite de serverActions.bodySizeLimit.
    proxyClientMaxBodySize: "50mb",
  },
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "ucpzyuonrebusjdvattt.supabase.co" },
    ],
  },
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // HSTS: força HTTPS por 2 anos (apenas em produção)
          ...(isProd
            ? [{ key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" }]
            : []),
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://player.pandavideo.com.br https://*.pandavideo.com.br https://*.tv.pandavideo.com.br",
              "frame-src 'self' https://player.pandavideo.com.br https://*.pandavideo.com.br https://*.tv.pandavideo.com.br https://docs.google.com https://www.youtube.com https://www.youtube-nocookie.com https://notion.so https://www.canva.com https://*.typeform.com",
              "img-src 'self' data: blob: https:",
              "style-src 'self' 'unsafe-inline'",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.pandavideo.com.br https://*.tv.pandavideo.com.br",
              "media-src 'self' blob: https://*.pandavideo.com.br https://*.tv.pandavideo.com.br",
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
      // Webhook endpoint: sem cache, sempre fresco
      {
        source: "/api/webhooks/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default withPWA({
  dest: "public",
  cacheOnFrontEndNav: false,
  aggressiveFrontEndNavCaching: false,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  customWorkerSrc: "worker",
  fallbacks: {
    document: "/~offline",
  },
})(nextConfig);
