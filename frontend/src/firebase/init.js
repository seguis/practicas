import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, sendPasswordResetEmail, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { environment } from "../environments/environment.js";

// Inicializamos la App con la config del environment
const app = initializeApp(environment.firebaseConfig);

// Exportamos las herramientas de Auth para usarlas en el Login
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export { signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail, onAuthStateChanged };