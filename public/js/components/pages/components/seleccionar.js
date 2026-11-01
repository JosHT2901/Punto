window.selectorConfig = {};
window.buscadorInstancia = null;
window.listaElementosGlobal = [];
window.evento=null
const SelectorModuleController = CrearSeleccionController('SelectorDinamico');


// 2. Escuchar el evento genérico de inicialización enviado por el padre
$.messenger.off('iniciar_seleccion');
$.messenger.on('iniciar_seleccion', async function (data, sourceWindow, origin) {
    try {
        console.log("Configuración recibida del padre:", data);

        // Guardamos la configuración globalmente
        window.selectorConfig = data || {};
        
        // Actualizar el título en #span-titulo
        if (window.selectorConfig.titulo) {
            $('#span-titulo').text(window.selectorConfig.titulo);
        }
        window.evento = window.selectorConfig.evento;

        // 1. Inicializar el controlador de selección de tu fábrica (primero para tenerlo listo)
        SelectorModuleController.init({
            scope: $('#seleccion-contenedor-cuerpo'), 
            checkItemClass: '.check-item-seleccion',
            checkAllId: '#check-item-all-seleccion',
            tarjetaClass: '.tarjeta-biblioteca',
            claseActiva: 'seleccionado',
            onChange: function (seleccionadosSet, estado, idModificado) {
                // Validación estricta: Si intentan modificar al usuario actual, forzar su eliminación de la selección
                const itemModificado = window.listaElementosGlobal.find(i => String(i.ID || i.id || i.codigo || '') === String(idModificado));
                if (itemModificado && (itemModificado.es_usuario_actual == 1 || itemModificado.es_actual == 1)) {
                    SelectorModuleController.limpiar(); // O eliminar específicamente ese ID si tienes método
                }
            }
        });

        // Limpiar selecciones previas al abrir
        SelectorModuleController.limpiar();

        // 3. Extraer la lista de elementos de forma flexible
        let lista = [];
        const fuenteDatos = window.selectorConfig.datos || window.selectorConfig.usuarios || window.selectorConfig.sucursales;

        if (Array.isArray(fuenteDatos)) {
            lista = fuenteDatos;
        } else if (fuenteDatos && fuenteDatos.data && Array.isArray(fuenteDatos.data)) {
            lista = fuenteDatos.data;
        }

        // 4. ORDENAR: Si existe la bandera de elemento actual, ponerlo siempre arriba
        lista.sort((a, b) => {
            const prioridadA = (a.es_usuario_actual == 1 || a.es_actual == 1) ? 1 : 0;
            const prioridadB = (b.es_usuario_actual == 1 || b.es_actual == 1) ? 1 : 0;
            return prioridadB - prioridadA;
        });

        window.listaElementosGlobal = lista;

        // 5. Cargar los elementos seleccionados iniciales (EXCLUYENDO al usuario actual por seguridad)
        if (Array.isArray(window.selectorConfig.seleccionados)) {
            window.selectorConfig.seleccionados.forEach(id => {
                // Verificar que el elemento a preseleccionar NO sea el usuario actual
                const itemEncontrado = window.listaElementosGlobal.find(i => String(i.ID || i.id || i.codigo || '') === String(id));
                const esElActual = itemEncontrado && (itemEncontrado.es_usuario_actual == 1 || itemEncontrado.es_actual == 1);
                
                if (!esElActual) {
                    SelectorModuleController.agregar(id);
                }
            });
        }

        // 6. Inicializar o actualizar el Buscador Universal
        if (!window.buscadorInstancia) {
            window.buscadorInstancia = BuscadorUniversal.crear({
                inputId: '#input-buscador',
                btnResetId: '#btn-reset-buscador-seleccionar',
                datos: window.listaElementosGlobal,
                render: function (filtrados, tipo, termino) {
                    renderizarElementos(filtrados, window.selectorConfig.columnas);
                    SelectorModuleController.sincronizarDOM();
                }
            });
        } else {
            window.buscadorInstancia.setDatos(window.listaElementosGlobal);
        }

        // 7. Renderizar inicial, sincronizar DOM y actualizar contador total
        renderizarElementos(window.listaElementosGlobal, window.selectorConfig.columnas);
        SelectorModuleController.sincronizarDOM();
        actualizarContadorTotal(window.listaElementosGlobal.length);

    } catch (error) {
        console.error("Error al procesar los datos del selector:", error);
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error al procesar la información.', false, false, false);
        }
    }
});

