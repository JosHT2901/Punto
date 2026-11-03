window.ID_Sucursal = null; // Inicializamos la variable global

$.messenger.on('datos_iniciales', async function (data) {
    if (data) {
        console.log("Datos iniciales recibidos:", data);
        const datosUnificados = data.data || data;
        window.ID_Sucursal = datosUnificados.id || datosUnificados.sucursal_id || null;
    }
});

function Enviar_Id(tiempoMaximoMs = 500) {
    return new Promise((resolve) => {
        if (window.ID_Sucursal !== undefined && window.ID_Sucursal !== null) {
            return resolve(window.ID_Sucursal);
        }

        let tiempoTranscurrido = 0;
        const intervalo = 50;

        const timer = setInterval(() => {
            tiempoTranscurrido += intervalo;
            if (window.ID_Sucursal !== undefined && window.ID_Sucursal !== null) {
                clearInterval(timer);
                resolve(window.ID_Sucursal);
            } else if (tiempoTranscurrido >= tiempoMaximoMs) {
                clearInterval(timer);
                resolve(null);
            }
        }, intervalo);
    });
}

// ==========================================
// FUNCIONES AUXILIARES GLOBALES (En cascada)
// ==========================================
function CargarMunicipios(claveEstado, municipioSeleccion_Editar = null, localidadSeleccion_Editar = null) {
    if (!window.localidades) return;
    
    const estados = ObtenerEstados(window.localidades);
    const estObj = estados.find(e => e.clave == claveEstado);
    window.estadoSeleccionadoNombre = estObj ? estObj.estado : '';
    window.municipioSeleccionadoNombre = '';
    window.localidadSeleccionadaObjeto = null;

    $('#contenedor-select-municipio').empty();
    $('#contenedor-select-localidad').empty();

    const municipios = ObtenerMunicipiosPorEstado(window.localidades, claveEstado);

    InsertarCustomSelect({
        contenedor: '#contenedor-select-municipio',
        id: 'select-municipio',
        placeholder: 'Selecciona un municipio',
        buscador: true,
        opciones: municipios.map(m => ({
            value: m.municipio.toUpperCase(),
            text: m.municipio
        })),
        onChange: function (municipioNombre) {
            CargarLocalidades(municipioNombre, localidadSeleccion_Editar);
        }
    });

    if (municipioSeleccion_Editar && typeof CustomSelect !== 'undefined') {
        CustomSelect.setValue('#select-municipio', municipioSeleccion_Editar);
        CargarLocalidades(municipioSeleccion_Editar, localidadSeleccion_Editar);
    }
}

function CargarLocalidades(municipioNombre, localidadSeleccion_Editar = null) {
    if (!window.localidades) return;

    window.municipioSeleccionadoNombre = municipioNombre;
    window.localidadSeleccionadaObjeto = null;

    $('#contenedor-select-localidad').empty();
    const localidadesFiltradas = ObtenerLocalidadesPorMunicipio(window.localidades, municipioNombre);

    InsertarCustomSelect({
        contenedor: '#contenedor-select-localidad',
        id: 'select-localidad',
        placeholder: 'Selecciona una localidad',
        buscador: true,
        opciones: localidadesFiltradas.map((item) => ({
            value: item.localidad.toUpperCase(),
            text: item.localidad
        })),
        onChange: function () {}
    });

    if (localidadSeleccion_Editar !== null && typeof CustomSelect !== 'undefined') {
        CustomSelect.setValue('#select-localidad', localidadSeleccion_Editar);
    }
}

