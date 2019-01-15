module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: ['plugin:vue/essential', '@vue/prettier'],
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'prettier/prettier': [
      'error',
      {
        semi: false, // false 表示去除结尾分号
        singleQuote: true, // 双引号全改用单引号
        bracketSpacing: true // 函数体括号后方留空格
      }
    ]
  },
  parserOptions: {
    parser: 'babel-eslint'
  }
}
