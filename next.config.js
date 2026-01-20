/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "i.ytimg.com",
                pathname: "/**",
            },
            {
                protocol: "https",
                hostname: "yt3.ggpht.com",
                pathname: "/**",
            },
        ],
    },
    // Production optimizations
    compress: true,
    poweredByHeader: false,
    reactStrictMode: true,

    // Remove unused features to reduce bundle size
    swcMinify: true,

    // Environment variable prefixes for client-side
    env: {
        NEXT_PUBLIC_APP_NAME: "Soi'Brand",
    },
};

module.exports = nextConfig;
