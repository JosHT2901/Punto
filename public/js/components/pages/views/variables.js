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
$("#variables-boton-guardar").on('click', async function (e) {
    e.preventDefault();

    const simbolo_moneda = CustomSelect.getValue("#select-moneda");
    const codigo_iso = CustomSelect.getValue("#select-codigo-iso");
    const redondear_precios = $("#variables-check-round").is(":checked") ? 1 : 0;
    const bloquear_stock_cero = $("#variables-check-limit").is(":checked") ? 1 : 0;

    if (!simbolo_moneda) {
        return MostrarAlerta("Selecciona el símbolo de moneda", 220);
    }

    if (!codigo_iso) {
        return MostrarAlerta("Selecciona el código de moneda", 220);
    }

    // Las llaves del objeto coinciden ahora con los índices que espera PHP ($datos['simbolo_moneda'], etc.)
    let data = {
        simbolo_moneda,
        codigo_iso,
        redondear_precios,
        bloquear_stock_cero
    };

    Guardar_Gestion_Variables(data);
});

$("#variables-boton-atras").off('click').on('click',async function (e) {
    window.location.href="ajustes.php"  
})