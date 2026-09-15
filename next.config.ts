import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin()

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en-US/posts',
        permanent: true, // or false if you plan on changing default locales dynamically
      },
    ]
  },
  reactCompiler: true,
  transpilePackages: ['next-mdx-remote'],
}

export default withNextIntl(nextConfig)
