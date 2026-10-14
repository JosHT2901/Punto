$(document).ready(async function () {
    try {
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Obteniendo información...', false);
        }

        // Cargamos en paralelo las variables del sistema y los esquemas fiscales
        const [variablesResponse, esquemasResponse] = await Promise.all([
            ajaxConParametros('../../../src/controllers/php/controllers/ajustes.php', {
                accion: 'obtener_variables'
            }),
            ajaxConParametros('../../../src/controllers/php/controllers/impuestos.php', {
                accion: 'obtener_esquemas_fiscales'
            })
        ]);

        // 1. Procesar variables del sistema de forma segura
        const listaVariables = variablesResponse?.data || variablesResponse || [];
        window.variables = listaVariables;
        window.variablesMap = {};

        if (Array.isArray(listaVariables)) {
            listaVariables.forEach(item => {
                if (item.v_clave) {
                    window.variablesMap[item.v_clave] = item.v_valor;
                }
            });
        }

        // 2. Procesar esquemas fiscales
        window.esquemas = esquemasResponse?.data || esquemasResponse || [];
        window.esquemasFiscales = true; // Activa la bandera para inicializadores dependientes

        // Disparar eventos de datos listos
        $(document).trigger('datosListos');
        $(document).trigger('datosListos.gestionEsquemasFiscales');

    } catch (error) {
        console.error("Error crítico al inicializar los datos:", error);

        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al cargar la información inicial.', false, false, false);
        }
    } finally {
        // Garantizamos que el cargador siempre se oculte
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
    }
});

// ==========================================
// FUNCIÓN CENTRALIZADA DE GUARDADO / EDICIÓN
// ==========================================
async function Guardar_Gestion_Esquema_Impuesto(datosEsquema) {
    try {
        const esEdicion = datosEsquema.accion === 'actualizar_esquema_fiscal';
        
        if (typeof MostrarCargando === 'function') {
            MostrarCargando(esEdicion ? 'Actualizando esquema fiscal...' : 'Guardando esquema fiscal...', false);
        }

        // Realizar la petición AJAX al controlador correspondiente
        const respuesta = await ajaxConParametros('../../../src/controllers/php/controllers/impuestos.php', datosEsquema);

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        if (respuesta && respuesta.ok) {
            const mensajeExito = esEdicion 
                ? 'Esquema fiscal actualizado exitosamente.' 
                : 'Esquema fiscal guardado exitosamente.';

            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(mensajeExito, true,false);
            }

            // Disparar eventos para actualizar tablas o vistas dependientes
            $(document).trigger('esquemaGuardadoExitosamente');
            
            // Opcional: Cerrar modal si existe función global de cierre
            // if (typeof CerrarModalEsquema === 'function') CerrarModalEsquema();

        } else {
            throw new Error(respuesta?.message || 'No se pudo procesar la solicitud del esquema.');
        }

    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error al procesar esquema:", error);
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje(error.message || 'Ocurrió un error al procesar la solicitud.', false, true, false);
        }
    }
}