$(document).ready(async function () {
    let inicializado = false;

    function InicializarGestionarSucursales() {
        if (inicializado) return;
        inicializado = true;

        // 1. Selector de Tipo de Sucursal
        InsertarCustomSelect({
            contenedor: '#sucursal-wrapper-tipo',
            id: 'select-custom-tipo-sucursal',
            placeholder: 'Selecciona tipo...',
            opciones: [
                { value: 'TIENDA', text: 'TIENDA' },
                { value: 'BODEGA', text: 'BODEGA' },
                { value: 'MATRIZ', text: 'MATRIZ' },
                { value: 'CEDIS', text: 'CEDIS' },
                { value: 'OFICINA', text: 'OFICINA' }
            ],
            buscador: true,
            onChange: () => ValidarSucursal()
        });

        // 2. Navegación del Wizard
        FormNavigationService.registrar('#form-sucursal-basico', '#sucursal-basica-boton-siguiente');
        FormNavigationService.registrar('#form-sucursal-domicilio', '#sucursal-domicilio-boton-siguiente');
        FormNavigationService.registrar('#form-sucursal-contacto', '#sucursal-contacto-boton-siguiente');

        // 3. Configuración y Restricciones de Inputs
        InputService.aMayusculas('.input-mayus');
        InputService.maxLength('.input-100', 100);
        InputService.maxLength('.input-5', 5);

        InputService.soloNumeros("#sucursal-input-num-ext", 'Ingresa el número exterior', 'left');
        InputService.soloNumeros("#sucursal-input-num-int", 'Ingresa el número interior', 'left');
        InputService.soloNumeros("#sucursal-input-cp", 'Ingresa el código postal', 'left');

        TelefonosUI.init("#sucursal-input-telefono");
        TelefonosUI.init("#sucursal-input-telefono-adicional");
        TelefonosUI.init("#sucursal-input-whatsapp");

        // 4. Evento Debounce para el Nombre
        let debounceTimer;
        $("#sucursal-input-nombre").on('input', function () {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => ValidarSucursal(), 300);
        });

        $("#sucursal-input-cp").on('input', function (e) {
            const codigo = $(this).val().trim();

            if (codigo && codigo.length === 5) {
                const registrosEncontrados = window.localidades.filter(item => {
                    return String(item.Codigo || '').trim() === codigo;
                });

                if (registrosEncontrados.length > 0) {
                    const datosUbicacion = registrosEncontrados[0];
                    const claveEstadoEncontrada = datosUbicacion.Clave_Estado; 
                    const municipioEncontrado = datosUbicacion.Municipio; 

                    if (typeof CustomSelect !== 'undefined' && claveEstadoEncontrada) {
                        CustomSelect.setValue('#select-estado', claveEstadoEncontrada, true);
                        CargarMunicipios(claveEstadoEncontrada, municipioEncontrado);
                    }
                }
            }
        });

        if (window.localidades && window.localidades.length > 0) {
            const estados = ObtenerEstados(window.localidades);

            InsertarCustomSelect({
                contenedor: '#contenedor-select-estado',
                id: 'select-estado',
                placeholder: 'Selecciona un estado',
                buscador: true,
                opciones: estados.map(item => ({
                    value: item.clave,
                    text: item.estado
                })),
                onChange: function (claveEstado) {
                    CargarMunicipios(claveEstado);
                }
            });
        }

        // 6. Precarga de Datos si estamos en modo Edición
        if (window.sucursalEdicion) {
            PrecargarDatosEdicion(window.sucursalEdicion);
        }

        // 7. Validación y Control del Wizard por Acordeón
        InicializarWizardAcordeon(function ($currentCard, $btn) {
            const btnId = $btn.attr('id');

            if (btnId === 'sucursal-basica-boton-siguiente') {
                const nombre = $("#sucursal-input-nombre").val().trim();
                const tipo = CustomSelect.getValue("#select-custom-tipo-sucursal");

                if (!nombre) {
                    MostrarAlerta('Ingresa el nombre de la sucursal', 220);
                    return false;
                }
                if (!tipo) {
                    MostrarAlerta('Selecciona el tipo de sucursal', 220);
                    return false;
                }
                if (ValidarSucursal() === false) {
                    return false;
                }
            }

            if (btnId === 'sucursal-domicilio-boton-siguiente') {
                const calleVal = $("#sucursal-input-calle").val().trim();
                const numExtVal = $("#sucursal-input-num-ext").val().trim();
                const cpVal = $("#sucursal-input-cp").val().trim();
                const estadoVal = CustomSelect.getValue("#select-estado");
                const municipioVal = CustomSelect.getValue("#select-municipio");
                const localidadVal = CustomSelect.getValue("#select-localidad");

                if (!calleVal) {
                    MostrarAlerta('Ingresa la calle', 220);
                    return false;
                }
                if (!numExtVal) {
                    MostrarAlerta('Ingresa el número exterior', 220);
                    return false;
                }
                if (!cpVal) {
                    MostrarAlerta('Ingresa el código postal', 220);
                    return false;
                }
                if (cpVal.length < 5) {
                    MostrarAlerta('El código postal debe tener 5 dígitos', 220);
                    return false;
                }

                if (window.localidades && Array.isArray(window.localidades)) {
                    const cpEncontrado = window.localidades.some(item => {
                        return String(item.Codigo || '').trim() === cpVal;
                    });

                    if (!cpEncontrado) {
                        MostrarAlerta('Verifica el código postal', 220);
                        return false;
                    }
                }

                if (!estadoVal) {
                    MostrarAlerta('Selecciona el estado', 220);
                    return false;
                }
                if (!municipioVal) {
                    MostrarAlerta('Selecciona el municipio', 220);
                    return false;
                }
                if (!localidadVal) {
                    MostrarAlerta('Selecciona la localidad', 220);
                    return false;
                }
            }

            if (btnId === 'sucursal-contacto-boton-siguiente') {
                const data_payload = {
                    id: window.sucursalEdicion ? (window.sucursalEdicion.ID || window.sucursalEdicion.id) : null,
                    nombre: $("#sucursal-input-nombre").val().trim(),
                    tipo: CustomSelect.getValue("#select-custom-tipo-sucursal"),
                    calle: $("#sucursal-input-calle").val().trim(),
                    numero_exterior: $("#sucursal-input-num-ext").val().trim(),
                    numero_interior: $("#sucursal-input-num-int").val().trim() || null,
                    codigo_postal: $("#sucursal-input-cp").val().trim(),
                    estado: CustomSelect.getValue("#select-estado"),
                    municipio: CustomSelect.getValue("#select-municipio"),
                    localidad: CustomSelect.getValue("#select-localidad"),
                    telefono: TelefonosUI.getValor("#sucursal-input-telefono") || null,
                    telefono_adicional: TelefonosUI.getValor("#sucursal-input-telefono-adicional") || null,
                    whatsapp: TelefonosUI.getValor("#sucursal-input-whatsapp") || null
                };

                Guardar_Gestion_Sucursal(data_payload);
            }

            return true;
        });
    }

    try {
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Obteniendo información...', false);
        }

        window.ID_Sucursal = await Enviar_Id(500); 
        console.log("ID de sucursal obtenido:", window.ID_Sucursal);

        const esEdicion = window.ID_Sucursal !== null && window.ID_Sucursal !== undefined && window.ID_Sucursal !== '';

        let promesas = [
            CargarJSON('../../../src/json/data/localidades.json'),
            window.AjaxService.enviar('../../../src/controllers/php/controllers/sucursales.php', {
                accion: 'obtener_sucursales'
            })
        ];

        if (esEdicion) {
            promesas.push(
                window.AjaxService.enviar('../../../src/controllers/php/controllers/sucursales.php', {
                    accion: 'obtener_informacion_sucursal',
                    id: window.ID_Sucursal
                }).catch(() => null)
            );
        }

        let resultados = await Promise.all(promesas);

        let localidades = resultados[0];
        let sucursales = resultados[1];
        let sucursalEspecificaRespuesta = esEdicion ? resultados[2] : null;

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        window.localidades = localidades || [];

        if (sucursales && sucursales.ok) {
            window.sucursales = sucursales.data;
        } else {
            window.sucursales = Array.isArray(sucursales) ? sucursales : (sucursales.data || []);
        }

        if (esEdicion && sucursalEspecificaRespuesta) {
            const respuestaData = sucursalEspecificaRespuesta.data || sucursalEspecificaRespuesta;
            window.sucursalEdicion = respuestaData.sucursal || respuestaData;
            console.log("Sucursal cargada para edición:", window.sucursalEdicion);
        } else {
            window.sucursalEdicion = null;
        }

        InicializarGestionarSucursales();

    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Error al obtener los datos:", error);
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error inesperado al conectar con el servidor.', false, false, false);
        }
    }
});

