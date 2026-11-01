const esperarDatosIniciales = new Promise((resolve) => {
    let recibido = false;

    if (window.$.messenger && typeof window.$.messenger.on === 'function') {
        window.$.messenger.on('datos_iniciales', function (data, sourceWindow, origin) {
            if (data && (data.id || data.ID)) {
                window.id_cliente = data.id || data.ID;
                window.seccion = data.seccion;
                recibido = true;
            }
            resolve(window.id_cliente);
        });
    }
});

$(document).ready(function () {

    InputService.aMayusculas('.input-mayus');
    InputService.maxLength('.input-100', 100);
    InputService.alfanumericoConEspacios(".input-alfanumerico");
    InputService.correo(".input-correo");

    function InicilizarGestionarClientes() {
        // 1. Validaciones defensivas iniciales
        if (!window.regimenes) {
            console.warn("Los regímenes fiscales no están cargados.");
            return;
        }
    
        console.log("Sección activa:", window.seccion);
    
        // 2. Mapeo de secciones y formularios
        const secciones = {
            basica: '#form-informacion-basica',
            fiscal: '#form-informacion-fiscal',
            contacto: '#form-contacto'
        };
    
        // Ocultamos todos los formularios primero
        Object.values(secciones).forEach(selector => $(selector).addClass('d-none'));
    
        // Mostramos únicamente el formulario correspondiente a la sección activa
        const selectorActivo = secciones[window.seccion];
        if (selectorActivo) {
            $(selectorActivo).removeClass('d-none');
        }
    
        // 3. Renderizado seguro del código del cliente (protegido contra nulos)
        if (window.informacion && window.informacion.Codigo_Cliente) {
            $("#span-codigo").text(window.informacion.Codigo_Cliente);
        }
    
        // 4. Inicialización de eventos específicos según la sección activa
        switch (window.seccion) {
            case 'basica':
                if (typeof Eventos_Seccion_Informacion_Basica === 'function') {
                    Eventos_Seccion_Informacion_Basica();
                }
                break;
            case 'fiscal':
                if (typeof Eventos_Seccion_Informacion_Fiscal === 'function') {
                    Eventos_Seccion_Informacion_Fiscal();
                }
                break;
            case 'contacto':
                if (typeof Eventos_Seccion_Contacto === 'function') {
                    Eventos_Seccion_Contacto();
                }
                break;
            default:
                console.warn(`Sección desconocida: ${window.seccion}`);
        }
    
        // 5. Registro seguro de navegación entre pasos del formulario
        const navegacionPasos = [
            { form: '#form-informacion-basica', btn: '#informacion-basica-boton-siguiente' },
            { form: '#form-informacion-fiscal', btn: '#fiscal-boton-siguiente' },
            { form: '#form-contacto', btn: '#contacto-boton-siguiente' }
        ];
    
        navegacionPasos.forEach(paso => {
            if ($(paso.form).length && $(paso.btn).length && typeof FormNavigationService !== 'undefined') {
                FormNavigationService.registrar(paso.form, paso.btn);
            }
        });
    }

    $(document).on('datosListos', function () {
        InicilizarGestionarClientes();
    });
});

