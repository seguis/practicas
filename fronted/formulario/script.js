document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("acreditacionForm");

    // Funcion auxiliar para mostrar errores
    const showError = (inputId, mensaje) => {
        const errorSpan = document.getElementById(`error-${inputId}`);
        const inputField = document.getElementById(inputId);
        errorSpan.textContent = mensaje;
        inputField.style.borderColor = "var(--color-error)";
    };

    // Funcion para limpiar errores
    const clearError = (inputId) => {
        const errorSpan = document.getElementById(`error-${inputId}`);
        const inputField = document.getElementById(inputId);
        errorSpan.textContent = "";
        inputField.style.borderColor = "#ccc"; // Vuelve al color original
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
        
        // Formula: el resto de dividir entre 23 nos da la posicion de la letra correcta
        const letraCalculada = validChars.charAt(numero % 23);

        return letraUsuario === letraCalculada;
    };

    // Validacion Email
    const validarEmailFormato = (email) => {
        // Regex de email: texto @ texto . texto
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Evento del formulario
    form.addEventListener("submit", (e) => {
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

        // Validar foto
        const fotoInput = document.getElementById("foto-file");
        if (!fotoInput.files || fotoInput.files.length === 0) {
            showError("foto", "Debes subir o tomar una foto.");
            formularioValido = false;
        } else {
            clearError("foto");
        }

        // Si pasa todos los test
        if (formularioValido) {
            console.log("Enviando al backend...");
            alert("Formulario validado correctamente");
        }
    });
});