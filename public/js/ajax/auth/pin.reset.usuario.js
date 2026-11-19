async function Guardar_Reset_Pin(payload) {
    try {
        MostrarCargando("Actualizando PIN...", false);

        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', payload);

        OcultarCargando();

        if (respuesta && respuesta.ok) {
            MostrarMensaje(respuesta.mensaje || "PIN actualizado exitosamente.", true, false, false);
            
            setTimeout(() => {
                $.messenger.send(
                    window.parent,
                    'pin_actualizado',
                    { status: 'success', mensaje: 'Proceso completado'},
                    '*'
                );
            }, 1500);
            return;
        }

        const mensajeAviso = respuesta?.mensaje || "No se pudo actualizar el PIN.";
        MostrarAlerta(mensajeAviso, 250, true);

    } catch (error) {
        console.error("Error al actualizar el PIN:", error);
        OcultarCargando();
        const mensajeError = error?.mensaje || error?.responseText || "Ocurrió un error en el servidor.";
        MostrarAlerta(mensajeError, 250, true);
    }
}