/* =============================================
    SERVICIO DE SINCRONIZACIÓN Y CIFRADO DE URL (Genérico)
============================================= */
window.UrlStateSyncService = (() => {

    /**
     * Lee el parámetro 'q' cifrado de la URL, lo descifra y devuelve 
     * el objeto con los parámetros planos almacenados.
     * 
     * @returns {Object|null} - Objeto con los parámetros descifrados o null si no existen/fallan.
     */
    const obtenerParametros = () => {
        try {
            const urlActual = new URL(window.location.href);
            const paramCifrado = urlActual.searchParams.get('q');

            if (!paramCifrado || typeof Descifrar_Payload !== 'function') {
                return null;
            }

            const jsonPlano = Descifrar_Payload(paramCifrado);
            if (!jsonPlano) return null;

            return JSON.parse(jsonPlano);
        } catch (e) {
            console.error("Error al obtener los parámetros desde la URL:", e);
            return null;
        }
    };

    /**
     * Lee el parámetro 'q' cifrado de la URL, lo descifra y ejecuta 
     * una función de callback personalizada para que cada módulo hidrate sus propios inputs y variables.
     * 
     * @param {Function} callbackHidratacion - Función que recibe el objeto con los parámetros descifrados para que el módulo los procese.
     * @returns {Object|null} - Los parámetros descifrados o null si no existen.
     */
    const sincronizarUrlAInputs = (callbackHidratacion) => {
        const paramsUrl = obtenerParametros();
        
        if (!paramsUrl) return null;

        try {
            // Si el módulo pasó una función de hidratación propia, se la ejecutamos pasándole los datos
            if (typeof callbackHidratacion === 'function') {
                callbackHidratacion(paramsUrl);
            }

            return paramsUrl;
        } catch (e) {
            console.error("Error al sincronizar estado desde la URL:", e);
            return null;
        }
    };

    /**
     * Recibe un objeto con los datos específicos del módulo, los cifra usando Cifrar_Payload 
     * y actualiza la URL del navegador sin recargar la página.
     * 
     * @param {Object} datosModulo - Objeto libre con los parámetros que el módulo actual desea guardar en la URL (ej. { buscar: 'Juan', pagina: 2, estado: 1 }).
     * @param {boolean} pushState - true para agregar al historial del navegador, false para reemplazar (replaceState).
     */
    const generarUrlConEstado = (datosModulo = {}, pushState = false) => {
        try {
            if (!datosModulo || typeof datosModulo !== 'object') {
                console.warn("UrlStateSyncService: No se proporcionaron datos válidos para la URL.");
                return;
            }

            // 1. Convertir el objeto del módulo a JSON plano
            const jsonString = JSON.stringify(datosModulo);

            // 2. Cifrar utilizando tu función Cifrar_Payload
            if (typeof Cifrar_Payload !== 'function') {
                console.error("UrlStateSyncService: La función Cifrar_Payload no está disponible.");
                return;
            }

            const payloadCifrado = Cifrar_Payload(jsonString);
            if (!payloadCifrado) {
                console.error("UrlStateSyncService: No se pudo generar el payload cifrado para la URL.");
                return;
            }

            // 3. Actualizar la URL limpia con el parámetro 'q'
            const urlObj = new URL(window.location.href);
            urlObj.searchParams.set('q', payloadCifrado);

            const nuevaUrl = urlObj.pathname + urlObj.search;

            if (pushState) {
                window.history.pushState({ path: nuevaUrl }, '', nuevaUrl);
            } else {
                window.history.replaceState({ path: nuevaUrl }, '', nuevaUrl);
            }

        } catch (e) {
            console.error("Error al actualizar la URL con el estado cifrado:", e);
        }
    };

    return {
        obtenerParametros,
        sincronizarUrlAInputs,
        generarUrlConEstado
    };
})();