function Eventos_Seccion_Informacion_Basica() {
    if (!window.informacion) return;

    $("#input-nombre").val(window.informacion.Nombre || '');
    $("#input-apellido-paterno").val(window.informacion.Apellido_Paterno || '');
    $("#input-apellido-materno").val(window.informacion.Apellido_Materno || '');
    const tipoCliente = (window.informacion.Tipo_Cliente || '').toUpperCase();
    const esMoral = tipoCliente === 'MORAL';
    const $contenedorPaterno = $("#input-apellido-paterno").closest('.flex-column');
    const $contenedorMaterno = $("#input-apellido-materno").closest('.flex-column');

    if (esMoral) {
        $contenedorPaterno.addClass('d-none');
        $contenedorMaterno.addClass('d-none');
        
        $("#input-apellido-paterno").val('');
        $("#input-apellido-materno").val('');
    } else {
        $contenedorPaterno.removeClass('d-none');
        $contenedorMaterno.removeClass('d-none');
    }

    $('#check-razon-social').prop('checked', esMoral);
    
    $(document).on('change', '#check-razon-social', function (e) {
        console.log("## Cambio en switch de razón social ##");

        const estaCheck = $(this).is(':checked');
        const $labelNombre = $('label[for="input-nombre"]');
        const $inputNombre = $('#input-nombre');

        const $bloqueApellidoPaterno = $('#input-apellido-paterno').closest('.row-gap-0');
        const $bloqueApellidoMaterno = $('#input-apellido-materno').closest('.row-gap-0');

        if (estaCheck) {
            $labelNombre.text('Razón Social');
            $inputNombre.attr('placeholder', 'Razón Social o Denominación');

            $bloqueApellidoPaterno.hide();
            $('#input-apellido-paterno').val('');

            $bloqueApellidoMaterno.hide();
            $('#input-apellido-materno').val('');
        } else {
            $labelNombre.text('Nombre (s)');
            $inputNombre.attr('placeholder', 'Nombre');

            $bloqueApellidoPaterno.show();
            $bloqueApellidoMaterno.show();
        }
    });

    $("#boton-guardar").off('click').on('click', function(e) {
        e.preventDefault();
    
        const esRazonSocial = $("#check-razon-social").is(':checked');
        const nombre = $("#input-nombre").val().trim();
        const apellidoPaterno = $("#input-apellido-paterno").val().trim();
        const apellidoMaterno = $("#input-apellido-materno").val().trim();
    
        // 1. Validar nombre / razón social (aplica para ambos casos)
        if (!nombre) {
            const mensajeAlerta = esRazonSocial ? 'Ingresa la razón social' : 'Ingresa el nombre';
            MostrarAlerta(mensajeAlerta);
            return false; // ⛔️ Detiene la ejecución
        }
    
        // 2. Validar apellidos SOLO si NO es razón social (es persona física)
        if (!esRazonSocial) {
            if (!apellidoPaterno) {
                MostrarAlerta('Ingresa el apellido paterno');
                return false;
            }
    
            if (!apellidoMaterno) {
                MostrarAlerta('Ingresa el apellido materno');
                return false;
            }
        }
    
        // 3. Armar correctamente el objeto de datos con comas y propiedades completas
        const data = {
            seccion: window.seccion,
            id: window.id_cliente,
            tipo_cliente: esRazonSocial ? 'MORAL' : 'FÍSICA',
            nombre: nombre,
            apellido_paterno: esRazonSocial ? '' : apellidoPaterno,
            apellido_materno: esRazonSocial ? '' : apellidoMaterno
        };
    
        // Puedes pasar 'data' a tu función si lo requiere, o ejecutarla directamente
        Guardar_Edicion_Cliente(data);
    });
}

