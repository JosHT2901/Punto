$(document).ready(async function () {
    try {
        await esperarDatosIniciales;
        console.log("###")
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Obteniendo información...', false);
        }

        // Preparamos las promesas base a ejecutar
        const promesasAjax = [
            window.AjaxService.enviar('../../../src/controllers/php/controllers/ajustes.php', {
                accion: 'obtener_variables'
            }),
            window.AjaxService.enviar('../../../src/controllers/php/controllers/impuestos.php', {
                accion: 'obtener_esquemas_fiscales'
            })
        ];

        // Si existe window.id_impuesto, agregamos la petición para obtener la información específica del impuesto
        if (window.id_impuesto !== undefined && window.id_impuesto !== null && window.id_impuesto !== '') {
            promesasAjax.push(
                window.AjaxService.enviar('../../../src/controllers/php/controllers/impuestos.php', {
                    accion: 'obtener_impuesto_por_id', // O la acción correspondiente en tu backend para consultar por ID
                    id: window.id_impuesto
                })
            );
        }

        // Ejecutamos las peticiones en paralelo
        const resultados = await Promise.all(promesasAjax);
        const variablesResponse = resultados[0];
        console.log(variablesResponse)
        const esquemasResponse = resultados[1];
        const impuestoResponse = resultados[2] || null; // Resultado opcional si se pidió por ID
        console.log(impuestoResponse)
        // 1. Procesar variables del sistema de forma segura
        const listaVariables = variablesResponse?.data.variables || variablesResponse || [];
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

        // 3. Si se consultó el impuesto específico por ID, lo almacenamos globalmente
        if (impuestoResponse) {
            window.impuestoActual = impuestoResponse?.data || impuestoResponse;
            console.log("Información del impuesto cargada:", window.impuestoActual);
        } 
        OcultarCargando();
        $(document).trigger('datosListos.gestionEsquemasFiscales');
       
    } catch (error) {
        console.error("Error crítico al inicializar los datos:", error);
        OcultarCargando();
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al cargar la información inicial.', false, false, false);
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
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/impuestos.php', datosEsquema);

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        // Verificamos éxito ya sea mediante respuesta.ok, respuesta.success o el formato JsonResponse estándar
        const esExitoso = respuesta && (respuesta.ok === true || respuesta.success === true || (respuesta.estado && respuesta.estado === 'exito'));

        if (esExitoso) {
            const mensajeExito = esEdicion 
                ? 'Esquema fiscal actualizado exitosamente.' 
                : 'Esquema fiscal guardado exitosamente.';

            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(mensajeExito, true, false);
            }

            // Disparar eventos para actualizar tablas o vistas dependientes
            $(document).trigger('esquemaGuardadoExitosamente');
            
            // Opcional: Redireccionar o limpiar tras guardar exitosamente
            setTimeout(() => {
                $.messenger.send(
                    window.parent,                        // Ventana padre
                    'esquema_impuestos',                         // Nombre de la acción
                    { status: 'success', mensaje: 'esquema_impuestos'},
                    '*'
                );
            }, 1200);

        } else {
            throw new Error(respuesta?.message || respuesta?.mensaje || 'No se pudo procesar la solicitud del esquema.');
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