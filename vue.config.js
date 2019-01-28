const path = require('path')
const SizePlugin = require('size-plugin')

// 引入开启 Gzip 的插件
const CompressionWebpackPlugin = require('compression-webpack-plugin')

// 只在生产环境下调用 size-plugin 插件
const isProductionEnvFlag = process.env.NODE_ENV === 'production'

function resolve(dir) {
  return path.join(__dirname, './', dir)
}

// cdn预加载使用
const externals = {
  vue: 'Vue',
  'vue-router': 'VueRouter',
  vuex: 'Vuex',
  axios: 'axios',
  'element-ui': 'ELEMENT',
  'js-cookie': 'Cookies',
  nprogress: 'NProgress'
}

const cdn = {
  // 开发环境
  dev: {
    css: [
      'https://unpkg.com/element-ui/lib/theme-chalk/index.css',
      'https://cdn.bootcss.com/nprogress/0.2.0/nprogress.min.css'
    ],
    js: []
  },
  // 生产环境
  build: {
    css: [
      'https://unpkg.com/element-ui/lib/theme-chalk/index.css',
      'https://cdn.bootcss.com/nprogress/0.2.0/nprogress.min.css'
    ],
    js: [
      'https://cdn.jsdelivr.net/npm/vue@2.5.17/dist/vue.min.js',
      'https://cdn.jsdelivr.net/npm/vue-router@3.0.1/dist/vue-router.min.js',
      'https://cdn.jsdelivr.net/npm/vuex@3.0.1/dist/vuex.min.js',
      'https://cdn.jsdelivr.net/npm/axios@0.18.0/dist/axios.min.js',
      'https://unpkg.com/element-ui/lib/index.js',
      'https://cdn.bootcss.com/js-cookie/2.2.0/js.cookie.min.js',
      'https://cdn.bootcss.com/nprogress/0.2.0/nprogress.min.js'
    ]
  }
}

// 是否使用gzip
const productionGzip = true
// 需要gzip压缩的文件后缀
const productionGzipExtensions = ['js', 'css']

module.exports = {
  chainWebpack: config => {
    // 配置别名
    config.resolve.alias
      .set('@', resolve('src'))
      .set('api', resolve('src/api'))
      .set('static', resolve('src/static'))

    // 这里是对环境的配置，不同环境对应不同的 BASE_API，以便 axios 的请求地址不同
    config.plugin('define').tap(args => {
      const argv = process.argv
      const mode = argv[argv.indexOf('--project-mode') + 1]
      args[0]['process.env'].MODE = `"${mode}"`
      switch (args[0]['process.env'].MODE) {
        case '"test"':
          args[0]['process.env'].BASE_API = '"/test"'
          break
        case '"dev"':
          args[0]['process.env'].BASE_API = '"/api"'
          break
      }
      return args
    })

    /**
     * 添加 CDN 参数到 htmlWebpackPlugin 配置中，详见 public/index.html 修改
     */
    config.plugin('html').tap(args => {
      if (process.env.NODE_ENV === 'production') {
        args[0].cdn = cdn.build
      }
      if (process.env.NODE_ENV === 'development') {
        args[0].cdn = cdn.dev
      }
      return args
    })

    // svg loader
    const svgRule = config.module.rule('svg') // 找到 svg-loader
    svgRule.uses.clear() // 清除已有的 loader, 如果不这样做会添加在此loader之后
    svgRule.exclude.add(/node_modules/) // 正则匹配排除 node_modules 目录
    svgRule // 添加 svg 新的 loader 处理
      .test(/\.svg$/)
      .use('svg-sprite-loader')
      .loader('svg-sprite-loader')
      .options({
        symbolId: 'icon-[name]'
      })

    // 修改 images loader 添加 svg 处理
    const imagesRule = config.module.rule('images')
    imagesRule.exclude.add(resolve('src/icons'))
    config.module.rule('images').test(/\.(png|jpe?g|gif|svg)(\?.*)?$/)

    // 使用 webpack4 新特性来拆分代码
    config.optimization.splitChunks({
      chunks: 'all',
      cacheGroups: {
        libs: {
          name: 'chunk-libs',
          test: /[\\/]node_modules[\\/]/,
          priority: 10,
          chunks: 'initial' // 只打包初始时依赖的第三方
        },
        elementUI: {
          name: 'chunk-elementUI', // 单独将 elementUI 拆包
          priority: 20, // 权重要大于 libs 和 app 不然会被打包进 libs 或者 app
          test: /[\\/]node_modules[\\/]element-ui[\\/]/
        },
        commons: {
          name: 'chunk-commons',
          test: resolve('src/components'), // 可自定义拓展你的规则
          minChunks: 3, // 最小公用次数
          priority: 5,
          reuseExistingChunk: true
        }
      }
    })
    config.optimization.runtimeChunk('single')
  },

  // 修改 webpack config, 使其不打包 externals 下的资源
  configureWebpack: () => {
    const myConfig = {}
    if (process.env.NODE_ENV === 'production') {
      // 1. 生产环境 npm 包转 CDN
      myConfig.externals = externals

      myConfig.plugins = []
      // 2. 构建时开启gzip，降低服务器压缩对CPU资源的占用，服务器也要相应开启gzip
      productionGzip &&
        myConfig.plugins.push(
          new CompressionWebpackPlugin({
            test: new RegExp(
              '\\.(' + productionGzipExtensions.join('|') + ')$' // 处理所有匹配此 {RegExp} 的资源
            ),
            threshold: 1024, // 1k, 只处理比这个值大的资源。按字节计算
            minRatio: 0.8 // 只有压缩率比这个值小的资源才会被处理
          })
        )

      // 配置 size-plugin 插件
      myConfig.plugins.push(isProductionEnvFlag ? new SizePlugin() : () => {})
    }
    if (process.env.NODE_ENV === 'development') {
      /**
       * 关闭 host check，方便使用 ngrok 之类的内网转发工具
       * 配置跨域
       */
      myConfig.devServer = {
        disableHostCheck: true,
        hot: true,
        port: 8081, // 端口号
        host: '0.0.0.0',
        https: false,
        open: false, // 是否自动启动浏览器
        compress: true, // 是否启用 gzip 压缩
        // 代理跨域
        proxy: {
          '/api': {
            target: 'http://10.18.72.30:20080/',
            ws: true,
            changeOrigin: true,
            pathRewrite: {
              '^/api': ''
            }
          }
        }
      }
    }
    return myConfig
  }
}
