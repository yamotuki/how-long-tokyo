<template>
    <div>
        <h1>駅をクリックすると他の駅までの時間が分かります</h1>
        <div class="map-wrapper" v-dragscroll>
            <!-- TODO: 不要なアイコンを読み込まないようにする -->
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons"
                  rel="stylesheet">
            <!--google map のスクショは、帰属をはっきりさせる部分を残せば使って良さそう。-->
            <img class="map-image"
                 src="https://firebasestorage.googleapis.com/v0/b/how-long-tokyo.appspot.com/o/google_map_ss_01.jpg?alt=media&token=2ce22939-01ca-413c-b824-d64609ec0b4f"
                 alt="地図">
            <template v-for="stationName in Object.keys(stations)">
                <div :style="getStyle(stations[stationName].coord.lat, stations[stationName].coord.lon)">
                    <div class="pointer-label" v-on:click="setStart(stationName)">
                        <!-- 開始点 -->
                        <span class="start-point" v-if="stations[stationName].time === 0">
                            <i class="material-icons">location_on</i>
                            <span class="start-point-name">
                                {{ stationName }}
                            </span>
                        </span>
                        <div class="selectable-point">
                            <span class="name">
                                {{ stationName }}
                             </span>
                            <span class="time" v-if="stations[stationName].time > 1">
                                {{ stations[stationName].time }}
                            </span>
                        </div>
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
        this.$nuxt.$loading.start({});
        await this.fetchData(stationName);
        this.$nuxt.$loading.finish()
      },
      fetchData: async function(stationName = '東京') {
        // memo: 入力が正しければCORSヘッダ入れてresponse.sendしているが、errorの場合には入らないのでCORSエラーになる。あとで直しても良い
        const jsonRes = await fetch(
            'http://localhost:5001/how-long-tokyo/asia-northeast1/showReachableTrigger?start=' +
            encodeURIComponent(stationName)).
            then(res =>
                res.json(),
            );

        // 直接 json parse できなかったので一度 string にしている
        this.stations = JSON.parse(JSON.stringify(jsonRes));
        await this.$forceUpdate();
      }
    },
    async fetch() {
      await this.fetchData()
    },
  };
</script>

<style lang="scss">
    .map-wrapper {
        position: relative;
        overflow: hidden;
        width: 1500px;
    }

    .pointer-label {
        font-size: 13px;
    }

    .map-image {
        width: 100%;
    }

    .start-point {
        color: red;

        .material-icons {
            font-size: 30px;
        }

        .start-point-name {
            font-size: 18px;
            font-weight: bold;
            vertical-align: super;
        }
    }

    .selectable-point {
        .name {
            display: none;
        }

        .time {
            cursor: pointer;
            color: #595959;
        }

        &:hover > .name, &:hover > .time {
            display: block;
            font-size: 18px;
            color: blue;
            background-color: white;
            opacity: 0.7;
            border-radius: 30%;
        }
    }
</style>
