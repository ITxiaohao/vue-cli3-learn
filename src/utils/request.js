import axios from 'axios'
import store from '@/store' // 引入 store 设置全局 loading 及 user cookie 等

// 创建axios 实例
const service = axios.create({
  baseURL: process.env.BASE_API, // api 的 base_url
  timeout: 5000 // 请求超时时间
})

// request 拦截器
service.interceptors.request.use(
  config => {
    // 这里可以自定义一些config 配置

    // loading + 1 , 出现 loading
    store.dispatch('setLoading', true)

    return config
  },
  error => {
    //  这里处理一些请求出错的情况

    // loading 清 0
    setTimeout(function() {
      store.dispatch('setLoading', 0)
    }, 300)

    // console.log(error)
    Promise.reject(error)
  }
)

// response 拦截器
service.interceptors.response.use(
  response => {
    const res = response.data
    // 这里处理一些response 正常放回时的逻辑

    // loading - 1
    store.dispatch('setLoading', false)

    return res
  },
  error => {
    // 这里处理一些response 出错时的逻辑

    // loading - 1
    store.dispatch('setLoading', false)

    return Promise.reject(error)
  }
)

export default service
