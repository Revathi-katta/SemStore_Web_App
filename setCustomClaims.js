// setCustomClaims.js
const admin = require('firebase-admin');

// Replace with path to your downloaded service account key from Firebase Console
const serviceAccount = require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uid = '3BGSRnw7E3c51DvmKd7uQUtHVxS2'; // replace with the actual UID

admin.auth().setCustomUserClaims(uid, { role: 'contributor' })
  .then(() => {
    console.log('Custom claims set successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error setting custom claims:', error);
    process.exit(1);
  });
