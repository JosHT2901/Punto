/*
$.messenger.on('resultado_opcion', function (data, sourceWindow, origin) {
    if (!data || !data.opcion) return;
    
    // Cerramos la ventana modal actual y procesamos la opción
    if (typeof ModalAPI !== 'undefined' && ModalAPI.cerrar) {
        ModalAPI.cerrar();
    }
    
    ProcesarOpciones(data);
});

$(document).ready(function () {
    let inicializado = false;

    function InicilizarGestionarAtributos() {
        if (inicializado) return;
        inicializado = true;
        const listaOpciones = [
            { id: 1, texto: 'Pollo' },
            { id: 2, texto: 'Carne' },
            { id: 3, texto: 'Cordero' },
            { id: 4, texto: 'Mixto' }
        ];
        // Si quieres que el menú aparezca estático dentro de un div específico de tu HTML:
        MenuSelectorCheck.abrir(null, listaOpciones, {
            multiple: true,
            buscador: true,
            contenedorMenu: '#mi-contenedor-estatico',
            contenedorTags: '#contenedor-opciones-1',
            onChange: function (idsSeleccionados) {
                console.log("Seleccionados:", idsSeleccionados);
            }
        });
        // Inserción del select personalizado de unidades
        if (typeof InsertarCustomSelect === 'function') {
            InsertarCustomSelect({
                contenedor: '#contenedor-select-unidades-kilogramo',
                id: 'select-unidades',
                placeholder: 'Selecciona tipo...',
                opciones: [
                    { value: 'TIENDA', text: 'TIENDA' },
                    { value: 'BODEGA', text: 'BODEGA' },
                    { value: 'MATRIZ', text: 'MATRIZ' },
                    { value: 'CEDIS', text: 'CEDIS' },
                    { value: 'OFICINA', text: 'OFICINA' }
                ],
                buscador: true,
                onChange: () => {
                    if (typeof ValidarSucursal === 'function') ValidarSucursal();
                }
            });
        }
        window.calendario = Calendario.init({
            tipo: 'single',
            contenedor: '#contenedor-calendario',
            idInput: 'fechaSeleccionada',
            idBtnAnterior: 'btnMesAnterior',
            idBtnSiguiente: 'btnMesSiguiente',
            orientacion: 'horizontal',
            minDate: '2026-01-01',
            maxDate: '2026-12-31',
            onChange: function (fecha) {
                console.log("Fecha seleccionada:", fecha);
            }
        });
    }

    // Eventos globales delegados (fuera de la bandera para garantizar funcionamiento dinámico)
    $(document).on('click', '.btn-abrir-color', function (e) {
        e.preventDefault();
        const $el =$(this);
        const esChipExistente = $el.hasClass('chip-color-agregado');

        if (esChipExistente) {
            let colorActual = rgbToHex($el.css('background-color')) || '#0fbd52';

            ColorPickerService.abrir($el, function (nuevoColor) {$el.css('background-color', nuevoColor).attr('title', nuevoColor);
            }, colorActual);

        } else {
            let colorPorDefecto = '#0fbd52';

            ColorPickerService.abrir($el, function (colorHex) {
                ProcesarColor(colorHex);
            }, colorPorDefecto);
        }
    });

    $(document).on('click', '#atributos-nueva-opcion', function (e) {
        e.preventDefault();
    
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
                        type_input: 'decimal',
                        mensajes: {
                            vacio: 'Ingresa una opción válida',
                            error: ''
                        }
                    };
        
                    $.messenger.send(iframeElement, 'datos_iniciales', datos);
                }
            );
        }
    });

    // Inicialización de la lógica base
    if (window.regimenes) {
        InicilizarGestionarAtributos();
    }

    $(document).on('datosListos', function () {
        InicilizarGestionarAtributos();
    });
});

// Función auxiliar para convertir RGB a HEX
function rgbToHex(rgb) {
    if (!rgb || rgb.startsWith('#')) return rgb;
    if (rgb === 'transparent' || rgb === 'rgba(0, 0, 0, 0)') return '#0fbd52';

    const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
    if (!match) return rgb;

    return "#" + ((1 << 24) + (parseInt(match[1]) << 16) + (parseInt(match[2]) << 8) + parseInt(match[3])).toString(16).slice(1);
}

// Función para procesar y renderizar un nuevo chip de color
function ProcesarColor(color) {
    if (!color) return;

    const $nuevoChip =$(`
        <div class="rounded-xl shadow-md cursor-pointer transition-transform hover:scale-105 btn-abrir-color chip-color-agregado" style="
            background-color: ${color}; 
            width: 30px; 
            height: 30px; 
            display: inline-block;
            border: 1px solid rgba(0,0,0,0.1);
        " title="${color}"></div>
    `);

    $("#contenedor-colores").append($nuevoChip);
}

// Función para procesar y renderizar las opciones recibidas del modal
function ProcesarOpciones(data) {
    if (!data || !data.opcion) return;

    const $nuevaOpcion =$(`
        <span class="rounded-8 bg-brand-soft p-2 text-brand-blue fw-600 fs-3 inline-flex items-center gap-2 shadow-xs h-30">
            ${data.opcion}
            <button class="btn btn-option rounded-3xl p-1"><i class="ph ph-x"></i></button>
        </span>
    `);

    $("#contenedor-opciones").append($nuevaOpcion);
}*/

$(document).ready(function () {
    // Lista con TODOS los tipos de atributos soportados por el catálogo maestro
    const todosLosAtributos = [
        { texto: 'Nombre del Producto', tipo: 'texto' },
        { texto: 'Descripción Detallada', tipo: 'textarea' },
        { texto: 'Precio Unitario', tipo: 'numero' },
        { texto: 'Peso del Empaque', tipo: 'peso' },
        { texto: 'Capacidad o Volumen', tipo: 'volumen' },
        { texto: 'Dimensiones o Longitud', tipo: 'longitud' },
        { texto: 'Variantes o Tallas', tipo: 'seleccion', opciones: ['Chico', 'Mediano', 'Grande'] },
        { texto: 'Características Múltiples', tipo: 'seleccion_multiple' },
        { texto: 'Colores Disponibles', tipo: 'color' },
        { texto: '¿Producto Activo?', tipo: 'booleano' },
        { texto: 'Fecha de Vencimiento', tipo: 'fecha' }
    ];

    // Inicialización del servicio apuntando a tu contenedor wizard
    AtributoManager.init({
        listaAtributos: todosLosAtributos,
        contenedor: '#contenedor-atributos'
    });

    // Botón para probar la extracción de todos los valores capturados
    $(document).on('click', '#btn-guardar', function(e) {
        e.preventDefault();
        
        const valoresCapturados = AtributoManager.obtenerValores();
        console.log("Valores estructurados de todos los atributos:", valoresCapturados);
    });
});