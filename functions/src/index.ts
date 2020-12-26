import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import DocumentData = admin.firestore.DocumentData;

admin.initializeApp();

const fireStore = admin.firestore();

// firestore declaration

class GoogleFormData {
  url: string;
  visitCount: number;
  count: number;

  constructor(url: string, visitCount?: number, totalCount?: number) {
    this.url = url;
    this.visitCount = visitCount ?? 0;
    this.count = totalCount ?? 0;
  }

  static toFirestore(modelObject: GoogleFormData): DocumentData {
    return JSON.parse(JSON.stringify(modelObject));
  }

  static fromFirestore(data: DocumentData): GoogleFormData {
    const url = data.url;
    const visitCount = data.visitCount;
    const count = data.count;
    return new GoogleFormData(url, visitCount, count)
  }


}

// Start writing Firebase Functions
// https://firebase.google.com/docs/functions/typescript

export const formMultiplexer = functions
  .region('asia-northeast1')
  .https
  .onRequest(async (request, response) => {
    const result = (await fireStore
      .collection("googleForms")
      .withConverter(GoogleFormData)
      .orderBy("count")
      .limit(1)
      .get());
    if (result.empty) {
      response.sendStatus(404);
      return;
    }
    const targetForm = result.docs[0]
    const data = targetForm.data()

    response.writeHead(307, {
      "Location": data.url
    })
    response.send();
    data.visitCount += 1;
    data.count += 1;
    await targetForm.ref.set(data)
  });
