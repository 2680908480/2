const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const WebpackUserscript = require("webpack-userscript");
const TerserPlugin = require("terser-webpack-plugin");
const path = require("path");
// const nodeExternals = require("webpack-node-externals");
const requireFunc =
  typeof __webpack_require__ === "function" ? __non_webpack_require__ : require; // 忽略源码中的require功能
module.exports = {
  mode: "production",
  entry: path.resolve(__dirname, "src", "app.tsx"),
  externals: {
    "js-base64": "Base64",
    "sweetalert2": "Swal",
    "spark-md5": "SparkMD5"
  },
  externalsPresets: { node: true },
  // externals: [nodeExternals()],
  resolve: {
    extensions: [".js", ".ts", ".tsx", ".json"],
    alias: {
      "@": path.resolve(__dirname, "src/"),
    },
  },
  output: {
    filename: "秒传连接提取.user.js",
    path: path.resolve(__dirname, "dist"),
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: [
          {
            loader: "text-loader",
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: path.resolve(__dirname, "./tsconfig.json"),
            },
          },
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          {
            loader: "text-loader",
          },
          "sass-loader",
        ],
        exclude: /node_modules/,
      },
      {
        test: /\.css$/,
        use: [
          {
            loader: "text-loader",
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  plugins: [
    new MiniCssExtractPlugin(),
    // 生成userscript header信息
    new WebpackUserscript({
      headers: {
        name: "百度网盘秒传助手 支持PC及移动端 永久无广告绿色版",
        "name:en": `[name]`,
        version: `[version]`,
        author: `[author]`,
        license: `GPLv3`,
        icon: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAABBUlEQVR4AZTTJRBUURTH4TtDwXuPdPrgbhHXiksf3CPucRNScHd3d3d3uO9bKeu7b79+fun8Q17CNHyMMUqaiPE4fEyYVjjGNKnNwQ4lpgV8lManEfwfosLHEGPU1N3ZnAv4qlT+NiQ56uPWSjKBrztUSnIaB66sY1vgxgxoMXB5NbsCB9rxcB5fN2M5/16nCFxeS6YTezpzsB1Pu/C2O7/78/99eYBYHXh+gqdHObGIK4GHgevjVIt1AgAnhvE4cGe8euoHbizgYuD2RGgx8O0RpwIPRmsmJDGqcrANd3pLo/qVr03hUlcpfSwf0/vD3JwkPdPK5/zhkOz+/f1FIDv/RcnOAEjywH/DhgADAAAAAElFTkSuQmCC",
        namespace: "sp.mengzonefire/fork/rin",
        supportURL: "",
        homepageURL: `[homepage]`,
        contributionURL: "",
        description: `[description]`,
        "description:en":
          "input bdlink to get files or get bdlink for Baidu™ WebDisk.",
        compatible: [
          "firefox Violentmonkey",
          "firefox Tampermonkey",
          "chrome Violentmonkey",
          "chrome Tampermonkey",
          "edge Violentmonkey",
          "edge Tampermonkey",
        ],
        match: [
          "*://pan.baidu.com/disk/home*",
          "*://pan.baidu.com/disk/main*",
          "*://pan.baidu.com/disk/synchronization*",
          "*://pan.baidu.com/s/*",
          "*://yun.baidu.com/disk/home*",
          "*://yun.baidu.com/disk/main*",
          "*://yun.baidu.com/disk/synchronization*",
          "*://yun.baidu.com/s/*",
          "*://wangpan.baidu.com/disk/home*",
          "*://wangpan.baidu.com/disk/main*",
          "*://wangpan.baidu.com/disk/synchronization*",
          "*://wangpan.baidu.com/s/*",
          "*://pan.baidu.com/wap/home*",
        ],
        grant: [
          "GM_setValue",
          "GM_getValue",
          "GM_deleteValue",
          "GM_setClipboard",
          "GM_addStyle",
          "GM_xmlhttpRequest",
          "GM_registerMenuCommand",
          "unsafeWindow",
        ],
        "run-at": "document-body",
        connect: ["baidu.com", "baidupcs.com", "cdn.jsdelivr.net", "*"],
        downloadURL: "",
        updateURL: "",
        require: [
          "http://libs.baidu.com/jquery/2.0.0/jquery.min.js",
          "https://cdn.jsdelivr.net/npm/js-base64@3.7.5/base64.min.js",
          "https://cdn.jsdelivr.net/npm/sweetalert2@11.4.8/dist/sweetalert2.min.js",
          "https://cdn.jsdelivr.net/npm/spark-md5@3.0.2/spark-md5.min.js"
        ]
      },
      pretty: true,
    }),
  ],
  optimization: {
    minimize: false,
    // 完全禁用压缩(会导致下面的配置项全部失效), 防止在greasyfork上被举报为加密/最小化代码
    minimizer: [
      new TerserPlugin({
        parallel: true,
        extractComments: false,
        terserOptions: {
          // 以下四项为禁用代码压缩 + 不压缩标识符
          mangle: false,
          compress: false,
          keep_fnames: true,
          keep_classnames: true,
          format: {
            // 输出格式化, 防止在greasyfork上被举报为最小化代码
            beautify: true,
            // 删除注释
            comments: false,
          },
        },
      }),
    ],
  },
};
