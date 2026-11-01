/* =============================================
    CONTROLADOR DEL MÓDULO CLIENTES
============================================= */
window.carga_inicial = true;
window.ClientesSelectionController = window.ClientesSelectionController || CrearSeleccionController('Clientes');
window.filtrosAdicionales = window.filtrosAdicionales || {}; // Inicializamos como objeto global seguro

$.messenger.on('cliente_editado', function (data, sourceWindow, origin) {
   if(data.status=='success')
   {
        ModalAPI.cerrar()
        CargarClientes()
   }
});



$(document).off('app:inicializada').on('app:inicializada', async() => {
    // 0. Sincronizamos los parámetros de la URL, rellenamos inputs, variables globales y el estado del MenuSelectorCheck
    if (window.UrlStateSyncService) {
        window.carga_inicial = false;
        const parametrosUrl = UrlStateSyncService.sincronizarUrlAInputs((params) => {
            if (params.buscar !== undefined) {
                window.busqueda = params.buscar;
                $('#buscador-cliente').val(params.buscar);
            }
            if (params.pagina !== undefined) {
                window.pagina = parseInt(params.pagina);
            }
            if (params.registros !== undefined || params.registros_por_p !== undefined) {
                window.registrosPorPagina = parseInt(params.registros || params.registros_por_p);
            }
            if (params.habilitado !== undefined) {
                window.habilitado = params.habilitado || 'inactivo';
            }
            if (params.tipo_rfc !== undefined) {
                window.filtrosAdicionales.tipo_rfc = Array.isArray(params.tipo_rfc) ? params.tipo_rfc : [params.tipo_rfc];
            }
            if (params.regimen_fiscal !== undefined) {
                window.filtrosAdicionales.regimen_fiscal = Array.isArray(params.regimen_fiscal) ? params.regimen_fiscal : [params.regimen_fiscal];
            }
        });

        if (parametrosUrl) {
            console.log("Parámetros decodificados de la URL:", parametrosUrl);

            // 💡 SINCRONIZACIÓN INICIAL DE CHECKS EN MenuSelectorCheck DESDE LA URL
            if (window.MenuSelectorCheck && typeof window.MenuSelectorCheck.setSeleccionesPorKey === 'function') {
                if (parametrosUrl.habilitado !== undefined && parametrosUrl.habilitado !== '') {
                    const estadoStr = parametrosUrl.habilitado == 1 ? 'activo' : 'inactivo';
                    MenuSelectorCheck.setSeleccionesPorKey('f-estado', [estadoStr]);
                }
                if (parametrosUrl.tipo_rfc) {
                    const tipoRfcArr = Array.isArray(parametrosUrl.tipo_rfc) ? parametrosUrl.tipo_rfc : [parametrosUrl.tipo_rfc];
                    MenuSelectorCheck.setSeleccionesPorKey('f-rfc', tipoRfcArr);
                }
                if (parametrosUrl.regimen_fiscal) {
                    const regimenArr = Array.isArray(parametrosUrl.regimen_fiscal) ? parametrosUrl.regimen_fiscal : [parametrosUrl.regimen_fiscal];
                    MenuSelectorCheck.setSeleccionesPorKey('f-regimen', regimenArr);
                }
            }
        }
        else
        {
            window.habilitado=1
        }
    }

    // 1. Inicializamos el acordeón universal y funciones base (que cargan JSON y renderizan carrusel)
    if (typeof InicializarAcordeonUniversal === 'function') {
        InicializarAcordeonUniversal();
    }
    
    await FuncionesIniciales();
    
    // Forzamos el refresco del carrusel para asegurar iluminación instantánea tras leer la URL
    if (window.FiltrosCarruselService) {
        FiltrosCarruselService.refrescar();
    }

    // 2. Inicializamos el Buscador Universal independiente con los IDs estandarizados
    if (window.BuscadorUniversal) {
        BuscadorUniversal.crear({
            inputId: '#buscador-cliente',
            btnResetId: '#btn-reset-buscador-cliente',
            onSearch: (termino) => {
                window.busqueda = termino !== undefined ? termino : $('#buscador-cliente').val();
                window.pagina = 1;
                CargarClientes();
            }
        });
    }

    // 3. Carga inicial de clientes usando variables window
    window.pagina = window.pagina || 1;
    window.registrosPorPagina = window.registrosPorPagina || 25;
    window.busqueda = $('#buscador-cliente').val() || window.busqueda || '';

    CargarClientes();
});

