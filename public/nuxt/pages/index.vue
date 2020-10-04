<template>
    <div>
        <h1>駅一覧 aaaaaaaaaaaa</h1>
        <!--    <div>
                <div v-for="stationName in this.posts.keys()">
                    {{ stationName }}
                </div>
            </div> -->
        <div>
            {{ this.posts }}
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
      this.posts = await fetch(
          'https://asia-northeast1-how-long-tokyo.cloudfunctions.net/showReachableTrigger?start=%E7%A5%9E%E6%A5%BD%E5%9D%82').
          then(res =>
              res.json(),
          );
    },
  };
</script>
