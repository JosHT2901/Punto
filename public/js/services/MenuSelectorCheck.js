/* =============================================
    SERVICIO: MENU SELECTOR CHECK (Extendido y Robusto)
============================================= */
window.MenuSelectorCheck = (function ($) {
    let $menu = null;
    let opciones = [];
    let estadoPersistente = {}; 
    let terminoBusqueda = "";
    let config = { multiple: true, onChange: null, buscador: false, seleccionados: [], contenedorTags: null, contenedorMenu: null };
    let $btnActivo = null;
    let currentKey = 'default';

    const inyectarEstilos = () => {
        if ($("#msc-styles").length) return;
        const css = `
            .msc-global-flotante {
                position: fixed !important; 
                display: flex; 
                flex-direction: column;
                background: #fff; 
                border: 1px solid #d1d5db; 
                border-radius: 8px;
                min-width: 240px; 
                box-shadow: 0 10px 25px rgba(0,0,0,0.15);
                font-family: inherit; 
                z-index: 9999999 !important;
            }
            .msc-global-estatico {
                display: flex; 
                flex-direction: column;
                background: #fff; 
                border: 1px solid #d1d5db; 
                border-radius: 8px;
                width: 100%; 
                box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                font-family: inherit; 
                margin-top: 6px;
            }
            .msc-opcion {
                display: flex; 
                align-items: center; 
                gap: 10px; 
                padding: 10px 14px;
                cursor: pointer; 
                transition: background 0.2s; 
                user-select: none;
            }
            .msc-opcion:hover { background: #f3f4f6; }
            .msc-opcion input { pointer-events: none; }
            .msc-contenedor-items::-webkit-scrollbar { width: 6px; }
            .msc-contenedor-items::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 10px; }
        `;
        $('<style>').attr("id", "msc-styles").html(css).appendTo('head');
    };

    function crearMenu() {
        if ($menu &&$menu.length) return;
        inyectarEstilos();
        
        $menu =$(`
            <div class="msc-dropdown-inner">
                <div class="msc-search-box" style="padding: 10px; border-bottom: 1px solid #f3f4f6; display:none;">
                    <input type="text" class="msc-input-search" placeholder="Buscar..." 
                        style="width: 100%; padding: 8px; border-radius: 6px; border: 1px solid #e5e7eb; font-size: 13px; outline: none;">
                </div>
                <div class="msc-contenedor-items" style="overflow-y: auto; max-height: 280px;"></div>
            </div>
        `);

        if (config.contenedorMenu) {
            $menu.addClass('msc-global-estatico');
            $(config.contenedorMenu).html($menu);
        } else {
            $menu.attr('id', 'msc-global').addClass('msc-global-flotante');$menu.hide().appendTo('body');
        }

        $menu.on('click', e => e.stopPropagation());

        $menu.find('.msc-input-search').on('input', function() {
            terminoBusqueda = $(this).val().toLowerCase();
            render();
        });

        if (!config.contenedorMenu) {
            $(document).on('mousedown.msc', (e) => {
                if (!$menu || !$menu.is(':visible')) return;
                const clickEnMenu = $menu.is(e.target) ||$menu.has(e.target).length > 0;
                const clickEnBtn = $btnActivo && ($btnActivo.is(e.target) ||$btnActivo.has(e.target).length > 0);
                if (!clickEnMenu && !clickEnBtn) cerrar();
            });
        }
    }

    function render() {
        if (!estadoPersistente[currentKey]) estadoPersistente[currentKey] = {};

        const filtradas = config.buscador 
            ? opciones.filter(op => op.texto.toLowerCase().includes(terminoBusqueda))
            : opciones;

        let html = filtradas.map(op => {
            const isChecked = !!estadoPersistente[currentKey][op.id];
            return `
                <label class="msc-opcion" data-id="${op.id}">
                    <input type="${config.multiple ? 'checkbox' : 'radio'}" ${isChecked ? 'checked' : ''} class="checkbox-round">
                    <span style="font-size:13.5px; color: #374151;">${op.texto}</span>
                </label>
            `;
        }).join('');

        if ($menu) {$menu.find('.msc-contenedor-items').html(html || '<div style="padding:15px; color:#999; text-align:center;">No hay resultados</div>');
        }
    }

    function actualizarContenedorTags() {
        if (!config.contenedorTags) return;
        const $cont =$(config.contenedorTags);
        if (!$cont.length) return;

        $cont.empty();
        const seleccionadosIds = getSeleccionados();

        seleccionadosIds.forEach(id => {
            const opEncontrada = opciones.find(o => String(o.id) === String(id));
            const textoOpcion = opEncontrada ? opEncontrada.texto : id;

            const $chip =$(`
                <span class="msc-chip" data-id="${id}" style="
                    display: inline-flex; align-items: center; gap: 8px;
                    background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;
                    border-radius: 20px; padding: 4px 10px 4px 12px; font-size: 13px;
                    font-weight: 500; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                    transition: all 0.2s ease; user-select: none;
                ">
                    <span>${textoOpcion}</span>
                    <button type="button" class="msc-btn-eliminar-tag" style="
                        background: #dbeafe; border: none; cursor: pointer; width: 18px; height: 18px;
                        border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;
                        color: #1e40af; font-size: 12px; line-height: 1; padding: 0;
                        transition: background 0.15s ease, color 0.15s ease;
                    " title="Eliminar">&times;</button>
                </span>
            `);
            $cont.append($chip);
        });
    }

    function abrir(btnRef, data = [], configuracion = {}) {
        config = $.extend({ multiple: true, onChange: null, buscador: false, seleccionados: [], contenedorTags: null, contenedorMenu: null }, configuracion);
        
        let domBtn = null;
        if (btnRef) {
            if (typeof btnRef === 'string') {
                domBtn = document.querySelector(btnRef); 
            } else if (btnRef.nodeType === 1) {
                domBtn = btnRef;
            } else if (btnRef instanceof jQuery && btnRef.length > 0) {
                domBtn = btnRef[0];
            } else if (btnRef.currentTarget && btnRef.currentTarget.nodeType === 1) {
                domBtn = btnRef.currentTarget;
            }
        }

        if (domBtn && !document.body.contains(domBtn) && domBtn.id) {
            domBtn = document.getElementById(domBtn.id);
        }

        if (!domBtn && config.contenedorMenu) {
            currentKey = config.contenedorMenu;
        } else if (domBtn) {
            $btnActivo =$(domBtn);
            currentKey = $btnActivo.attr('id') || 'default_msc';
        } else {
            currentKey = 'default_msc';
        }

        if ($menu && config.contenedorMenu) {
            $menu.remove();$menu = null;
        }

        crearMenu();

        if ($btnActivo && !config.contenedorMenu) {$btnActivo.addClass('bg-white shadow-sm text-blue-03618d');
        }

        $menu.find('.msc-search-box').toggle(config.buscador);
        opciones = data;
        terminoBusqueda = "";
        $menu.find('.msc-input-search').val("");

        if (!estadoPersistente[currentKey]) estadoPersistente[currentKey] = {};

        if (config.seleccionados && config.seleccionados.length > 0) {
            config.seleccionados.forEach(id => {
                estadoPersistente[currentKey][id] = true;
            });
        } else if (!Object.keys(estadoPersistente[currentKey]).length) {
            opciones.forEach(op => {
                if (op.selected || op.checked) estadoPersistente[currentKey][op.id] = true;
            });
        }

        render();
        actualizarContenedorTags();
        
        // --- MANEJO DE CLICS EN LAS OPCIONES ---
        $menu.find('.msc-contenedor-items').off('click').on('click', '.msc-opcion', function(e) {
            e.preventDefault();
            const id = $(this).data('id');

            if (config.multiple) {
                estadoPersistente[currentKey][id] = !estadoPersistente[currentKey][id];
            } else {
                if (estadoPersistente[currentKey][id]) {
                    estadoPersistente[currentKey] = {}; 
                } else {
                    estadoPersistente[currentKey] = { [id]: true };
                }
            }

            render();
            actualizarContenedorTags();
            if (config.onChange) config.onChange(getSeleccionados());

            // 💡 FORZAR CIERRE INMEDIATO AL SELECCIONAR CUALQUIER OPCIÓN (Múltiple o Única)
            if (!config.contenedorMenu) {
                setTimeout(cerrar, 100);
            }
        });

        if (!config.contenedorMenu) {
            $menu.css({
                position: 'fixed',
                visibility: 'hidden',
                display: 'flex',
                top: '0px',
                left: '0px',
                zIndex: 9999999
            }).show();
        }

        if (!config.contenedorMenu && domBtn) {
            const rect = domBtn.getBoundingClientRect();
            
            let top = rect.bottom + 6;
            let left = rect.left;

            const menuWidth = $menu.outerWidth();
            const menuHeight = $menu.outerHeight();
            const windowWidth = $(window).width();
            const windowHeight = $(window).height();

            if (left + menuWidth > windowWidth - 15) {
                left = rect.right - menuWidth;
                if (left < 10) left = 10;
            }

            if ((top + menuHeight > windowHeight - 10) && (rect.top - menuHeight > 10)) {
                top = rect.top - menuHeight - 6;
            }

            $menu.css({
                position: 'fixed',
                top: `${top}px`,
                left: `${left}px`,
                visibility: 'visible'
            });
        }

        if (config.buscador) setTimeout(() => $menu.find('.msc-input-search').focus(), 100);
    }

    function cerrar() {
        if (!$menu || config.contenedorMenu) return;
        if ($btnActivo) $btnActivo.removeClass('bg-white shadow-sm text-blue-03618d');$menu.hide();

        if (typeof window.FiltrosCarruselService?.refrescar === 'function') {
            window.FiltrosCarruselService.refrescar();
        }
    }

    function getSeleccionados() {
        const st = estadoPersistente[currentKey] || {};
        return Object.keys(st).filter(k => st[k]);
    }

    function getSeleccionadosPorKey(key) {
        const st = estadoPersistente[key] || {};
        return Object.keys(st).filter(k => st[k]);
    }

    function setSeleccionesPorKey(key, seleccionadosArray = []) {
        if (!key) return;
        estadoPersistente[key] = {};
        if (Array.isArray(seleccionadosArray)) {
            seleccionadosArray.forEach(id => {
                estadoPersistente[key][id] = true;
            });
        }
    }

    $(document).on('mouseenter', '.msc-btn-eliminar-tag', function () {$(this).css({ background: '#ef4444', color: '#ffffff' });
    }).on('mouseleave', '.msc-btn-eliminar-tag', function () {
        $(this).css({ background: '#dbeafe', color: '#1e40af' });
    });

    $(document).on('click', '.msc-btn-eliminar-tag', function (e) {
        e.preventDefault();
        const $chip =$(this).closest('.msc-chip');
        const id = $chip.data('id');
        
        if (estadoPersistente[currentKey]) {
            delete estadoPersistente[currentKey][id];
        }

        $chip.css({ transform: 'scale(0.85)', opacity: 0 });
        setTimeout(() => {
            $chip.remove();
            render(); 
            if (config.onChange) config.onChange(getSeleccionados());
            if (typeof window.FiltrosCarruselService?.refrescar === 'function') {
                window.FiltrosCarruselService.refrescar();
            }
        }, 150);
    });

    return { abrir, cerrar, getSeleccionados, getSeleccionadosPorKey, setSeleccionesPorKey };
})(jQuery);