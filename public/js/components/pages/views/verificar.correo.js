$(document).ready(async function () {
    try {
        // 1. Verificar si ya existe un código o token activo al cargar la vista
        const codigo = await Solicitar_Token_Verificacion();
        console.log("Token actual:", codigo);

        // Si no hay un código activo, enviamos uno nuevo por correo de manera automática
        if (codigo) {
            await Enviar_Token_Correo();
        }
    } catch (error) {
        console.error("Error al inicializar el proceso de verificación:", error);
    }

    // 2. Inicializar los componentes de UI (PinInput y ResendTimer)
    window.PinInput.init({
        containerSelector: '#contenedor-inputs-codigo',
        cantidadDigitos: 6,
        buttonId: 'boton-confirmar-verificacion'
    });

    window.ResendTimer.init({
        buttonId: 'link-reenviar-codigo',
        minutos: 3, // Tiempo de espera para volver a enviar
        storageKey: 'verificacion_correo_timer' // Clave única en localStorage
    });

    // 3. Obtener el valor completo al hacer clic en confirmar
    $('#boton-confirmar-verificacion').on('click', function (e) {
        e.preventDefault();
        const codigoCompleto = window.PinInput.obtener();
        console.log("PIN ingresado:", codigoCompleto);

        Verificar_Codigo(codigoCompleto)
    });

    // 4. Evento cuando el temporizador permite reenviar el código
    $('#link-reenviar-codigo').on('enviarCodigo', async function () {
        console.log("Solicitando reenvío de código al servidor...");

        try {
            // Llamamos a tu función para que vuelva a descargar el token y enviar el correo
            const exito = await Enviar_Token_Correo();

            if (exito) {
                MostrarMensaje('Código reenviado exitosamente a tu correo.', true, false, false);
            }
        } catch (error) {
            console.error("Error al reenviar código:", error);
        }
    });
});