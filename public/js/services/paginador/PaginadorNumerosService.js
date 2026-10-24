/* =============================================
    SERVICIO DE PAGINADOR DE NÚMEROS (NATIVO / SIN CARRUSEL)
============================================= */
window.PaginadorNumerosService = (() => {

    const render = ({ contenedor = '#contenedor-paginador', paginacion, callbackPagina, callbackRegistros }) => {
        const { total_paginas, pagina_actual, registros_por_p } = paginacion;
        const $paginador = $(contenedor);
        
        if (!$paginador.length) return; 
        $paginador.empty();

        const actual = normalizarPagina(pagina_actual, total_paginas);
        const RANGO = 1; 

        // 1. Contenedor principal de los botones de paginación
        const $botonesContainer = $('<div/>', {
            id: 'paginador-botones-wrapper',
            class: 'h-p-100 flex-1 px-px-5 box-sizing flex items-center gap-1'
        });

        // Botones de navegación iniciales (Primera y Anterior)
        if (actual > 1) {
            $botonesContainer.append(crearElementoBoton('primera', 'vf-ic_fluent_arrow_previous_24_filled', 'Primera'));
            $botonesContainer.append(crearElementoBoton('anterior', 'vf-ic_fluent_arrow_left_24_filled', 'Anterior'));
        }

        // Botón página 1
        $botonesContainer.append(crearElementoNumero(1, actual)); 

        const inicio = Math.max(2, actual - RANGO);
        const fin = Math.min(total_paginas - 1, actual + RANGO);

        if (inicio > 2) {
            $botonesContainer.append($('<div/>', { text: '…', class: 'h-30 w-30 flex justify-center items-center text-white fw-600 rounded-3xl' }));
        }

        for (let i = inicio; i <= fin; i++) {
            $botonesContainer.append(crearElementoNumero(i, actual));
        }

        if (fin < total_paginas - 1) {
            $botonesContainer.append($('<div/>', { text: '…', class: 'h-30 w-30 flex justify-center items-center text-white fw-600 rounded-3xl' }));
        }

        if (total_paginas > 1) {
            $botonesContainer.append(crearElementoNumero(total_paginas, actual));
        }

        // Botones de navegación finales (Siguiente y Última)
        if (actual < total_paginas) {
            $botonesContainer.append(crearElementoBoton('siguiente', 'vf-ic_fluent_chevron_right_24_filled', 'Siguiente'));
            $botonesContainer.append(crearElementoBoton('ultima', 'vf-ic_fluent_arrow_next_24_filled', 'Última'));
        }

        $paginador.append($botonesContainer);

        // 2. Info de Registros (Lado Derecho)
        const $infoRegistros = $(`
            <div class="h-p-100 text-blue-03618d" id="paginador-select"></div>
        `);
        $paginador.append($infoRegistros);

        let inicializado = false;

        InsertarCustomSelect({
            contenedor: '#paginador-select',
            id: 'select-registros-por-pagina',
            placeholder: registros_por_p,
            opciones: [
                { value: '1', text: '1' },
                { value: '10', text: '10' },
                { value: '25', text: '25' },
                { value: '50', text: '50' },
                { value: '100', text: '100' }
            ],
            buscador: false,
            onChange: (val) => {
                if (inicializado && callbackRegistros) {
                    callbackRegistros(val);
                }
            }
        });

        CustomSelect.setValue('#select-registros-por-pagina', registros_por_p);
        inicializado = true;

        // Registrar eventos en el DOM de forma delegada
        inicializarEventosGlobales(contenedor, actual, total_paginas, callbackPagina);
    };

    /* =============================================
        HELPERS DE CONSTRUCCIÓN NATIVA
    ============================================= */
    const crearElementoNumero = (numero, paginaActual) => {
        const esActivo = numero === paginaActual;
        return $('<a/>', {
            href: '#',
            text: numero,
            class: `btn-pagina p-1 h-30 w-30 rounded-3xl flex justify-center items-center fw-600 transition-all text-decoration-none ${
                esActivo ? 'bg-warning text-dark' : 'cursor-pointer btn-option btn'
            }`,
            'data-action': numero
        });
    };

    const crearElementoBoton = (accion, icono, title) => {
        const $a = $('<a/>', {
            href: '#',
            class: 'btn btn-pagina btn-option p-1 cursor-pointer rounded-2xl fw-600 flex justify-center items-center h-30 w-30 transition-all text-decoration-none',
            'data-action': accion,
            title: title
        });
        
        $a.append($('<i/>', {
            class: `icon ${icono} h-35 w-35 fs-5 flex justify-center items-center`
        }));

        return $a;
    };

    /* =============================================
        GESTIÓN DE EVENTOS DELEGADOS
    ============================================= */
    const inicializarEventosGlobales = (contenedorSelector, actual, total, callback) => {
        $(document).off('click.paginadorBtn').on('click.paginadorBtn', `${contenedorSelector} .btn-pagina`, function (e) {
            e.preventDefault();
            e.stopPropagation();

            const $btn = $(this);
            const accion = $btn.attr('data-action') || $btn.data('action');

            if (accion === undefined || accion === null) return;

            let paginaActual = typeof window.pagina !== 'undefined' ? parseInt(window.pagina, 10) : actual;
            let totalPaginas = typeof window.totalPaginas !== 'undefined' ? parseInt(window.totalPaginas, 10) : total;
            
            let nuevaPagina = paginaActual;

            if (!isNaN(accion)) {
                nuevaPagina = parseInt(accion, 10);
            } else {
                switch (String(accion).toLowerCase()) {
                    case 'primera':   
                        nuevaPagina = 1; 
                        break;
                    case 'anterior':  
                        nuevaPagina = Math.max(1, paginaActual - 1); 
                        break;
                    case 'siguiente': 
                        nuevaPagina = Math.min(totalPaginas, paginaActual + 1); 
                        break;
                    case 'ultima':    
                        nuevaPagina = totalPaginas; 
                        break;
                }
            }

            if (nuevaPagina !== paginaActual && typeof callback === 'function') {
                callback(nuevaPagina);
            }
        });
    };

    const normalizarPagina = (pagina, totalPaginas) => {
        const p = parseInt(pagina) || 1;
        return Math.max(1, Math.min(p, totalPaginas));
    };

    return {
        render
    };
})();