async function Guardar_Ticket_AJAX(payload) {
    try {
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Guardando configuración del ticket...', false);
        }

        // true = el cuerpo es FormData (lleva el archivo de fuente)
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/ajustes.php'
            ,payload, true);

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        if (respuesta && (respuesta.success || respuesta.ok)) {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(respuesta.mensaje || 'Configuración del ticket guardada correctamente.', true, false, false);
                setTimeout(() => {
                    ModalAPI.cerrar()
                }, 1000);
            }
        } else {
            if (typeof MostrarMensaje === 'function') {
                MostrarAlerta(respuesta?.mensaje || 'Error al guardar la configuración del ticket.', 320, false);
            }
        }
    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error('Error crítico al guardar la configuración del ticket:', error);
        if (typeof MostrarMensaje === 'function') {
            MostrarAlerta(error?.mensaje || 'Ocurrió un error inesperado en la red.', 320, false);
        }
    }
}


async function Obtener_Configuracion_Ticket() {
    try {
        const respuesta = await window.AjaxService.enviar(
            '../../../src/controllers/php/controllers/ajustes.php', 
            { accion: 'obtener_configuracion_ticket' }, 
            false
        );

        if (respuesta && (respuesta.ok || respuesta.success)) {
            return respuesta.data;
        } else {
            console.error("Error al obtener la configuración:", respuesta?.mensaje || 'Respuesta inválida');
            return null;
        }
    } catch (error) {
        console.error("Error crítico en la red al obtener la configuración del ticket:", error);
        return null;
    }
}