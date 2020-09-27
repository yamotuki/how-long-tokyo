import * as functions from 'firebase-functions';
import * as admin from "firebase-admin";

// required authentication （get api key）
// https://developers.google.com/maps/documentation/distance-matrix/get-api-key?hl=ja
// FYI: キーの環境変数への設定
// firebase functions:config:set how-long-tokyo.key=dummykeystring
// firebase functions:config:get
// local emulator から functions.config() では呼び出せないので firebase functions:config:get > .runtimeconfig.json として入れておく ref: https://stackoverflow.com/questions/54689871/set-firebase-local-emulator-cloud-function-environment-config-values
export const showReachableTrigger = functions.region('asia-northeast1').https.onRequest(async (request, response) => {
    const inputForStart = request.query.start as string;
    if (!inputForStart) {
        throw new Error('開始駅の名前が必要です');
    }

    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.applicationDefault(),
        });
    }

    const db = admin.firestore();
    const docRef = db.collection('coord').doc('point');
    const resData = await docRef.get();
    if (!resData.get(inputForStart)) {
        throw new Error('開始駅の名前が正しくありません');
    }
    const startCoord = resData.get(inputForStart).coord;
    // const startNodeId = resData.get(inputForStart).id;


    // すでに取得したことがあれば firestore から取得
    // TODO: 結果をCDNなど通してキャッシュする。firestoreから取るより安いし早いはず
    const timeToArriveDoc = db.collection('timeToArrive').doc('station');

    const dataFromFirestore = await timeToArriveDoc.get();
    const resultFromFirestore = dataFromFirestore.get(inputForStart)
    if (resultFromFirestore) {
        console.log('response with firestore data');
        response.send(resultFromFirestore);
        return
    }

    const unirest = require("unirest");
    const req = unirest("GET", "https://navitime-reachable.p.rapidapi.com/reachable_transit");
    req.query({
        "term_from": "2" /* 最短時間設定。0だと駅近から検索するとその駅もマッチしてしまうので排除 */,
        "offset": "0",
        "options": "node_detail" /* ノード詳細表示？ */,
        "limit": "1000" /* 表示件数。max2000 */,
        "transit_limit": "5" /* 乗り換え関数上限 */,
        "coord_unit": "degree",
        "datum": "wgs84",
        "walk_speed": "4" /* 歩く速度km/h。デフォルト5だが4にしている*/,
        "start": startCoord._latitude + ',' + startCoord._longitude /* 出発地 */,
        "term": "120" /* 2時間で行ける距離。最大3時間 */
    });
    const apiKey = functions.config()['how-long-tokyo'].navitime_key;
    req.headers({
        "x-rapidapi-host": "navitime-reachable.p.rapidapi.com",
        "x-rapidapi-key": apiKey,
        "useQueryString": true
    });

    await req.end(async (res: any) => {
        if (res.error) throw new Error(res.error);

        const items = res.body.items;

        let index = 0;
        let batch = db.batch();
        for (const itemForStore of items) {
            if (index > 0 && (index) % 500 === 0) {
                await batch.commit();
                batch = db.batch();
            }
            index++;

            batch.set(timeToArriveDoc, {
                    [inputForStart]: arrangeTimeToArriveItem(itemForStore)
                }
                , {merge: true}
            );
        }
        await batch.commit();

        // もうちょっとスマートな変換ありそう。あとで考える。
        const formattedArray = items.map((itemForResponse: reachableApiResponseItem) => {
            return arrangeTimeToArriveItem(itemForResponse);
        });
        const formattedObject = formattedArray.reduce((result: any, current: any) => {
            const key = Object.keys(current)[0];
            result[key] = current[key];
            return result;
        }, {});


        console.log('response from reachable api response')
        response.send(formattedObject);
        return
    });
});

type coordType = {
    "lat": number,
    "lon": number
}

interface reachableApiResponseItem {
    "time": number,
    "coord": coordType,
    "name": string,
    "node_id": string,
    "transit_count": string
}

const arrangeTimeToArriveItem = (item: reachableApiResponseItem) => {
    return {
        [item.name]:
            {
                time: item.time,
                transit_count: item.transit_count,
                coord: item.coord
            }
    }
}

// 駅の座標情報のimport
// export const importCoordTrigger = functions.https.onRequest(async (request, response) => {
//     await importCoordData(response);
// });

// export const importCoordData = async (response: any) => {
//     // 乗り入れ路線の多いランキングより
//     // https://blog.ieagent.jp/eria/rosengaooieki-292768
// //    const destinations = [
// //        '新宿駅', '東京駅', '渋谷駅', '池袋駅', '上野駅', '新橋駅', '日暮里駅', '飯田橋駅', '品川駅', '四ツ谷駅', '市ヶ谷駅', '北千住駅', '秋葉原', '御徒町', '神田駅', '大手町', '永田町', '代々木', '御茶ノ水', '荻窪駅', '赤羽駅'
// //    ];
//
//     // 他の県も含めてすべての駅がありそうなサイト　https://townphoto.net/rosen-tokyo.html
//
//     admin.initializeApp({
//         credential: admin.credential.applicationDefault(),
//     });
//     const db = admin.firestore();
//     const docRef = db.collection('coord').doc('point');
//
//     await docRef.set({});
//
//     let index = 0;
//     let batch = db.batch();
//     このtempOutput は nodeList.ts に一時的に保管しました。
//     for (const node of tempOutput.items) {
//         if (index > 0 && (index) % 500 === 0) {
//             await batch.commit();
//             batch = db.batch();
//         }
//         index++;
//
//         batch.set(docRef, {
//                 [node.name]: {
//                     id: node.node_id,
//                     coord: new admin.firestore.GeoPoint(
//                         node.coord.lat,
//                         node.coord.lon
//                     )
//                 }
//             }
//             , {merge: true}
//         );
//     }
//
//     await batch.commit();
//
//     response.send('ok');
// };

// const destinations = ['新宿駅', '東京駅', '渋谷駅', '池袋駅', '上野駅', '新橋駅', '日暮里駅', '飯田橋駅', '品川駅', '四ツ谷駅', '市ヶ谷駅', '北千住駅', '秋葉原駅', '御徒町駅', '神田駅', '大手町駅', '永田町駅', '代々木駅', '御茶ノ水駅', '荻窪駅', '赤羽駅'];
