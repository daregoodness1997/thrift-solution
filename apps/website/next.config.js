/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@thrift/types", "@thrift/config", "@thrift/ui", "@thrift/utils"],
  webpack: (config) => {
    config.resolve.conditionNames = [
      "@thrift/source",
      ...(config.resolve.conditionNames || ["require", "node", "default"]),
    ];
    return config;
  },
};

module.exports = nextConfig;
