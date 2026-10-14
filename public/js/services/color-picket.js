window.ColorPickerService = (function ($) {
    let $modal = null;
    let callbackSeleccion = null;
    let $elementoActivo = null;

    function crearModal() {
        if ($modal &&$modal.length) return;

        $modal =$(`
            <div id="custom-color-picker-service" style="
                position: fixed;
                display: none;
                background: rgba(255, 255, 255, 0.98);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                color: #0f172a;
                border-radius: 20px;
                box-shadow: 0 20px 40px -15px rgba(15, 23, 42, 0.2), 0 0 0 1px rgba(15, 23, 42, 0.05);
                padding: 16px;
                width: 230px;
                z-index: 999999;
                font-family: inherit;
                box-sizing: border-box;
            ">
                <div style="font-size: 13px; font-weight: 700; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; letter-spacing: -0.01em;">
                    <span style="display: flex; align-items: center; gap: 6px; color: #1e293b;">
                        Seleccionar Tono
                    </span>
                    <button type="button" id="cp-close-btn" style="border: none; background: #f1f5f9; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; color: #64748b; font-size: 16px;" title="Cerrar">&times;</button>
                </div>

                <div>
                    <div style="
                        position: relative;
                        display: flex;
                        align-items: center;
                        gap: 12px;
                        background: #f8fafc;
                        border: 1px solid #e2e8f0;
                        border-radius: 14px;
                        padding: 10px 12px;
                        cursor: pointer;
                        transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                        box-shadow: inset 0 2px 4px rgba(0,0,0,0.01);
                    ">
                        
                        <input type="color" id="cp-native-input" style="
                            position: absolute;
                            inset: 0;
                            width: 100%;
                            height: 100%;
                            opacity: 0;
                            cursor: pointer;
                            z-index: 2;
                        " title="Abrir selector de color">

                        <div id="cp-color-indicator" style="
                            width: 38px;
                            height: 38px;
                            border-radius: 10px;
                            box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.08);
                            flex-shrink: 0;
                        "></div>

                        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; z-index: 1; pointer-events: none;">
                            <span style="font-size: 12px; font-weight: 700; color: #0f172a; letter-spacing: -0.01em;">Elegir color</span>
                            <span style="font-size: 10px; font-weight: 500; color: #94a3b8;">Click para abrir paleta</span>
                        </div>
                    </div>
                </div>
            </div>
        `).appendTo('body');

        $('#cp-close-btn').on('click', function () {
            cerrar();
        });

        // SOLO actualiza la vista previa flotante mientras se desliza el cursor
        $('#cp-native-input').on('input', function () {
            const colorHex = $(this).val();
            actualizarUI(colorHex);
        });

        // Únicamente cuando se confirma la selección final en la paleta del sistema se aplica y cierra
        $('#cp-native-input').on('change', function () {
            const colorHex = $(this).val();
            actualizarUI(colorHex);

            if (typeof callbackSeleccion === 'function' && $elementoActivo) {
                callbackSeleccion(colorHex, $elementoActivo);
            }
            cerrar();
        });

        $(document).on('mousedown.colorPickerService', function (e) {
            if ($modal &&$modal.is(':visible')) {
                if (!$modal.is(e.target) &&$modal.has(e.target).length === 0) {
                    if (!$(e.target).is('button, i, span, input') && !$(e.target).hasClass('btn-abrir-color')) {
                        cerrar();
                    }
                }
            }
        });
    }

    function actualizarUI(hex) {
        let val = hex.toUpperCase();
        if (!val.startsWith('#')) val = '#' + val;

        if (/^#[0-9A-F]{6}$/i.test(val)) {
            $('#cp-native-input').val(val);
            $('#cp-color-indicator').css('background-color', val);
        }
    }

    function cerrar() {
        if ($modal) {
            $modal.fadeOut(150);$elementoActivo = null;
        }
    }

    return {
        abrir: function ($elementoReferencia, onSelectCallback, colorInicial) {
            crearModal();
            $elementoActivo =$elementoReferencia;

            if (typeof onSelectCallback === 'function') {
                callbackSeleccion = onSelectCallback;
            }

            let valActual = colorInicial || '#6366F1';
            actualizarUI(valActual);

            $modal.css({ display: 'block', opacity: 0 });

            setTimeout(() => {
                const offset = $elementoReferencia.offset();
                const elementH = $elementoReferencia.outerHeight();
                const modalW = $modal.outerWidth();
                const modalH = $modal.outerHeight();

                const winW = $(window).width();
                const winH = $(window).height();
                const scrollT = $(window).scrollTop();
                const scrollL = $(window).scrollLeft();

                let left = offset.left;
                if (left + modalW > winW + scrollL - 12) {
                    left = (winW + scrollL) - modalW - 12;
                }
                if (left < scrollL + 12) {
                    left = scrollL + 12;
                }

                let top = offset.top + elementH + 8;
                if (top + modalH > winH + scrollT - 12) {
                    const topArriba = offset.top - modalH - 8;
                    if (topArriba >= scrollT + 12) {
                        top = topArriba;
                    }
                }

                $modal.css({
                    top: top,
                    left: left,
                    opacity: 1
                });
            }, 10);
        }
    };
})(jQuery);