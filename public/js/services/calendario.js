window.Calendario = (function ($) {

    const instancias = [];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

    /* =========================================================
        CREAR HTML INTERFAZ BASE
    ========================================================= */
    function crearHTML(config) {
        const esVertical = config.orientacion === 'vertical';
        const direccion = esVertical ? 'flex-direction:column;' : 'flex-direction:row;';

        let html = `
            <div class="calendario-wrapper"
                 style="width:100%; display:flex; ${direccion} gap:12px; box-sizing: border-box; position:relative;">
        `;

        if (config.tipo === 'rango') {
            html += `
                ${crearInputRango({
                    inputId: config.idInicio,
                    btnAnterior: config.idBtnInicioAnterior,
                    btnSiguiente: config.idBtnInicioSiguiente,
                    placeholder: 'Fecha inicio'
                })}

                ${crearInputRango({
                    inputId: config.idFin,
                    btnAnterior: config.idBtnFinAnterior,
                    btnSiguiente: config.idBtnFinSiguiente,
                    placeholder: 'Fecha final'
                })}
            `;
        }

        if (config.tipo === 'single') {
            html += `
                <div class="calendar-box">
                    <a class="btn w-35 h-35 btn-secondary rounded-md flex justify-center items-center" id="${config.idBtnAnterior}">
                        <i class="icon vf-ic_fluent_caret_left_24_filled fs-6"></i>
                    </a>
                    <input
                        type="text"
                        id="${config.idInput}"
                        class="input"
                        placeholder="Selecciona fecha"
                        readonly
                    >
                    <a class="btn w-35 h-35 btn-secondary rounded-md flex justify-center items-center" id="${config.idBtnSiguiente}">
                        <i class="icon vf-ic_fluent_caret_right_24_filled fs-6"></i>
                    </a>
                </div>
            `;
        }

        html += `</div>`;
        $(config.contenedor).html(html);
    }

    function crearInputRango(data) {
        return `
            <div class="calendar-box">
                <a class="btn w-35 h-35 btn-secondary rounded-md flex justify-center items-center" id="${data.btnAnterior}">
                    <i class="icon vf-ic_fluent_caret_left_24_filled fs-6"></i>
                </a>
                <input
                    type="text"
                    id="${data.inputId}"
                    class="input"
                    placeholder="${data.placeholder}"
                    readonly
                >
                <a class="btn w-35 h-35 btn-secondary rounded-md flex justify-center items-center" id="${data.btnSiguiente}">
                    <i class="icon vf-ic_fluent_caret_right_24_filled fs-6"></i>
                </a>
            </div>
        `;
    }

    /* =========================================================
        MOTOR DEL CALENDARIO CON SOPORTE MULTI-VISTA Y TECLADO
    ========================================================= */
    function crearInstanciaCalendario(config, $inputInicio, $inputFin) {
        let fechaActual = new Date();
        let rangoSeleccionado = {
            inicio: null,
            fin: null
        };
        let dibujandoRango = false;

        const minDate = config.minDate ? new Date(config.minDate) : null;
        const maxDate = config.maxDate ? new Date(config.maxDate) : null;

        if (minDate) minDate.setHours(0, 0, 0, 0);
        if (maxDate) maxDate.setHours(0, 0, 0, 0);

        let estadoVistas = {
            m1: 'dias',
            m2: 'dias'
        };

        const claseVista = config.tipo === 'rango' ? 'view-range' : 'view-single';

        let htmlBloquesMeses = `
            <div class="calendar-month-block" id="calendar-m1" data-block="m1" style="display:flex; flex-direction:column;">
                <div class="calendar-dp-controls">
                    <button type="button" class="calendar-dp-arrow btn-prev-m">◀</button>
                    <div class="calendar-dp-month-title"></div>
                    <button type="button" class="calendar-dp-arrow ${config.tipo === 'rango' ? 'hidden-arrow' : 'btn-next-m'} idx-next">▶</button>
                </div>
                <div class="calendar-dp-weekdays-container" style="display:grid; grid-template-columns: repeat(7, 1fr);"></div>
                <div class="calendar-dp-grid-wrapper ocultar-scroll" style="max-height: 160px; overflow-y: auto; overflow-x: hidden;">
                    <div class="calendar-dp-grid"></div>
                </div>
            </div>
        `;

        if (config.tipo === 'rango') {
            htmlBloquesMeses += `
                <div class="calendar-month-block" id="calendar-m2" data-block="m2" style="display:flex; flex-direction:column;">
                    <div class="calendar-dp-controls">
                        <button type="button" class="calendar-dp-arrow hidden-arrow idx-prev">◀</button>
                        <div class="calendar-dp-month-title"></div>
                        <button type="button" class="calendar-dp-arrow btn-next-m">▶</button>
                    </div>
                    <div class="calendar-dp-weekdays-container" style="display:grid; grid-template-columns: repeat(7, 1fr);"></div>
                    <div class="calendar-dp-grid-wrapper ocultar-scroll" style="max-height: 160px; overflow-y: auto; overflow-x: hidden;">
                        <div class="calendar-dp-grid"></div>
                    </div>
                </div>
            `;
        }

        const $wrapper = $inputInicio.closest('.calendario-wrapper');
        const $picker = $(`
            <div class="calendar-datepicker ${claseVista}" style="position:absolute; z-index:9999; background:#fff;">
                <div class="calendar-months-container" style="display:flex; width:100%; gap:16px; box-sizing:border-box;">
                    ${htmlBloquesMeses}
                </div>
            </div>
        `);

        $picker.find('.calendar-month-block').css({ 'flex': '1', 'box-sizing': 'border-box' });
        $wrapper.append($picker);
        $picker.hide();

        function posicionarPicker() {
            const wrapperWidth = $wrapper.outerWidth();
            const wrapperHeight = $wrapper.outerHeight();
            const pickerHeight = $picker.outerHeight();
            const wrapperOffset = $wrapper.offset();

            $picker.css({
                width: wrapperWidth + 'px',
                left: '0px',
                right: 'auto',
                boxSizing: 'border-box'
            });

            if (wrapperOffset) {
                const espacioAbajo = $(window).height() - (wrapperOffset.top + wrapperHeight);
                if (espacioAbajo < pickerHeight && wrapperOffset.top > pickerHeight) {
                    $picker.css({
                        top: (-pickerHeight - 8) + 'px',
                        bottom: 'auto'
                    });
                    return;
                }
            }

            $picker.css({
                top: (wrapperHeight + 8) + 'px',
                bottom: 'auto'
            });
        }

        function asegurarFocoTeclado() {
            const isGridDays = estadoVistas['m1'] === 'dias';
            const $celdas = isGridDays 
                ? $picker.find('.calendar-dp-day:not(.empty), .calendar-dp-item') 
                : $picker.find('.calendar-dp-item');

            if (!$celdas.filter('.keyboard-focus').length) {
                let $inicial = $celdas.filter('.selected-endpoint').first(); 
                
                if (!$inicial.length) {
                    $inicial = $celdas.filter('.today-current').first();
                }
                if (!$inicial.length) {
                    $inicial = $celdas.not('.disabled-day').first();
                }

                $celdas.removeClass('keyboard-focus');
                if ($inicial.length) {
                    $inicial.addClass('keyboard-focus');
                }
            }
        }

        function renderizar() {
            const año1 = fechaActual.getFullYear();
            const mes1 = fechaActual.getMonth();
            renderizarCuerpo($('#calendar-m1', $picker), año1, mes1, 'm1');

            if (config.tipo === 'rango') {
                let año2 = año1;
                let mes2 = mes1 + 1;
                if (mes2 > 11) {
                    mes2 = 0;
                    año2++;
                }
                renderizarCuerpo($('#calendar-m2', $picker), año2, mes2, 'm2');
            }
            asegurarFocoTeclado();
            posicionarPicker();
        }

        function renderizarCuerpo($bloque, año, mes, claveBloque) {
            const vista = estadoVistas[claveBloque];
            const $wdayContainer = $bloque.find('.calendar-dp-weekdays-container').empty();
            const $grid = $bloque.find('.calendar-dp-grid').empty();

            $grid.removeClass('grid-days grid-months grid-years grid-decades');

            if (vista === 'dias') {
                $wdayContainer.show();
                diasSemana.forEach(d => $wdayContainer.append(`<div class="calendar-dp-wday" style="text-align:center; font-weight:bold; font-size:12px;">${d}</div>`));
                
                $grid.addClass('grid-days');
                $bloque.find('.calendar-dp-month-title').text(`${meses[mes]} ${año}`);

                const primerDiaIndex = (new Date(año, mes, 1).getDay() + 6) % 7;
                const totalDias = new Date(año, mes + 1, 0).getDate();

                for (let i = 0; i < primerDiaIndex; i++) {
                    $grid.append('<div class="calendar-dp-day empty"></div>');
                }

                const hoy = new Date();
                for (let dia = 1; dia <= totalDias; dia++) {
                    const celdaFecha = new Date(año, mes, dia);
                    celdaFecha.setHours(0, 0, 0, 0);
                    let clases = ['calendar-dp-day'];

                    if (celdaFecha.toDateString() === hoy.toDateString()) clases.push('today-current');

                    if ((minDate && celdaFecha < minDate) || (maxDate && celdaFecha > maxDate)) {
                        clases.push('disabled-day');
                    }

                    if (config.tipo === 'rango') {
                        if (rangoSeleccionado.inicio && celdaFecha.toDateString() === rangoSeleccionado.inicio.toDateString()) {
                            clases.push('selected-endpoint');
                        } else if (rangoSeleccionado.fin && celdaFecha.toDateString() === rangoSeleccionado.fin.toDateString()) {
                            clases.push('selected-endpoint');
                        } else if (rangoSeleccionado.inicio && rangoSeleccionado.fin && celdaFecha > rangoSeleccionado.inicio && celdaFecha < rangoSeleccionado.fin) {
                            clases.push('in-range');
                        }
                    } else {
                        if (rangoSeleccionado.inicio && celdaFecha.toDateString() === rangoSeleccionado.inicio.toDateString()) {
                            clases.push('selected-endpoint');
                        }
                    }

                    const $diaCelda = $(`<div class="${clases.join(' ')}">${dia}</div>`);
                    $diaCelda.data('fecha', celdaFecha);
                    $grid.append($diaCelda);
                }
            } else {
                $wdayContainer.hide();
                
                if (vista === 'meses') {
                    $grid.addClass('grid-months');
                    $bloque.find('.calendar-dp-month-title').text(año);

                    meses.forEach((m, index) => {
                        let clases = ['calendar-dp-item'];
                        const pDiaMes = new Date(año, index, 1);
                        const uDiaMes = new Date(año, index + 1, 0);
                        if ((minDate && uDiaMes < minDate) || (maxDate && pDiaMes > maxDate)) {
                            clases.push('disabled-day');
                        }
                        if (rangoSeleccionado.inicio && rangoSeleccionado.inicio.getFullYear() === año && rangoSeleccionado.inicio.getMonth() === index) {
                            clases.push('selected-endpoint');
                        }
                        const $item = $(`<div class="${clases.join(' ')}">${m.substring(0, 3)}</div>`);
                        $item.data('mes-idx', index);
                        $grid.append($item);
                    });
                } else if (vista === 'años') {
                    $grid.addClass('grid-years');
                    const decadaInicio = Math.floor(año / 10) * 10;
                    $bloque.find('.calendar-dp-month-title').text(`${decadaInicio}-${decadaInicio + 9}`);

                    for (let i = decadaInicio; i <= decadaInicio + 9; i++) {
                        let clases = ['calendar-dp-item'];
                        if (i < decadaInicio || i > decadaInicio + 9) clases.push('out-of-bounds');
                        if ((minDate && i < minDate.getFullYear()) || (maxDate && i > maxDate.getFullYear())) {
                            clases.push('disabled-day');
                        }
                        if (rangoSeleccionado.inicio && rangoSeleccionado.inicio.getFullYear() === i) clases.push('selected-endpoint');
                        const $item =$(`<div class="${clases.join(' ')}">${i}</div>`);
                        $item.data('año-val', i);
                        $grid.append($item);
                    }
                } else if (vista === 'decades') {
                    $grid.addClass('grid-decades');
                    const sigloInicio = Math.floor(año / 100) * 100;
                    $bloque.find('.calendar-dp-month-title').text(`${sigloInicio}-${sigloInicio + 99}`);

                    for (let i = sigloInicio; i <= sigloInicio + 90; i += 10) {
                        let clases = ['calendar-dp-item'];
                        if (i < sigloInicio || i > sigloInicio + 99) clases.push('out-of-bounds');
                        if ((minDate && (i + 9) < minDate.getFullYear()) || (maxDate && i > maxDate.getFullYear())) {
                            clases.push('disabled-day');
                        }
                        const textDecada = `${i}-${i+9}`;
                        const $item =$(`<div class="${clases.join(' ')}" style="font-size:11px;">${textDecada}</div>`);
                        $item.data('decada-val', i);
                        $grid.append($item);
                    }
                }
            }
        }

        // Formato visual amigable para el input (Ej: Jue, 15 Oct)
        function formatearFechaVisual(date) {
            if (!date) return '';
            const d = date.getDate();
            const m = meses[date.getMonth()].substring(0, 3);
            const a = date.getFullYear();
            const diasS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            return `${diasS[date.getDay()]}, ${d} ${m} ${a}`;
        }

        // Formato estándar SQL / Base de Datos (YYYY-MM-DD)
        function formatearFechaBD(date) {
            if (!date) return '';
            const año = date.getFullYear();
            const mes = String(date.getMonth() + 1).padStart(2, '0');
            const dia = String(date.getDate()).padStart(2, '0');
            return `${año}-${mes}-${dia}`;
        }

        /* --- MÉTODOS DE INSTANCIA ACCESIBLES --- */
        const instanciaPublica = {
            moverDia: function (tipoInput, cantidad) {
                let target = (config.tipo === 'rango' && tipoInput !== 'inicio') ? rangoSeleccionado.fin : rangoSeleccionado.inicio;
                if (!target) target = new Date();

                let nuevaFecha = new Date(target);
                nuevaFecha.setDate(nuevaFecha.getDate() + cantidad);
                nuevaFecha.setHours(0, 0, 0, 0);

                if (minDate && nuevaFecha < minDate) return;
                if (maxDate && nuevaFecha > maxDate) return;

                if (config.tipo === 'rango') {
                    if (tipoInput === 'inicio') rangoSeleccionado.inicio = nuevaFecha;
                    else rangoSeleccionado.fin = nuevaFecha;

                    if (rangoSeleccionado.inicio && rangoSeleccionado.fin && rangoSeleccionado.inicio > rangoSeleccionado.fin) {
                        if (tipoInput === 'inicio') rangoSeleccionado.inicio = new Date(rangoSeleccionado.fin);
                        else rangoSeleccionado.fin = new Date(rangoSeleccionado.inicio);
                    }

                    $inputInicio.val(formatearFechaVisual(rangoSeleccionado.inicio));
                    if ($inputFin)$inputFin.val(formatearFechaVisual(rangoSeleccionado.fin));
                    
                    // Almacenamos el formato de BD en los inputs mediante data-attributes opcionales si lo requieres
                    $inputInicio.attr('data-date-db', formatearFechaBD(rangoSeleccionado.inicio));
                    if ($inputFin)$inputFin.attr('data-date-db', formatearFechaBD(rangoSeleccionado.fin));

                    if (config.onChange) config.onChange([formatearFechaBD(rangoSeleccionado.inicio), formatearFechaBD(rangoSeleccionado.fin)]);
                } else {
                    rangoSeleccionado.inicio = nuevaFecha;
                    $inputInicio.val(formatearFechaVisual(rangoSeleccionado.inicio));$inputInicio.attr('data-date-db', formatearFechaBD(rangoSeleccionado.inicio));
                    
                    if (config.onChange) config.onChange(formatearFechaBD(rangoSeleccionado.inicio));
                }

                fechaActual = new Date(nuevaFecha);
                estadoVistas.m1 = 'dias';
                estadoVistas.m2 = 'dias';
                renderizar();
            },
            getValor: function() {
                if (config.tipo === 'rango') {
                    return {
                        inicio: formatearFechaBD(rangoSeleccionado.inicio),
                        fin: formatearFechaBD(rangoSeleccionado.fin),
                        inicioDate: rangoSeleccionado.inicio,
                        finDate: rangoSeleccionado.fin
                    };
                }
                return {
                    fecha: formatearFechaBD(rangoSeleccionado.inicio),
                    fechaDate: rangoSeleccionado.inicio
                };
            },
            setRange: function(fInicio, fFin = null) {
                if (fInicio) {
                    let stringInicio = typeof fInicio === 'string' ? fInicio.replace(/-/g, '/') : fInicio;
                    rangoSeleccionado.inicio = new Date(stringInicio);
                    rangoSeleccionado.inicio.setHours(0, 0, 0, 0);
                    $inputInicio.val(formatearFechaVisual(rangoSeleccionado.inicio));$inputInicio.attr('data-date-db', formatearFechaBD(rangoSeleccionado.inicio));
                    fechaActual = new Date(rangoSeleccionado.inicio);
                } else {
                    rangoSeleccionado.inicio = null;
                    $inputInicio.val('');$inputInicio.removeAttr('data-date-db');
                }
            
                if (config.tipo === 'rango') {
                    if (fFin) {
                        let stringFin = typeof fFin === 'string' ? fFin.replace(/-/g, '/') : fFin;
                        rangoSeleccionado.fin = new Date(stringFin);
                        rangoSeleccionado.fin.setHours(0, 0, 0, 0);
                        if ($inputFin) {
                            $inputFin.val(formatearFechaVisual(rangoSeleccionado.fin));$inputFin.attr('data-date-db', formatearFechaBD(rangoSeleccionado.fin));
                        }
                    } else {
                        rangoSeleccionado.fin = null;
                        if ($inputFin) {
                            $inputFin.val('');$inputFin.removeAttr('data-date-db');
                        }
                    }
                }
                dibujandoRango = false;
                renderizar();
            },
            limpiar: function() {
                rangoSeleccionado = { inicio: null, fin: null };
                dibujandoRango = false;
                $inputInicio.val('').removeAttr('data-date-db');
                if ($inputFin)$inputFin.val('').removeAttr('data-date-db');
                renderizar();
                if (config.onChange) config.onChange(config.tipo === 'rango' ? [null, null] : null);
            }
        };

        /* --- HOVER DINÁMICO DE RANGOS --- */
        $picker.off('mouseenter').on('mouseenter', '.calendar-dp-day:not(.empty):not(.disabled-day)', function () {
            if (!dibujandoRango || config.tipo !== 'rango' || !rangoSeleccionado.inicio) return;

            const fechaHover = $(this).data('fecha');

            $picker.find('.calendar-dp-day:not(.empty)').each(function () {
                const fechaCelda = $(this).data('fecha');
                if ($(this).hasClass('disabled-day')) return;

                $(this).removeClass('in-range selected-endpoint');

                if (fechaCelda.toDateString() === rangoSeleccionado.inicio.toDateString()) {
                    $(this).addClass('selected-endpoint');
                } else if (fechaCelda > rangoSeleccionado.inicio && fechaCelda <= fechaHover) {
                    if (fechaCelda.toDateString() === fechaHover.toDateString()) {
                        $(this).addClass('selected-endpoint');
                    } else {
                        $(this).addClass('in-range');
                    }
                }
            });
        });

        /* --- EVENTO CLICK EN EL TÍTULO --- */
        $picker.off('click', '.calendar-dp-month-title').on('click', '.calendar-dp-month-title', function (e) {
            e.stopPropagation();
            const claveBloque = $(this).closest('.calendar-month-block').data('block');
            const vistaActual = estadoVistas[claveBloque];

            if (vistaActual === 'dias') estadoVistas[claveBloque] = 'meses';
            else if (vistaActual === 'meses') estadoVistas[claveBloque] = 'años';
            else if (vistaActual === 'años') estadoVistas[claveBloque] = 'decades';

            renderizar();
        });

        /* --- CLICS EN LAS CELDAS INTERNAS --- */
        function seleccionarCelda($elemento) {
            if ($elemento.hasClass('disabled-day')) return;

            const claveBloque = $elemento.closest('.calendar-month-block').data('block');
            const vistaActual = estadoVistas[claveBloque];

            if (vistaActual === 'decades') {
                const decadaElegida = $elemento.data('decada-val');
                fechaActual.setFullYear(decadaElegida);
                estadoVistas[claveBloque] = 'años';
                renderizar();
            } else if (vistaActual === 'años') {
                const añoElegido = $elemento.data('año-val');
                fechaActual.setFullYear(añoElegido);
                estadoVistas[claveBloque] = 'meses';
                renderizar();
            } else if (vistaActual === 'meses') {
                const mesElegido = $elemento.data('mes-idx');
                fechaActual.setMonth(mesElegido);
                estadoVistas[claveBloque] = 'dias';
                renderizar();
            } else if (vistaActual === 'dias' && !$elemento.hasClass('empty')) {
                const fechaClic = $elemento.data('fecha');

                if (config.tipo === 'rango') {
                    if (!rangoSeleccionado.inicio || (rangoSeleccionado.inicio && rangoSeleccionado.fin)) {
                        rangoSeleccionado.inicio = fechaClic;
                        rangoSeleccionado.fin = null;
                        dibujandoRango = true;
                        $inputInicio.val(formatearFechaVisual(fechaClic));$inputInicio.attr('data-date-db', formatearFechaBD(fechaClic));
                        if ($inputFin) {
                            $inputFin.val('');$inputFin.removeAttr('data-date-db');
                        }
                    } else if (fechaClic < rangoSeleccionado.inicio) {
                        rangoSeleccionado.inicio = fechaClic;
                        $inputInicio.val(formatearFechaVisual(fechaClic));$inputInicio.attr('data-date-db', formatearFechaBD(fechaClic));
                    } else {
                        rangoSeleccionado.fin = fechaClic;
                        dibujandoRango = false;
                        if ($inputFin) {
                            $inputFin.val(formatearFechaVisual(fechaClic));$inputFin.attr('data-date-db', formatearFechaBD(fechaClic));
                        }
                        $picker.fadeOut(150);
                        if (config.onChange) {
                            config.onChange([formatearFechaBD(rangoSeleccionado.inicio), formatearFechaBD(rangoSeleccionado.fin)]);
                        }
                    }
                } else {
                    rangoSeleccionado.inicio = fechaClic;
                    $inputInicio.val(formatearFechaVisual(rangoSeleccionado.inicio));
                    $inputInicio.attr('data-date-db', formatearFechaBD(rangoSeleccionado.inicio));$picker.fadeOut(150);
                    if (config.onChange) {
                        config.onChange(formatearFechaBD(rangoSeleccionado.inicio));
                    }
                }
                renderizar();
            }
        }

        $picker.off('click', '.calendar-dp-grid .calendar-dp-item, .calendar-dp-grid .calendar-dp-day').on('click', '.calendar-dp-grid .calendar-dp-item, .calendar-dp-grid .calendar-dp-day', function (e) {
            e.stopPropagation();
            seleccionarCelda($(this));
        });

        /* =========================================================
            CONTROL DE TECLADO LIGADO AL INPUT
        ========================================================= */
        function manejarTecladoInput($inputActual, tipoInputStr) {$inputActual.off('keydown.calendarioKey').on('keydown.calendarioKey', function (e) {
                const isOpen = $picker.is(':visible');
                const teclasValidas = ['Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '];

                if (!teclasValidas.includes(e.key) && e.keyCode !== 13) return;

                e.preventDefault();
                e.stopImmediatePropagation();

                if (!isOpen) {
                    if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                        instanciaPublica.moverDia(tipoInputStr, -1);
                    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                        instanciaPublica.moverDia(tipoInputStr, 1);
                    } else if (e.key === 'Enter' || e.keyCode === 13) {
                        const tieneFecha = (tipoInputStr === 'inicio') ? rangoSeleccionado.inicio : rangoSeleccionado.fin;
                        
                        if (tieneFecha) {
                            if (config.tipo === 'rango') {
                                if (tipoInputStr === 'inicio') {
                                    if ($inputFin && $inputFin.length) {$inputFin.focus();
                                    }
                                } else {
                                    const $inputs =$(config.contenedor).find('input');
                                    const indexInput = $inputs.index($inputActual);
                                    if (indexInput < $inputs.length - 1) {$inputs.eq(indexInput + 1).focus();
                                    }
                                }
                            } else {
                                const $inputsAll =$('input, button, select, textarea').filter(':visible');
                                const idx = $inputsAll.index($inputActual);
                                if (idx !== -1 && idx < $inputsAll.length - 1) {$inputsAll.eq(idx + 1).focus();
                                }
                            }
                        } else {
                            $inputActual.trigger('click');
                        }
                    }
                    return;
                }

                if (e.key === 'Enter' || e.keyCode === 13) {
                    let $celdaActiva =$picker.find('.calendar-dp-day.keyboard-focus, .calendar-dp-item.keyboard-focus').first();
                    if (!$celdaActiva.length) {
                        $celdaActiva =$picker.find('.calendar-dp-day.today-current').first();
                        if (!$celdaActiva.length) {
                            $celdaActiva =$picker.find('.calendar-dp-day:not(.empty):not(.disabled-day)').first();
                        }
                    }
                    if ($celdaActiva.length) {
                        seleccionarCelda($celdaActiva);
                    }
                    return;
                }

                const isGridDays = estadoVistas['m1'] === 'dias';
                const $celdas = isGridDays 
                    ? $picker.find('.calendar-dp-day:not(.empty)') 
                    : $picker.find('.calendar-dp-item');

                let $activa =$celdas.filter('.keyboard-focus');

                if (!$activa.length) {
                    asegurarFocoTeclado();
                    $activa =$celdas.filter('.keyboard-focus');
                }

                let index = $celdas.index($activa);
                const colCount = isGridDays ? 7 : 4;

                if (e.key === 'ArrowRight') index++;
                else if (e.key === 'ArrowLeft') index--;
                else if (e.key === 'ArrowDown') index += colCount;
                else if (e.key === 'ArrowUp') index -= colCount;

                if (index >= $celdas.length) {
                    fechaActual.setMonth(fechaActual.getMonth() + 1);
                    renderizar();
                    const $nuevasCeldas = isGridDays ? $picker.find('.calendar-dp-day:not(.empty)') : $picker.find('.calendar-dp-item');$nuevasCeldas.removeClass('keyboard-focus').first().addClass('keyboard-focus');
                    return;
                } else if (index < 0) {
                    fechaActual.setMonth(fechaActual.getMonth() - 1);
                    renderizar();
                    const $nuevasCeldas = isGridDays ? $picker.find('.calendar-dp-day:not(.empty)') : $picker.find('.calendar-dp-item');$nuevasCeldas.removeClass('keyboard-focus').last().addClass('keyboard-focus');
                    return;
                }

                if (index >= 0 && index < $celdas.length) {$celdas.removeClass('keyboard-focus');
                    const $siguienteCelda = $celdas.eq(index);$siguienteCelda.addClass('keyboard-focus');

                    const $gridWrapper =$siguienteCelda.closest('.calendar-dp-grid-wrapper');
                    if ($gridWrapper.length) {
                        const elemTop = $siguienteCelda.position().top;
                        if (elemTop < 0 || elemTop > $gridWrapper.height()) {
                            $gridWrapper.scrollTop($gridWrapper.scrollTop() + elemTop);
                        }
                    }
                }
            });
        }

        manejarTecladoInput($inputInicio, 'inicio');
        if ($inputFin) manejarTecladoInput($inputFin, 'fin');

        /* --- CONTROLADORES NAVEGACIÓN FLECHAS --- */
        $picker.find('.btn-prev-m, .idx-prev').off('click').on('click', (e) => {
            e.stopPropagation();
            const claveBloque = $(e.target).closest('.calendar-month-block').data('block') || 'm1';
            const vista = estadoVistas[claveBloque];

            if (vista === 'dias') fechaActual.setMonth(fechaActual.getMonth() - 1);
            else if (vista === 'meses') fechaActual.setFullYear(fechaActual.getFullYear() - 1);
            else if (vista === 'años') fechaActual.setFullYear(fechaActual.getFullYear() - 10);
            else if (vista === 'decades') fechaActual.setFullYear(fechaActual.getFullYear() - 100);

            renderizar();
        });

        $picker.find('.btn-next-m, .idx-next').off('click').on('click', (e) => {
            e.stopPropagation();
            const claveBloque = $(e.target).closest('.calendar-month-block').data('block') || 'm1';
            const vista = estadoVistas[claveBloque];

            if (vista === 'dias') fechaActual.setMonth(fechaActual.getMonth() + 1);
            else if (vista === 'meses') fechaActual.setFullYear(fechaActual.getFullYear() + 1);
            else if (vista === 'años') fechaActual.setFullYear(fechaActual.getFullYear() + 10);
            else if (vista === 'decades') fechaActual.setFullYear(fechaActual.getFullYear() + 100);

            renderizar();
        });

        $(document).off('click.calendarioGlobal').on('click.calendarioGlobal', function (e) {
            if (!$(e.target).closest('.calendario-wrapper').length) {$('.calendar-datepicker').fadeOut(150);
                dibujandoRango = false;
                estadoVistas.m1 = 'dias';
                estadoVistas.m2 = 'dias';
            }
        });

        $inputInicio.off('click').on('click', function () {
            $('.calendar-datepicker').not($picker).hide();
            renderizar();
            $picker.fadeIn(150);
        });

        return instanciaPublica;
    }

    return {
        init: function (config) {
            crearHTML(config);
            const $inputInicio =$(`#${config.idInput || config.idInicio}`);
            const $inputFin = config.idFin ? $(`#${config.idFin}`) : null;
            const instancia = crearInstanciaCalendario(config, $inputInicio,$inputFin);
            instancias.push(instancia);
            return instancia;
        }
    };

})(jQuery);