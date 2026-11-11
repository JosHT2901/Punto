$(document).ready(async function () {
    try {
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Obteniendo información...', false);
        }

        // Cargamos en paralelo el archivo JSON de monedas y la petición AJAX de ajustes
        const [monedasResponse, variablesResponse] = await Promise.all([
            CargarJSON('../../../src/json/data/moneda.json'),
            window.AjaxService.enviar('../../../src/controllers/php/controllers/ajustes.php', {
                accion: 'obtener_variables'
            })
        ]);

        window.monedas = monedasResponse;
        
        // La estructura de la respuesta es { variables: Array(...), total: ... }
        // Verificamos de forma segura si viene en .variables, .data o directamente en la respuesta
        const contenedorDatos = variablesResponse?.variables ? variablesResponse : (variablesResponse?.data || variablesResponse);
        const listaVariables = Array.isArray(contenedorDatos?.variables) 
            ? contenedorDatos.variables 
            : (Array.isArray(contenedorDatos) ? contenedorDatos : [contenedorDatos]);

        window.variables = listaVariables;
        window.variablesMap = {};
        console.log("Variables cargadas:", window.variables);

        listaVariables.forEach(item => {
            if (item && item.v_clave) {
                window.variablesMap[item.v_clave] = item.v_valor;
            }
        });

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        // Disparamos un evento personalizado opcional por si otros scripts escuchan cuando los datos estén listos
        $(document).trigger('datosListos.gestionVariables');

    } catch (error) {
        console.error("Error crítico al inicializar los datos:", error);
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al cargar la información inicial.', false, false, false);
        }
    }
});

async function Guardar_Gestion_Variables(data) {
    // Estructuramos los datos a enviar asegurando las propiedades correctas
    const datosVariables = {
        accion: 'guardar_variables',
        simbolo_moneda: data.simbolo_moneda || data.simbolo,
        codigo_iso: data.codigo_iso || data.codigo,
        redondear_precios: data.redondear_precios,
        bloquear_stock_cero: data.bloquear_stock_cero
    };

    try {
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Guardando variables...', false);
        }

        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/ajustes.php', datosVariables);

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        // Verificamos tanto 'success' como 'ok' por compatibilidad con JsonResponse
        if (respuesta && (respuesta.success || respuesta.ok)) {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje('Variables actualizadas correctamente.', true, false, false);
            }
            
            // Actualizamos el mapa global en memoria para reflejar los cambios de inmediato
            window.variablesMap['simbolo_moneda'] = datosVariables.simbolo_moneda;
            window.variablesMap['codigo_iso'] = datosVariables.codigo_iso;
            window.variablesMap['redondear_precios'] = datosVariables.redondear_precios;
            window.variablesMap['bloquear_stock_cero'] = datosVariables.bloquear_stock_cero;

            // Cerramos el modal únicamente si la operación fue exitosa
            setTimeout(() => {
                if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                }
            }, 1000);
        } else {
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(respuesta?.mensaje || 'Error al guardar las variables.', false, false, false);
            }
        }
    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error crítico al guardar:", error);
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado en la red.', false, false, false);
        }
    }
}