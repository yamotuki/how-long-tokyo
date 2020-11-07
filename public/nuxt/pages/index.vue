<template>
    <div>
        <h1>駅一覧</h1>
        <div style="position: relative">
            <img src="https://firebasestorage.googleapis.com/v0/b/how-long-tokyo.appspot.com/o/google_map_ss_01.jpg?alt=media&token=2ce22939-01ca-413c-b824-d64609ec0b4f"
                 alt="地図">
            <template v-for="stationName in Object.keys(station)">
                <div :style="getStyle(station[stationName].coord.lat, station[stationName].coord.lon)">
                    <div class="pointer-pin">
                        p
                    </div>
                    <div class="pointer-label">
                        {{ stationName }}
                        {{ station[stationName].time }}
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
  export default {
    data() {
      return {
        station: [],
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
    },
    async fetch() {
      const jsonRes = await fetch(
          'http://localhost:5001/how-long-tokyo/asia-northeast1/showReachableTrigger?start=%E7%A5%9E%E6%A5%BD%E5%9D%82').
          then(res =>
              res.json(),
          );

      // 直接 json parse できなかったので一度 string にしている
      const tempString = JSON.stringify(jsonRes);
      this.station = JSON.parse(tempString);

      // map をどこ基準にするか？　https://www.gsi.go.jp/KOKUJYOHO/CENTER/kendata/tokyo_heso.pdf
      // 経度 138 ~ 140 でとりあえず表示
      // 緯度 35 ~ 36 のなかで表示
      // TODO sin にすれば百分率計算いい感じにできる　https://developers.google.com/maps/documentation/javascript/examples/map-coordinates

      // google map のスクショは、帰属をはっきりさせる部分を残せば使って良さそう。

    },
  };
</script>

<style>
    .pointer-label {
        font-size: 13px;
    }
</style>
