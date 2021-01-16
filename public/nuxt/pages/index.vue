<template>
    <div>
        <h1 class="title">”おおよそ”の他の駅までの時間（分）</h1>
        <div class="search-form">
            <label>
                開始点を検索
                <input type="text" v-model="searchString">
            </label>
            <div v-for="searchWord in matchedStrings">
                <a href="javascript:void(0)" v-on:click="setStart(searchWord)">{{ searchWord }} を開始点にする</a>
            </div>
        </div>
        <div class="map-wrapper">
            <!-- TODO: 不要なアイコンを読み込まないようにする -->
            <link href="https://fonts.googleapis.com/icon?family=Material+Icons"
                  rel="stylesheet">
            <!--google map のスクショは、帰属をはっきりさせる部分を残せば使って良さそう。-->
            <img class="map-image"
                 src="https://firebasestorage.googleapis.com/v0/b/how-long-tokyo.appspot.com/o/google_map_ss_01.jpg?alt=media&token=2ce22939-01ca-413c-b824-d64609ec0b4f"
                 alt="地図">
            <template v-for="stationName in Object.keys(stations)">
                <div :style="getStyle(stations[stationName].coord.lat, stations[stationName].coord.lon)">
                    <div :id="stationName" class="pointer-label">
                        <!-- 開始点 -->
                        <span class="start-point" v-if="stations[stationName].time === 0">
                            <i class="material-icons">location_on</i>
                            <span class="start-point-name">
                                {{ stationName }}
                            </span>
                        </span>
                        <div class="selectable-point" v-if="stations[stationName].time !== 0">
                            <span class="name" :class="{ show: shouldShow(stationName) }">
                                <i class="material-icons">location_on</i>
                                {{ stationName }}
                             </span>
                            <span v-on:mousedown="" v-on:touchstart="" class="time"
                                  v-if="stations[stationName].time > 1">
                                {{ stations[stationName].time }}
                            </span>
                            <a class="set-to-start" href="javascript:void(0)"
                               v-on:click="setStart(stationName)">開始点にする</a>
                            <a class="search-detail" href="javascript:void(0)"
                               v-on:click="navitimeSearchUrl(stationName)">詳細検索
                                <i class="material-icons">open_in_new</i>
                            </a>
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
    head: {
      meta: [
        {charset: 'utf-8'},
        {name: 'viewport', content: 'initial-scale=1, user-scalable=no'},
        {hid: 'title', content: '他の駅までの距離'},
        {hid: 'description', name: 'description', content: '都内の駅から、他の複数の駅に何分かかるか検索できます。'}
      ]
    },
    data() {
      return {
        stations: [],
        searchString: '',
        currentStartPoint: ''
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
      }
    },
    methods: {
      shouldShow: function(stationName) {
        // https://rtrp.jp/locations/229/categories/2159/
        return ['東京', '池袋', '品川', '新宿', '渋谷', '上野', '北千住', '高田馬場', '飯田橋', '秋葉原', '王子'].includes(
            stationName);
      },
      navitimeSearchUrl: function(destStationName) {
        const link = "https://www.navitime.co.jp/transfer/searchlist?orvStationName=" + this.currentStartPoint +
            "&dnvStationName=" + destStationName + "&month=2021%2F01&day=12&hour=8&minute=0&wspeed=125"

        window.open(link);
      },
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

        this._scrollToStation(stationName);

        this.currentStartPoint = stationName;
        this.$nuxt.$loading.finish()
      },
      _scrollToStation: function(name) {
        if (!process.client) {
          return;
        }

        // id を日本語の駅名でつけているのでこれで取れる
        const element = document.getElementById(name);
        if (!element) {
          return;
        }

        element.scrollIntoView({behavior: 'smooth', block: 'center', inline: 'center'})
      },
      fetchData: async function(stationName) {
        const url = process.env.NODE_ENV === 'development'
            ? 'http://localhost:5001/how-long-tokyo/asia-northeast1/showReachableTrigger?start='
            : 'https://asia-northeast1-how-long-tokyo.cloudfunctions.net/showReachableTrigger?start=';
        const jsonRes = await fetch(
            url + encodeURIComponent(stationName)
        ).then(res =>
            res.json(),
        ).catch(() => {
          if (process.client) {
            /* マップ範囲外かcoordの起点となった落合が対象。*/
            /* TODO: 落合についてはあとで治す。 */
            this.$toasted.show('サポート対象外の駅です', {duration: 5000});
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
      const initial = '東京';
      await this.fetchData(initial);
      this.currentStartPoint = initial;
    },
  };
</script>

<style lang="scss">
    @mixin text-shadow() {
        text-shadow: 2px 2px 1px white,
        -2px 2px 1px white,
        2px -2px 1px white,
        -2px -2px 1px white,
        2px 0px 1px white,
        0px 2px 1px white,
        -2px 0px 1px white,
        0px -2px 1px white;
    }

    .title {
        position: fixed;
        z-index: 1;
        background-color: white;
        font-size: 14px;
        top: 5px;
        left: 20px;
    }

    .search-form {
        position: fixed;
        top: 35px;
        left: 20px;
        z-index: 1;
        background-color: white;
        /* sp でスクロールイベント終わるまでの間もfixed が聞くようにするハックらしい */
        transform: translate3d(0, 0, 0);
    }

    .map-wrapper {
        position: relative;
        overflow: hidden;
        width: 1500px;
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

    .pointer-label {
        font-size: 13px;
        position: relative;
    }

    .selectable-point {
        .set-to-start, .search-detail {
            display: none;
        }

        .name {
            display: none;

            &.show {
                display: block;
                color: black;
                font-size: 14px;
                @include text-shadow();

                @media screen and (max-width: 480px) {
                    font-size: 20px;
                }

                .material-icons {
                    vertical-align: bottom;
                    margin-right: -7px;
                }
            }
        }

        .time {
            color: #595959;
        }

        @media screen and (max-width: 480px) {
            .time {
                font-size: 15px;
                font-weight: bold;
            }
        }

        &:hover > .name, &:hover > .time, &:hover > .set-to-start, &:hover > .search-detail {
            z-index: 1;
            top: 65px;
            position: relative;
            display: block;
            font-size: 18px;
            color: orangered;
            background-color: white;
            opacity: 0.7;
        }
    }
</style>
