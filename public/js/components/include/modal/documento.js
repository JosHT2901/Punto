/**
 * Muestra el modal con la información detallada del documento clonando la plantilla HTML.
 * @param {Object} archivo - Objeto con la información del archivo.
 * @param {boolean} [cerrar=true] - Muestra botón de cerrar
 * @param {boolean} [transparencia=true] - Fondo oscuro/transparente
 * @param {number} [altura=410] - Altura de la ventana del modal
 */
function MostrarInformacionDocumento(archivo) {
    if (!archivo) {
        console.warn("MostrarInformacionDocumento: No se proporcionó un archivo válido.");
        return;
    }

    // 1. Clonamos la plantilla estática del HTML fijo
    const $contenido = $('#plantilla-info-documento-html').children().clone();

    // 2. Procesar y formatear los datos del archivo
    let tamanoFormateado = '0 KB';
    if (archivo.tamano_bytes) {
        const kb = archivo.tamano_bytes / 1024;
        tamanoFormateado = kb > 1024 ? (kb / 1024).toFixed(2) + ' MB' : kb.toFixed(1) + ' KB';
    } else if (archivo.tamano) {
        tamanoFormateado = archivo.tamano;
    }

    const fechaCreacion = archivo.creado_en_formato || archivo.creado_en || 'No disponible';
    const fechaActualizacion = archivo.actualizado_en_formato || archivo.actualizado_en || 'No disponible';
    
    // Formatear la fecha de última lectura si existe
    let ultimaLecturaTexto = 'Nunca';
    if (archivo.ultima_vez_abierto) {
        const fechaLecturaObj = new Date(archivo.ultima_vez_abierto);
        ultimaLecturaTexto = !isNaN(fechaLecturaObj) 
            ? fechaLecturaObj.toLocaleString('es-ES', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) 
            : archivo.ultima_vez_abierto;
    }

    const ext = (archivo.extension || 'FILE').toUpperCase();
    const nombreArchivo = archivo.nombre_original || archivo.name || 'Sin nombre';

    // 3. Asignar los valores dinámicamente dentro del contenedor clonado
    $contenido.find('.js-info-doc-extension-badge').text('.' + ext);
    $contenido.find('.js-info-doc-nombre').text(nombreArchivo).attr('title', nombreArchivo);
    $contenido.find('.js-info-doc-tamano').text(tamanoFormateado);
    $contenido.find('.js-info-doc-extension').text(ext);
    $contenido.find('.js-info-doc-creacion').text(fechaCreacion);
    $contenido.find('.js-info-doc-actualizacion').text(fechaActualizacion);
    $contenido.find('.js-info-doc-lectura').text(ultimaLecturaTexto);

    // 4. Apertura del Modal con el contenido ya preparado
    ModalAPI.abrir({
        titulo: 'Información del Documento', 
        cerrarBtn: true,
        altura: 420, 
        color: false,
        transparencia: true,
        contenido: $contenido,
        padding: true 
    });
}