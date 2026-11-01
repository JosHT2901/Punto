window.id_cliente = null
window.accion = null
$.messenger.off('resultado_codigo_postal');

// 2. Registramos el receptor del mensaje de forma limpia
$.messenger.on('resultado_codigo_postal', function (data, sourceWindow, origin) {
    if (data && data.codigo) {
        // Puedes armar la cadena como mejor prefieras para tu input. 
        // Ejemplo: "90450 - Localidad, Municipio, Estado" o solo lo básico.
        const textoUbicacion = `${data.codigo} - ${data.localidad}`

        // Asignamos el valor al input correspondiente
        $("#crear-cliente-input-codigo-postal").val(textoUbicacion).data('id', data.codigo).trigger('change');

        ModalAPI.cerrar()
    } else {
        console.warn("Los datos recibidos no contienen un código postal válido.");
    }
});
$(document).ready(function () {
    InputService.aMayusculas('.input-mayus');
    InputService.maxLength('.input-100',100);
    InputService.alfanumericoConEspacios(".input-alfanumerico")
    InputService.correo(".input-correo")
    // Función que inicializa tu select cuando ya existan los datos
    function InicilizarGestionarClientes() {
        if (!window.regimenes) return; // Por seguridad

        $("#crear-cliente-span-codigo").text(window.codigo_cliente)
       
        const listaLocalidades = window.localidades.map(item => ({
            id: item.Codigo,
            valor: `${item.Codigo} - ${item.Localidad}`
        }));
        AutocompletarGenerico('#crear-cliente-input-codigo-postal', listaLocalidades);
        TelefonosUI.init("#crear-cliente-input-telefono");
        AutocompletarCorreo("#crear-cliente-input-correo")
        setTimeout(() => {
            $("#crear-cliente-input-nombre").focus()
        }, 500);

        $(document).on('click', '#crear-cliente-boton-buscar-codigo-postal', function (e) {
            e.preventDefault();
            e.stopPropagation();

            // Verificamos que los datos estén disponibles antes de enviarlos
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
                    // Empaquetamos los datos con la propiedad 'localidades'
                    let datos = {
                        localidades: window.localidades
                    };

                    // Enviamos al iframe recién creado usando la acción 'codigo_postal'
                    $.messenger.send(iframeElement, 'codigo_postal', datos);
                }
            );
        });
        InicializarWizardAcordeon(function ($currentCard, $btn) {

            // Identificamos de qué botón o paso se trata (ejemplo usando el ID del botón actual)
            const btnId = $btn.attr('id');

            // Lógica específica si es el botón de crear cliente / paso 1
            if (btnId === 'crear-cliente-informacion-basica-boton-siguiente') {
                window.esRazonSocial = $("#crear-cliente-check-razon-social").is(':checked');
                const nombre = $("#crear-cliente-input-nombre").val().trim();
                const apellidoPaterno = $("#crear-cliente-input-apellido-paterno").val().trim();
                const apellidoMaterno = $("#crear-cliente-input-apellido-paterno").val().trim(); // o apellido materno según tu input
            
                // 1. Validar nombre / razón social (aplica para ambos casos)
                if (!nombre) {
                    const mensajeAlerta = window.esRazonSocial ? 'Ingresa la razón social' : 'Ingresa el nombre';
                    MostrarAlerta(mensajeAlerta);
                    return false; // ⛔️ Detiene el avance del acordeón
                }
            
                // 2. Validar apellidos SOLO si es persona física (NO es razón social)
                if (!window.esRazonSocial) {
                    if (!apellidoPaterno) {
                        MostrarAlerta('Ingresa el apellido paterno');
                        return false;
                    }
            
                    
                    if (!apellidoMaterno) {
                        MostrarAlerta('Ingresa el apellido materno');
                        return false;
                    }
                }
            }

            if (btnId === 'crear-cliente-fiscal-boton-siguiente') {
                const rfc = $("#crear-cliente-input-rfc").val().trim().toUpperCase();
                const regimen = CustomSelect.getValue("#select-regimen");

                // 1. Validar RFC ingresado
                if (!rfc) {
                    MostrarAlerta('Ingresa el RFC');
                    return false; // ⛔️ Detiene el avance
                }

                // 2. Validar si el RFC ya existe en la lista global de clientes
                let yaExiste = window.clientes && window.clientes.some(c => {
                    return c.RFC && String(c.RFC).trim().toUpperCase() === rfc;
                });

                if (yaExiste) {
                    MostrarAlerta('El RFC ingresado ya se encuentra registrado en el sistema.');
                    return false; // ⛔️ Detiene el avance por duplicidad
                }

                if(window.esRazonSocial && rfc==='XAXX010101000')
                {
                    MostrarAlerta('No puede tener R.F.C. genérico');
                    return false; // ⛔️ Detiene el avance por duplicidad
                }
                // 3. Validar longitud estándar del RFC (12 moral, 13 física)
                if (!ValidacionService.validarRFC(rfc)) {
                    MostrarAlerta('El RFC debe tener 12 o 13 caracteres válidos');
                    return false;
                }

                // 4. Validar Régimen Fiscal
                if (!regimen) {
                    MostrarAlerta('Selecciona un régimen fiscal');
                    return false;
                }

                // 5. Validar Código Postal (soporta data('id') o el valor del input según tu implementación)
                const codigoPostal = $("#crear-cliente-input-codigo-postal").data('id');
                if (!codigoPostal) {
                    MostrarAlerta('Selecciona o ingresa un código postal');
                    return false;
                }
            }

            if (btnId === 'crear-cliente-contacto-boton-siguiente') {
                const selectorTel = "#crear-cliente-input-telefono";
                const telefonoLimpio = TelefonosUI.getValor(selectorTel);

                if (!TelefonosUI.esValido(selectorTel)) {
                    return MostrarAlerta("El número de teléfono no es válido para el país seleccionado.", 200, false);
                }

                // 1. Validar si el teléfono ya existe (usando 'Telefono' en mayúscula)
                let telefonoExiste = Array.isArray(window.clientes) && window.clientes.some(u => {
                    if (!u.Telefono) return false;
                    return String(u.Telefono).trim() === String(telefonoLimpio).trim();
                });

                if (telefonoExiste) {
                    MostrarAlerta('Este número de teléfono ya se encuentra registrado');
                    return false;
                }

                // 2. Validaciones de Correo
                const correo = $("#crear-cliente-input-correo").val().trim();
                if (!correo) {
                    MostrarAlerta('Ingresa un correo electrónico');
                    return false;
                }
                if (!ValidacionService.validarCorreo(correo)) {
                    MostrarAlerta('Ingresa un correo electrónico válido');
                    return false;
                }

                // 3. Validar si el correo ya existe (usando 'Correo' en mayúscula)
                let correoExiste = Array.isArray(window.clientes) && window.clientes.some(u => {
                    return u.Correo && String(u.Correo).trim().toLowerCase() === correo.toLowerCase();
                });

                if (correoExiste) {
                    MostrarAlerta('Este correo electrónico ya se encuentra registrado');
                    return false;
                }

                // Si todo es válido, imprimimos el detalle de confirmación
                Imprimir_Detalle_Confirmar_Cliente();
            }

            if (btnId === 'crear-cliente-confirmar-boton-siguiente') {
                Guardar_Gestion_Cliente()
            }
            return true; // ✅ Todo correcto, permite que el acordeón avance al siguiente paso
        });

        $(document).on('change', '#crear-cliente-check-razon-social', function (e) {
            const estaCheck = $(this).is(':checked');
        
            // Seleccionamos los contenedores de los apellidos y la etiqueta/input de nombre
            const $labelNombre = $('label[for="crear-cliente-input-nombre"]');
            const $inputNombre = $('#crear-cliente-input-nombre');
        
            // Buscamos los bloques contenedores de los apellidos
            const $bloqueApellidoPaterno = $('#crear-cliente-input-apellido-paterno').closest('.row-gap-0');
            const $bloqueApellidoMaterno = $('#crear-cliente-input-apellido-materno').closest('.row-gap-0');
            
            // Contenedor del check de RFC genérico
            const $contenedorRfcGenerico = $('#contenedor-check-rfc-generico');
        
            if (estaCheck) {
                // Si está activado (Persona Moral / Razón Social)
                $labelNombre.text('Razón Social');
                $inputNombre.attr('placeholder', 'Razón Social o Denominación');
        
                // Ocultamos el check de RFC genérico
                $contenedorRfcGenerico.addClass('d-none');
        
                // Ocultamos y limpiamos los campos de apellidos
                $bloqueApellidoPaterno.hide();
                $('#crear-cliente-input-apellido-paterno').val('');
        
                $bloqueApellidoMaterno.hide();
                $('#crear-cliente-input-apellido-materno').val('');
            } else {
                // Si está desactivado (Persona Física)
                $labelNombre.text('Nombre (s)');
                $inputNombre.attr('placeholder', 'Nombre');
        
                // Mostramos de nuevo el check de RFC genérico
                $contenedorRfcGenerico.removeClass('d-none');
        
                // Mostramos de nuevo los campos de apellidos
                $bloqueApellidoPaterno.show();
                $bloqueApellidoMaterno.show();
            }
        
            // 🌟 Actualizamos automáticamente el select de regímenes filtrando por física/moral
            ActualizarSelectRegimen(estaCheck);
        });
        $('#cliente-input-rfc-generico').on('change', function() {
            const $inputRfc = $('#crear-cliente-input-rfc');
            
            if ($(this).is(':checked')) {
                // Asignar el RFC genérico estándar del SAT y bloquear el campo
                $inputRfc.val('XAXX010101000').prop('readonly', true);
                CustomSelect.setValue("#select-regimen",'616')
                CustomSelect.disabled("#select-regimen", true);
            } else {
                // Limpiar el campo y habilitarlo para escritura libre
                $inputRfc.val('').prop('readonly', false).focus();
                CustomSelect.reset("#select-regimen", true);
                CustomSelect.disabled("#select-regimen",false);
            }
        });
        $('#crear-cliente-input-rfc').off('input.rfcVal').on('input.rfcVal', function (e) {
            let $input =$(this);
            let valorOriginal = $input.val();
            let valor = valorOriginal.trim().toUpperCase();
        
            // Si excede los 13 caracteres, cortamos automáticamente
            if (valor.length > 13) {
                valor = valor.substring(0, 13);
            }
        
            // Actualizamos el input visualmente si hubo cambios
            if (valorOriginal !== valor) {
                $input.val(valor);
            }
        
            let $span =$("#crear-cliente-span-rfc");
        
            // Un RFC válido tiene 12 o 13 caracteres. Si tiene menos de 12, estado neutral.
            if (valor.length < 12) {
                $span.text('Faltan caracteres (12 o 13 requeridos)')
                    .removeClass('text-success text-danger')
                    .addClass('text-muted');
                return;
            }
        
            // 1. Evaluamos la sintaxis del RFC con el servicio
            let esValido = ValidacionService.validarRFC(valor);
        
            if (!esValido) {
                $span.text('R.F.C. no válido')
                    .removeClass('text-success text-muted')
                    .addClass('text-danger');
                return;
            }
        
            // 2. Verificamos si ya existe en la variable global `window.clientes` usando la propiedad exacta 'RFC'
            let yaExiste = window.clientes && window.clientes.some(c => {
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

        // Validación en tiempo real para el Teléfono
        $('#crear-cliente-input-telefono').off('input.telDupVal').on('input.telDupVal', function (e) {
            const $input = $(this);
            const selectorTel = "#crear-cliente-input-telefono";
            const $span = $("#crear-cliente-span-telefono");

            const telefonoLimpio = TelefonosUI.getValor(selectorTel);

            // Si el campo está vacío, limpiamos el mensaje y salimos
            if (!telefonoLimpio || telefonoLimpio.length === 0) {
                $span.text('').removeClass('text-success text-danger text-muted');
                return;
            }

            // Validamos formato
            if (!TelefonosUI.esValido(selectorTel)) {
                $span.text('Formato de teléfono inválido')
                    .removeClass('text-success text-muted')
                    .addClass('text-danger');
                return;
            }

            // Comparamos usando 'Telefono' (con T mayúscula)
            const telefonoExiste = Array.isArray(window.clientes) && window.clientes.some(u => {
                if (!u.Telefono) return false;
                return String(u.Telefono).trim() === String(telefonoLimpio).trim();
            });

            // Actualizamos la interfaz según el resultado
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


        // Validación en tiempo real para el Correo Electrónico
        $('#crear-cliente-input-correo').off('input.emailVal').on('input.emailVal', function (e) {
            let $input = $(this);
            let valor = $input.val().trim();
            let $span = $("#crear-cliente-span-correo");

            if (valor.length === 0) {
                $span.text('').removeClass('text-success text-danger');
                return;
            }

            // Expresión regular estándar y segura para validar correos
            let emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            let esValido = emailRegex.test(valor);

            if (!esValido) {
                $span.text('Correo no válido')
                    .removeClass('text-success text-muted')
                    .addClass('text-danger');
                return;
            }

            // Verificamos usando 'Correo' (con C mayúscula) y normalizando a minúsculas
            let yaExiste = window.clientes && window.clientes.some(u => {
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

        FormNavigationService.registrar(
            '#form-crear-cliente-informacion-basica', // Contenedor de los campos
            '#crear-cliente-informacion-basica-boton-siguiente' // Botón que simulará el clic al llegar al final
        );

        FormNavigationService.registrar(
            '#form-crear-cliente-informacion-fiscal', // Contenedor de los campos
            '#crear-cliente-fiscal-boton-siguiente' // Botón que simulará el clic al llegar al final
        );
        FormNavigationService.registrar(
            '#form-crear-cliente-contacto', // Contenedor de los campos
            '#crear-cliente-contacto-boton-siguiente' // Botón que simulará el clic al llegar al final
        );
    }

    // Si no han cargado, se queda esperando a que el Archivo 1 dispare el evento
    $(document).on('datosListos', function () {
        InicilizarGestionarClientes();
    });
});

function Imprimir_Detalle_Confirmar_Cliente() {
    // 1. Obtener código de cliente (o valor por defecto si es nuevo)
    const codigoCliente = window.codigo_cliente || 'Automático';

    // 2. Recolectar valores del formulario
    const esRazonSocial = $("#crear-cliente-check-razon-social").is(':checked');
    const nombre = $("#crear-cliente-input-nombre").val().trim();
    const apellidoPaterno = $("#crear-cliente-input-apellido-paterno").val().trim();
    const apellidoMaterno = $("#crear-cliente-input-apellido-materno").val().trim();

    // Armar nombre completo según el tipo de persona
    const nombreCompleto = esRazonSocial ?
        nombre :
        `${nombre} ${apellidoPaterno} ${apellidoMaterno}`.trim();

    const rfc = $("#crear-cliente-input-rfc").val().trim().toUpperCase();
    const idRegimen = CustomSelect.getValue("#select-regimen");

    // Traducir el ID del régimen a su nombre/descripción usando la función auxiliar
    const regimenFiscalNombre = typeof ObtenerNombreRegimenFiscal === 'function' ?
        ObtenerNombreRegimenFiscal(idRegimen) :
        idRegimen;

    const codigoPostal = $("#crear-cliente-input-codigo-postal").val() || $("#crear-cliente-input-codigo-postal").data('id') || '---';

    const selectorTel = "#crear-cliente-input-telefono";
    const telefono = TelefonosUI.getValor(selectorTel);
    const correo = $("#crear-cliente-input-correo").val().trim();

    // 3. Definir la configuración de campos (puedes agregar Nombre o Razón Social si lo requieres en la vista previa)
    const camposCliente = [{
            label: 'Código',
            columna: 'Codigo_Cliente'
        },
        {
            label: 'Nombre / Razón Social',
            columna: 'nombre_completo'
        },
        {
            label: 'RFC',
            columna: 'RFC'
        },
        {
            label: 'Código Postal',
            columna: 'Codigo_Postal'
        },
        {
            label: 'Correo',
            columna: 'Correo'
        },
        {
            label: 'Teléfono',
            columna: 'Telefono'
        },
        {
            label: 'Régimen Fiscal',
            columna: 'Regimen_Fiscal'
        }
    ];

    // 4. Construir el objeto con los datos reales capturados del formulario
    const datosClientePreview = {
        Codigo_Cliente: codigoCliente,
        nombre_completo: nombreCompleto || '---',
        RFC: rfc || '---',
        Codigo_Postal: codigoPostal,
        Correo: correo || '---',
        Telefono: telefono || '---',
        Regimen_Fiscal: regimenFiscalNombre.toUpperCase() || '---'
    };

    // 5. Generar el HTML utilizando HtmlDetailService
    const htmlDetalle = HtmlDetailService.renderizarCampos(datosClientePreview, camposCliente);

    // 6. Inyectarlo en el contenedor de vista previa o confirmación
    $("#crear-cliente-imprimir-detalle").html(htmlDetalle);
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
    $('#crear-cliente-contenedor-select-regimen').empty();

    // Insertamos el custom select con las opciones ya filtradas
    InsertarCustomSelect({
        contenedor: '#crear-cliente-contenedor-select-regimen',
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