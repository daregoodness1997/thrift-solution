/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@thrift/types", "@thrift/config", "@thrift/ui", "@thrift/utils"],
};

module.exports = nextConfig;
