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
    // Si tu ModalAPI permite cerrar de forma limpia, ejecutamos directo o validamos la instancia
    try {
        ModalAPI.cerrar();
    } catch (e) {
        console.log("Error al cerrar modal de carga:", e);
    }
}