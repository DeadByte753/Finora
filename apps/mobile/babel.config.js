module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo']
    // Reanimated's plugin is added automatically by babel-preset-expo (SDK 50+).
  };
};
