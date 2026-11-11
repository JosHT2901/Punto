/* =============================================
    SERVICIO: HABILITAR SERVICE (Individual o Masivo)
============================================= */
window.HabilitarService = (() => {

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
                    MostrarMensaje('No se han seleccionado elementos para habilitar.', false, false, false);
                }
                return { ok: false, mensaje: 'Sin elementos seleccionados' };
            }

            const total = idsArray.length;
            const esMasivo = total > 1;

            const tituloConfirmacion = options.titulo || 'Confirmar habilitación';
            const mensajeConfirmacion = options.mensaje || (!esMasivo 
                ? '¿Deseas habilitar este elemento seleccionado?' 
                : `¿Deseas habilitar los ${total} elementos seleccionados?`);

            // 2. Mostrar la pregunta utilizando la modal personalizada con Promesa
            const confirmado = await MostrarPregunta({
                titulo: tituloConfirmacion,
                texto: mensajeConfirmacion,
                icono: options.icono || 'vf-ic_fluent_checkmark_circle_24_filled',
                confirmarText: options.confirmarText || 'Sí, habilitar',
                cancelarText: options.cancelarText || 'Cancelar',
                colorConfirmar: options.colorConfirmar || 'btn-primary',
                altura: options.altura || 350
            });

            if (!confirmado) {
                return { ok: false, mensaje: 'Acción cancelada por el usuario' };
            }

            // 3. Mostrar modal de carga
            const textoCargando = options.textoCargando || (esMasivo ? 'Habilitando registros...' : 'Habilitando registro...');
            if (typeof MostrarCargando === 'function') {
                MostrarCargando(textoCargando);
            }

            // 4. Preparar los datos
            const payload = Object.assign({}, options.extraData || {}, {
                accion: accion,
                ids: idsArray,
                id: !esMasivo ? idsArray[0] : null,
                es_masivo: esMasivo ? 1 : 0
            });

            // 5. Ejecutar petición AJAX
            const ajaxCall = window.AjaxService && typeof window.AjaxService.enviar === 'function'
                ? window.AjaxService.enviar(url, payload)
                : $.ajax({ url: url, method: 'POST', data: payload, dataType: 'json' });

            const response = await ajaxCall;

            // 6. Ocultar carga
            if (typeof OcultarCargando === 'function') {
                OcultarCargando();
            }

            if (response && response.ok) {
                if (typeof MostrarMensaje === 'function') {
                    MostrarMensaje(response.mensaje || 'Elementos habilitados correctamente.', true, false, false);
                }
                if (typeof options.onSuccess === 'function') {
                    options.onSuccess(response);
                }
                return response;
            } else {
                const errorMsg = response?.mensaje || 'No se pudieron completar los cambios.';
                if (typeof MostrarAlerta === 'function') {
                    MostrarAlerta(errorMsg, 250, false);
                } else if (typeof MostrarMensaje === 'function') {
                    MostrarMensaje(errorMsg, false, false, false);
                }
                throw response;
            }

        } catch (error) {
            if (typeof OcultarCargando === 'function') {
                OcultarCargando();
            }

            const errorMsg = error?.mensaje || error?.responseText || 'Ocurrió un error inesperado en el servidor.';
            
            // Usamos MostrarAlerta de forma limpia sin interferir con ModalAPI prematuramente
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta(errorMsg, 250, false);
            } else if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(errorMsg, false, false, false);
            }
            
            throw error;
        }
    };

    return { ejecutar };

})();