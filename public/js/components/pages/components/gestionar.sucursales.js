
$(document).ready(function () {
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

        $("#sucursal-input-cp").on('input', function(e) {
            const codigo = $(this).val().trim();
            
            if (codigo && codigo.length === 5) {
                // 1. Filtramos todas las coincidencias que tengan ese código postal
                const registrosEncontrados = window.localidades.filter(item => {
                    return String(item.Codigo || '').trim() === codigo;
                });
        
                if (registrosEncontrados.length > 0) {
                    // Tomamos el primer registro para extraer Estado y Municipio (ya que comparten la misma ubicación geográfica)
                    const datosUbicacion = registrosEncontrados[0];
                    const estadoEncontrado = datosUbicacion.Estado;         // Ej. "Aguascalientes"
                    const claveEstadoEncontrada = datosUbicacion.Clave_Estado; // Ej. "01"
                    const municipioEncontrado = datosUbicacion.Municipio;   // Ej. "Aguascalientes"
                    // 2. Opcional: Autoseleccionar Estado y Municipio en tus CustomSelect automáticamente
                    if (typeof CustomSelect !== 'undefined' && claveEstadoEncontrada) {
                        // Seleccionamos el estado usando su Clave_Estado
                        CustomSelect.setValue('#select-estado', claveEstadoEncontrada, true);
                        
                        // Cargamos los municipios de ese estado y autoseleccionamos el municipio encontrado
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
                opciones: estados.map(item => ({ value: item.clave, text: item.estado })),
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
        InicializarWizardAcordeon(function ($currentCard,$btn) {
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

                // Validar campos vacíos básicos
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

                // Validación específica de longitud del Código Postal
                if (cpVal.length < 5) {
                    MostrarAlerta('El código postal debe tener 5 dígitos', 220);
                    return false;
                }

                // Validación de existencia en window.localidades usando la propiedad 'Codigo' (con C mayúscula)
                if (window.localidades && Array.isArray(window.localidades)) {
                    const cpEncontrado = window.localidades.some(item => {
                        return String(item.Codigo || '').trim() === cpVal;
                    });

                    if (!cpEncontrado) {
                        MostrarAlerta('Verifica el código postal', 220);
                        return false;
                    }
                }

                // Validar selects de domicilio
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
                // Payload final listo para enviar
                const data_payload = {
                    id: window.sucursalEdicion ? window.sucursalEdicion.id : null,
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

    // Funciones auxiliares para cascada y edición
    function CargarMunicipios(claveEstado, municipioSeleccion_Editar = null, localidadSeleccion_Editar = null) {
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
            opciones: municipios.map(m => ({ value: m.municipio, text: m.municipio })),
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
        window.municipioSeleccionadoNombre = municipioNombre;
        window.localidadSeleccionadaObjeto = null;

        $('#contenedor-select-localidad').empty();
        const localidadesFiltradas = ObtenerLocalidadesPorMunicipio(window.localidades, municipioNombre);

        InsertarCustomSelect({
            contenedor: '#contenedor-select-localidad',
            id: 'select-localidad',
            placeholder: 'Selecciona una localidad',
            buscador: true,
            opciones: localidadesFiltradas.map((item, index) => ({
                value: item.localidad,
                text: item.localidad
            })),
            onChange: function () {}
        });

        if (localidadSeleccion_Editar !== null && typeof CustomSelect !== 'undefined') {
            CustomSelect.setValue('#select-localidad', localidadSeleccion_Editar);
        }
    }

    function PrecargarDatosEdicion(sucursal) {
        $("#sucursal-input-nombre").val(sucursal.nombre || '');
        if (typeof CustomSelect !== 'undefined') {
            CustomSelect.setValue('#select-custom-tipo-sucursal', sucursal.tipo);
        }
        $("#sucursal-input-calle").val(sucursal.calle || '');
        $("#sucursal-input-num-ext").val(sucursal.numero_exterior || '');
        $("#sucursal-input-num-int").val(sucursal.numero_interior || '');
        $("#sucursal-input-cp").val(sucursal.codigo_postal || '');

        if (sucursal.estado && typeof CustomSelect !== 'undefined') {
            CustomSelect.setValue('#select-estado', sucursal.estado);
            CargarMunicipios(sucursal.estado, sucursal.municipio, sucursal.localidad);
        }

        if (sucursal.telefono) TelefonosUI.setValor("#sucursal-input-telefono", sucursal.telefono);
        if (sucursal.telefono_adicional) TelefonosUI.setValor("#sucursal-input-telefono-adicional", sucursal.telefono_adicional);
        if (sucursal.whatsapp) TelefonosUI.setValor("#sucursal-input-whatsapp", sucursal.whatsapp);
    }

    // Inicialización
    if (window.localidades) {
        InicializarGestionarSucursales();
    }

    $(document).off('datosListos.gestionSucursales').on('datosListos.gestionSucursales', function () {
        InicializarGestionarSucursales();
    });
});

function ValidarSucursal() {
    let nombre = $('#sucursal-input-nombre').val().trim().toLowerCase();
    let tipo = CustomSelect.getValue('#select-custom-tipo-sucursal');
    let idActual = window.sucursalEdicion ? window.sucursalEdicion.id : null;

    if (window.sucursales && Array.isArray(window.sucursales)) {
        let existeDuplicado = window.sucursales.some(sucursal => {
            if (idActual && sucursal.id == idActual) return false;

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

