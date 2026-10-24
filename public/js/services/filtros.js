/* =============================================
    SERVICIO: FILTROS CARRUSEL (Genérico y Robusto)
============================================= */
window.FiltrosCarruselService = (() => {
    let instanciaActual = null;
    let menuAbiertoId = null;

    const _tplBotonFiltro = (config = {}) => {
        const { 
            id = "", 
            icono = "", 
            texto = "", 
            clases = "", 
            tieneCaret = true, 
            esActivo = false, 
            altura = 'h-30' 
        } = config;

        const estiloEstado = esActivo 
            ? "bg-white shadow-sm text-blue-03618d border-transparent" 
            : "border-white"; 

        const textFinal = texto || config.text || "";
        const iconFinal = icono || config.icon || "";

        return `
            <a id="${id}" class="${altura} btn flex items-center rounded-md transition-all cursor-pointer border-1 px-px-10 gap-5 ${estiloEstado} ${clases}" style="flex-shrink: 0; white-space: nowrap;">
                ${iconFinal ? `<i class="icon ${iconFinal} h-18 w-18"></i>` : ''}
                <span class="fs-3 fw-600">${textFinal}</span>
                ${tieneCaret ? `<i class="icon vf-ic_fluent_caret_down_24_filled h-15 w-15 opacity-60"></i>` : ''}
            </a>
        `;
    };

    const render = (contenedor, botones = [], callback = null, evaluarActivoFn = null) => {
        if (!contenedor) return;

        instanciaActual = { contenedor, botones, callback, evaluarActivoFn };
        const listaSegura = Array.isArray(botones) ? botones.filter(Boolean) : [];

        const renderHTML = (activaId) => {
            const html = listaSegura.map(btn => {
                // 1. Verificación estándar en el componente visual MenuSelectorCheck
                const seleccionadosBtn = window.MenuSelectorCheck ? window.MenuSelectorCheck.getSeleccionadosPorKey(btn.id) : [];
                let tieneSelecciones = seleccionadosBtn && seleccionadosBtn.length > 0;

                // 2. Evaluar propiedad estática 'esActivo' definida en la configuración del botón
                if (!tieneSelecciones && btn.esActivo !== undefined) {
                    tieneSelecciones = typeof btn.esActivo === 'function' ? btn.esActivo(btn) : Boolean(btn.esActivo);
                }

                // 3. Evaluar mediante función externa personalizada (Inyectada para hacerlo 100% genérico por módulo)
                if (!tieneSelecciones && typeof evaluarActivoFn === 'function') {
                    tieneSelecciones = Boolean(evaluarActivoFn(btn.id, btn));
                }

                const esActivo = btn.id === activaId || tieneSelecciones;
                const opciones = { ...btn, esActivo };

                opciones.clases = btn.clases || btn.class || '';

                return _tplBotonFiltro(opciones);
            }).join("");

            $(contenedor).find('.carousel-nav-track').html(html);
        };

        const idUnico = typeof contenedor === 'string' ? contenedor.replace(/[#.]/g, '') : 'default';

        if ($('#carrusel-filtros-styles').length === 0) {
            $('head').append(`
                <style id="carrusel-filtros-styles">
                    .carrusel-filtros-wrapper { display: flex; align-items: center; width: 100%; position: relative; gap: 6px; box-sizing: border-box; }
                    .carousel-nav-track { display: flex; flex-wrap: nowrap; overflow-x: auto; gap: 6px; align-items: center; width: 100%; scroll-behavior: smooth; -ms-overflow-style: none; scrollbar-width: none; }
                    .carousel-nav-track::-webkit-scrollbar { display: none; }
                </style>
            `);
        }

        const estructura = `
            <div class="carrusel-filtros-wrapper w-p-100 h-p-100">
                <button type="button" id="f-left-${idUnico}" class="btn btn-secondary rounded-3xl p-1 w-30 h-30 fs-4 justify-center flex items-center" style="display:none;" title="Anterior">
                    <i class="vf-ic_fluent_chevron_left_24_filled"></i>
                </button>

                <div class="carousel-nav-track ocultar-scrollbar" id="f-scroll-${idUnico}">
                    <!-- Se inyectan los botones -->
                </div>

                <button type="button" id="f-right-${idUnico}" class="btn btn-secondary rounded-3xl p-1 w-30 h-30 fs-4 justify-center flex items-center" style="display:none;" title="Siguiente">
                    <i class="vf-ic_fluent_chevron_right_24_filled"></i>
                </button>
            </div>
        `;

        const $cont = $(contenedor);$cont.html(estructura);
        renderHTML(menuAbiertoId);

        const $track =$cont.find('.carousel-nav-track');
        const $leftArrow =$cont.find(`#f-left-${idUnico}`);
        const $rightArrow =$cont.find(`#f-right-${idUnico}`);

        const updateArrows = () => {
            const el = $track[0];
            if (!el) return;
            const scrollLeft = el.scrollLeft;
            const scrollWidth = el.scrollWidth;
            const clientWidth = el.clientWidth;

            if (scrollWidth <= clientWidth + 2) {
                $leftArrow.hide();$rightArrow.hide();
                return;
            }
            if (scrollLeft <= 2) {
                $leftArrow.hide();
            } else {
                $leftArrow.css('display', 'flex');
            }
            if (scrollLeft + clientWidth >= scrollWidth - 2) {
                $rightArrow.hide();
            } else {
                $rightArrow.css('display', 'flex');
            }
        };

        $leftArrow.off('click').on('click', () => {$track.animate({ scrollLeft: '-=200px' }, 200, updateArrows);
        });

        $rightArrow.off('click').on('click', () => {$track.animate({ scrollLeft: '+=200px' }, 200, updateArrows);
        });

        $track.off('scroll').on('scroll', updateArrows);$(window).off(`resize.carruselFiltros_${idUnico}`).on(`resize.carruselFiltros_${idUnico}`, updateArrows);

        $cont.off('click', '.btn').on('click', '.btn', function(e) {
            if ($(this).attr('id') === `f-left-${idUnico}` || $(this).attr('id') === `f-right-${idUnico}`) {
                return;
            }
            e.preventDefault();
            const idBtn = $(this).attr('id');
            const datosOriginales = listaSegura.find(b => b.id === idBtn);

            if (menuAbiertoId === idBtn) {
                menuAbiertoId = null;
                if (window.MenuSelectorCheck && typeof window.MenuSelectorCheck.cerrar === 'function') {
                    window.MenuSelectorCheck.cerrar();
                }
                renderHTML(null);
            } else {
                menuAbiertoId = idBtn;
                renderHTML(menuAbiertoId);

                if (typeof callback === 'function') {
                    callback(datosOriginales, idBtn, this);
                }
            }
        });

        setTimeout(updateArrows, 60);
    };

    const refrescar = () => {
        if (instanciaActual) {
            render(instanciaActual.contenedor, instanciaActual.botones, instanciaActual.callback, instanciaActual.evaluarActivoFn);
        }
    };

    return { render, refrescar };
})();