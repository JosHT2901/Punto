window.carga_inicial = true;
window.UsuariosSelectionController = window.UsuariosSelectionController || CrearSeleccionController('Usuarios');
window.filtrosAdicionales = window.filtrosAdicionales || {}; // Inicializamos como objeto global seguro

$(document).off('app:inicializada').on('app:inicializada', async() => {
    // Inicializamos window.filtrosAdicionales por seguridad
    window.filtrosAdicionales = window.filtrosAdicionales || {};

    // 0. Sincronizamos los parámetros de la URL, rellenamos inputs, variables globales y el estado del MenuSelectorCheck
    if (window.UrlStateSyncService) {
        window.carga_inicial = false;
        const parametrosUrl = UrlStateSyncService.sincronizarUrlAInputs((params) => {
            if (params.buscar !== undefined) {
                window.busqueda = params.buscar;
                $('#buscador-usuario').val(params.buscar);
            }
            if (params.pagina !== undefined) {
                window.pagina = parseInt(params.pagina, 10);
            }
            if (params.registros !== undefined || params.registros_por_p !== undefined) {
                window.registrosPorPagina = parseInt(params.registros || params.registros_por_p, 10);
            }
            if (params.habilitado !== undefined && params.habilitado !== '') {
                window.habilitado = parseInt(params.habilitado, 10);
            }
            if (params.correo_verificado !== undefined && params.correo_verificado !== '') {
                window.filtrosAdicionales.correo_verificado = parseInt(params.correo_verificado, 10);
            }
        });

        if (parametrosUrl) {
            console.log("Parámetros decodificados de la URL:", parametrosUrl);

            // 💡 SINCRONIZACIÓN INICIAL DE CHECKS EN MenuSelectorCheck DESDE LA URL
            if (window.MenuSelectorCheck && typeof window.MenuSelectorCheck.setSeleccionesPorKey === 'function') {
                if (parametrosUrl.habilitado !== undefined && parametrosUrl.habilitado !== '') {
                    MenuSelectorCheck.setSeleccionesPorKey('f-estado', [String(parametrosUrl.habilitado)]);
                }
                if (parametrosUrl.correo_verificado !== undefined && parametrosUrl.correo_verificado !== '') {
                    MenuSelectorCheck.setSeleccionesPorKey('f-correo-verificado', [String(parametrosUrl.correo_verificado)]);
                }
            }
        } else {
            window.habilitado = 1; // Por defecto activos si no hay estado en URL
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
            inputId: '#buscador-usuario',
            btnResetId: '#btn-reset-buscador-usuario',
            onSearch: (termino) => {
                window.busqueda = termino !== undefined ? termino : $('#buscador-usuario').val();
                window.pagina = 1;
                CargarUsuarios();
            }
        });
    }

    window.pagina = window.pagina || 1;
    window.registrosPorPagina = window.registrosPorPagina || 25;
    window.busqueda = $('#buscador-usuario').val() || window.busqueda || '';

    CargarUsuarios();
});
function CargarUsuarios() {
    try {
        MostrarCargando('Obteniendo información...', false);
        window.pagina = window.pagina || 1;
        window.registrosPorPagina = window.registrosPorPagina || 25;

        // O si tu buscador de usuarios tiene otro ID, ajústalo aquí (ej. #buscador-usuario)
        const valorInputBuscador = $('#buscador-usuario').val()
        if (valorInputBuscador !== undefined) {
            window.busqueda = valorInputBuscador;
        }

        const filtros = {
            ...(window.filtrosAdicionales || {}),
            habilitado: window.habilitado !== undefined ? window.habilitado : 1,
            buscar: window.busqueda || ''
        };

        console.log("Enviando filtros a API de Usuarios:", filtros);

        // 🌟 Recuperamos el orden actual desde el estado global (o por defecto ID DESC)
        const orden = window.ordenUsuarios || {
            columna: 'ID',
            direccion: 'DESC'
        };

        Obtener_Usuarios_API(window.pagina, window.registrosPorPagina, filtros, orden)
            .then(response => {
                OcultarCargando();
                if (response && response.ok) {
                    console.log("Respuesta API Usuarios:", response);
                    const listaDatos = response.data?.datos || [];

                    // 🌟 GUARDAR EL UNIVERSO TOTAL DE IDS FILTRADOS CON NORMALIZACIÓN A STRING
                    const idsCrudos = response.data?.todos_los_ids || listaDatos.map(u => u.ID || u.id);
                    window.todosLosIdsFiltrados = idsCrudos.map(id => String(id));

                    if (response.sinDatos || listaDatos.length === 0) {
                        if (window.carga_inicial) {
                            if (typeof Contenedor_No_Resultados === 'function') {
                                Contenedor_No_Resultados('No se encontraron usuarios', '#contenedor-principal');
                            }
                        } else {
                            if (typeof Contenedor_No_Resultados === 'function') {
                                Contenedor_No_Resultados('No se encontraron usuarios', '#contenedor-tarjetas');
                            }
                            $('#contenedor-resultados > div:first-child > div.w-p-100.h-30.flex').addClass('d-none');
                            $('#contenedor-paginador').addClass('d-none');
                        }

                        $("#contador-total").text(`0 usuarios`);
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
                                    CargarUsuarios();
                                },
                                callbackRegistros: (nuevoLimite) => {
                                    console.log("Cambiando registros por página a:", nuevoLimite);
                                    window.registrosPorPagina = parseInt(nuevoLimite, 10);
                                    window.pagina = 1;
                                    CargarUsuarios();
                                }
                            });
                        }

                        $("#contador-total").text(`${listaDatos.length} usuario${listaDatos.length > 1 ? 's' : ''}`);

                        if (window.CardTemplateService) {
                            CardTemplateService.render("#contenedor-tarjetas", listaDatos, {
                                idKey: 'ID',
                                tituloKey: 'nombre_completo', // O asegúrate de que el backend devuelva esta propiedad concatenada (nombre + apellidos)
                                badgeKey: 'nombre_usuario',
                                permisoOpciones: true,
                                callbackOpciones: 'AbrirMenuOpcionesUsuario(event, ${ID}, this)',
                                configuracionCampos: [
                                    { label: 'Usuario', columna: 'nombre_usuario' },
                                    { label: 'Correo', columna: 'correo' },
                                    { label: 'Correo verificado', columna: 'correo_verificado_fmt' },
                                    { label: 'Teléfono', columna: 'telefono' },
                                    { label: 'CURP', columna: 'curp' },
                                    { label: 'RFC', columna: 'rfc' },
                                    { label:'Fecha de nacimiento',columna:'fecha_nacimiento'},
                                    { label: 'Registrado', columna: 'Fecha_registro' }
                                ]
                            });
                        }
                    }

                    // 🌟 SINCRONIZAR DOM: Marca automáticamente los checkboxes si existe controlador de selección de usuarios
                    if (window.UsuariosSelectionController && typeof window.UsuariosSelectionController.sincronizarDOM === 'function') {
                        window.UsuariosSelectionController.sincronizarDOM();
                    } else if (window.UsuariosSelectionController && typeof window.UsuariosSelectionController.sincronizarDOM === 'function') {
                        window.UsuariosSelectionController.sincronizarDOM();
                    }

                    window.carga_inicial = false;
                }
            })
            .catch(error => {
                console.error("Error al filtrar usuarios:", error);
                OcultarCargando();
                MostrarMensaje('Ocurrió un error', false, false, false);
            });
    } catch (error) {
        console.log(error);
        OcultarCargando();
        MostrarMensaje('Ocurrió un error', false, false, false);
    }
}
async function FuncionesIniciales() {
    if (window.CarouselButtonsNav && typeof botonesToolbarConfig !== 'undefined') {
        CarouselButtonsNav.render('#viewer-toolbar', botonesToolbarConfig);
    }

    // 2. RENDERIZA EL CARRUSEL CON LAS OPCIONES YA CARGADAS
    if (window.FiltrosCarruselService && typeof filtrosConfiguracionUsuarios !== 'undefined') {
        FiltrosCarruselService.render(
            '#contenedor-filtros', 
            filtrosConfiguracionUsuarios, 
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
                            seleccionesActuales = [String(window.habilitado)];
                        }
                    } else if (idBtn === 'f-correo-verificado') {
                        seleccionesActuales = window.filtrosAdicionales?.correo_verificado !== undefined 
                            ? [String(window.filtrosAdicionales.correo_verificado)] 
                            : [];
                    }
                }

                MenuSelectorCheck.abrir(`#${idBtn}`, filtroSeleccionado.opciones, {
                    multiple: filtroSeleccionado.config?.multiple ?? false,
                    buscador: filtroSeleccionado.config?.buscador ?? false,
                    contenedorTags: '#contenedor-tags-filtros',
                    seleccionados: seleccionesActuales,
                    onChange: (seleccionados) => {
                        window.filtrosAdicionales = window.filtrosAdicionales || {};

                        if (idBtn === 'f-estado') {
                            const val = seleccionados[0];
                            if (val !== undefined && val !== '') {
                                window.habilitado = parseInt(val, 10);
                            } else {
                                window.habilitado = undefined;
                            }

                            if (window.UsuariosSelectionController && typeof window.UsuariosSelectionController.limpiar === 'function') {
                                window.UsuariosSelectionController.limpiar();
                            }
                        } else if (idBtn === 'f-correo-verificado') {
                            const val = seleccionados[0];
                            if (val !== undefined && val !== '') {
                                window.filtrosAdicionales.correo_verificado = parseInt(val, 10);
                            } else {
                                delete window.filtrosAdicionales.correo_verificado;
                            }
                        }

                        window.pagina = 1;
                        CargarUsuarios();

                        if (window.FiltrosCarruselService) {
                            FiltrosCarruselService.refrescar();
                        }
                    }
                });
            },
            (idBtn) => {
                if (idBtn === 'f-estado') {
                    return window.habilitado !== undefined && window.habilitado !== '';
                } else if (idBtn === 'f-correo-verificado') {
                    return window.filtrosAdicionales?.correo_verificado !== undefined && window.filtrosAdicionales.correo_verificado !== '';
                }
                return false;
            }
        );
    }

    // 3. Inicialización del controlador de selección conectado a la barra flotante
    if (window.UsuariosSelectionController && window.SelectionBarService) {
        window.UsuariosSelectionController.init({
            scope: $("#contenedor-resultados"),
            checkItemClass: '.check-item',
            tarjetaClass: '.card-universal',
            claseActiva: 'seleccionada',
            checkAllId: 'check-item-all',
            onChange: SelectionBarService.conectar(window.UsuariosSelectionController, {
                entidad: 'usuarios',
                barra: '#barra-seleccion',
                contador: '#contador-container',
                contenedorBotones: '#acciones-masivas-container',
                botones: [
                    {
                        id: 'btn-eliminar-masivo',
                        icon: 'vf-ic_fluent_delete_24_filled',
                        title: 'Eliminar seleccionados',
                        onclick: 'EliminarUsuariosMasivos()'
                    },
                    {
                        id: 'btn-exportar-masivo',
                        icon: 'vf-ic_fluent_arrow_export_24_filled',
                        title: 'Exportar seleccionados',
                        onclick: 'ExportarUsuariosMasivos()'
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
    
                const controlador = window.UsuariosSelectionController;
    
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

    // 5. Menú de ordenamiento corregido
    $(document).off('click.abrirMenuOrden').on('click.abrirMenuOrden', '#btn-ordenar-registros', function(e) {
        Abrir_Menu_Opciones_Global(e, window.opcionesMenuOrdenar);
    });
}

function AbrirMenuOpcionesUsuario(event, idUsuario, elementoButton) {
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
        ? (window.opcionesUsuarioDeshabilitado || []) 
        : (window.opcionesUsuarioHabilitado || []);

    // 3. Filtrar las opciones según los permisos del usuario
    const opcionesPermitidas = opcionesBase.filter(op => {
        if (!op.permiso) return true;
        return window.PermisosService && typeof window.PermisosService.tienePermiso === 'function' 
            ? PermisosService.tienePermiso(op.permiso) 
            : true;
    });

    if (opcionesPermitidas.length === 0) {
        console.warn("No hay opciones disponibles para este usuario con los permisos actuales.");
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
                    usuario_seleccionado: idUsuario,
                    accion_actual: op.texto
                });
            }

            if (typeof op.callback === 'function') {
                op.callback(idUsuario);
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