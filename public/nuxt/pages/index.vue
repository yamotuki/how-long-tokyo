<template>
    <div>
        <h1>駅一覧</h1>
        <div>
            <div v-for="stationName in Object.keys(posts)">
                {{ posts[stationName] }}
            </div>
        </div>
    </div>
</template>

<script>
  export default {
    data() {
      return {
        posts: [],
      };
    },
    async fetch() {
      const jsonRes = await fetch(
          'http://localhost:5001/how-long-tokyo/asia-northeast1/showReachableTrigger?start=%E7%A5%9E%E6%A5%BD%E5%9D%82').
          then(res =>
              res.json(),
          );

      const tempString = JSON.stringify(jsonRes);
      this.posts = JSON.parse(tempString)
    },
  };
</script>
