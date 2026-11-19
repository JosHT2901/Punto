$(document).off('app:inicializada').on('app:inicializada', async function () {
    if (typeof MostrarCargando === 'function') {
        MostrarCargando('Obteniendo información...', false);
    }

    // Aseguramos un respaldo limpio en la variable global
    window.ListaSucursales = window.ListaSucursales || [];

    try {
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/sucursales.php', {
            accion: 'obtener_sucursales'
        });

        if (respuesta && (respuesta.ok || respuesta.success === true)) {
            const datos = respuesta.data || respuesta.datos || [];
            
            // Asignamos el arreglo de sucursales a las variables globales
            window.ListaSucursales = Array.isArray(datos) ? datos : (datos.sucursales || []);
            window.sucursales = window.ListaSucursales; // Compatibilidad por si otro script usa window.sucursales
            $(document).trigger('datosListos.preferencias');
        }
    } catch (err) {
        console.error("Error al obtener las sucursales:", err);
            OcultarCargando();
            MostrarMensaje('Ocurrió un error al obtener la información', false, false, false);
        
    }

    // Disparamos el evento correcto pasando la lista de sucursales
    $(document).trigger('datosListos.sucursales', [window.ListaSucursales]);
});

async function Guardar_Preferencias(datosPreferencias)
{
    if (typeof MostrarCargando === 'function') {
        MostrarCargando('Guardando preferencias...', false);
    }

    try {
        // 4. Enviar al controlador PHP
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/preferencias.php', {
            accion: 'guardar_preferencias_usuario',
            preferencias: datosPreferencias
        });

        OcultarCargando()
        if (respuesta && respuesta.ok) {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje('Preferencias guardadas correctamente', true, false, false);
                setTimeout(() => {
                    ModalAPI.cerrar()
                    window.location.reload()
                }, 1000);
            }

        } else {
            const mensajeError = respuesta?.mensaje || respuesta?.error || 'No se pudieron guardar las preferencias.';
                MostrarAlerta(mensajeError, 300, false);
           
        }

    } catch (error) {
        console.error("Error al guardar preferencias:", error);
        OcultarCargando()
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al guardar.', false, false, false);
        }
    } 
}