function Eventos_Seccion_Informacion_Fiscal() {
    const listaLocalidades = (window.localidades || []).map(item => ({
        id: item.Codigo,
        valor: `${item.Codigo}\n${item.Localidad}`
    }));
    AutocompletarGenerico('#input-codigo-postal', listaLocalidades);

    const tipoCliente = (window.informacion?.Tipo_Cliente || '').toUpperCase();
    const esMoral = tipoCliente === 'MORAL';
    
    ActualizarSelectRegimen(esMoral);

    // 🌟 Corrección lógica: Las personas morales NO usan RFC genérico público, solo las físicas
    if (esMoral) {
        $("#contenedor-check-rfc-generico").addClass('d-none');
    } else {
        $("#contenedor-check-rfc-generico").removeClass('d-none');
    }

    $(document).off('click.buscarCP').on('click.buscarCP', '#boton-buscar-codigo-postal', function (e) {
        e.preventDefault();
        e.stopPropagation();

        if (!window.localidades || window.localidades.length === 0) {
            console.warn("Los datos de localidades aún no están cargados.");
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje('Los datos de ubicación todavía se están cargando, por favor espere un momento.', false, false, false);
            }
            return;
        }

        CrearVentanaIframe(
            'Código postal',
            'buscador.codigo.postal.php',
            '620px',
            true,
            true,
            function (iframeElement) {
                let datos = {
                    localidades: window.localidades
                };
                
                // Envío de mensaje seguro al iframe si existe el servicio global
                if (window.messenger && typeof window.messenger.send === 'function') {
                    window.messenger.send(iframeElement, 'codigo_postal', datos);
                } else if ($.messenger && typeof $.messenger.send === 'function') {
                    $.messenger.send(iframeElement, 'codigo_postal', datos);
                }
            }
        );
    });

    $('#cliente-input-rfc-generico').off('change.rfcGen').on('change.rfcGen', function () {
        const $inputRfc = $('#input-rfc');

        if ($(this).is(':checked')) {
            $inputRfc.val('XAXX010101000').prop({ readonly: true, disabled: true });
            CustomSelect.setValue("#select-regimen", '616');
            CustomSelect.disabled("#select-regimen", true);
        } else {
            $inputRfc.val('').prop({ readonly: false, disabled: false }).focus();
            CustomSelect.reset("#select-regimen", true);
            CustomSelect.disabled("#select-regimen", false);
        }
    });

    // Validación en tiempo real del input de RFC (excluyendo el ID actual)
    $('#input-rfc').off('input.rfcVal').on('input.rfcVal', function (e) {
        let $input = $(this);
        let valorOriginal = $input.val();
        let valor = valorOriginal.trim().toUpperCase();

        if (valor.length > 13) {
            valor = valor.substring(0, 13);
        }

        if (valorOriginal !== valor) {
            $input.val(valor);
        }

        let $span = $("#span-rfc");

        if (valor.length < 12) {
            $span.text('Faltan caracteres (12 o 13 requeridos)')
                .removeClass('text-success text-danger')
                .addClass('text-muted');
            return;
        }

        let esValido = ValidacionService.validarRFC(valor);

        if (!esValido) {
            $span.text('R.F.C. no válido')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
            return;
        }

        let yaExiste = window.clientes && window.clientes.some(c => {
            const idClienteActual = window.id_cliente ? String(window.id_cliente) : null;
            const idItem = c.ID ? String(c.ID) : null;
            
            if (idClienteActual && idItem === idClienteActual) return false;

            return c.RFC && String(c.RFC).trim().toUpperCase() === valor;
        });

        if (yaExiste) {
            $span.text('Este R.F.C. ya está registrado')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
        } else {
            $span.text('R.F.C. válido y disponible')
                .removeClass('text-danger text-muted')
                .addClass('text-success');
        }
    });

    if (window.informacion) {
        const rfcActual = window.informacion.RFC || '';
        $("#input-rfc").val(rfcActual);
        
        if (rfcActual === 'XAXX010101000') {
            $("#cliente-input-rfc-generico").prop('checked', true);
        }

        if (window.informacion.Regimen_Fiscal) {
            CustomSelect.setValue('#select-regimen', window.informacion.Regimen_Fiscal);
        }

        if (window.informacion && window.informacion.Codigo_Postal) {
            const codigoBuscado = String(window.informacion.Codigo_Postal).trim();
            
            // Buscamos el objeto de la localidad que coincida con el código postal
            const localidadEncontrada = (window.localidades || []).find(item => String(item.Codigo).trim() === codigoBuscado);
            
            if (localidadEncontrada) {
                // Formateamos el texto tal como lo espera el autocompletar (campoValor por defecto es 'valor')
                const textoFormateado = `${localidadEncontrada.Codigo} ${localidadEncontrada.Localidad}`;
                
                // Asignamos el valor al input, guardamos el ID en el atributo de datos y marcamos como seleccionado
                $("#input-codigo-postal")
                    .val(textoFormateado)
                    .attr('data-id', localidadEncontrada.Codigo)
                    .data('menu-opcion-seleccionado', true);
            } else {
                // Fallback por si el código postal no está en el catálogo actual pero existe en la info
                $("#input-codigo-postal")
                    .val(codigoBuscado)
                    .attr('data-id', codigoBuscado)
                    .data('menu-opcion-seleccionado', true);
            }
        }
    }
    $("#boton-guardar").off('click').on('click', function(e) {
        e.preventDefault();
    
        const esRazonSocial = window.esRazonSocial || $('#check-razon-social').is(':checked');
        const rfc = $("#input-rfc").val().trim().toUpperCase();
        const regimen = CustomSelect.getValue("#select-regimen");
    
        // 1. Validar RFC ingresado
        if (!rfc) {
            MostrarAlerta('Ingresa el RFC');
            return false;
        }
    
        // 2. Validar que Persona Moral no use RFC genérico
        if (esRazonSocial && rfc === 'XAXX010101000') {
            MostrarAlerta('Una persona moral no puede tener R.F.C. genérico');
            return false;
        }
    
        // 3. Validar longitud y formato estándar del RFC
        if (!ValidacionService.validarRFC(rfc)) {
            MostrarAlerta('El RFC debe tener 12 o 13 caracteres válidos');
            return false;
        }
    
        // 4. Validar duplicidad de RFC en la lista global (excluyendo al cliente actual si se está editando)
        let yaExiste = window.clientes && window.clientes.some(c => {
            const idClienteActual = window.id_cliente ? String(window.id_cliente) : null;
            const idItem = c.ID ? String(c.ID) : null;
            
            if (idClienteActual && idItem === idClienteActual) return false;
    
            return c.RFC && String(c.RFC).trim().toUpperCase() === rfc;
        });
    
        if (yaExiste) {
            MostrarAlerta('El RFC ingresado ya se encuentra registrado en el sistema.');
            return false;
        }
    
        // 5. Validar Régimen Fiscal
        if (!regimen) {
            MostrarAlerta('Selecciona un régimen fiscal');
            return false;
        }
    
        // 6. Armar objeto con los datos (manteniendo los campos necesarios para el backend)
        const data = {
            seccion: window.seccion,
            id: window.id_cliente,
            rfc: rfc,
            regimen_fiscal: regimen,
            codigo_postal: $("#input-codigo-postal").data('id') || $("#input-codigo-postal").val().trim()
        };
    
        // Ejecutamos la función de guardado
        Guardar_Edicion_Cliente(data);
    });
}

