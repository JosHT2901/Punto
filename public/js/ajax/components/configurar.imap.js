$(document).ready(async function () {
    try {
        MostrarCargando('Obteniendo información...', false);

        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/ajustes.php', {
            accion: 'obtener_ajustes_imap'
        });

        OcultarCargando();

        const imap = respuesta.data || respuesta || {};

        // Guardamos de forma global en caché
        window.configuracion = imap;

        // Disparamos el evento para IMAP
        $(document).trigger('datosListos.imap');

    } catch (error) {
        OcultarCargando();
        console.error("Error crítico al inicializar los datos:", error);

        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al cargar la información inicial.', false, false, false);
        }
    }
});

async function Guardar_Configuracion_IMAP(payload) {
    try {
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Guardando configuración IMAP...', false);
        }

        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/ajustes.php', payload);
        console.log(respuesta);

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        if (respuesta && (respuesta.ok || respuesta.success)) {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje('Configuración IMAP guardada correctamente.', true, false, false);
            }
            
            // Actualizar caché global
            window.configuracion = payload;

            // Notificar a la ventana padre mediante el messenger de iframes
            setTimeout(() => {
                if (window.parent && $.messenger && typeof $.messenger.send === 'function') {
                    $.messenger.send(
                        window.parent,
                        'configuracion_imap_actualizada',
                        { status: 'success', mensaje: 'Proceso completado'},
                        '*'
                    );
                }
                ModalAPI.cerrar();
            }, 1000);

        } else {
            const mensajeError = (respuesta && (respuesta.mensaje || respuesta.error)) || 'No se pudo guardar la configuración.';
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(mensajeError, false, false, false);
            } else if (typeof MostrarAlerta === 'function') {
                MostrarAlerta(mensajeError, 250, false);
            } else {
                alert(mensajeError);
            }
        }

    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error crítico al guardar IMAP:", error);
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error de red al intentar guardar la configuración.', false, false, false);
        }
    }
}