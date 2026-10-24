/* =============================================
   SERVICIO: EXPORTACION SERVICE
============================================= */
window.ExportacionService = (function () {

    /**
     * Ejecuta la exportación enviando la petición al servidor mediante AjaxService.descargarArchivo
     * @param {String} url Ruta o endpoint de destino
     * @param {String} accion Acción o tipo de proceso a ejecutar
     * @param {String|Array} formato Formato(s) seleccionado(s) (ej: 'pdf', 'xlsx')
     * @param {Object} [datosExtras={}] Filtros o parámetros adicionales (ej: IDs seleccionados)
     */
    const exportar = async (url, accion, formato, datosExtras = {}) => {
        if (!url) {
            console.error("ExportacionService: URL no proporcionada.");
            return;
        }

        const payload = {
            accion: accion,
            formato: formato,
            ...datosExtras
        };

        try {
            if (typeof MostrarCargando === 'function') {
                MostrarCargando('Generando archivo de exportación...', false);
            }

            // Llamada al servicio que ahora debe retornar un objeto con { ok, blob, nombre, mensaje }
            const respuesta = await AjaxService.descargarArchivo(url, payload, false, `exportacion_${Date.now()}.${formato}`, false);

            if (typeof OcultarCargando === 'function') {
                OcultarCargando();
            }

            // Validamos la respuesta exitosa del servidor antes de mostrar la confirmación
            if (respuesta && respuesta.ok) {
                // 4. Mostramos la pregunta de confirmación
                const confirma = await MostrarPregunta({
                    titulo: 'Descargar archivo',
                    texto: 'Archivo listo para descargar',
                    icono: 'fa-solid fa-download text-gray-500',
                    confirmarText: 'Descargar',
                    colorConfirmar: 'btn-primary',
                    altura: 320
                });

                // 5. Si el usuario confirma, ejecutamos el disparo manual de la descarga con el blob recibido
                if (confirma) {
                    const urlBlob = window.URL.createObjectURL(respuesta.blob);
                    const link = document.createElement("a");
                    link.href = urlBlob;
                    link.download = respuesta.nombre || `exportacion_${Date.now()}.${formato}`;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();

                    setTimeout(() => {
                        window.URL.revokeObjectURL(urlBlob);
                        document.body.removeChild(link);
                    }, 200);
                }
            } else {
                // Si el servidor respondió pero con ok: false
                const mensajeError = respuesta?.mensaje || 'No se pudo generar el archivo de exportación.';
                if (typeof MostrarAlerta === 'function') {
                    MostrarAlerta(mensajeError);
                } else {
                    alert(mensajeError);
                }
            }

        } catch (error) {
            if (typeof OcultarCargando === 'function') {
                OcultarCargando();
            }
            
            const mensajeError = error.mensaje || 'Ocurrió un error al generar el archivo.';
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta(mensajeError);
            } else {
                alert(mensajeError);
            }
            console.error("Error en exportación:", error);
        }
    };

    return {
        exportar
    };

})(jQuery);