import { auth, provider, signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from "../src/firebase/init.js";

document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const btnGoogle = document.getElementById("btn-google");
    const btnForgot = document.getElementById("forgot-password");

    const showError = (id, msg) => document.getElementById(`error-${id}`).textContent = msg;
    const clearErrors = () => document.querySelectorAll(".error-msg").forEach(el => el.textContent = "");

    // Validar Email Formato
    const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

    // Login Tradicional (Email + Pass)
    loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        clearErrors();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value.trim();
        let valid = true;

        if (!email) { showError("email", "El correo es obligatorio."); valid = false; }
        else if (!isValidEmail(email)) { showError("email", "Formato de correo inválido."); valid = false; }
        
        if (!password) { showError("password", "La contraseña es obligatoria."); valid = false; }

        if (!valid) return;

        try {
            // Llamada a Firebase
            await signInWithEmailAndPassword(auth, email, password);
            window.location.href = "../formulario/index.html"; // Redirigir al exito
        } catch (error) {
            showError("global", "Credenciales incorrectas o usuario inexistente.");
            console.error(error.message);
        }
    });

    // Login con Google
    btnGoogle.addEventListener("click", async () => {
        try {
            await signInWithPopup(auth, provider);
            window.location.href = "../formulario/index.html";
        } catch (error) {
            showError("global", "Error al iniciar sesión con Google.");
        }
    });

    // Recuperar Contraseña
    btnForgot.addEventListener("click", async (e) => {
        e.preventDefault();
        clearErrors();
        const email = document.getElementById("email").value.trim();

        if (!email || !isValidEmail(email)) {
            showError("email", "Introduce un correo válido arriba para recuperarla.");
            return;
        }

        try {
            await sendPasswordResetEmail(auth, email);
            alert("Te hemos enviado un enlace de recuperación a tu correo.");
        } catch (error) {
            showError("global", "Error al enviar el correo de recuperación.");
        }
    });
});