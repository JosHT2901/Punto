/**
 * API de Pregunta Dinámica integrada con ModalAPI mediante Promesas
 * @param {Object} options - Configuración de la pregunta
 * @returns {Promise<boolean>} Devuelve true si confirma, false si cancela
 */
async function MostrarPregunta(options = {}) {
    const config = {
        titulo: options.titulo || 'Confirmación',
        texto: options.texto || '¿Estás seguro?',
        icono: options.icono || 'vf-ic_fluent_question_circle_24_regular',
        btnConfirmarText: options.confirmarText || 'Confirmar',
        btnCancelarText: options.cancelarText || 'Cancelar',
        colorConfirmar: options.colorConfirmar || 'btn-primary',
        altura: options.altura || 280
    };

    return new Promise((resolve) => {
        // 1. Clonar la plantilla estática del DOM
        const $contenido =$('#plantilla-pregunta-html').children().clone();

        // 2. Inyectar datos dinámicos (texto e icono) de forma limpia
        $contenido.find('.js-pregunta-icono').addClass(config.icono);$contenido.find('.js-pregunta-texto').text(config.texto);

        // 3. Crear botones dinámicamente utilizando jQuery
        const $btnCancelar =$('<a>', {
            class: 'btn btn-option w-p-100 h-p-100 fs-3 fw-600 flex justify-center items-center',
            text: config.btnCancelarText
        });

        const $btnConfirmar =$('<a>', {
            class: `btn ${config.colorConfirmar} w-p-100 h-p-100 fs-3 fw-600 shadow-sm flex justify-center items-center`,
            text: config.btnConfirmarText
        });

        // 4. Insertar botones en sus respectivos contenedores dentro del clon
        $contenido.find('.js-contenedor-btn-izquierdo').append($btnCancelar);
        $contenido.find('.js-contenedor-btn-derecho').append($btnConfirmar);

        // 5. Configurar eventos de respuesta (one() previene múltiples clics accidentales)
        $btnConfirmar.one('click', (e) => {
            e.preventDefault();
            ModalAPI.cerrar();
            resolve(true);
        });

        $btnCancelar.one('click', (e) => {
            e.preventDefault();
            ModalAPI.cerrar();
            resolve(false);
        });

        // 6. Abrir usando la API unificada
        ModalAPI.abrir({
            titulo: config.titulo,
            altura: config.altura,
            cerrarBtn: false, // Las preguntas requieren una elección obligatoria
            overlayClick: false,
            color: true,
            contenido: $contenido // Pasamos el elemento jQuery limpio
        });
    });
}