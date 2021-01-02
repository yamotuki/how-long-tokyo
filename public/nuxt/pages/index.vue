<template>
    <div>
        <meta name="viewport" content="width=device-width,initial-scale=1">
        <h1>他の駅までの時間</h1>
        <div class="search-form">
            <label>
                開始点を検索
                <input type="text" v-model="searchString">
            </label>
            <div v-for="searchWord in matchedStrings">
                <!-- TODO: () の中のものを表示上フィルターするのを追加 -->
                <a href="javascript:void(0)" v-on:click="setStart(searchWord)">{{ searchWord }} を開始点にする</a>
            </div>
        </div>
        <!-- TODO: SPだと小さすぎ & スクロールできない。まずは view port から-->
        <div v-dragscroll class="map-wrapper">
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
        searchString: ''
      };
    },
    computed: {
      matchedStrings: function() {
        if (!this.searchString) {
          return ''
        }

        return Object.keys(this.stations).filter((station) => {
          let checkStationName = station;

          // （東京都） などを排除して検索
          const filteredArray = station.match(/(.*?)([（(].*[）)])/);
          if (filteredArray) {
            checkStationName = filteredArray[1];
          }

          return checkStationName.includes(this.searchString);
        });
      },
    },
    methods: {
      getStyle: function(lat, lon) {
        const bottomEnd = 35.547;
        const leftEnd = 139.562459;

        const bottom = (lat - bottomEnd) / (35.789124 - bottomEnd) * 100;
        const left = (lon - leftEnd) / (139.964959 - leftEnd) * 100;

        let style = {
          // map 右上 35.789124, 139.964959
          // map 左下 35.561099, 139.552459
          position: 'absolute',
          bottom: bottom + '%',
          left: left + '%',
        };

        if (bottom < 0 || 100 < bottom
            || left < 0 || 100 < left) {
          style['visibility'] = 'hidden';
        }

        return style;
      },
      setStart: async function(stationName) {
        this.$nuxt.$loading.start();
        await this.fetchData(stationName);
        // 検索を初期化
        this.searchString = '';
        this.$nuxt.$loading.finish()
      },
      fetchData: async function(stationName = '東京') {
        const jsonRes = await fetch(
            'http://localhost:5001/how-long-tokyo/asia-northeast1/showReachableTrigger?start=' +
            //            'https://asia-northeast1-how-long-tokyo.cloudfunctions.net/showReachableTrigger?start=' +
            encodeURIComponent(stationName)).
            then(res =>
                res.json(),
            ).catch(() => {
              if (process.client) {
                this.$toasted.show('範囲外の駅です');
              }
            });
        if (!jsonRes) {
          return;
        }

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
