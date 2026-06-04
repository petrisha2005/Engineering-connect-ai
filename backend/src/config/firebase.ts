import admin from "firebase-admin";
import { env } from "./env.js";

const privateKey = env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n");

export const firebaseAdmin =
  admin.apps.length > 0
    ? admin.app()
    : admin.initializeApp({
        credential: admin.credential.cert({
          projectId: env.FIREBASE_PROJECT_ID,
          clientEmail: env.FIREBASE_CLIENT_EMAIL,
          privateKey
        })
      });

export const firebaseAuth = firebaseAdmin.auth();