function Eventos_Seccion_Contacto() {
    TelefonosUI.init("#input-telefono");
    AutocompletarCorreo("#input-correo");

    // Validación en tiempo real para el Teléfono (excluyendo el ID actual)
    $('#input-telefono').off('input.telDupVal').on('input.telDupVal', function (e) {
        const $input = $(this);
        const selectorTel = "#input-telefono";
        const $span = $("#span-telefono");

        const telefonoLimpio = TelefonosUI.getValor(selectorTel);

        if (!telefonoLimpio || telefonoLimpio.length === 0) {
            $span.text('').removeClass('text-success text-danger text-muted');
            return;
        }

        if (!TelefonosUI.esValido(selectorTel)) {
            $span.text('Formato de teléfono inválido')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
            return;
        }

        const telefonoExiste = Array.isArray(window.clientes) && window.clientes.some(u => {
            const idClienteActual = window.id_cliente ? String(window.id_cliente) : null;
            const idItem = u.ID ? String(u.ID) : null;

            if (idClienteActual && idItem === idClienteActual) return false;
            if (!u.Telefono) return false;

            return String(u.Telefono).trim() === String(telefonoLimpio).trim();
        });

        if (telefonoExiste) {
            $span.text('Este teléfono ya está registrado')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
        } else {
            $span.text('Teléfono disponible')
                .removeClass('text-danger text-muted')
                .addClass('text-success');
        }
    });

    // Validación en tiempo real para el Correo Electrónico (excluyendo el ID actual)
    $('#input-correo').off('input.emailVal').on('input.emailVal', function (e) {
        let $input = $(this);
        let valor = $input.val().trim();
        let $span = $("#span-correo");

        if (valor.length === 0) {
            $span.text('').removeClass('text-success text-danger');
            return;
        }

        let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        let esValido = emailRegex.test(valor);

        if (!esValido) {
            $span.text('Correo no válido')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
            return;
        }

        let yaExiste = window.clientes && window.clientes.some(u => {
            const idClienteActual = window.id_cliente ? String(window.id_cliente) : null;
            const idItem = u.ID ? String(u.ID) : null;

            if (idClienteActual && idItem === idClienteActual) return false;

            return u.Correo && String(u.Correo).trim().toLowerCase() === valor.toLowerCase();
        });

        if (yaExiste) {
            $span.text('Este correo ya está registrado')
                .removeClass('text-success text-muted')
                .addClass('text-danger');
        } else {
            $span.text('Correo válido y disponible')
                .removeClass('text-danger text-muted')
                .addClass('text-success');
        }
    });

    TelefonosUI.setValor("#input-telefono", window.informacion.Telefono);
$('#input-correo').val(window.informacion.Correo).trigger('change');

    $("#boton-guardar").off('click').on('click', function(e) {
        e.preventDefault();
    
        const selectorTel = "#input-telefono";
        const telefonoLimpio = TelefonosUI.getValor(selectorTel);
    
        if (!TelefonosUI.esValido(selectorTel)) {
            return MostrarAlerta("El número de teléfono no es válido para el país seleccionado.", 200, false);
        }
    
        // ID del cliente actual (convertido a String para comparación segura)
        const idClienteActual = window.id_cliente ? String(window.id_cliente) : null;
    
        // 1. Validar si el teléfono ya existe (excluyendo al cliente actual)
        let telefonoExiste = Array.isArray(window.clientes) && window.clientes.some(u => {
            const idItem = u.ID ? String(u.ID) : null;
            if (idClienteActual && idItem === idClienteActual) return false;
    
            if (!u.Telefono) return false;
            return String(u.Telefono).trim() === String(telefonoLimpio).trim();
        });
    
        if (telefonoExiste) {
            MostrarAlerta('Este número de teléfono ya se encuentra registrado');
            return false;
        }
    
        // 2. Validaciones de Correo
        const correo = $("#input-correo").val().trim();
        if (!correo) {
            MostrarAlerta('Ingresa un correo electrónico');
            return false;
        }
        if (!ValidacionService.validarCorreo(correo)) {
            MostrarAlerta('Ingresa un correo electrónico válido');
            return false;
        }
    
        // 3. Validar si el correo ya existe (excluyendo al cliente actual)
        let correoExiste = Array.isArray(window.clientes) && window.clientes.some(u => {
            const idItem = u.ID ? String(u.ID) : null;
            if (idClienteActual && idItem === idClienteActual) return false;
    
            return u.Correo && String(u.Correo).trim().toLowerCase() === correo.toLowerCase();
        });
    
        if (correoExiste) {
            MostrarAlerta('Este correo electrónico ya se encuentra registrado');
            return false;
        }
    
        const telefono = TelefonosUI.getValor(selectorTel);
        const data = {
            seccion: window.seccion,
            id: window.id_cliente,
            telefono: telefono,
            correo: correo
        };
        
        Guardar_Edicion_Cliente(data);
    });
}

function ActualizarSelectRegimen(esMoral) {
    if (!window.regimenes || !Array.isArray(window.regimenes)) return;

    // Filtramos las opciones según el tipo de persona
    const opcionesFiltradas = window.regimenes
        .filter(item => {
            if (esMoral) {
                return item.moral === "Sí";
            } else {
                return item.fisica === "Sí";
            }
        })
        .map(item => ({
            value: item.id,
            text: `${item.id} - ${item.descripcion}` // Opcional: puedes dejar solo item.descripcion si prefieres
        }));

    // Vaciamos el contenedor antes de reinsertar el custom select por seguridad
    $('#contenedor-select-regimen').empty();

    // Insertamos el custom select con las opciones ya filtradas
    InsertarCustomSelect({
        contenedor: '#contenedor-select-regimen',
        id: 'select-regimen',
        placeholder: 'Selecciona un régimen',
        buscador: true,
        disabled: false,
        opciones: opcionesFiltradas,
        onChange: function (valorSeleccionado) {
            console.log('El valor seleccionado es:', valorSeleccionado);
        }
    });
}