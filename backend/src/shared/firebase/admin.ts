import admin from 'firebase-admin';
import { getStorage } from 'firebase-admin/storage';
import { env } from '../../config/env.js';

let app: admin.app.App;

if (!admin.apps.length) {
  const isEmulator = Boolean(
    env.FIRESTORE_EMULATOR_HOST ||
    env.FIREBASE_AUTH_EMULATOR_HOST ||
    env.FIREBASE_STORAGE_EMULATOR_HOST
  );

  if (env.FIREBASE_STORAGE_EMULATOR_HOST) {
    process.env.FIREBASE_STORAGE_EMULATOR_HOST = env.FIREBASE_STORAGE_EMULATOR_HOST;
  }

  if (isEmulator) {
    console.log('🔧 Firebase Admin inicializado em MODO EMULADOR');
    console.log(`   - Firestore: ${env.FIRESTORE_EMULATOR_HOST || 'local'}`);
    console.log(`   - Auth: ${env.FIREBASE_AUTH_EMULATOR_HOST || 'local'}`);
    console.log(`   - Storage: ${env.FIREBASE_STORAGE_EMULATOR_HOST || 'local'}`);
    console.log(`   - Bucket: ${env.FIREBASE_STORAGE_BUCKET}`);

    app = admin.initializeApp({
      projectId: env.FIREBASE_PROJECT_ID,
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
    });
  } else {
    console.log('☁️ Firebase Admin inicializado em MODO NUVEM (PRODUÇÃO)');
    app = admin.initializeApp({
      projectId: env.FIREBASE_PROJECT_ID,
      storageBucket: env.FIREBASE_STORAGE_BUCKET,
    });
  }
} else {
  app = admin.app();
}

export const auth = admin.auth(app);
export const firestore = admin.firestore(app);
export const storage = getStorage(app);
export const bucket = storage.bucket(env.FIREBASE_STORAGE_BUCKET);
export const firebaseAdmin = admin;
