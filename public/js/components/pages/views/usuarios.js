window.carga_inicial = window.carga_inicial !== undefined ? window.carga_inicial : true;
window.UsuariosSelectionController = window.UsuariosSelectionController || CrearSeleccionController('Usuarios');
window.filtrosAdicionales = window.filtrosAdicionales || {};

$.messenger.off('usuario_editado').on('usuario_editado', function(data, sourceWindow, origin) {
    if (data.status === "success") {
        ModalAPI.cerrar();
        CargarUsuarios();
    }
});

// Usamos namespace único y evitamos múltiples bindings duplicados
$(document).off('app:inicializada.usuariosInit datosListos.usuariosInit')
  .on('app:inicializada.usuariosInit datosListos.usuariosInit', async (event) => {
    
    window.filtrosAdicionales = window.filtrosAdicionales || {};

    if (window.UrlStateSyncService) {
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
            if (window.MenuSelectorCheck && typeof window.MenuSelectorCheck.setSeleccionesPorKey === 'function') {
                if (parametrosUrl.habilitado !== undefined && parametrosUrl.habilitado !== '') {
                    MenuSelectorCheck.setSeleccionesPorKey('f-estado', [String(parametrosUrl.habilitado)]);
                }
                if (parametrosUrl.correo_verificado !== undefined && parametrosUrl.correo_verificado !== '') {
                    MenuSelectorCheck.setSeleccionesPorKey('f-correo-verificado', [String(parametrosUrl.correo_verificado)]);
                }
            }
        } else {
            window.habilitado = 1;
        }
    }

    if (typeof InicializarAcordeonUniversal === 'function') {
        InicializarAcordeonUniversal();
    }
    
    await FuncionesIniciales();
    
    if (window.FiltrosCarruselService) {
        FiltrosCarruselService.refrescar();
    }

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

        const valorInputBuscador = $('#buscador-usuario').val();
        if (valorInputBuscador !== undefined) {
            window.busqueda = valorInputBuscador;
        }

        const filtros = {
            ...(window.filtrosAdicionales || {}),
            habilitado: window.habilitado !== undefined ? window.habilitado : 1,
            buscar: window.busqueda || ''
        };

        const orden = window.ordenUsuarios || {
            columna: 'ID',
            direccion: 'DESC'
        };

        Obtener_Usuarios_API(window.pagina, window.registrosPorPagina, filtros, orden)
            .then(response => {
                OcultarCargando();
                if (response && response.ok) {
                    const listaDatos = response.data?.datos || [];
                    window.usuarioActualID = response.data.usuario_actual_id;
                    
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
                                    window.pagina = nuevaPagina;
                                    CargarUsuarios();
                                },
                                callbackRegistros: (nuevoLimite) => {
                                    window.registrosPorPagina = parseInt(nuevoLimite, 10);
                                    window.pagina = 1;
                                    CargarUsuarios();
                                }
                            });
                        }

                        $("#contador-total").text(`${listaDatos.length} usuario${listaDatos.length > 1 ? 's' : ''}`);

                        if (window.CardTemplateService) {
                            const tienePermisoGeneral = (window.permiso_editar || window.permiso_eliminar || window.permiso_editar_permisos);
                            CardTemplateService.render("#contenedor-tarjetas", listaDatos, {
                                idKey: 'ID',
                                tituloKey: 'nombre_completo',
                                badgeKey: 'nombre_usuario',
                                esActualKey: 'es_usuario_actual',
                                permisoOpciones: tienePermisoGeneral,
                                callbackOpciones: 'AbrirMenuOpcionesUsuario(event, ${ID}, this)',
                                configuracionCampos: [
                                    { label: 'Usuario', columna: 'nombre_usuario' },
                                    { label: 'Correo', columna: 'correo' },
                                    { label: 'Correo verificado', columna: 'correo_verificado_fmt' },
                                    { label: 'Teléfono', columna: 'telefono' },
                                    { label: 'CURP', columna: 'curp' },
                                    { label: 'RFC', columna: 'rfc' },
                                    { label: 'Fecha de nacimiento', columna: 'fecha_nacimiento' },
                                    { label: 'Registrado', columna: 'Fecha_registro' }
                                ]
                            });
                        }
                    }

                    if (window.UsuariosSelectionController && typeof window.UsuariosSelectionController.sincronizarDOM === 'function') {
                        window.UsuariosSelectionController.sincronizarDOM();
                    }

                    // Establecemos carga_inicial a falso una única vez aquí de forma definitiva
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
                        permiso: 'eliminar_usuarios',
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

    $(document).off('click.abrirMenuOrden').on('click.abrirMenuOrden', '#btn-ordenar-registros', function(e) {
        Abrir_Menu_Opciones_Global(e, window.opcionesMenuOrdenar);
    });
}

