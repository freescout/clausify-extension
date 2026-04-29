const path = require("path");
const CopyPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    popup: "./src/popup/index.ts",
    background: "./src/background/index.ts",
    content: "./src/content/index.ts",
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].js",
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js"],
  },
  plugins: [
    new CopyPlugin({
      patterns: [{ from: "public", to: "." }],
    }),
  ],
};