function CargarClientes() {
    try {
        MostrarCargando('Obteniendo información...', false);
        window.pagina = window.pagina || 1;
        window.registrosPorPagina = window.registrosPorPagina || 25;

        const valorInputBuscador = $('#buscador-cliente').val();
        if (valorInputBuscador !== undefined) {
            window.busqueda = valorInputBuscador;
        }

        const filtros = {
            ...(window.filtrosAdicionales || {}),
            habilitado: window.habilitado !== undefined ? window.habilitado : 1,
            buscar: window.busqueda || ''
        };

        console.log("Enviando filtros a API:", filtros);

        // 🌟 Recuperamos el orden actual desde el estado global (o por defecto ID DESC)
        const orden = window.ordenClientes || {
            columna: 'ID',
            direccion: 'DESC'
        };

        Obtener_Clientes_API(window.pagina, window.registrosPorPagina, filtros, orden)
            .then(response => {
                OcultarCargando();
                if (response && response.ok) {
                    console.log("Respuesta API Clientes:", response);
                    const listaDatos = response.data?.datos || [];

                    // 🌟 GUARDAR EL UNIVERSO TOTAL DE IDS FILTRADOS CON NORMALIZACIÓN A STRING
                    const idsCrudos = response.data?.todos_los_ids || listaDatos.map(c => c.ID || c.id);
                    window.todosLosIdsFiltrados = idsCrudos.map(id => String(id));

                    if (response.sinDatos || listaDatos.length === 0) {
                        if (window.carga_inicial) {
                            if (typeof Contenedor_No_Resultados === 'function') {
                                Contenedor_No_Resultados('No se encontraron clientes', '#contenedor-principal');
                            }
                        } else {
                            if (typeof Contenedor_No_Resultados === 'function') {
                                Contenedor_No_Resultados('No se encontraron clientes', '#contenedor-tarjetas');
                            }
                            $('#contenedor-resultados > div:first-child > div.w-p-100.h-30.flex').addClass('d-none');
                            $('#contenedor-paginador').addClass('d-none');
                        }

                        $("#contador-total").text(`0 clientes`);
                    } else {
                        $('#contenedor-resultados > div:first-child > div.w-p-100.h-30.flex').removeClass('d-none');
                        $('#contenedor-paginador').removeClass('d-none');
                        $('#contenedor-tarjetas').find('#contenedor-no-resultados').addClass('d-none');

                        if (response.data?.paginacion && window.PaginadorNumerosService) {
                            PaginadorNumerosService.render({
                                contenedor: '#contenedor-paginador',
                                paginacion: response.data.paginacion,
                                callbackPagina: (nuevaPagina) => {
                                    console.log("Cambiando a la página:", nuevaPagina);
                                    window.pagina = nuevaPagina;
                                    CargarClientes();
                                },
                                callbackRegistros: (nuevoLimite) => {
                                    console.log("Cambiando registros por página a:", nuevoLimite);
                                    window.registrosPorPagina = parseInt(nuevoLimite, 10);
                                    window.pagina = 1;
                                    CargarClientes();
                                }
                            });
                        }

                        $("#contador-total").text(`${listaDatos.length} cliente${listaDatos.length > 1 ? 's' : ''}`);

                        if (window.CardTemplateService) {
                            CardTemplateService.render("#contenedor-tarjetas", listaDatos, {
                                idKey: 'ID',
                                tituloKey: 'nombre_completo',
                                badgeKey: 'RFC',
                                permisoOpciones: true,
                                callbackOpciones: 'AbrirMenuOpcionesCliente(event, ${ID}, this)',
                                configuracionCampos: [
                                    { label: 'Código', columna: 'Codigo_Cliente' },
                                    { label: 'RFC', columna: 'RFC' },
                                    { label: 'Correo', columna: 'Correo' },
                                    { label: 'Teléfono', columna: 'Telefono' },
                                    { label: 'Régimen', columna: 'Regimen_Fiscal' },
                                    { label: 'Registrado', columna: 'Fecha_Registro_Fmt' }
                                ]
                            });
                        }
                    }

                    // 🌟 SINCRONIZAR DOM: Marca automáticamente los checkboxes de la página actual si ya están en el Set global
                    if (window.ClientesSelectionController && typeof window.ClientesSelectionController.sincronizarDOM === 'function') {
                        window.ClientesSelectionController.sincronizarDOM();
                    }

                    window.carga_inicial = false;
                }
            })
            .catch(error => {
                console.error("Error al filtrar clientes:", error);
                OcultarCargando();
                MostrarMensaje('Ocurrió un error', false, false, false);
            });
    } catch (error) {
        console.log(error);
        OcultarCargando();
        MostrarMensaje('Ocurrió un error', false, false, false);
    }
}
// Función centralizada para cargar y filtrar clientes (sin parámetros, basada 100% en window)
async function FuncionesIniciales() {
    if (window.CarouselButtonsNav && typeof botonesToolbarConfig !== 'undefined') {
        CarouselButtonsNav.render('#viewer-toolbar', botonesToolbarConfig);
    }

    // CARGAR CATÁLOGO DE REGÍMENES FISCALES
    if (typeof Obtener_Regimenes_API === 'function') {
        try {
            const regimenesData = await Obtener_Regimenes_API();

            // 1. Procesar Regímenes
            window.regimenes = regimenesData;

            const filtroRegimen = window.filtrosConfiguracionClientes?.find(f => f.id === 'f-regimen');
            if (filtroRegimen && Array.isArray(regimenesData)) {
                filtroRegimen.opciones = regimenesData.map(reg => ({
                    id: reg.id,
                    texto: `${reg.id} - ${reg.descripcion}`
                }));
            }

            console.log("Catálogo de regímenes cargado exitosamente.");

        } catch (error) {
            console.error("Error al cargar los regímenes fiscales:", error);
        }
    }

    // 2. RENDERIZA EL CARRUSEL CON LAS OPCIONES YA CARGADAS
    if (window.FiltrosCarruselService && typeof filtrosConfiguracionClientes !== 'undefined') {
        FiltrosCarruselService.render(
            '#contenedor-filtros', 
            filtrosConfiguracionClientes, 
            (filtroSeleccionado, idBtn) => {
                if (!filtroSeleccionado || !filtroSeleccionado.opciones) return;

                if (window.MenuSelectorCheck && typeof window.MenuSelectorCheck.cerrar === 'function') {
                    window.MenuSelectorCheck.cerrar();
                }

                let seleccionesActuales = [];
                if (window.MenuSelectorCheck && typeof window.MenuSelectorCheck.getSeleccionadosPorKey === 'function') {
                    seleccionesActuales = window.MenuSelectorCheck.getSeleccionadosPorKey(idBtn);
                }

                if (seleccionesActuales.length === 0) {
                    if (idBtn === 'f-estado') {
                        if (window.habilitado !== undefined && window.habilitado !== '') {
                            seleccionesActuales = [window.habilitado == 1 ? 'activo' : 'inactivo'];
                        }
                    } else if (idBtn === 'f-rfc') {
                        seleccionesActuales = window.filtrosAdicionales?.tipo_rfc || [];
                    } else if (idBtn === 'f-regimen') {
                        seleccionesActuales = window.filtrosAdicionales?.regimen_fiscal || [];
                    }
                }

                MenuSelectorCheck.abrir(`#${idBtn}`, filtroSeleccionado.opciones, {
                    multiple: filtroSeleccionado.config?.multiple ?? true,
                    buscador: filtroSeleccionado.config?.buscador ?? false,
                    contenedorTags: '#contenedor-tags-filtros',
                    seleccionados: seleccionesActuales,
                    onChange: (seleccionados) => {
                        window.filtrosAdicionales = window.filtrosAdicionales || {};

                        if (idBtn === 'f-estado') {
                            if (seleccionados.includes('activo')) {
                                window.habilitado = 1;
                            } else if (seleccionados.includes('inactivo')) {
                                window.habilitado = 0;
                            } else {
                                window.habilitado = undefined;
                            }

                            if (window.ClientesSelectionController && typeof window.ClientesSelectionController.limpiar === 'function') {
                                window.ClientesSelectionController.limpiar();
                            }
                        } else if (idBtn === 'f-rfc') {
                            window.filtrosAdicionales.tipo_rfc = seleccionados;
                        } else if (idBtn === 'f-regimen') {
                            window.filtrosAdicionales.regimen_fiscal = seleccionados;
                        }

                        window.pagina = 1;
                        CargarClientes();

                        if (window.FiltrosCarruselService) {
                            FiltrosCarruselService.refrescar();
                        }
                    }
                });
            },
            (idBtn) => {
                if (idBtn === 'f-estado') {
                    return window.habilitado !== undefined && window.habilitado !== '';
                } else if (idBtn === 'f-rfc') {
                    return window.filtrosAdicionales?.tipo_rfc?.length > 0;
                } else if (idBtn === 'f-regimen') {
                    return window.filtrosAdicionales?.regimen_fiscal?.length > 0;
                }
                return false;
            }
        );
    }

    // 3. Inicialización del controlador de selección conectado a la barra flotante
    if (window.ClientesSelectionController && window.SelectionBarService) {
        window.ClientesSelectionController.init({
            scope: $("#contenedor-resultados"),
            checkItemClass: '.check-item',
            tarjetaClass: '.card-universal',
            claseActiva: 'seleccionada',
            checkAllId: 'check-item-all',
            onChange: SelectionBarService.conectar(window.ClientesSelectionController, {
                entidad: 'clientes',
                barra: '#barra-seleccion',
                contador: '#contador-container',
                contenedorBotones: '#acciones-masivas-container',
                botones: [
                    {
                        id: 'btn-eliminar-masivo',
                        icon: 'vf-ic_fluent_delete_24_filled',
                        title: 'Eliminar seleccionados',
                        onclick: 'EliminarClientesMasivos()'
                    },
                    {
                        id: 'btn-exportar-masivo',
                        icon: 'vf-ic_fluent_arrow_export_24_filled',
                        title: 'Exportar seleccionados',
                        onclick: 'ExportarClientesMasivos()'
                    }
                ]
            })
        });
    }

    // 4. Configuración del menú desplegable de selección masiva (Página actual vs Todos)
    $(document).off('click.abrirMenuSel').on('click.abrirMenuSel', '#btn-menu-seleccion', function(e) {
        e.preventDefault();
        e.stopPropagation();
    
        const opcionesMenu = [
            { id: 'pagina', texto: 'Seleccionar página actual' },
            { id: 'todos', texto: `Seleccionar todos (${window.todosLosIdsFiltrados?.length || 0} registros)` },
            { id: 'ninguno', texto: 'Deseleccionar todos' }
        ];
    
        window.MenuSelectorCheck.abrir(this, opcionesMenu, {
            multiple: false,
            buscador: false,
            onChange: (seleccionadoArray) => {
                const accion = seleccionadoArray[0];
                if (!accion) return;
    
                const controlador = window.ClientesSelectionController;
    
                if (accion === 'pagina') {
                    if (typeof controlador.limpiar === 'function') {
                        controlador.limpiar();
                    }
                    controlador.seleccionarTodo(true);
                } 
                else if (accion === 'todos') {
                    if (window.todosLosIdsFiltrados && Array.isArray(window.todosLosIdsFiltrados)) {
                        window.todosLosIdsFiltrados.forEach(id => {
                            if (typeof controlador.agregar === 'function') {
                                controlador.agregar(String(id));
                            }
                        });
                    }
                    controlador.sincronizarDOM();
                } 
                else if (accion === 'ninguno') {
                    controlador.limpiar();
                }
            }
        });
    });

    $(document).off('click.abrirMenuOrden').on('click.abrirMenuOrdens', '#btn-ordenar-registros', function(e) {
        Abrir_Menu_Opciones_Global(e, window.opcionesMenuOrdenar);
    });
}

