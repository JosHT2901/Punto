$(document).ready(async function () {
    try {
        MostrarCargando('Obteniendo información...', false);

        const [listaUsuarios,informacion] = await Promise.all([
            window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', {
                accion: 'obtener_usuarios'
            }),
            window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', {
                accion: 'obtener_informacion_usuario_actual'
            })
        ]);

        window.usuarios = (listaUsuarios && Array.isArray(listaUsuarios.data)) ? listaUsuarios.data : [];
        window.informacion=informacion.data
        console.log(informacion)
        OcultarCargando();
        $(document).trigger('datosListos');

    } catch (error) {
        console.error("Error crítico al inicializar los datos:", error);

        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al cargar la información inicial.', false, false, false);
        }
    } 
});

async function Guardar_Edicion_Usuario_Actual(payload) {
    try {
        MostrarCargando('Guardando cambios...', false);

        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/usuarios.php', payload);

        OcultarCargando();
        console.log("Respuesta del servidor:", respuesta);

        // Verificamos si la respuesta fue exitosa (soporta .ok o .success)
        const esExitoso = (respuesta && (respuesta.ok || respuesta.success === true));

        if (esExitoso) {
            const dataRes = respuesta.data || {};
            const correoCambiado = dataRes.correo_cambiado === true;

            // Mensaje dinámico según si cambió el correo o no
            const mensajeExito = correoCambiado 
                ? 'Información de contacto actualizada. Se ha modificado tu correo electrónico.' 
                : 'Información guardada correctamente';

            MostrarMensaje(mensajeExito, true, false, false,320);
            
            setTimeout(() => {
                $.messenger.send(
                    window.parent,
                    'usuario_actualizado',
                    { 
                        status: 'success', 
                        mensaje: 'Proceso completado',
                        correo_cambiado: correoCambiado, // 💡 Enviamos el indicador explícito a parent
                        data: dataRes 
                    },
                    '*'
                );
            }, 1500);
            return;
        } else {
            const mensajeError = respuesta.message || (respuesta.error ? respuesta.error.message : null) || 'Error al guardar los datos';
            MostrarAlerta(mensajeError, 250, false);
        }

    } catch (error) {
        OcultarCargando();
        console.error("Error en la petición:", error);
        MostrarAlerta('Ocurrió un error de conexión', 250, false);
    }
}