module.exports = {
  entry: "./src/index.tsx",
  output: {
    libraryTarget: "umd",
    publicPath: './build/',
    filename: "bundle.js",
    path: __dirname + "/build"
  },

  devtool: "source-map",

  target: 'electron',

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: [".ts", ".tsx", ".js", ".json"]
  },

  externals: {
    BSDeviceInfo : 'BSDeviceInfo',
    '@brightsign/assetpool': 'commonjs @brightsign/assetpool',
    '@brightsign/assetpoolfetcher': 'commonjs @brightsign/assetpoolfetcher',
    '@brightsign/assetrealizer': 'commonjs @brightsign/assetrealizer',
    '@brightsign/registry': 'commonjs @brightsign/registry',
    '@brightsign/systemtime': 'commonjs @brightsign/systemtime',
    '@brightsign/networkconfiguration': 'commonjs @brightsign/networkconfiguration',
    '@brightsign/videooutput': 'commonjs @brightsign/videooutput',
    '@brightsign/screenshot': 'commonjs @brightsign/screenshot',

    '@brightsign/videomodeconfiguration': 'commonjs @brightsign/videomodeconfiguration',
    '@brightsign/videoinput': 'commonjs @brightsign/videoinput',
    '@brightsign/system': 'commonjs @brightsign/system',

    '@brightsign/hostconfiguration': 'commonjs @brightsign/hostconfiguration',
    '@brightsign/networkdiagnostics': 'commonjs @brightsign/networkdiagnostics',
    'core-js/fn/object/assign' : 'commonjs core-js/fn/object/assign',
  },

  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
      { test: /\.tsx?$/, loader: "awesome-typescript-loader" },

      { enforce: "pre", test: /\.js$/, loader: "source-map-loader" }
    ],
  },
};
