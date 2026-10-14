/**
 * Muestra un mensaje dinámico (Éxito/Error) utilizando la estructura fija del HTML
 * @param {string} texto - Mensaje a mostrar
 * @param {boolean} tipo - true para éxito (verde), false para error (rojo)
 * @param {boolean} [cerrar=true] - Muestra botón de cerrar
 * @param {boolean} [transparencia=true] - Fondo oscuro/transparente
 * @param {number} [altura=220] - Altura de la ventana
 * @param {boolean|string} [color=false] - Color personalizado del modal
 */
function MostrarMensaje(texto, tipo, cerrar = true, 
    transparencia = true,altura=250) {
    // 1. Clonamos la plantilla estática del HTML fijo
    const $contenido = $('#plantilla-mensaje-html').children().clone();
    
    // 2. Definimos las clases de los iconos según el tipo (éxito/error)
    const iconoClase = tipo 
        ? 'vf-ic_fluent_checkmark_circle_24_filled text-success' 
        : 'vf-ic_fluent_warning_24_filled text-danger';
    
    // 3. Asignamos de forma dinámica el icono y el texto dentro del clon
    $contenido.find('.js-mensaje-icono').addClass(iconoClase);
    $contenido.find('.js-mensaje-texto').text(texto);

    // 4. Apertura del Modal con el contenido ya preparado
    ModalAPI.abrir({
        titulo: '', 
        cerrarBtn: cerrar,
        altura: altura, 
        color: false,
        transparencia: transparencia,
        contenido: $contenido, // Pasamos el objeto jQuery clonado
        padding: false 
    });
}

/**
 * Acceso rápido para alertas de error
 * @param {string} texto - Mensaje de error
 * @param {number} [altura=250] - Altura opcional
 * @param {boolean} [transparencia=true] - Fondo oscuro opcional
 */
function MostrarAlerta(texto, altura = 250, transparencia = true) {
    MostrarMensaje(texto, false, true, transparencia, altura);
}

/**
 * Acceso rápido para mensajes de éxito
 * @param {string} texto - Mensaje de éxito
 * @param {number} [altura=220] - Altura opcional
 * @param {boolean} [transparencia=true] - Fondo oscuro opcional
 */
function MostrarExito(texto, altura = 220, transparencia = true) {
    MostrarMensaje(texto, true, true, transparencia, altura);
}