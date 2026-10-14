/**
 * Muestra el modal de conflicto de archivos de forma limpia y segura
 * @param {string|number} info - Nombre del archivo o contador de duplicados
 * @param {boolean} esMultiples - Indica si son varios archivos
 * @param {Function} callback - Función que recibe la acción ('sobreescribir', 'copia', 'cancelar')
 */
function MostrarConflicto(info, esMultiples, callback) {
    // 1. Clonar la plantilla estática del DOM
    const $contenido =$('#plantilla-conflicto-html').children().clone();

    // 2. Construir el mensaje dinámico de manera segura
    const mensaje = esMultiples 
        ? `Se han detectado <b>${info} archivos</b> que ya existen en el sistema.`
        : `El archivo <b>${info}</b> ya existe.`;

    $contenido.find('.js-mensaje-conflicto').html(`${mensaje} ¿Qué deseas hacer con ellos?`);

    // 3. Vincular eventos directamente al clon antes de inyectarlo en el modal
    $contenido.find('.js-btn-sobreescribir').on('click', function(e) {
        e.stopPropagation();
        ModalAPI.cerrar();
        if (typeof callback === 'function') callback('sobreescribir');
    });

    $contenido.find('.js-btn-copia').on('click', function(e) {
        e.stopPropagation();
        ModalAPI.cerrar();
        if (typeof callback === 'function') callback('copia');
    });

    $contenido.find('.js-btn-cancelar').on('click', function(e) {
        e.stopPropagation();
        ModalAPI.cerrar();
        if (typeof callback === 'function') callback('cancelar');
    });

    // 4. Abrir el modal usando la API centralizada
    ModalAPI.abrir({
        titulo: 'Conflicto de Archivos',
        cerrarBtn: true,
        altura: 340, 
        anchoMax: '400px',
        color: true,
        transparencia: true,
        contenido: $contenido, // Pasamos el objeto jQuery limpio
        onClose: function() {
            // Opcional: si el usuario cierra con la 'X' o Escape, por defecto se toma como cancelar
            // if (typeof callback === 'function') callback('cancelar');
        }
    });
}