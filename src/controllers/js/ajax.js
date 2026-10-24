/* =============================================
    SERVICIO: AJAX SERVICE (Independiente)
============================================= */
window.AjaxService = (function ($) {

    /**
     * Realiza peticiones AJAX estándar usando jQuery $.ajax
     */
    const enviar = (url, data = {}, esFormData = false) => {
        return new Promise((resolve, reject) => {
            $.ajax({
                url: url,
                method: 'POST',
                data: data,
                processData: !esFormData,
                contentType: esFormData ? false : 'application/x-www-form-urlencoded; charset=UTF-8',
                dataType: 'json',
                success: resolve,
                error: (xhr) => {
                    console.log(xhr);
                    let errorMsg = "Error en la petición";
                    let errorData = null;

                    try {
                        const res = JSON.parse(xhr.responseText);
                        errorMsg = res.mensaje || errorMsg;
                        errorData = res.data || null;
                    } catch (e) {
                        errorMsg = xhr.statusText || errorMsg;
                    }

                    reject({
                        ok: false,
                        status: xhr.status,
                        mensaje: errorMsg,
                        data: errorData
                    });
                }
            });
        });
    };

    /**
     * Realiza peticiones AJAX usando XHR nativo para soporte de progreso y respuesta JSON.
     */
    const enviarConProgreso = (url, data = {}, esFormData = false, opciones = {}) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);

            if (typeof opciones.onCreateXhr === 'function') {
                opciones.onCreateXhr(xhr);
            }
            if (xhr.upload && typeof opciones.onProgress === 'function') {
                xhr.upload.onprogress = opciones.onProgress;
            }

            xhr.onload = function () {
                let respuesta;
                try {
                    respuesta = JSON.parse(xhr.responseText);
                } catch (e) {
                    respuesta = xhr.responseText;
                }

                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(respuesta);
                } else {
                    reject({
                        ok: false,
                        status: xhr.status,
                        mensaje: (respuesta && respuesta.mensaje) ? respuesta.mensaje : (xhr.statusText || 'Error en el servidor'),
                        response: respuesta
                    });
                }
            };

            xhr.onerror = () => reject({
                ok: false,
                status: xhr.status,
                mensaje: 'Error de red',
                response: null
            });

            if (esFormData || data instanceof FormData) {
                xhr.send(data);
            } else {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                xhr.send(typeof $.param === 'function' ? $.param(data) : data);
            }
        });
    };

    /**
     * Descarga archivos mediante AJAX permitiendo enviar parámetros POST y soporte opcional para FormData.
     */
    const descargarArchivo = (url, data = {}, esFormData = false, nombrePredeterminado = 'descarga.xlsx', ejecutarClick = true) => {
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', url, true);
            xhr.responseType = 'blob'; 

            if (esFormData) {
                xhr.send(data);
            } else {
                xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                xhr.send(typeof $.param === 'function' ? $.param(data) : data);
            }

            xhr.onload = function () {
                const status = xhr.status;
                const contentType = xhr.getResponseHeader('Content-Type');

                if (contentType && contentType.includes('application/json')) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const jsonRes = JSON.parse(reader.result);
                            reject(jsonRes);
                        } catch (e) {
                            reject({ ok: false, mensaje: "Error desconocido del servidor" });
                        }
                    };
                    reader.readAsText(xhr.response);
                    return;
                }

                if (status >= 200 && status < 300) {
                    let nombreFinal = nombrePredeterminado;
                    const disposition = xhr.getResponseHeader('Content-Disposition');
                    if (disposition && disposition.includes('attachment')) {
                        const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(disposition);
                        if (matches && matches[1]) {
                            nombreFinal = matches[1].replace(/['"]/g, '');
                        }
                    }

                    if (!ejecutarClick) {
                        resolve({ ok: true, blob: xhr.response, nombre: nombreFinal });
                        return;
                    }

                    const urlBlob = window.URL.createObjectURL(xhr.response);
                    const link = document.createElement("a");
                    link.href = urlBlob;
                    link.download = nombreFinal;
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    
                    setTimeout(() => {
                        window.URL.revokeObjectURL(urlBlob);
                        document.body.removeChild(link);
                        resolve({ ok: true, mensaje: "Descarga iniciada" });
                    }, 200);

                } else {
                    reject({ ok: false, mensaje: `Error HTTP: ${status}` });
                }
            };

            xhr.onerror = () => reject({ ok: false, mensaje: "Error de conexión con el servidor" });
        });
    };

    /**
     * Helper para ejecutar peticiones HTTP mostrando el progreso real en el modal de carga.
     */
    const ejecutarPeticionConProgreso = (url, data = {}, esFormData = false, textoModal = 'Cargando...', imagenUrl = '') => {
        return enviarConProgreso(url, data, esFormData, {
            onCreateXhr: function(xhr) {
                if (typeof MostrarModalCarga === 'function') {
                    MostrarModalCarga(textoModal, xhr, imagenUrl, true, false);
                }
            }
        });
    };

    /**
     * Helper para ejecutar peticiones HTTP de forma silenciosa reportando el progreso.
     */
    const ejecutarPeticionSinModal = (url, data = {}, esFormData = false, onProgress = null) => {
        return enviarConProgreso(url, data, esFormData, {
            onCreateXhr: function(xhr) {
                if (onProgress && xhr.upload) {
                    xhr.upload.onprogress = function(e) {
                        if (e.lengthComputable) {
                            onProgress(Math.round((e.loaded / e.total) * 100));
                        }
                    };
                }
            }
        });
    };

    // Exponemos el objeto modularizado con nombres intuitivos
    return {
        enviar,
        enviarConProgreso,
        descargarArchivo,
        ejecutarPeticionConProgreso,
        ejecutarPeticionSinModal
    };

})(jQuery);