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

    const docRef = db.collection('routes').doc('3yloNs7ywdkKAx3r2yIl');

    //  await docRef.set({
    //      first: 'Ada',
    //      last: 'Lovelace',
    //      born: 1815
    //  });

    const resData = await docRef.get();

    // functions.logger.info("Hello logs!", {structuredData: true});
    response.send(resData.get('route'));
});
