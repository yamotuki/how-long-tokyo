module.exports = {
  // ssr: false,
  plugins: [
  ],
  modules: [
    '@nuxtjs/toast',
  ],
  toast: {
    position: 'top-center'
  },
  loading: {
    color: 'blue',
    height: '3px',
  },
  build: {
    loadingScreen: false
  },
  buildModules: [
    '@nuxtjs/google-analytics'
  ],
  googleAnalytics: {
    id: 'G-W07ECYL3S3'
  }
};
