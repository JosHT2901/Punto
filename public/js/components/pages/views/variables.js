$(document).ready(async function () {
    let inicializado = false;

    function InicializarGestionarVariables() {
        if (inicializado) return;

        // Verificamos que window.monedas tenga datos válidos antes de continuar
        if (!window.monedas) return;

        inicializado = true;

        // Extraemos las opciones desde el JSON global cargado
        const opcionesISO = window.monedas.codigosISO || (Array.isArray(window.monedas) ? window.monedas : []);
        const opcionesMonedas = window.monedas.simbolosSoloIcono || [];

        console.log("Opciones ISO cargadas:", opcionesISO);

        InsertarCustomSelect({
            contenedor: '#contenedor-select-codigo-iso',
            id: 'select-codigo-iso',
            placeholder: 'Selecciona código ISO',
            opciones: opcionesISO,
            buscador: false
        });

        InsertarCustomSelect({
            contenedor: '#contenedor-select-moneda',
            id: 'select-moneda',
            placeholder: 'Selecciona una moneda',
            opciones: opcionesMonedas,
            buscador: false
        });

        InsertarCustomSelect({
            contenedor: '#contenedor-select-iva-porcentaje',
            id: 'select-iva-porcentaje',
            placeholder: 'Selecciona un porcentaje',
            opciones: [{
                    value: '16',
                    text: '16% (General)'
                },
                {
                    value: '8',
                    text: '8% (Fronterizo)'
                },
                {
                    value: '0',
                    text: '0% (Tasa cero)'
                },
                {
                    value: 'exento',
                    text: 'Exento de I.V.A.'
                }
            ],
            buscador: false
        });

        // 1. Inicializar el campo de números decimales para el porcentaje de comisión
        InputService.numerosDecimales("#input_terminal_porcentaje", 2, 'center', 'Ingresa el porcentaje de comisión');

        // 2. Control optimizado del switch para mostrar/ocultar el contenedor de comisión e IVA
        $("#check-comision-terminal").off('change').on('change', function () {
            const isChecked = $(this).is(":checked");
            $("#contenedor-comision-iva").toggleClass('d-none', !isChecked);
        }).triggerHandler('change'); 

        // Si ya existen variables cargadas de la base de datos, podemos asignarlas a los inputs aquí
        if (window.variablesMap) {
            if (window.variablesMap['simbolo_moneda']) {
                CustomSelect.setValue('#select-moneda', window.variablesMap['simbolo_moneda']);
            }
            if (window.variablesMap['codigo_iso']) {
                CustomSelect.setValue('#select-codigo-iso', window.variablesMap['codigo_iso']);
            }
            if (window.variablesMap['redondear_precios'] !== undefined) {
                $('#variables-check-round').prop('checked', window.variablesMap['redondear_precios'] == '1' || window.variablesMap['redondear_precios'] === true);
            }
            if (window.variablesMap['bloquear_stock_cero'] !== undefined) {
                $('#variables-check-limit').prop('checked', window.variablesMap['bloquear_stock_cero'] == '1' || window.variablesMap['bloquear_stock_cero'] === true);
            }
            if (window.variablesMap['incluir_comision_tarjeta'] !== undefined) {
                const incluirComision = window.variablesMap['incluir_comision_tarjeta'] == '1' || window.variablesMap['incluir_comision_tarjeta'] === true;
                $("#check-comision-terminal").prop('checked', incluirComision).trigger('change');
            }
            if (window.variablesMap['comision_tarjeta'] !== undefined) {
                $("#input_terminal_porcentaje").val(window.variablesMap['comision_tarjeta']);
            }
            if (window.variablesMap['iva_comision'] !== undefined) {
                CustomSelect.setValue('#select-iva-porcentaje', window.variablesMap['iva_comision']);
            }
        }
        OcultarCargando()
    }

    // Si los datos ya estaban listos al cargar el DOM
    if (window.monedas && window.variables) {
        InicializarGestionarVariables();
    }

    // Escucha el evento personalizado exacto que se dispara en el bloque de carga global
    $(document).off('datosListos.gestionVariables').on('datosListos.gestionVariables', function () {
        InicializarGestionarVariables();
    });
});


// Evento para guardar las variables del sistema
$("#variables-boton-guardar").off('click').on('click', async function (e) {
    e.preventDefault();


    const simbolo_moneda = CustomSelect.getValue("#select-moneda");
    const codigo_iso = CustomSelect.getValue("#select-codigo-iso");
    const redondear_precios = $("#variables-check-round").is(":checked") ? 1 : 0;
    const bloquear_stock_cero = $("#variables-check-limit").is(":checked") ? 1 : 0;
    
    // Captura de datos de comisión
    const incluir_comision_tarjeta = $("#check-comision-terminal").is(":checked") ? 1 : 0;
    const comision_tarjeta = incluir_comision_tarjeta ? ($("#input_terminal_porcentaje").val().trim() || '0.00') : '0.00';
    const iva_comision = incluir_comision_tarjeta ? (CustomSelect.getValue('#select-iva-porcentaje') || '0') : '0';

    // Validaciones básicas
    if (!simbolo_moneda) {
        return MostrarAlerta("Selecciona el símbolo de moneda", 220);
    }

    if (!codigo_iso) {
        return MostrarAlerta("Selecciona el código de moneda", 220);
    }

    if (incluir_comision_tarjeta && (isNaN(comision_tarjeta) || parseFloat(comision_tarjeta) <= 0)) {
        return MostrarAlerta("Ingresa un porcentaje de comisión válido", 220);
    }

    // Objeto con todas las variables mapeadas exactamente como las espera PHP
    const data = {
        simbolo_moneda,
        codigo_iso,
        redondear_precios,
        bloquear_stock_cero,
        incluir_comision_tarjeta,
        comision_tarjeta,
        iva_comision
    };

    await Guardar_Gestion_Variables(data);
    
});

$("#variables-boton-atras").off('click').on('click', async function (e) {
    window.location.href = "ajustes.php"
})