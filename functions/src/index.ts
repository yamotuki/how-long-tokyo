import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";

// // Start writing Firebase Functions
// // https://firebase.google.com/docs/functions/typescript
//
export const topPage = functions.https.onRequest(async (request, response) => {
    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });

    const db = admin.firestore();

    const docRef = db.collection('routes').doc('originToDestination');

    //  await docRef.set({
    //      first: 'Ada',
    //      last: 'Lovelace',
    //      born: 1815
    //  });

    const resData = await docRef.get();

    // functions.logger.info("Hello logs!", {structuredData: true});
    response.send(resData.get('route'));
});

// const destinations = ['新宿駅', '東京駅', '渋谷駅', '池袋駅', '上野駅', '新橋駅', '日暮里駅', '飯田橋駅', '品川駅', '四ツ谷駅', '市ヶ谷駅', '北千住駅', '秋葉原駅', '御徒町駅', '神田駅', '大手町駅', '永田町駅', '代々木駅', '御茶ノ水駅', '荻窪駅', '赤羽駅'];

// Navitime の reachable api のレンジを伸ばして使ったケースのテスト
// https://api.rakuten.net/navitimejapan-navitimejapan/api/navitime-reachable/endpoints
export const checkFromNavitimeReachableTrigger = functions.https.onRequest(async (request, response) => {

    // required authentication （get api key）
    // https://developers.google.com/maps/documentation/distance-matrix/get-api-key?hl=ja
    // FYI: キーの環境変数への設定
    // firebase functions:config:set how-long-tokyo.key=dummykeystring
    // firebase functions:config:get
    // local emulator から functions.config() では呼び出せないので firebase functions:config:get > .runtimeconfig.json として入れておく ref: https://stackoverflow.com/questions/54689871/set-firebase-local-emulator-cloud-function-environment-config-values


    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });

    var unirest = require("unirest");

    var req = unirest("GET", "https://navitime-reachable.p.rapidapi.com/reachable_transit");

    req.query({
        "term_from": "0",
        "offset": "0",
        "limit": "5",
        "transit_limit": "0",
        "coord_unit": "degree",
        "datum": "wgs84",
        "walk_speed": "5",
        "start": "35.7105656,139.6856175",
        "term": "120"
    });

    const apiKey = functions.config()['how-long-tokyo'].navitime_key;

    req.headers({
        "x-rapidapi-host": "navitime-reachable.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
        "useQueryString": true
    });


    await req.end(function (res: any) {
        if (res.error) throw new Error(res.error);

        const body = res.body;

        console.log(body);

        response.send(body)
    });

});


// TODO import は本来はコマンドラインからやりたいが、一時的にhttp経由で叩く
export const importTrigger = functions.https.onRequest(async (request, response) => {
    await importData();
});


export const importData = async () => {
    // 乗り入れ路線の多いランキングより
    // https://blog.ieagent.jp/eria/rosengaooieki-292768
//    const destinations = [
//        '新宿駅', '東京駅', '渋谷駅', '池袋駅', '上野駅', '新橋駅', '日暮里駅', '飯田橋駅', '品川駅', '四ツ谷駅', '市ヶ谷駅', '北千住駅', '秋葉原', '御徒町', '神田駅', '大手町', '永田町', '代々木', '御茶ノ水', '荻窪駅', '赤羽駅'
//    ];
    const destinations = [
        '新宿駅', '東京駅'
    ];

    // 他の県も含めてすべての駅がありそうなサイト　https://townphoto.net/rosen-tokyo.html
    // まずは一部抜粋
    const origins = [
        '上野'
        , '日暮里'
        , '三河島'
        /*
                , '南千住'
                , '北千住'
                , '綾瀬'
                , '亀有'
                , '金町'
        */
    ];


    admin.initializeApp({
        credential: admin.credential.applicationDefault(),
    });
    const db = admin.firestore();
    const docRef = db.collection('routes').doc('originToDestination');

    /*
    * TODO google maps platform api を調べて使ってみる
    *  TODO 値段など確認
    *  https://developers.google.com/maps/documentation/?hl=ja&_ga=2.218392921.1920703913.1597555830-907448181.1596366261&_gac=1.224011753.1597555852.CjwKCAjwj975BRBUEiwA4whRB5LaF2XMp4-hu0wAvMMH_89NVlv6v4Pk-1dLY8vCxsnqMk6NwsHUzBoCMBgQAvD_BwE

    * */

    db.runTransaction(async (t) => {
        // store 初期化処理
        await t.set(docRef, {});

        for (const orig of origins) {
            for await (const dest of destinations) {
                t.set(docRef, {
                        route: {
                            [orig]: {
                                [dest]: 10
                            }
                        }
                    }
                    , {merge: true});
            }
        }
    }).catch((err) => {
        console.log('Transaction failure:', err);
    });
};
