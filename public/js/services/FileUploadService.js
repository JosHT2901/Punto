/* =============================================
    SERVICIO: FILE UPLOAD SERVICE (Blindado y Reutilizable)
============================================= */
window.FileUploadService = (function (AjaxService) {

    const subir = async (url, archivos, accion, parametrosExtra = {}, textoModal = 'Subiendo archivo...') => {
        if (!archivos) {
            return Promise.reject({ ok: false, mensaje: "No se proporcionaron archivos para enviar." });
        }

        const formData = new FormData();
        formData.append('accion', accion);

        // Normalizamos a arreglo para tratar archivo único o múltiple por igual
        const listaArchivos = Array.isArray(archivos) ? archivos : [archivos];

        listaArchivos.forEach((file, index) => {
            formData.append(`archivo_${index}`, file);
        });
        formData.append('total_archivos', listaArchivos.length);

        // Compatibilidad adicional por si el backend busca 'archivo' directamente
        if (listaArchivos.length === 1) {
            formData.append('archivo', listaArchivos[0]);
        }

        // Inyectamos parámetros adicionales si los hay
        for (const key in parametrosExtra) {
            if (Object.prototype.hasOwnProperty.call(parametrosExtra, key)) {
                formData.append(key, parametrosExtra[key]);
            }
        }

        return window.AjaxService.enviarConProgreso(url, formData, true, textoModal);
    };

    return {
        subir
    };

})(window.AjaxService);