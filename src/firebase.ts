import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
	apiKey: 'AIzaSyB2xI_0_yQXXWPm3i5tMI116gMrVitHnKY',
	authDomain: 'learnscape-749b3.firebaseapp.com',
	projectId: 'learnscape-749b3',
	storageBucket: 'learnscape-749b3.appspot.com',
	messagingSenderId: '426993204900',
	appId: '1:426993204900:web:b6be09c91e5a473ff3f031',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const storage = getStorage(app);
