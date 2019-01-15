const path = require('path')
const SizePlugin = require('size-plugin')

// 只在生产环境下调用 size-plugin 插件
const isProductionEnvFlag = process.env.NODE_ENV === 'production'

function resolve(dir) {
  return path.join(__dirname, './', dir)
}

module.exports = {
  chainWebpack: config => {
    // 这里是对环境的配置，不同环境对应不同的 BASE_API，以便 axios 的请求地址不同
    config.plugin('define').tap(args => {
      const argv = process.argv
      const mode = argv[argv.indexOf('--project-mode') + 1]
      args[0]['process.env'].MODE = `"${mode}"`
      switch (args[0]['process.env'].MODE) {
        case '"test"':
          args[0]['process.env'].BASE_API = '"http://test.com"'
          break
        case '"dev"':
          args[0]['process.env'].BASE_API = '"http://baseApi.com"'
          break
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
    const splitOptions = config.optimization.get('splitChunks')
    config.optimization.splitChunks(
      Object.assign({}, splitOptions, {
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
            name: 'chunk-comomns',
            test: resolve('src/components'), // 可自定义拓展你的规则
            minChunks: 2, // 最小共用次数
            priority: 5,
            reuseExistingChunk: true
          }
        }
      })
    )
  },

  configureWebpack: {
    plugins: [
      // 配置 size-plugin 插件
      isProductionEnvFlag ? new SizePlugin() : () => {}
    ]
  }
}
