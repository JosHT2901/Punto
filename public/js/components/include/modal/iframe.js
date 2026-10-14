/**
 * Crea una ventana modal que carga un archivo externo vía Iframe
 * @param {string} titulo - Título de la ventana
 * @param {string} url - Ruta del archivo (ej: ../iframes/auth.php)
 * @param {number|string} altura - Altura en px o porcentaje
 * @param {boolean} cerrar - Mostrar botón X
 * @param {boolean} transparencia - Overlay oscuro
 * @param {function|null} onLoadCallback - Función a ejecutar cuando el iframe cargue
 */
function CrearVentanaIframe(
    titulo,
    url,
    altura,
    cerrar = true,
    transparencia = true,
    onLoadCallback = null
) {
    // 1. Clonar la plantilla estática del DOM
    const $iframe = $('#plantilla-iframe-html').children().clone();

    // 2. Asignar de forma segura el atributo src y un ID único dinámico
    const iframeId = 'iframe_' + Date.now();
    $iframe.attr({
        'id': iframeId,
        'src': url
    });

    // 3. Vincular el evento load antes de enviarlo al modal
    if (typeof onLoadCallback === 'function') {
        $iframe.on('load', function() {
            // Intentar aplicar estilos limpios al contenido interno (si es del mismo dominio)
            try {
                $(this).contents().find('body').css({
                    'margin': '0',
                    'padding': '0',
                    'overflow-x': 'hidden'
                });
            } catch (e) {
                // Restricción CORS de seguridad del navegador
                console.warn("No se pudo acceder al DOM interno del iframe debido a políticas CORS.");
            }
            
            onLoadCallback(this);
        });
    }

    // 4. Abrir utilizando la API centralizada pasando el objeto jQuery clonado
    ModalAPI.abrir({
        titulo: titulo,
        contenido: $iframe, // Pasamos directamente el iframe limpio
        altura: altura,
        color: true,
        cerrarBtn: cerrar,
        transparencia: transparencia,
        padding: false // El iframe ocupa todo el espacio del contenedor
    });
}