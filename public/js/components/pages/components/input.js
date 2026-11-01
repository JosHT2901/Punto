$.messenger.on('datos_iniciales', function (data, sourceWindow, origin) {
    MostrarCargando('Obteniendo información...',false)
    const mayus = data.mayus ?? true;
    if (!data) return;

    // Asignamos textos dinámicos con respaldo por defecto
    if (data.label) {
        $("#label-input-nombre").text(data.label);
    }

    if (data.placeholder) {
        $("#input-nombre").attr('placeholder', data.placeholder);
    }
    if(data.valor)
    {
        $("#input-nombre").val(data.valor);
    }
    if(mayus)
    {
        InputService.aMayusculas('.input-mayus');
    }

    InputService.maxLength('.input-100',100)
    // Inicialización según el tipo de input solicitado
    if (data.type_input) {
        switch (data.type_input) {
            case 'decimal':
                if (typeof InputService !== 'undefined' && InputService.numerosDecimales) {
                    InputService.numerosDecimales("#input-nombre", 2, 'left', data.mensajes?.vacio || 'Ingresa un valor válido');
                }
                break;

            case 'entero':
                if (typeof InputService !== 'undefined' && InputService.numerosEnteros) {
                    InputService.numerosEnteros("#input-nombre", 'left', data.mensajes?.vacio || 'Ingresa un número entero');
                }
                break;

            case 'texto':
            default:
                break;
        }
    }

    // Almacenar mensajes de validación en el elemento para uso posterior
    if (data.mensajes) {
        $("#input-nombre").data('msg-vacio', data.mensajes.vacio);
        $("#input-nombre").data('msg-error', data.mensajes.error);
    }
    OcultarCargando()
    // Manejo del evento click en el botón siguiente (usamos .off().on() para evitar duplicados)
    $('#boton-siguiente').off('click').on('click', function (e) {
        e.preventDefault();

        const $input = $("#input-nombre");
        const valorIngresado = $input.val().trim();

        // Validamos si el campo está vacío correctamente usando .val()
        if (!valorIngresado) {
            const mensajeVacio = data.mensajes?.vacio || 'Ingresa una opción válida';
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta(mensajeVacio, 250, true);
            }
            return; // Detenemos la ejecución si está vacío
        }

        // Enviamos el resultado correcto hacia la ventana padre
        $.messenger.send(
            window.parent,
            data.evento, // Nombre del evento ajustado al contexto actual
            { 
                opcion: valorIngresado 
            },
            '*'
        );
    });
});