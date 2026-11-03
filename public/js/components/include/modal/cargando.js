/**
 * Muestra el modal de carga estándar (Bloquea la UI)
 */
function MostrarCargando(texto = 'Cargando...', transparencia = true) {
    const $contenido = $('#plantilla-cargando-html').children().clone();
    $contenido.find('.js-loading-text').text(texto);

    ModalAPI.abrir({
        titulo: '',        
        cerrarBtn: false,   
        overlayClick: false,
        altura: 200,
        transparencia: transparencia,
        contenido: $contenido,
        padding: false,
        color: transparencia ? true : false,
        esCargando: true // 🌟 Bandera clave para identificar que es un modal de carga
    });
}

/**
 * Quita el modal de carga de forma segura asegurando la transición solo si es cargando
 */
function OcultarCargando() {
    try {
        if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrarCargando === 'function') {
            ModalAPI.cerrarCargando();
        }
        
        // Validar si existe el elemento contenedor de carga tradicional antes de removerlo
        const $contenedorCarga = $("#contenedor-carga");
        if ($contenedorCarga.length) {
            $contenedorCarga.remove();
        }
    } catch (e) {
        console.log("Error al cerrar modal de carga:", e);
    }
}