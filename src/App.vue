<template>
  <div id="app">
    <div id="nav">
      <!-- 使用示例 -->
      <svg-icon icon-class="example" />
      <router-link to="/">Home</router-link> |
      <router-link to="/about">About</router-link>
    </div>
    <router-view />
    <request-loding></request-loding>
  </div>
</template>

<script>
import RequestLoding from '@/components/RequestLoading.vue'
import { login } from 'api/login'

export default {
  components: {
    RequestLoding
  },
  created() {
    let username = 'root'
    let password = 123456
    login(username, password).then(() => {
      // console.log(res)
    })
    let a = '2s'
    let b
    console.log(a)
  }
}
</script>

<style lang="scss">
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
#nav {
  padding: 30px;
  a {
    font-weight: bold;
    color: #2c3e50;
    &.router-link-exact-active {
      color: #42b983;
    }
  }
}
</style>
