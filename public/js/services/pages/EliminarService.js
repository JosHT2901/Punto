/* =============================================
    SERVICIO: ELIMINAR SERVICE (Individual o Masivo)
============================================= */
window.EliminarService = (() => {

    /**
     * Elimina uno o múltiples registros enviando los IDs al controlador tras confirmar con MostrarPregunta.
     * 
     * @param {string} url - URL del controlador endpoint.
     * @param {string} accion - Nombre de la acción (ej. 'eliminar', 'eliminar_masivo').
     * @param {number|string|Array} ids - Un ID único o un arreglo de IDs a eliminar.
     * @param {Object} options - Opciones adicionales (título, mensaje, textoCargando, extraData, onSuccess, etc.).
     * @returns {Promise} - Promesa que resuelve la respuesta del servidor o rechaza si se cancela/falla.
     */
    const ejecutar = async (url, accion, ids, options = {}) => {
        try {
            // 1. Normalizar los IDs a un arreglo plano y limpio
            let idsArray = [];
            if (Array.isArray(ids)) {
                idsArray = ids;
            } else if (ids !== null && ids !== undefined && ids !== '') {
                idsArray = [ids];
            }

            if (idsArray.length === 0) {
                if (typeof MostrarMensaje === 'function') {
                    MostrarMensaje('No se han seleccionado elementos para eliminar.', false, false, false);
                }
                return { ok: false, mensaje: 'Sin elementos seleccionados' };
            }

            const total = idsArray.length;
            const esMasivo = total > 1; // Determinamos si la operación es masiva

            const tituloConfirmacion = options.titulo || 'Confirmar eliminación';
            const mensajeConfirmacion = options.mensaje || (!esMasivo 
                ? '¿Deseas eliminar este elemento seleccionado?' 
                : `¿Deseas eliminar los ${total} elementos seleccionados?`);

            // 2. Mostrar la pregunta utilizando tu modal personalizada con Promesa
            const confirmado = await MostrarPregunta({
                titulo: tituloConfirmacion,
                texto: mensajeConfirmacion,
                icono: options.icono || 'vf-ic_fluent_delete_24_regular',
                confirmarText: options.confirmarText || 'Sí, eliminar',
                cancelarText: options.cancelarText || 'Cancelar',
                colorConfirmar: options.colorConfirmar || 'btn-danger',
                altura: options.altura || 280
            });

            // Si el usuario cancela la operación
            if (!confirmado) {
                return { ok: false, mensaje: 'Acción cancelada por el usuario' };
            }

            // 3. Mostrar modal de carga mientras se ejecuta la petición
            const textoCargando = options.textoCargando || (esMasivo ? 'Eliminando registros...' : 'Eliminando registro...');
            if (typeof MostrarCargando === 'function') {
                MostrarCargando(textoCargando);
            }

            // 4. Preparar los datos a enviar
            const payload = Object.assign({}, options.extraData || {}, {
                accion: accion,
                ids: idsArray,
                id: !esMasivo ? idsArray[0] : null, // Soporte retroactivo
                es_masivo: esMasivo ? 1 : 0        // Parámetro indicador de si es masivo o no
            });

            // 5. Ejecutar la petición AJAX usando AjaxService o jQuery $.ajax directo
            const ajaxCall = window.AjaxService && typeof window.AjaxService.enviar === 'function'
                ? window.AjaxService.enviar(url, payload)
                : $.ajax({ url: url, method: 'POST', data: payload, dataType: 'json' });

            const response = await ajaxCall;

            // 6. Ocultar el modal de carga
            if (typeof OcultarCargando === 'function') {
                OcultarCargando();
            }

            if (response && response.ok) {
                if (typeof MostrarMensaje === 'function') {
                    MostrarMensaje(response.mensaje || 'Elementos eliminados correctamente.', true, false, false);
                }
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess(response);
                }
                setTimeout(() => {
                    ModalAPI.cerrar()
                }, 1000);
                return response;
            } else {
                const errorMsg = response?.mensaje || 'No se pudieron completar los cambios.';
                if (typeof MostrarMensaje === 'function') {
                    MostrarMensaje(errorMsg, false, false, false);
                }
                throw response;
            }

        } catch (error) {
            // Asegurar que siempre se oculte el modal de carga si ocurre un error o excepción de red
            if (typeof OcultarCargando === 'function') {
                OcultarCargando();
            }

            const errorMsg = error?.mensaje || 'Ocurrió un error inesperado en el servidor.';
            if (typeof MostrarMensaje === 'function' && !error?.mensaje) {
                MostrarMensaje(errorMsg, false, false, false);
            }
            setTimeout(() => {
                ModalAPI.cerrar()
            }, 1000);
            throw error;
        }
    };

    return { ejecutar };

})();