// ============================================================
// FIREBASE CONFIGURATION
// ============================================================
// SETUP STEPS:
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (e.g., "manish-portfolio")
// 3. Enable Firestore Database (Start in test mode)
// 4. Enable Authentication > Sign-in method > Email/Password
// 5. Go to Project Settings > General > Your apps > Add Web App
// 6. Copy your config values below
// 7. In Authentication > Users > Add user (your admin email + password)
// 8. In Firestore > Rules, paste the rules from SETUP.md
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyBHDfGfoTRd5-SwmeETAwDtAVnL0Imi-Pk",
  authDomain: "firstproject-2946a.firebaseapp.com",
  projectId: "firstproject-2946a",
  storageBucket: "firstproject-2946a.firebasestorage.app",
  messagingSenderId: "200908325234",
  appId: "1:200908325234:web:d8bbd162050346eeac1deb"
};

// Initialize Firebase (only if not already initialized)
if (!firebase.apps || !firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

const auth = firebase.auth();
const db = typeof firebase.firestore === "function" ? firebase.firestore() : null;
