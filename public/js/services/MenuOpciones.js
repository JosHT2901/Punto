window.MenuOpcionesController = (function ($) {
    let $menu = null;
    let opciones = [];
    let indexActivo = -1;
    let menuBloqueado = false;
    let inputAsociado = null; // Guardamos la referencia del input que abrió el menú

    function crearMenu() {
        if ($menu) return;
        $menu =$('<div id="menu-opciones-global" class="menu-opciones-global"></div>').css({
            position: 'absolute',
            maxHeight: '260px',
            overflowY: 'auto',
            zIndex: 10000,
            display: 'none',
            boxSizing: 'border-box'
        });
        $('body').append($menu);

        $(document).on('mousedown.menuOpciones', function (e) {
            if ($menu.is(':visible') && !$menu.is(e.target) &&$menu.has(e.target).length === 0) {
                cerrar();
            }
        });
    }

    function render() {
        let html = opciones.map((op, i) => `
            <div class="menu-opcion-item" data-index="${i}">
                ${op.icono ? `<div style="width: 30px; display: flex; justify-content: center;"><i class="${op.icono}"></i></div>` : ''}
                <div style="flex: 1; padding-left: 10px;">
                    <span>${op.texto}</span>
                </div>
            </div>
        `).join('');

        $menu.html(html);
        actualizarActivo();
    }

    function posicionar($btn) {
        const offset = $btn.offset();
        const btnH = $btn.outerHeight();
        const btnW = $btn.outerWidth();
        const winH = $(window).height();
        const winW = $(window).width();
        const scrollT = $(window).scrollTop();

        $menu.css({
            display: 'block',
            width: btnW,
            minWidth: '180px',
            visibility: 'hidden'
        });

        const menuH = $menu.outerHeight();
        const menuW = $menu.outerWidth();

        let left = offset.left;
        if (left + menuW > winW) left = winW - menuW - 10;

        const espacioAbajo = winH + scrollT - (offset.top + btnH);
        let top = offset.top + btnH + 2;

        if (espacioAbajo < menuH && (offset.top - scrollT) > menuH) {
            top = offset.top - menuH - 2;
        }

        $menu.css({
            left: Math.max(8, left),
            top: top,
            visibility: 'visible'
        });
    }

    function actualizarActivo() {
        const $items = $menu.find('.menu-opcion-item');$items.removeClass('activo');
        if (indexActivo >= 0) {
            const $activo =$items.eq(indexActivo).addClass('activo');
            const menu = $menu[0];
            const item = $activo[0];
            if (item.offsetTop < menu.scrollTop) menu.scrollTop = item.offsetTop;
            if (item.offsetTop + item.offsetHeight > menu.scrollTop + menu.offsetHeight) {
                menu.scrollTop = item.offsetTop + item.offsetHeight - menu.offsetHeight;
            }
        }
    }

    function cerrar() {
        if ($menu &&$menu.is(':visible')) {
            $menu.stop().fadeOut(100);$(document).off('keydown.menuOpciones');
            
            // Bloqueamos temporalmente la reapertura en el input para evitar loops por eventos en cadena
            if (inputAsociado) {
                const $inp = $(inputAsociado);$inp.data('bloquearReaperturaMenu', true);
                setTimeout(() => {
                    $inp.data('bloquearReaperturaMenu', false);
                }, 300);
            }

            inputAsociado = null;
        }
    }

    function ejecutarOpcion() {
        const op = opciones[indexActivo];
        if (op && typeof op.onClick === 'function') {
            menuBloqueado = true;
            op.onClick();
            
            // Forzar el trigger en el input asociado y marcar que acaba de seleccionar por menú
            if (inputAsociado) {
                const $inp = $(inputAsociado);$inp.data('acabadoDeSeleccionarCorreo', true)
                    .trigger('input')
                    .trigger('change');

                setTimeout(() => {
                    $inp.data('acabadoDeSeleccionarCorreo', false);
                }, 300);
            }

            cerrar();
            setTimeout(() => menuBloqueado = false, 150);
        }
    }

    function abrir(btn, opcionesMenu = []) {
        if (menuBloqueado) return;
        
        if ($(btn).data('bloquearReaperturaMenu')) return;

        crearMenu();
        inputAsociado = btn;
        opciones = opcionesMenu;
        indexActivo = 0;
        render();
        posicionar($(btn));

        $menu.off('.menu').on('click.menu', '.menu-opcion-item', function () {
            indexActivo = $(this).data('index');
            ejecutarOpcion();
        }).on('mousemove.menu', '.menu-opcion-item', function () {
            indexActivo = $(this).data('index');
            $menu.find('.menu-opcion-item').removeClass('activo');$(this).addClass('activo');
        });

        $(document).off('keydown.menuOpciones').on('keydown.menuOpciones', function (e) {
            if (e.key === 'ArrowDown') {
                indexActivo = (indexActivo + 1) % opciones.length;
                actualizarActivo();
                e.preventDefault();
            }
            if (e.key === 'ArrowUp') {
                indexActivo = (indexActivo - 1 + opciones.length) % opciones.length;
                actualizarActivo();
                e.preventDefault();
            }
            if (e.key === 'Enter') {
                ejecutarOpcion();
                e.preventDefault();
            }
            if (e.key === 'Escape') {
                cerrar();
            }
        });

        $menu.stop().fadeIn(100);
    }

    return {
        abrir,
        cerrar,
        isVisibles: () => $menu &&$menu.is(':visible')
    };
})(jQuery);