function ValidarSucursal() {
    let nombre = $('#sucursal-input-nombre').val().trim().toLowerCase();
    let tipo = CustomSelect.getValue('#select-custom-tipo-sucursal');
    let idActual = window.sucursalEdicion ? (window.sucursalEdicion.ID || window.sucursalEdicion.id) : null;

    if (window.sucursales && Array.isArray(window.sucursales)) {
        let existeDuplicado = window.sucursales.some(sucursal => {
            let sucursalId = sucursal.ID || sucursal.id;
            if (idActual && sucursalId == idActual) return false;

            let nombreExistente = (sucursal.nombre || '').trim().toLowerCase();
            let tipoExistente = (sucursal.tipo || '').trim();

            return nombreExistente === nombre && tipoExistente === tipo;
        });

        if (existeDuplicado) {
            $("#sucursal-span-tipo").text("Ya existe una sucursal con este mismo nombre y tipo");
            return false;
        } else {
            $("#sucursal-span-tipo").text('');
        }
    }

    return true;
}

function PrecargarDatosEdicion(sucursal) {
    if (!sucursal) return;

    $("#sucursal-input-nombre").val(sucursal.nombre || '');
    
    if (typeof CustomSelect !== 'undefined' && sucursal.tipo) {
        CustomSelect.setValue('#select-custom-tipo-sucursal', sucursal.tipo);
    }

    $("#sucursal-input-calle").val(sucursal.calle || '');
    $("#sucursal-input-num-ext").val(sucursal.numero_exterior || '');
    $("#sucursal-input-num-int").val(sucursal.numero_interior || '');
    $("#sucursal-input-cp").val(sucursal.codigo_postal || '');

    if (sucursal.entidad_federativa && typeof CustomSelect !== 'undefined') {
        CustomSelect.setValue('#select-estado', sucursal.entidad_federativa_clave);
        CargarMunicipios(sucursal.entidad_federativa_clave, sucursal.municipio, sucursal.localidad);
    }

    if (typeof TelefonosUI !== 'undefined') {
        if (sucursal.telefono) TelefonosUI.setValor("#sucursal-input-telefono", sucursal.telefono);
        if (sucursal.telefono_adicional) TelefonosUI.setValor("#sucursal-input-telefono-adicional", sucursal.telefono_adicional);
        if (sucursal.whatsapp) TelefonosUI.setValor("#sucursal-input-whatsapp", sucursal.whatsapp);
    } else {
        $("#sucursal-input-telefono").val(sucursal.telefono || '');
        $("#sucursal-input-telefono-adicional").val(sucursal.telefono_adicional || '');
        $("#sucursal-input-whatsapp").val(sucursal.whatsapp || '');
    }
}