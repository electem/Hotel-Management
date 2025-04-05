const nextConfig = {
  reactStrictMode: true,
  publicRuntimeConfig: {

    // Will be available on both server and client
    //changes are made by feature1

    API_BASE_URL: process.env.API_BASE_URL
  }
};

module.exports = nextConfig;