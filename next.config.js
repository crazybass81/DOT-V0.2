/** @type {import('next').NextConfig} */
const nextConfig = {
  // TypeScript strict 모드 활성화
  typescript: {
    ignoreBuildErrors: false,
  },

  // 실험적 기능 활성화
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js', 'zustand'],
  },

  // 성능 최적화 설정
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 번들 최적화
    if (!dev) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          platform: {
            name: 'platform',
            test: /[\\/]src[\\/](components|lib)[\\/]platform[\\/]/,
            priority: 10,
            reuseExistingChunk: true,
          },
          apps: {
            name: 'apps',
            test: /[\\/]src[\\/]apps[\\/]/,
            priority: 8,
            reuseExistingChunk: true,
          },
          vendor: {
            name: 'vendor',
            test: /[\\/]node_modules[\\/]/,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };

      // Tree shaking 최적화
      config.optimization.usedExports = true;
      config.optimization.sideEffects = false;
    }

    return config;
  },

  // 보안 헤더
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // 환경별 설정
  env: {
    PLATFORM_VERSION: process.env.PLATFORM_VERSION || '1.0.0',
  },
};

module.exports = nextConfig;