function AutocompletarCorreo(selector) {
    const DOMINIOS = [
        { dominio: 'gmail.com', icono: 'fa-brands fa-google' },
        { dominio: 'hotmail.com', icono: 'fa-brands fa-microsoft' },
        { dominio: 'outlook.com', icono: 'fa-brands fa-microsoft' },
        { dominio: 'yahoo.com', icono: 'fa-brands fa-yahoo' },
        { dominio: 'icloud.com', icono: 'fa-brands fa-apple' }
    ];

    $(document).on('input', selector, function () {
        const $input = $(this);$input.data('menu-opcion-seleccionado', false);

        let valor = $input.val();
        if ((valor.match(/@/g) || []).length > 1) {
            $input.val(valor.substring(0, valor.lastIndexOf('@')));
        }
    });

    $(document).on('keyup', selector, function (e) {
        if (['Escape', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) return;

        const $input =$(this);

        if ($input.data('bloquearReaperturaMenu')) return;

        if (e.key === 'Enter') {
            if (window.MenuOpcionesController && window.MenuOpcionesController.isVisibles()) {
                return; 
            }
            $input.data('menu-opcion-seleccionado', true);
            MenuOpcionesController.cerrar();
            return;
        }

        if ($input.data('menu-opcion-seleccionado')) return;

        const valor = $input.val();
        const pos = valor.indexOf('@');

        if (pos === -1) {
            MenuOpcionesController.cerrar();
            return;
        }

        const usuario = valor.substring(0, pos);
        const dominioEscrito = valor.substring(pos + 1).toLowerCase();

        if (!usuario.length) return;

        const dominioExactoCoincide = DOMINIOS.some(d => d.dominio === dominioEscrito);
        if (dominioExactoCoincide) {
            MenuOpcionesController.cerrar();
            return;
        }

        const opciones = DOMINIOS
            .filter(d => d.dominio.startsWith(dominioEscrito))
            .map(d => ({
                texto: `<strong>${d.dominio.substring(0, dominioEscrito.length)}</strong>${d.dominio.substring(dominioEscrito.length)}`,
                icono: d.icono,
                onClick: () => {
                    $input.val(`${usuario}@${d.dominio}`)
                          .data('menu-opcion-seleccionado', true)
                          .trigger('input')
                          .trigger('change');
                }
            }));

        if (opciones.length > 0) {
            MenuOpcionesController.abrir(this, opciones);
        } else {
            MenuOpcionesController.cerrar();
        }
    });
}

// Controlador unificado para la secuencia de Enter (Correo -> PIN / Siguiente)
$(document).on('keydown', function(e) {
    if (e.key === 'Enter') {
        const $target =$(e.target);

        // Si el usuario acaba de presionar Enter para seleccionar del menú, bloqueamos este Enter global
        if ($target.is('input[type="email"], .input-correo') && $target.data('acabadoDeSeleccionarCorreo')) {
            e.preventDefault();
            return;
        }

        // Si estamos en un campo de correo con menú cerrado o ya seleccionado
        if ($target.is('input[type="email"], .input-correo') && (!window.MenuOpcionesController.isVisibles())) {
            const $primerPin =$('.input-pin').first();
            if ($primerPin.length && !$target.data('pasado-siguiente')) {
                $target.data('pasado-siguiente', true);$primerPin.focus();
                e.preventDefault();
                return;
            }
        }

        // Si se presiona Enter en el botón de siguiente o se quiere disparar la acción final
        if ($target.is('#crear-usuario-pin-boton-siguiente') || ($target.hasClass('input-pin') &&$target.is(':last-child'))) {
            if (typeof window.PinValidador !== 'undefined') {
                const pinPrincipal = window.PinValidador.obtener();
                const pinConfirmacion = window.PinValidador.obtenerConfirmacion();
                const totalEsperado = $('.input-pin').not('.input-pin-confirmar').length || 4;

                if (pinPrincipal.length === totalEsperado && pinConfirmacion.length === totalEsperado && pinPrincipal === pinConfirmacion) {
                    $('#crear-usuario-pin-boton-siguiente').trigger('click');
                    e.preventDefault();
                }
            }
        }
    }
});
function AutocompletarGenerico(selector, data = [], campoValor = 'valor', usarIdComoValor = false) {
    
    // Normaliza texto: quita acentos y pasa a minúsculas
    const _normalizar = (str) => (str || "").toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    // OPTIMIZACIÓN: Pre-procesar y cachear la data normalizada una sola vez
    const dataOptimizada = data.map(item => ({
        original: item,
        valorNorm: _normalizar(item[campoValor] ?? item.valor)
    }));

    let debounceTimer = null;

    $(document).on('input', selector, (e) => {
        const $input = $(e.currentTarget);
        $input.data('menu-opcion-seleccionado', false).removeAttr('data-id');
    });

    $(document).on('keyup', selector, function (e) {
        if (['Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) return;
        const $input = $(this);
        if ($input.data('menu-opcion-seleccionado')) return;

        const rawQuery = $input.val().trim();
        if (!rawQuery) {
            clearTimeout(debounceTimer);
            return MenuOpcionesController.cerrar();
        }

        // OPTIMIZACIÓN: Debounce para evitar ejecuciones masivas mientras se escribe rápido
        clearTimeout(debounceTimer);
        const self = this;
        
        debounceTimer = setTimeout(() => {
            const query = _normalizar(rawQuery);

            const matches = [];
            const maxResults = 50; // Límite de resultados para renderizado fluido

            for (let i = 0; i < dataOptimizada.length; i++) {
                const item = dataOptimizada[i];
                const valNorm = item.valorNorm;
                
                let j = 0;
                for (let k = 0; k < valNorm.length && j < query.length; k++) {
                    if (valNorm[k] === query[j]) j++;
                }

                if (j === query.length) {
                    matches.push(item.original);
                    if (matches.length >= maxResults) break; // Detener si ya tenemos suficientes coincidencias
                }
            }

            if (matches.length > 0) {
                const options = matches.map(item => ({
                    texto: _resaltarRobusto(item[campoValor] ?? item.valor, query),
                    icono: item.icono || null,
                    onClick: () => _seleccionar($input, item)
                }));
                MenuOpcionesController.abrir(self, options);
            } else {
                MenuOpcionesController.cerrar();
            }
        }, 150); // Retraso de 150ms para fluidez total
    });

    // Resalta cada letra individualmente de forma eficiente
    function _resaltarRobusto(texto, query) {
        let resultado = "";
        let queryIdx = 0;

        for (let i = 0; i < texto.length; i++) {
            if (queryIdx < query.length && _normalizar(texto[i]) === query[queryIdx]) {
                resultado += `<strong>${texto[i]}</strong>`;
                queryIdx++;
            } else {
                resultado += texto[i];
            }
        }
        return resultado;
    }

    function _seleccionar($input, item) {
        // Si usarIdComoValor es true, pone el ID; si es false (por defecto), pone el texto del campo correspondiente
        const valorInput = usarIdComoValor ? (item.id ?? '') : (item[campoValor] ?? item.valor);

        $input.val(valorInput).attr('data-id', item.id ?? '').data('menu-opcion-seleccionado', true).trigger('change');
        MenuOpcionesController.cerrar();
    }
}

function AutocompletarProductos(selector, config) {
    // Función auxiliar para resaltar el texto coincidente
    const resaltarTexto = (texto, busqueda) => {
        if (!busqueda) return texto;
        const regex = new RegExp(`(${busqueda})`, 'gi');
        return texto.replace(regex, '<span style="background-color: #fef08a; font-weight: bold; border-radius: 2px;">$1</span>');
    };

    $(document).on('keyup', selector, function (e) {
        if (['Enter', 'Escape', 'ArrowUp', 'ArrowDown', 'Tab'].includes(e.key)) return;

        const $input = $(this);
        const valor = $input.val();

        if (valor.length < (config.minChars || 3)) {
            MenuOpcionesController.cerrar();
            return;
        }

        config.onSearch(valor).then(productos => {
            if (!productos || productos.length === 0) {
                MenuOpcionesController.cerrar();
                return;
            }

            const opciones = productos.map(prod => ({
                // Usamos la función resaltarTexto para el nombre
                texto: `
                    <div style="display: flex; align-items: center; padding: 10px; gap: 15px; border-bottom: 1px solid #f0f0f0;">
                        <div style="width: 50px; height: 50px; flex-shrink: 0; overflow: hidden; ">
                           <img src="../../${prod.imagen_principal ? 'uploads/productos/' + prod.imagen_principal : 'assets/images/ui/caja.png'}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        
                        <div style="flex: 1; display: flex; flex-direction: column; gap: 4px;">
                            <span style="font-weight: 700; font-size: 14px; color: #1a1a1a;">
                                ${resaltarTexto(prod.nombre, valor)}
                            </span>
                            
                            <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                                <span style="font-size: 11px; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 12px; font-weight: 600;">SKU: ${prod.sku}</span>
                                <span style="font-size: 11px; background: #f1f5f9; color: #475569; padding: 2px 8px; border-radius: 12px;">Cód: ${prod.codigo}</span>
                                <span style="font-size: 11px; background: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 12px;">${prod.marca_nombre || 'Sin marca'}</span>
                            </div>
                        </div>
                        
                        <div style="color: #cbd5e1;">
                            <i class="fa-solid fa-chevron-right" style="font-size: 12px;"></i>
                        </div>
                    </div>
                `,
                onClick: () => config.onSelect(prod)
            }));

            MenuOpcionesController.abrir(this, opciones);
        });
    });
}
