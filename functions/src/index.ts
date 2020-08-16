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

    db.runTransaction(async (t) => {
        // store 初期化処理
        await t.set(docRef, {});

        for (const orig of origins) {
            for await (const dest of destinations) {
                t.set(docRef, {
                    [orig]: {
                        [dest]: 10
                    }
                }, {merge: true});
            }
        }
    }).catch((err) => {
        console.log('Transaction failure:', err);
    });
};


/*
{
  "落合": {
    "大手町": 20,
    "日本橋": 15
  },
  "王子": {
    "大手町": 30,
    "日本橋": 25
  }
}
* */
