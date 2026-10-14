/**
 * Muestra un mensaje dinámico con un botón de acción opcional.
 * @param {string} texto - Texto descriptivo del mensaje.
 * @param {boolean} tipo - true para éxito (verde), false para error (rojo).
 * @param {object} [opciones] - Opciones adicionales (cerrar, transparencia, altura, botonTexto, accionBoton).
 */
function MostrarMensajeConAccion(texto, tipo,altura=280,transparencia=false,cerrar=false, opciones = {}) {
    const config = $.extend({
        cerrar: cerrar,
        transparencia: transparencia,
        altura:altura, // Un poco más de altura para acomodar el botón
        botonTexto: null,
        accionBoton: null // Puede ser una URL (string) o una función callback
    }, opciones);

    // 1. Clonamos la plantilla estática del HTML fijo
    const $contenido = $('#plantilla-mensaje-accion-html').children().clone();
    
    // 2. Definimos las clases de los iconos según el tipo
    const iconoClase = tipo 
        ? 'vf-ic_fluent_checkmark_circle_24_filled text-success' 
        : 'vf-ic_fluent_warning_24_filled text-danger';
    
    // 3. Asignamos icono y texto
    $contenido.find('.js-mensaje-icono').addClass(iconoClase);
    $contenido.find('.js-mensaje-texto').text(texto);

    // 4. Configuramos el botón de acción si se proporcionaron los parámetros
    const $btnAccion = $contenido.find('.js-mensaje-btn-accion');
    if (config.botonTexto && config.accionBoton) {
        $btnAccion.text(config.botonTexto).removeClass('d-none').on('click', function () {
       
            if (typeof config.accionBoton === 'function') {
                config.accionBoton(); // Ejecutamos la función si es un callback
            } else if (typeof config.accionBoton === 'string') {
                window.location.href = config.accionBoton; // Redirigimos si es una URL
            }
        });
    } else {
        $btnAccion.addClass('d-none');
    }

    // 5. Apertura del Modal
    ModalAPI.abrir({
        titulo: '', 
        cerrarBtn: config.cerrar,
        altura: config.altura, 
        color: false,
        transparencia: config.transparencia,
        contenido: $contenido,
        padding: false 
    });
}