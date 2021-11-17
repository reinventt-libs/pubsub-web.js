const { merge } = require("webpack-merge");
const webpackBaseConfig = require("@reinventt/build-webpack/webpack.base.config");

module.exports = [
  merge(webpackBaseConfig, {
    target: ["web"],
    output: {
      ...webpackBaseConfig.output,
      filename: "[name].js",
      library: {
        ...webpackBaseConfig.output.library,
        name: "@reinventt/pubsub-web",
      },
    },
    plugins: [],
  }),
];