// 7. Manejar el clic en el botón de guardar/confirmar (Devuelve los objetos seleccionados al padre)
$(document).on('click', '#btn-enviar-seleccion', function () {
    // 1. Obtener los IDs seleccionados del controlador
    const idsSeleccionados = SelectorModuleController.getSeleccionados();
    
    if (idsSeleccionados.length === 0) {
        if (typeof MostrarAlerta === 'function') {
            return MostrarAlerta('Selecciona un elemento', 250, false);
        }
        return;
    }

    // 2. Envío respetando exactamente tu formato
    $.messenger.send(window.parent, window.evento, idsSeleccionados);
});
/**
 * Función para renderizar dinámicamente las tarjetas respetando las columnas enviadas
 */
function renderizarElementos(elementos, columnas = []) {
    const contenedor = '#contenedor-tarjetas';
    const $contenedor = $(contenedor);

    // Limpiar tarjetas anteriores
    $contenedor.find('.tarjeta-biblioteca').remove();

    if (!Array.isArray(elementos) || elementos.length === 0) {
        Contenedor_No_Resultados('No se encontraron registros', contenedor);
        return;
    } else {
        Ocultar_No_Resultados(contenedor);
    }

    elementos.forEach(item => {
        const id = String(item.ID || item.id || item.codigo || '');
        const esActual = item.es_usuario_actual == 1 || item.es_actual == 1;

        // Respetar estrictamente las columnas enviadas (ej: ['nombre', 'nombre_usuario'])
        let tituloPrincipal = 'Sin nombre';
        let subtituloSecundario = '';

        if (Array.isArray(columnas) && columnas.length > 0) {
            if (columnas[0] && item[columnas[0]] !== undefined) {
                tituloPrincipal = item[columnas[0]];
            }
            if (columnas[1] && item[columnas[1]] !== undefined) {
                subtituloSecundario = item[columnas[1]];
            }
        } else {
            tituloPrincipal = item.nombre || item.nombre_sucursal || item.titulo || 'Sin nombre';
            subtituloSecundario = item.correo || item.direccion || '';
        }

        let htmlTarjeta = '';

        if (esActual) {
            // Estilo compacto para el elemento actual (fijo, sin checkbox interactivo)
            htmlTarjeta = `
                <div class="w-p-100 my-1 bg-brand-soft py-2 px-3 rounded-lg shadow-sm border border-brand-blue flex items-center gap-3 transition-all duration-200 tarjeta-biblioteca tarjeta-elemento-actual" data-id="${id}">
                    <div class="flex items-center justify-center w-25">
                        <i class="vf-ic_fluent_checkmark_circle_24_filled text-brand-blue fs-5"></i>
                    </div>
                    <div class="flex-1 flex items-center justify-between">
                        <span class="text-gray-900 font-medium text-base fw-600">${tituloPrincipal}</span>
                        <span class="rounded-6 bg-brand-blue text-brand-dark px-2 py-02 fs-1 fw-600">Actual</span>
                    </div>
                </div>
            `;
        } else {
            // Estilo compacto estándar interactivo conectado con la clase de la fábrica (.check-item-seleccion)
            htmlTarjeta = `
                <div class="w-p-100 my-1 bg-white py-2 px-3 rounded-lg shadow-sm border border-gray-100 flex items-center gap-3 transition-all duration-200 hover:shadow-sm hover:border-gray-300 tarjeta-biblioteca cursor-pointer" data-id="${id}">
                    <div class="flex items-center justify-center w-25">
                        <input type="checkbox" class="check-item-seleccion checkbox-round cursor-pointer w-4 h-4 accent-primary" data-id="${id}">
                    </div>
                    <div class="flex-1 flex flex-column justify-center">
                        <span class="text-gray-900 font-medium text-sm fw-600">${tituloPrincipal}</span>
                        ${subtituloSecundario ? `<span class="fs-1 fw-600 text-brand-blue">${subtituloSecundario}</span>` : ''}
                    </div>
                </div>
            `;
        }

        const $tarjeta = $(htmlTarjeta);
        $tarjeta.data('item', item);
        $contenedor.append($tarjeta);
    });

    // Sincronizar el DOM para que el controlador reconozca los nuevos elementos y mantenga los checks
    SelectorModuleController.sincronizarDOM();
}

/**
 * Función para actualizar el contador total en #contador-span
 */
function actualizarContadorTotal(total) {
    $('#contador-span').text(`${total} disponibles`);
}

/**
 * Ocultar contenedor de no resultados
 */
function Ocultar_No_Resultados(contenedor) {
    const $contenedor = $(contenedor);
    if (!$contenedor.length) return;

    const $noResultados = $contenedor.find('#contenedor-no-resultados');
    if ($noResultados.length) {
        $noResultados.addClass('d-none');
    }
}