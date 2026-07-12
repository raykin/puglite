module.exports = {
  name: 'banner-marker',
  setup(build) {
    build.initialOptions.banner = {
      ...build.initialOptions.banner,
      js: '/* puglite-plugin-marker */',
    };
  },
};
