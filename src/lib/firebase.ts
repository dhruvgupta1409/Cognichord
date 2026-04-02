import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyCzPi_B0x_YZVaZNjbHK54GiJO_ptXsQMw",
  authDomain: "cognichord-5945b.firebaseapp.com",
  databaseURL: "https://cognichord-5945b-default-rtdb.firebaseio.com",
  projectId: "cognichord-5945b",
  storageBucket: "cognichord-5945b.firebasestorage.app",
  messagingSenderId: "90226700285",
  appId: "1:90226700285:web:9ae7b425257ad8e87c7394"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