function AbrirMenuOpcionesUsuario(event, idUsuario, elementoButton) {
    if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
    }

    const parametrosUrl = (window.UrlStateSyncService && typeof window.UrlStateSyncService.obtenerParametros === 'function')
        ? window.UrlStateSyncService.obtenerParametros() || {}
        : {};

    const habilitado = parametrosUrl.habilitado !== undefined ? parseInt(parametrosUrl.habilitado) : 1;
    const opcionesBase = (habilitado === 0) 
        ? (window.opcionesUsuarioDeshabilitado || []) 
        : (window.opcionesUsuarioHabilitado || []);

    const opcionesPermitidas = opcionesBase.filter(op => {
        if (!op.permiso) return true;
        return window.PermisosService && typeof window.PermisosService.tienePermiso === 'function' 
            ? PermisosService.tienePermiso(op.permiso) 
            : true;
    });

    if (opcionesPermitidas.length === 0) return;

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

    if (typeof Abrir_Menu_Opciones_Global === 'function') {
        Abrir_Menu_Opciones_Global(elementoButton, opcionesConId);
    }
}

function Editar_Usuario(id, seccion) {
    const tienePermiso = (window.PermisosService && typeof window.PermisosService.tienePermiso === 'function') 
        ? PermisosService.tienePermiso('editar_usuarios') 
        : true;

    if (!tienePermiso) {
        MostrarAlerta('No tienes permiso para editar', 230, false);
        return; 
    }

    AbrirModalAutenticacion(false, function(datosAuth) {
        window.permiso_edicion = true;

        CrearVentanaIframe(
            'Editar usuario',
            '../components/editar.usuario.php',
            '620px',
            true,
            true,
            function (iframeElement) {
                let datosIframe = {
                    id: id,
                    seccion: seccion
                };
                $.messenger.send(iframeElement, 'datos_iniciales', datosIframe);
            }
        );
    });
}

async function Deshabilitar_Usuario(id_usuario) {
    const confirmado = await MostrarPregunta({
        titulo: 'Deshabilitar usuario',
        texto: `¿Estás seguro de que deseas deshabilitar a este usuario? Esta acción no se puede deshacer.`,
        icono: 'vf-ic_fluent_delete_24_filled',
        confirmarText: 'Sí, eliminar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-danger',
        altura: 350
    });

    if (!confirmado) return false;
    Deshabilitar_Usuario_AJAX(id_usuario);
}

async function Eliminar_Usuario_Permanente(id_usuario) {
    const confirmado = await MostrarPregunta({
        titulo: 'Eliminación Permanente',
        texto: '¿Estás completamente seguro? Esta acción borrará al usuario de forma definitiva y no se puede deshacer.',
        icono: 'vf-ic_fluent_delete_24_filled',
        confirmarText: 'Sí, elimina',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-danger',
        altura: 370
    });

    if (!confirmado) return false;
    Eliminar_Usuario_Permanente_AJAX(id_usuario);
}

async function Habilitar_Usuario(id_usuario) {
    const confirmado = await MostrarPregunta({
        titulo: 'Habilitar usuario',
        texto: '¿Estás seguro de que deseas habilitar el acceso a este usuario?',
        icono: 'vf-ic_fluent_checkmark_24_filled',
        confirmarText: 'Sí, habilitar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-primary',
        altura: 350
    });

    if (!confirmado) return false;
    Habilitar_Usuario_AJAX(id_usuario);
}