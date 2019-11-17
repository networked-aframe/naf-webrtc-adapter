const path = require("path");
const merge = require("webpack-merge");
const MinifyPlugin = require("babel-minify-webpack-plugin");
const common = require("./webpack.common");
const package = require("./package.json");

module.exports = merge(common, {
  output: {
    filename: package.name + ".min.js"
  },
  devtool: "source-map",
  plugins: [new MinifyPlugin()]
});
