// src/firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDMoQviyboqko5kL_kDVZkElxDnqoUhGpo", //
  authDomain: "pda-picking-almacen.firebaseapp.com",
  projectId: "pda-picking-almacen",
  storageBucket: "pda-picking-almacen.firebasestorage.app",
  messagingSenderId: "455830471394",
  appId: "1:455830471394:web:f20f4c5db05f8a4acc14bb",
  measurementId: "G-F3L8H17MPH"
};

// Iniciamos la conexión
const app = initializeApp(firebaseConfig);

// Exportamos la base de datos para usarla en la App
export const db = getFirestore(app);
