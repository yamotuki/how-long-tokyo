<template>
    <div>
        <h1>駅一覧</h1>
        <div style="position: relative">
            <img src="https://firebasestorage.googleapis.com/v0/b/how-long-tokyo.appspot.com/o/google_map_ss_01.jpg?alt=media&token=2ce22939-01ca-413c-b824-d64609ec0b4f"
                 alt="地図">
            <template v-for="stationName in Object.keys(station)">
                <div :style="getStyle(station[stationName].coord.lat, station[stationName].coord.lon)">
                    {{ stationName }}
                    {{ station[stationName].coord.lat }}
                    {{ station[stationName].coord.lon }}
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
          position: 'absolute',
          top: (lat - 35.5) / 35.5 * 100 * 100 + '%',
          left: (lon - 139) / 139 * 100 * 100 + '%',
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

      // TODO この google map static api で適当な幅を指定して、そこにcssでオーバーレイするのは？
      // https://developers.google.com/maps/documentation/maps-static/overview?hl=ja
      // ピンにラベルがつけられそう
      // marker は url につける形。URLの長さ制限は8000ほど。http://maps.googleapis.com/maps/api/staticmap?&size=600x400&style=visibility:on&markers=label:S%7C40.702147,-74.015794
      // 上記の形式のようにすると200くらいはマーカー足せそうだけど、結構きつい。駅の数は1000。これじゃダメ。

      // google map のスクショは、帰属をはっきりさせる部分を残せば使って良さそう。
      // TODO storage に google_map_ss_01.jpg みたいな名前で保存したのでそれをダウンロードしてnuxtで表示する

    },
  };
</script>
