window.AtributoManager = (function ($) {
    let opcionesGlobales = [];
    let configGlobal = {};
    let instanciaId = 'msc_' + Math.random().toString(36).substring(2, 9);
    let ultimoAtributoSeleccionado = null;

    const catalogoTiposDatos = [
        { codigo: "texto", etiqueta: "Texto Libre", requiere_opciones: false, requiere_unidad: false },
        { codigo: "textarea", etiqueta: "Párrafo / Texto Largo", requiere_opciones: false, requiere_unidad: false },
        { codigo: "numero", etiqueta: "Número / Cantidad", requiere_opciones: false, requiere_unidad: false },
        { codigo: "peso", etiqueta: "Peso", requiere_opciones: false, requiere_unidad: true, unidades_disponibles: ["kg", "g", "lb", "oz", "ton"] },
        { codigo: "volumen", etiqueta: "Volumen / Capacidad", requiere_opciones: false, requiere_unidad: true, unidades_disponibles: ["lt", "ml", "gal", "oz_fluida"] },
        { codigo: "longitud", etiqueta: "Longitud / Medida", requiere_opciones: false, requiere_unidad: true, unidades_disponibles: ["cm", "m", "mm", "pulg", "yd"] },
        { codigo: "seleccion", etiqueta: "Lista de Selección (Única)", requiere_opciones: true, requiere_unidad: false },
        { codigo: "seleccion_multiple", etiqueta: "Lista de Selección Múltiple", requiere_opciones: true, requiere_unidad: false },
        { codigo: "color", etiqueta: "Selector de Color", requiere_opciones: false, requiere_unidad: false },
        { codigo: "booleano", etiqueta: "Sí / No (Interruptor)", requiere_opciones: false, requiere_unidad: false },
        { codigo: "fecha", etiqueta: "Fecha de Caducidad / Vencimiento", requiere_opciones: false, requiere_unidad: false }
    ];

    const plantillas = {
        renderizarCampo: function(id, label, tipo) {
            const configTipo = catalogoTiposDatos.find(t => t.codigo === tipo) || { requiere_unidad: false, requiere_opciones: false };
            let htmlControl = '';

            if (tipo === 'color') {
                htmlControl = `
                    <div class="flex items-center gap-2 w-p-100">
                        <div class="flex-1 flex flex-wrap items-center gap-2 p-2 bg-slate-50/50 border border-slate-200/80 rounded-2xl min-h-[50px] transition-all" id="contenedor-colores-${id}"></div>
                        <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40 btn-abrir-color-dinamico" data-target-id="${id}">
                            <i class="vf-ic_fluent_add_24_filled fs-6"></i>
                        </a>
                    </div>
                `;
            } else if (tipo === 'texto') {
                htmlControl = `<input type="text" class="form-control w-p-100 p-2 border border-slate-200 rounded-8 atributo-valor input-mayusculas-${id}" placeholder="Escribe aquí...">`;
            } else if (tipo === 'textarea') {
                htmlControl = `<textarea class="form-control w-p-100 p-2 border border-slate-200 rounded-8 atributo-valor input-mayusculas-${id}" rows="3" placeholder="Notas u observaciones..."></textarea>`;
            } else if (tipo === 'numero') {
                htmlControl = `<input type="text" class="form-control w-p-100 p-2 border border-slate-200 rounded-8 atributo-valor input-decimales-numero-${id}" placeholder="0.00">`;
            } else if (tipo === 'booleano') {
                htmlControl = `
                    <div class="flex-1 flex flex-wrap items-center gap-2 p-2 bg-slate-50 border border-slate-200/80 rounded-8 justify-between">
                        <span class="fs-3 fw-600 text-slate-700">Habilitar ${label}</span>
                        <label class="toggle-switch pointer">
                            <input type="checkbox" class="atributo-toggle atributo-valor">
                            <div class="toggle-switch-background">
                                <div class="toggle-switch-handle"></div>
                            </div>
                        </label>
                    </div>
                `;
            } else if (tipo === 'fecha') {
                htmlControl = `<div class="w-p-100" id="contenedor-calendario-${id}"><input class="w-p-100" id="fecha-input-${id}"></div>`;
            } else if (configTipo.requiere_unidad) {
                htmlControl = `
                    <div class="w-p-100 h-40 flex gap-2">
                        <div class="flex-1 flex flex-wrap items-center gap-2">
                            <input type="text" class="form-control w-p-100 p-2 border border-slate-200 rounded-8 atributo-valor input-decimales-unidad-${id}" placeholder="0.00">
                        </div>
                        <div class="w-200 h-p-100 flex items-center gap-2" id="contenedor-unidad-${id}"></div>
                    </div>
                `;
            } else if (configTipo.requiere_opciones) {
                htmlControl = `
                    <div class="flex items-center gap-2 w-p-100">
                        <div class="flex-1 flex flex-wrap items-center gap-2 p-2 bg-slate-50/50 border border-slate-200/80 rounded-2xl min-h-[50px] transition-all contenedor-opciones-dinamico" id="contenedor-opciones-${id}"></div>
                        <a class="btn btn-secondary rounded-md flex-center shrink-0 w-40 h-40 btn-agregar-opcion-modal" data-atributo-id="${id}">
                            <i class="vf-ic_fluent_add_24_filled fs-6"></i>
                        </a>
                    </div>
                `;
            }

            // Cada atributo ocupa aprox el 50% de la fila (calc 50% con espacio de separación)
            return `
                <div class="row-gap-0 flex flex-column atributo-item animate-fade-in mb-4 px-2" style="flex: 0 0 50%; max-width: 50%; box-sizing: border-box;" data-atributo-id="${id}" data-tipo="${tipo}">
                    <label class="block mb-1 fs-3 fw-600 pl-2 text-slate-700">${label}</label>
                    <div class="flex items-center gap-2 w-p-100">
                        ${htmlControl}
                    </div>
                </div>
            `;
        }
    };

    $(document).ready(function () {
        if ($.messenger && typeof $.messenger.on === 'function') {
            $.messenger.on('resultado_opcion', function (data, sourceWindow, origin) {
                if (!data || !data.opcion) return;
                
                if (typeof ModalAPI !== 'undefined' && ModalAPI.cerrar) {
                    ModalAPI.cerrar();
                }
                
                if (ultimoAtributoSeleccionado) {
                    const opObj = opcionesGlobales.find(o => String(o.id) === String(ultimoAtributoSeleccionado));
                    if (opObj) {
                        if (!opObj.opciones) opObj.opciones = [];
                        opObj.opciones.push(data.opcion);
                    }

                    const $nuevoChip =$(`
                        <span class="rounded-8 bg-brand-soft p-2 text-brand-blue fw-600 fs-3 inline-flex items-center gap-2 shadow-xs h-30" data-valor="${data.opcion}">
                            ${data.opcion}
                            <button type="button" class="btn btn-option rounded-3xl p-1 btn-remover-opcion-chip"><i class="ph ph-x"></i></button>
                        </span>
                    `);
                    $(`#contenedor-opciones-${ultimoAtributoSeleccionado}`).append($nuevoChip);
                    ultimoAtributoSeleccionado = null;
                }
            });
        }

        $(document).on('click', '.btn-remover-opcion-chip', function(e) {
            e.preventDefault();
            $(this).closest('span').remove();
        });

        $(document).on('click', '.btn-agregar-opcion-modal', function (e) {
            e.preventDefault();
            ultimoAtributoSeleccionado = $(this).data('atributo-id');
        
            if (typeof CrearVentanaIframe === 'function') {
                CrearVentanaIframe(
                    'Ingresar opción',
                    'input.php',
                    '380px',
                    true,
                    true,
                    function (iframeElement) {
                        let datos = {
                            label: 'Ingresa la opción',
                            placeholder: 'Ej. Escribe aquí...',
                            type_input: 'text',
                            mensajes: { vacio: 'Ingresa una opción válida', error: '' }
                        };
                        $.messenger.send(iframeElement, 'datos_iniciales', datos);
                    }
                );
            }
        });

        $(document).on('click', '.btn-abrir-color-dinamico', function (e) {
            e.preventDefault();
            const $el =$(this);
            const targetId = $el.data('target-id');

            ColorPickerService.abrir($el, function (colorHex) {
                if (colorHex) {
                    const $nuevoChip =$(`
                        <div class="rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105 chip-color-agregado" style="
                            background-color: ${colorHex}; width: 30px; height: 30px; display: inline-block; border: 1px solid rgba(0,0,0,0.1);
                        " title="${colorHex}"></div>
                    `);
                    $(`#contenedor-colores-${targetId}`).append($nuevoChip);
                }
            }, '#0fbd52');
        });
    });

    return {
        init: function(configuracion) {
            configGlobal = $.extend({
                listaAtributos: [],
                contenedor: '#contenedor-atributos'
            }, configuracion);

            const $contenedor =$(configGlobal.contenedor);
            if (!$contenedor.length) return;

            $contenedor.empty();

            opcionesGlobales = configGlobal.listaAtributos.map((attr, index) => ({
                ...attr,
                id: attr.id || `attr_${instanciaId}_${index}`,
                opciones: attr.opciones || []
            }));

            opcionesGlobales.forEach(attr => {
                const htmlCampo = plantillas.renderizarCampo(attr.id, attr.texto || attr.etiqueta, attr.tipo);
                $contenedor.append(htmlCampo);

                setTimeout(() => {
                    const configTipo = catalogoTiposDatos.find(t => t.codigo === attr.tipo) || {};

                    if (typeof InputService !== 'undefined') {
                        if (attr.tipo === 'texto' || attr.tipo === 'textarea') {
                            InputService.aMayusculas(`.input-mayusculas-${attr.id}`);
                        }
                        if (attr.tipo === 'numero') {
                            InputService.numerosDecimales(`.input-decimales-numero-${attr.id}`, 2);
                        }
                        if (configTipo.requiere_unidad) {
                            let decimalesUnidad = (attr.tipo === 'peso') ? 3 : 2;
                            InputService.numerosDecimales(`.input-decimales-unidad-${attr.id}`, decimalesUnidad);
                        }
                    }

                    if (attr.tipo === 'fecha' && window.Calendario) {
                        Calendario.init({
                            tipo: 'single',
                            contenedor: `#contenedor-calendario-${attr.id}`,
                            idInput: `fecha-input-${attr.id}`,
                            orientacion: 'horizontal',
                            minDate: '2026-01-01',
                            maxDate: '2026-12-31'
                        });
                    }

                    if (configTipo.requiere_unidad && typeof InsertarCustomSelect === 'function') {
                        const opcionesUnidades = (configTipo.unidades_disponibles || []).map(u => ({ value: u, text: u }));
                        InsertarCustomSelect({
                            contenedor: `#contenedor-unidad-${attr.id}`,
                            id: `unidad-${attr.id}`,
                            placeholder: opcionesUnidades[0] ? opcionesUnidades[0].text : 'Unidad...',
                            opciones: opcionesUnidades,
                            buscador: false
                        });
                    }
                }, 50);
            });
        },

        obtenerValores: function() {
            let resultado = [];
            const $contenedor =$(configGlobal.contenedor);

            $contenedor.find('.atributo-item').each(function() {
                const $item =$(this);
                const id = $item.data('atributo-id');
                const tipo = $item.data('tipo');
                const opOriginal = opcionesGlobales.find(o => String(o.id) === String(id));
                const etiqueta = opOriginal ? (opOriginal.texto || opOriginal.etiqueta) : '';

                let valor = '';
                let unidad = null;
                const configTipo = catalogoTiposDatos.find(t => t.codigo === tipo) || {};

                if (tipo === 'texto' || tipo === 'textarea' || tipo === 'numero') {
                    valor = $item.find('.atributo-valor').val();
                } else if (configTipo.requiere_unidad) {
                    valor = $item.find('.atributo-valor').val();
                    const $unidadSelect =$item.find('.custom-select-input, select, input[id^="unidad-"]');
                    unidad = $unidadSelect.length ? $unidadSelect.val() : null;
                } else if (tipo === 'booleano') {
                    valor = $item.find('.atributo-valor').is(':checked');
                } else if (tipo === 'fecha') {
                    valor = $item.find('input[id^="fecha-input-"]').val();
                } else if (tipo === 'seleccion' || tipo === 'seleccion_multiple') {
                    let opcionesRegistradas = [];
                    $item.find('.contenedor-opciones-dinamico span').each(function() {
                        opcionesRegistradas.push($(this).data('valor'));
                    });
                    valor = opcionesRegistradas;
                } else if (tipo === 'color') {
                    let colores = [];
                    $item.find('.chip-color-agregado').each(function() {
                        colores.push($(this).attr('title'));
                    });
                    valor = colores;
                }

                resultado.push({
                    id: id,
                    etiqueta: etiqueta,
                    tipo: tipo,
                    valor: valor,
                    unidad: unidad
                });
            });

            return resultado;
        }
    };
})(jQuery);