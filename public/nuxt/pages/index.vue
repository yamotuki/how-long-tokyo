<template>
    <div>
        <h1>駅一覧</h1>
        <div style="position: relative">
            <!--google map のスクショは、帰属をはっきりさせる部分を残せば使って良さそう。-->
            <img src="https://firebasestorage.googleapis.com/v0/b/how-long-tokyo.appspot.com/o/google_map_ss_01.jpg?alt=media&token=2ce22939-01ca-413c-b824-d64609ec0b4f"
                 alt="地図">
            <template v-for="stationName in Object.keys(stations)">
                <div :style="getStyle(stations[stationName].coord.lat, stations[stationName].coord.lon)">
                    <div class="pointer-label" v-on:click="setStart(stationName)">
                        <!-- TODO: マウスオーバーした時だけ駅名が見れるようにする -->
                        {{ stations[stationName].time }}
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
  import {empty} from '../.nuxt/utils';

  export default {
    data() {
      return {
        stations: [],
      };
    },
    methods: {
      getStyle: function(lat, lon) {
        return {
          // map 右上 35.789124, 139.964959
          // map 左下 35.561099, 139.552459
          position: 'absolute',
          bottom: (lat - 35.561099) / (35.789124 - 35.561099) * 100 + '%',
          left: (lon - 139.552459) / (139.964959 - 139.552459) * 100 + '%',
        };
      },
      setStart: async function(stationName) {
        await this.fetchData(stationName);
      },
      fetchData: async function(stationName = '東京') {
        // memo: 入力が正しければCORSヘッダ入れてresponse.sendしているが、errorの場合には入らないのでCORSエラーになる。あとで直しても良い
        const jsonRes = await fetch(
            'http://localhost:5001/how-long-tokyo/asia-northeast1/showReachableTrigger?start=' +
            encodeURIComponent(stationName)).
            then(res =>
                res.json(),
            );

        console.log(jsonRes);

        // 直接 json parse できなかったので一度 string にしている
        this.stations = JSON.parse(JSON.stringify(jsonRes));
        await this.$forceUpdate();

        console.log(this.stations['宿河原'])

        // vue が認識できるように入れ直す
/*        this.stations = [];
        // TODO: これだと name が key の object だったものが配列になってしまっているので直す！！！！！
        Object.keys(stationObjects).forEach((itemName) => {
          this.stations.push({[itemName]: stationObjects[itemName]})
        })*/
       //  console.log(this.stations)
      }
    },
    async fetch() {
      await this.fetchData()
    },
  };
</script>

<style>
    .pointer-label {
        font-size: 13px;
    }
</style>
