// Importar autenticacion
import { auth } from "../src/firebase/init.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getStorage, ref, uploadString, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Revisar si existe alguien conectado
onAuthStateChanged(auth, (user) => {
    if (!user) {
        // Sino forzar al login
        window.location.href = "../login/index.html";
    }
});

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("acreditacionForm");

    // Funcion para cerrar sesion
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) {
        btnLogout.addEventListener("click", async () => {
            try {
                await signOut(auth);
                // El onAuthStateChanged que ya tienes programado detectará que no hay usuario 
                // y lo enviará automáticamente de vuelta al login. ¡Magia!
            } catch (error) {
                console.error("Error al cerrar sesión:", error);
                alert("Hubo un problema al cerrar la sesión.");
            }
        });
    }

    // Funcion para mostrar errores
    const showError = (inputId, mensaje) => {
        const errorSpan = document.getElementById(`error-${inputId}`);
        const inputField = document.getElementById(inputId);
        
        if (errorSpan) errorSpan.textContent = mensaje;
        
        // Solo se pinta el borde si el input existe realmente
        if (inputField) {
            inputField.style.borderColor = "var(--color-error)";
        }
    };

    // Funcion para limpiar errores
    const clearError = (inputId) => {
        const errorSpan = document.getElementById(`error-${inputId}`);
        const inputField = document.getElementById(inputId);
        errorSpan.textContent = "";
        //inputField.style.borderColor = "#ccc"; // Vuelve al color original
    };

    // Funcion apagar camara en cualquier navegador
    const stopCamera = () => {
        if (stream) {
            video.pause();
            stream.getTracks().forEach(track => track.stop());
            video.srcObject = null;
            stream = null; //Limpiar la memoria
        }
    };

    // Validar DNI / NIE en España
    const validarDNINIE = (valor) => {
        const validChars = 'TRWAGMYFPDXBNJZSQVHLCKE';
        const str = valor.trim().toUpperCase();

        // Expresiones regulares
        const nifRegex = /^[0-9]{8}[A-Z]$/i;
        const nieRegex = /^[XYZ][0-9]{7}[A-Z]$/i;

        if (!nifRegex.test(str) && !nieRegex.test(str)) {
            return false; // No cumple ni la forma visual
        }

        // Letra inicial en mayuscula
        const numeroTratado = str
            .replace(/^X/, '0')
            .replace(/^Y/, '1')
            .replace(/^Z/, '2');

        const letraUsuario = str.slice(-1); // Ultimo caracter
        const numero = parseInt(numeroTratado.slice(0, 8), 10);

        // Formula: el resto de dividir entre 23 da la posicion de la letra correcta
        const letraCalculada = validChars.charAt(numero % 23);

        return letraUsuario === letraCalculada;
    };

    // Validacion Email
    const validarEmailFormato = (email) => {
        // Regex de email: texto @ texto . texto
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // --- USAR LA CAMARA E IMAGEN ---
    const btnCamera = document.getElementById("btn-camera");
    const cameraContainer = document.getElementById("camera-container");
    const video = document.getElementById("webcam-video");
    const btnCapture = document.getElementById("btn-capture");
    const canvas = document.getElementById("photo-canvas");
    const ctx = canvas.getContext("2d");
    const fotoFile = document.getElementById("foto-file");

    let stream = null; // Para guardar la conexion de la cámara

    // Encender la webcam
    btnCamera.addEventListener("click", async () => {
        try {
            // Permiso para usar la cámara
            stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            video.srcObject = stream;
            cameraContainer.style.display = "block"; // Mostrar el video
            canvas.style.display = "none"; // Ocultar foto anterior si la habia
            fotoFile.value = ""; // Limpiar input de archivo por si habia algo
        } catch (err) {
            alert("Error al acceder a la camara. Asegurate de dar permisos.");
            console.error(err);
        }
    });

    // Capturar la foto de la webcam
    btnCapture.addEventListener("click", () => {
        if (!stream) return;

        // Pintar fotograma en el lienzo de 121x98
        ctx.drawImage(video, 0, 0, 121, 98);

        // Apagar camara
        stopCamera();

        cameraContainer.style.display = "none";
        canvas.style.display = "block"; // Mostrar resultado
    });

    // Subir archivo desde el ordenador
    fotoFile.addEventListener("change", (e) => {
        const file = e.target.files;
        if (!file) return;

        // Si es desde el ordenador apagar camara
        stopCamera();
        cameraContainer.style.display = "none";

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                ctx.drawImage(img, 0, 0, 121, 98);
                canvas.style.display = "block";
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Evento del formulario
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        let formularioValido = true;

        // Validar Nombre
        const nombre = document.getElementById("nombre").value.trim();
        if (!nombre) {
            showError("nombre", "El nombre no puede estar vacio.");
            formularioValido = false;
        } else {
            clearError("nombre");
        }

        // Validar Apellidos
        const apellidos = document.getElementById("apellidos").value.trim();
        if (!apellidos) {
            showError("apellidos", "Los apellidos no pueden estar vacios.");
            formularioValido = false;
        } else {
            clearError("apellidos");
        }

        // Validar DNI / NIE
        const dni = document.getElementById("dni").value.trim();
        if (!dni) {
            showError("dni", "El DNI/NIE es obligatorio.");
            formularioValido = false;
        } else if (!validarDNINIE(dni)) {
            showError("dni", "El formato o la letra del DNI/NIE no son validos.");
            formularioValido = false;
        } else {
            clearError("dni");
        }

        // Validar Email
        const email = document.getElementById("email").value.trim();
        if (!email) {
            showError("email", "El correo es obligatorio.");
            formularioValido = false;
        } else if (!validarEmailFormato(email)) {
            showError("email", "Introduce un formato de correo valido (ej: correo@proveedor.dominio).");
            formularioValido = false;
        } else {
            clearError("email");
        }

        // Validar Confirmación de Email
        const emailConfirm = document.getElementById("email-confirm").value.trim();
        if (!emailConfirm) {
            showError("email-confirm", "Debes confirmar tu correo.");
            formularioValido = false;
        } else if (email !== emailConfirm) {
            showError("email-confirm", "Los correos electronicos no coinciden.");
            formularioValido = false;
        } else {
            clearError("email-confirm");
        }

        // Validar Empresa
        const empresa = document.getElementById("empresa").value.trim();
        if (!empresa) {
            showError("empresa", "El campo empresa es obligatorio.");
            formularioValido = false;
        } else {
            clearError("empresa");
        }
        //Fecha de evento
        const fechaInput = document.getElementById("fecha");
        const fechaSeleccionada = fechaInput.value;
        const fechasPermitidas = ["2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18"];
        
        if (!fechaSeleccionada) {
            showError("fecha", "Por favor, elige una fecha.");
            formularioValido = false;
        } else if (!fechasPermitidas.includes(fechaSeleccionada)) {
            showError("fecha", "Selecciona un día entre el 15 y el 18 de junio.");
            formularioValido = false;
        } else {
            clearError("fecha");
        }

        // Validar foto
        if (canvas.style.display !== "block") {
            showError("foto", "Debes subir un archivo o tomar una foto con la cámara.");
            formularioValido = false;
        } else {
            clearError("foto");
        }

        // Si formulario es valido
        if (formularioValido) {
            const btnSubmit = form.querySelector("button[type='submit']");
            btnSubmit.disabled = true;
            btnSubmit.textContent = "Guardando...";

            try {
                // Obtener Token
                const idToken = await auth.currentUser.getIdToken();

                // Subir la foto a Firebase Storage
                const storage = getStorage();
                const fileName = `fotos/${Date.now()}-${auth.currentUser.uid}.png`;
                const storageRef = ref(storage, fileName);
                
                // Extraer la imagen del canvas
                const imageData = canvas.toDataURL("image/png");
                
                // Subir y obtener la URL pública
                const snapshot = await uploadString(storageRef, imageData, 'data_url');
                const photoUrl = await getDownloadURL(snapshot.ref);

                // Empaquetar los datos
                const datosAcreditado = {
                    nombre: document.getElementById("nombre").value.trim(),
                    apellidos: document.getElementById("apellidos").value.trim(),
                    email: document.getElementById("email").value.trim(),
                    dni: document.getElementById("dni").value.trim(),
                    empresa: document.getElementById("empresa").value.trim(),
                    foto: photoUrl,
                    fecha: document.getElementById("fecha").value
                };

                // Enviar al backend
                const response = await fetch("http://localhost:8080/acreditados", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${idToken}` 
                    },
                    body: JSON.stringify(datosAcreditado)
                });
                if (response.status === 409) {
                    const errorData = await response.json();
                    showError("fecha", errorData.message); 
                    alert(errorData.message);
                    return; 
                }

                if (response.ok) {
                    const resultado = await response.json();
                    alert(`Perfecto, datos guardados con id: ${resultado.id}`);
                    form.reset();
                    ctx.clearRect(0, 0, canvas.width, canvas.height); // Limpiar el lienzo
                    canvas.style.display = "none";
                } else {
                    const errorText = await response.text();
                    throw new Error(errorText);
                }
            } catch (error) {
                console.error("Error al guardar:", error);
                alert("Hubo un problema al enviar los datos: " + error.message);
            } finally {
                btnSubmit.disabled = false;
                btnSubmit.textContent = "Enviar Solicitud";
            }
        }
    });
});