const path = require("path");
const package = require("./package.json");

module.exports = {
  entry: path.join(__dirname, "src", "index"),
  output: {
    filename: package.name + ".js",
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [
      {
        test: /.js$/,
        include: [path.resolve(__dirname, "src")],
        exclude: [path.resolve(__dirname, "node_modules")],
        loader: "babel-loader"
      }
    ]
  },
  resolve: {
    extensions: [".js"]
  }
};