function AbrirMenuOpcionesCliente(event, idCliente, elementoButton) {
    if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
    }

    // 1. Obtener los parámetros actuales desde la URL cifrada
    const parametrosUrl = (window.UrlStateSyncService && typeof window.UrlStateSyncService.obtenerParametros === 'function')
        ? window.UrlStateSyncService.obtenerParametros() || {}
        : {};

    const habilitado = parametrosUrl.habilitado !== undefined ? parseInt(parametrosUrl.habilitado) : 1;

    // 2. Seleccionar el arreglo de opciones según el estatus en la URL
    const opcionesBase = (habilitado === 0) 
        ? (window.opcionesClienteDeshabilitado || []) 
        : (window.opcionesClienteHabilitado || []);

    // 3. Filtrar las opciones según los permisos del usuario
    const opcionesPermitidas = opcionesBase.filter(op => {
        if (!op.permiso) return true;
        return window.PermisosService && typeof window.PermisosService.tienePermiso === 'function' 
            ? PermisosService.tienePermiso(op.permiso) 
            : true;
    });

    if (opcionesPermitidas.length === 0) {
        console.warn("No hay opciones disponibles para este cliente con los permisos actuales.");
        return;
    }

    // 4. Mapear los callbacks para inyectar el ID y asegurar la actualización del estado cifrado
    const opcionesConId = opcionesPermitidas.map(op => ({
        ...op,
        callback: () => {
            if (window.UrlStateSyncService && typeof window.UrlStateSyncService.generarUrlConEstado === 'function') {
                const paramsActuales = window.UrlStateSyncService.obtenerParametros() || {};
                window.UrlStateSyncService.generarUrlConEstado({
                    ...paramsActuales,
                    buscar: window.busqueda || paramsActuales.buscar || '',
                    pagina: window.pagina || paramsActuales.pagina || 1,
                    cliente_seleccionado: idCliente,
                    accion_actual: op.texto
                });
            }

            if (typeof op.callback === 'function') {
                op.callback(idCliente);
            }
        }
    }));

    // 5. Abrir el menú global de opciones
    if (typeof Abrir_Menu_Opciones_Global === 'function') {
        Abrir_Menu_Opciones_Global(elementoButton, opcionesConId);
    } else {
        console.warn("Abrir_Menu_Opciones_Global no está disponible.");
    }
}

function EditarCliente(id,seccion)
{
    console.log(seccion)
    CrearVentanaIframe(
        'Editar cliente',
        '../components/editar.cliente.php',
        '620px',
        true,
        true,
        function (iframeElement) {
            // Empaquetamos los datos con la propiedad 'localidades'
            let datos = {
                id: id,
                seccion:seccion
            };

            // Enviamos al iframe recién creado usando la acción 'codigo_postal'
            $.messenger.send(iframeElement, 'datos_iniciales', datos);
        }
    );
}

