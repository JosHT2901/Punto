$.messenger.on('datos_iniciales', function (data, sourceWindow, origin) {
    const payload = data || {};
    if (payload.tipos_permitidos) {
        // Guardamos de forma segura si es multiple (por defecto true)
        window.multiple = payload.multiple !== undefined ? Boolean(payload.multiple) : true;
        let tiposArray = payload.tipos_permitidos;
        if (typeof tiposArray === 'string') {
            tiposArray = tiposArray.split(',').map(t => t.trim().replace(/^\./, ''));
        }

        Renderizar_Tarjetas_Archivo(tiposArray);
        OcultarCargando();
    }
});

$(document).ready(function(e) {
    MostrarCargando('Obteniendo información...', false);

    // Evento delegado para manejar la selección única si window.multiple es falso
    $(document).on('change', '.check-item', function() {
        if (!window.multiple && $(this).is(':checked')) {
            // Si no es múltiple, desmarcamos todos los demás
            $('.check-item').not(this).prop('checked', false);
        }
    });

    // Lógica del botón seguir / confirmar selección
    $("#boton-seguir").off('click').on('click', function(e) {
        e.preventDefault();
    
        // Recolectamos los tipos seleccionados
        const seleccionados = [];
        $('.check-item:checked').each(function() {
            const tipo = $(this).data('tipo');
            if (tipo) {
                seleccionados.push(tipo.toString().trim().replace(/^\./, ''));
            }
        });
    
        if (seleccionados.length === 0) {
            if (typeof MostrarAlerta === 'function') {
                MostrarAlerta('Debe seleccionar al menos un formato de archivo.');
            } else {
                alert('Debe seleccionar al menos un formato de archivo.');
            }
            return;
        }
    
        // Si es selección única y no múltiple, pasamos el string directo; si es múltiple, el array
        const resultadoFinal = window.multiple ? seleccionados : seleccionados[0];
    
        // Envío seguro utilizando el servicio de mensajería hacia la ventana padre
        if (typeof window.parent !== 'undefined') {
            if (typeof $.messenger !== 'undefined' && typeof $.messenger.send === 'function') {
                $.messenger.send(window.parent, 'tipo_seleccionado', resultadoFinal);
            } else if (typeof window.messenger !== 'undefined' && typeof window.messenger.send === 'function') {
                window.messenger.send(window.parent, 'tipo_seleccionado', resultadoFinal);
            } else {
                console.warn("$.messenger.send no está disponible para comunicarse con el padre.");
            }
        }
    });
});

function Renderizar_Tarjetas_Archivo(tipos = []) {
    if (!Array.isArray(tipos) || tipos.length === 0) return;

    // Determinamos si usamos 'checkbox' o 'radio'
    const tipoInput = window.multiple ? 'checkbox' : 'radio';
    
    const tarjetasHtml = tipos.map((tipo, index) => {
        const extensionLimpia = tipo.replace(/^\./, '');
        const urlIconoDinamico = FileIconService.obtenerPorExtension(extensionLimpia);
        const uniqueId = `check-archivo-${index}`;

        return `
            <label class="m-2 p-4 bg-white rounded-md d-flex flex-column justify-between align-items-center cursor-pointer position-relative shadow-sm" style="width: 110px; height: 110px; box-sizing: border-box;">
                <!-- Control dinámico según multiple -->
                <div class="position-absolute top-0 right-0 p-1">
                    <input type="${tipoInput}" id="${uniqueId}" name="archivo_seleccionado" class="check-item checkbox-round" data-tipo="${extensionLimpia}">
                </div>
                
                <!-- Icono centrado -->
                <div class="flex justify-center items-center flex-1 my-2">
                    <img src="${urlIconoDinamico}" alt="Icono" class="w-40 h-40" onerror="this.style.display='none'">
                </div>

                <!-- Texto de la extensión -->
                <div class="fw-600 fs-3 text-center w-p-150" style="font-size: 12px;">
                    <span>${extensionLimpia.toUpperCase()}</span>
                </div>
            </label>
        `;
    }).join('');

    $('#contenedor-tarjetas').html(tarjetasHtml);
}