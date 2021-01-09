module.exports = {
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
  }
};
