/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@thrift/types", "@thrift/config", "@thrift/ui"],
};

module.exports = nextConfig;
