// src/lib/firebase/admin.ts

import admin from "firebase-admin";

// Função para garantir que a chave privada esteja formatada corretamente
function getServiceAccount() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  let privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Faltam variáveis de ambiente do Firebase Admin.");
  }

  // Substitui os literais '\n' pela quebra de linha real
  privateKey = privateKey.replace(/\\n/g, "\n");

  return { projectId, clientEmail, privateKey };
}

// Inicializa o app do Firebase Admin apenas uma vez
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getServiceAccount()),
  });
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth(); // Já exportamos o auth também, pode ser útil
export default admin;