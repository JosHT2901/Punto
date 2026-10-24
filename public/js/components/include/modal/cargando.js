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
        color: transparencia ? true : false
    });
}

/**
 * Quita el modal de carga de forma segura asegurando la transición
 */
function OcultarCargando() {
    try {
        if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
            ModalAPI.cerrar();
        }
        
        // Validar si existe el elemento antes de removerlo
        const $contenedorCarga = $("#contenedor-carga");
        if ($contenedorCarga.length) {
            $contenedorCarga.remove();
        }
    } catch (e) {
        console.log("Error al cerrar modal de carga:", e);
    }
}