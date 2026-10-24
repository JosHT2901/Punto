/* =============================================
    SERVICIO: VERTICAL SUBMENU NAV (Optimizado y Seguro)
============================================= */
window.VerticalSubmenuNav = (function ($) {
    let $menu = null;
    let opciones = [];
    let $btnActivo = null;
    let eventosActivos = false;

    const inyectarEstilos = () => {
        if ($("#v-submenu-nav-styles").length) return;
        const css = `
            #v-submenu-nav-global {
                position: fixed; display: flex; flex-direction: column;
                background: #fff; border: 1px solid #d1d5db; border-radius: 8px;
                padding: 6px 0; min-width: 220px; z-index: 99999;
                box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); font-family: inherit;
            }
            .v-menu-item {
                position: relative; display: flex; align-items: center; justify-content: space-between;
                padding: 10px 16px; cursor: pointer; color: #374151; font-size: 14px;
            }
            .v-menu-item:hover, .v-menu-item.active { background: #f3f4f6; color: #111827; }
            .v-submenu-container {
                position: absolute; display: none; background: #fff; border: 1px solid #d1d5db;
                border-radius: 8px; padding: 6px 0; min-width: 190px; z-index: 1000000;
                box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
            }
            .v-submenu-item { padding: 8px 16px; font-size: 13.5px; color: #4b5563; }
            .v-submenu-item:hover { background: #f9fafb; color: #111827; }
        `;
        $('<style>').attr("id", "v-submenu-nav-styles").html(css).appendTo('head');
    };

    function crearMenu() {
        if ($menu) return;
        inyectarEstilos();
        $menu =$(`<div id="v-submenu-nav-global"></div>`).hide();
        $('body').append($menu);

        $(document).on('mousedown.vSubmenuNav', (e) => {
            if ($menu.is(':visible') && !$menu.is(e.target) &&$menu.has(e.target).length === 0) {
                if (!$btnActivo || (!$btnActivo.is(e.target) &&$btnActivo.has(e.target).length === 0)) {
                    cerrar();
                }
            }
        });
    }

    function abrir(btn, opcionesMenu = []) {
        crearMenu();
        const $btn =$(btn);
        $btnActivo =$btn;
        opciones = opcionesMenu;
        
        $menu.html(opciones.map(op => `
            <div class="v-menu-item" data-id="${op.id}">
                <div style="display:flex; align-items:center;">
                    ${op.icono ? `<i class="${op.icono}" style="margin-right:10px; width:16px; text-align:center;"></i>` : ''}
                    <span>${op.texto}</span>
                </div>
                ${op.subopciones?.length ? `<i class="ph ph-caret-right" style="font-size:10px"></i>` : ''}
                ${op.subopciones?.length ? `
                    <div class="v-submenu-container">
                        ${op.subopciones.map(sub => `<div class="v-submenu-item" data-opid="${op.id}" data-subid="${sub.id}">${sub.texto}</div>`).join('')}
                    </div>
                ` : ''}
            </div>`).join(''));

        if (!eventosActivos) {
            eventosActivos = true;
            
            // Eventos delegados para submenús
            $menu.on('mouseenter', '.v-menu-item', function() {
                const $sub = $(this).find('.v-submenu-container');$menu.find('.v-submenu-container').hide();
                if ($sub.length) {
                    const rectItem = this.getBoundingClientRect();
                    const winH = window.innerHeight;
                    const winW = window.innerWidth;
                    
                    let sLeft = rectItem.width;
                    let sTop = 0;

                    $sub.show(); // Mostrar para medir dimensiones
                    const subH = $sub.outerHeight();
                    const subW = $sub.outerWidth();

                    if (rectItem.right + subW > winW) sLeft = -subW;
                    if (rectItem.top + subH > winH) {
                        sTop = Math.max(0, (rectItem.top + subH) - winH - 10);
                    }

                    $sub.css({ left: sLeft, top: sTop });
                }
            });

            $menu.on('click', '.v-menu-item', function() {
                const op = opciones.find(o => String(o.id) === String($(this).data('id')));
                if (op && !op.subopciones?.length) { 
                    op.onClick?.(); 
                    cerrar(); 
                }
            });

            $menu.on('click', '.v-submenu-item', function(e) {
                e.stopPropagation();
                const op = opciones.find(o => String(o.id) === String($(this).data('opid')));
                const sub = op?.subopciones?.find(s => String(s.id) === String($(this).data('subid')));
                sub?.onClick?.(); 
                cerrar();
            });
        }

        // --- LÓGICA DE DETECCIÓN DE COLISIÓN (Viewport-Safe corregida) ---
        $menu.css({ visibility: 'hidden', display: 'flex', top: 0, left: 0, maxHeight: 'none', overflowY: 'visible' });
        
        const rectBtn = $btn[0].getBoundingClientRect();
        const winH = window.innerHeight;
        const winW = window.innerWidth;
        const menuH = $menu.outerHeight();
        const menuW = $menu.outerWidth();

        // 1. Posición sugerida inicial (al lado del botón)
        let top = rectBtn.top;
        let left = rectBtn.right + 5;

        // 2. ¿Desborda a la derecha? Intentar ponerlo a la izquierda
        if (left + menuW > winW) {
            left = rectBtn.left - menuW - 5;
        }

        // 3. ¿Sigue desbordando o es muy ancho? Ajuste forzado al borde con margen
        if (left + menuW > winW) {
            left = winW - menuW - 10;
        }
        if (left < 10) {
            left = 10;
        }

        // 4. ¿Desborda abajo? Restar el excedente exacto
        if (top + menuH > winH) {
            const overflow = (top + menuH) - winH;
            top = top - overflow - 10;
        }

        // 5. ¿Desborda arriba tras el ajuste? (Menú más alto que la pantalla)
        if (top < 10) {
            top = 10;
            $menu.css({
                maxHeight: (winH - 20) + 'px',
                overflowY: 'auto'
            });
        }

        $menu.css({
            top: top + 'px',
            left: left + 'px',
            visibility: 'visible'
        }).hide().fadeIn(100);

        // Eventos para cerrar al hacer scroll o redimensionar
        $(window).off('scroll.vSubmenuNav resize.vSubmenuNav').on('scroll.vSubmenuNav resize.vSubmenuNav', cerrar);
    }

    function cerrar() {
        if ($menu)$menu.hide();
        $(window).off('scroll.vSubmenuNav resize.vSubmenuNav');$btnActivo = null;
    }

    return { abrir, cerrar };
})(jQuery);