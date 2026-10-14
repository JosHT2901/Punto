/**
 * Muestra el modal de carga y lo vincula al progreso real de un objeto XHR
 * @param {string} texto - Mensaje de espera
 * @param {XMLHttpRequest|null} xhr - El objeto XMLHttpRequest nativo que ejecuta la petición
 * @param {string} imagenUrl - Ruta opcional de un logo o icono central para la onda
 * @param {boolean} modoSubida - True si mides envío de datos/archivos, False si mides descarga
 * @param {boolean} transparencia - Oscuro o translúcido
 */
function MostrarModalCarga(texto = 'Cargando...', xhr = null, imagenUrl = '', modoSubida = true, transparencia = true) {
    const timestamp = Date.now();
    const idLoaderDinamico = `modal-loader-${timestamp}`;
    const idTextoPorcentaje = `modal-porcentaje-${timestamp}`;

    // Clonamos o extraemos el HTML base y le inyectamos los IDs únicos necesarios
    const $contenidoCarga =$('#plantilla-carga-html').children().clone();
    $contenidoCarga.find('.js-modal-loader-target').attr('id', idLoaderDinamico);
    $contenidoCarga.find('.js-modal-texto-porcentaje').attr('id', idTextoPorcentaje);$contenidoCarga.find('.js-modal-texto-mensaje').text(texto);

    // Abrimos el Modal usando tu API centralizada
    ModalAPI.abrir({
        titulo: '',
        cerrarBtn: false,
        overlayClick: false,
        altura: 220,
        anchoMax: '300px',
        transparencia: transparencia,
        contenido: $contenidoCarga // Pasamos el elemento jQuery directamente
    });

    const $loader =$(`#${idLoaderDinamico}`);
    const $textoPorcentaje =$(`#${idTextoPorcentaje}`);

    // Inicializamos el plugin de la onda de forma segura
    if (typeof $loader.ondaLoader === 'function') {$loader.ondaLoader({
            progreso: 0,
            color: '#23c8fa',
            frecuencia: 10,
            amplitud: 3,
            imagenUrl: imagenUrl,
            imagenSize: '100px',
            imagenSizeFull: '120px'
        });
    } else {
        console.warn("El plugin ondaLoader no está cargado.");
    }

    // Escucha automática de los eventos de red del XHR
    if (xhr && xhr instanceof XMLHttpRequest) {
        const targetProgreso = modoSubida ? xhr.upload : xhr;

        targetProgreso.onprogress = function (e) {
            if (e.lengthComputable) {
                const porcentajeReal = (e.loaded / e.total) * 100;
                const porcentajeRedondeado = Math.floor(porcentajeReal);

                // Actualizar plugin de onda
                const actualizarFn = $loader.data('actualizar');
                if (typeof actualizarFn === 'function') {
                    actualizarFn(porcentajeReal);
                }

                // Actualizamos el número de texto del modal
                $textoPorcentaje.text(`${porcentajeRedondeado}%`);
            }
        };
    }
}

/**
 * Quita el modal de carga, asegura el 100% visual y cierra de forma fluida
 */
function OcultarModalCarga() {
    const $contenedorCarga =$('#contenedor-cargando-proceso');

    if ($contenedorCarga.length > 0) {
        const $loader =$contenedorCarga.find('[id^="modal-loader-"]');
        const $textoPorcentaje =$contenedorCarga.find('[id^="modal-porcentaje-"]');

        const actualizarFn = $loader.data('actualizar');
        const destruirFn = $loader.data('destruir');

        // Ejecutamos limpieza del plugin si existe
        if (typeof destruirFn === 'function') {
            destruirFn();
        }

        if (typeof actualizarFn === 'function') {
            $textoPorcentaje.text('100%');
            actualizarFn(100);
            
            // Damos un pequeño respiro visual de 200ms para que el usuario note el 100% antes de cerrar
            setTimeout(() => {
                ModalAPI.cerrar();
            }, 200);
        } else {
            ModalAPI.cerrar();
        }
    } else {
        // Fallback por si el contenedor ya no está en el DOM
        ModalAPI.cerrar();
    }
}