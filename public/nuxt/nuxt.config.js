module.exports = {
  plugins: [
    {src: '@/plugins/vue-dragscroll.js', ssr: false},
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
