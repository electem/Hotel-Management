const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {

    // Will be available on both server and client
    //feature2

    API_BASE_URL: process.env.API_BASE_URL
  }
};

module.exports = nextConfig;