$.messenger.on('tipo_seleccionado', function (data, sourceWindow, origin) {
    const formato = typeof data === 'object' && data.formato ? data.formato : data;
    
    // Obtenemos la selección bruta del controlador
    const seleccionBruta = window.ImpuestosSelectionController  ? window.ImpuestosSelectionController.getSeleccionados() : [];

    // Normalizamos: Aseguramos que sea un arreglo plano de IDs (por si devuelve objetos)
    const seleccion = seleccionBruta.map(item => {
        if (typeof item === 'object' && item !== null) {
            // Extrae la propiedad ID o id si es un objeto, o el primer valor disponible
            return item.ID || item.id || Object.values(item)[0];
        }
        return item;
    }).filter(id => id !== undefined && id !== null && id !== '');

    let url = '../../../src/controllers/php/controllers/impuestos.php';
    let accion = 'exportar_esquemas';

    console.log("IDs limpios a exportar:", seleccion); // Depuración en consola del navegador

    ExportacionService.exportar(url, accion, formato, { seleccion: seleccion });
});
window.carga_inicial = true;
window.ImpuestosSelectionController = window.ImpuestosSelectionController || CrearSeleccionController('Impuestos');
window.filtrosAdicionales = window.filtrosAdicionales || {}; // Inicializamos como objeto global seguro

$.messenger.on('esquema_impuestos', function (data, sourceWindow, origin) {
    if (data.status == 'success') {
        ModalAPI.cerrar();
        CargarImpuestos();
    }
});

// Usar .off().on() previene que el evento se duplique si el script se carga o evalúa más de una vez
$(document).off('datosListos.impuestos')
  .on('datosListos.impuestos', async (event) => {
    
    // Evitar ejecuciones simultáneas dobles
    if (window._moduloImpuestosInicializado) return;
    window._moduloImpuestosInicializado = true;

    // 0. Sincronizamos los parámetros de la URL, rellenamos inputs, variables globales y el estado del MenuSelectorCheck
    if (window.UrlStateSyncService) {
        window.carga_inicial = false;
        const parametrosUrl = UrlStateSyncService.sincronizarUrlAInputs((params) => {
            if (params.buscar !== undefined) {
                window.busqueda = params.buscar;
                $('#buscador-impuestos').val(params.buscar);
            }
            if (params.pagina !== undefined) {
                window.pagina = parseInt(params.pagina);
            }
            if (params.registros !== undefined || params.registros_por_p !== undefined) {
                window.registrosPorPagina = parseInt(params.registros || params.registros_por_p);
            }
            if (params.habilitado !== undefined) {
                window.habilitado = params.habilitado;
            }
            if (params.f_iva !== undefined) {
                window.filtrosAdicionales.f_iva = Array.isArray(params.f_iva) ? params.f_iva : [params.f_iva];
            }
            if (params.f_ieps !== undefined) {
                window.filtrosAdicionales.f_ieps = params.f_ieps;
            }
            if (params.f_retenciones !== undefined) {
                window.filtrosAdicionales.f_retenciones = Array.isArray(params.f_retenciones) ? params.f_retenciones : [params.f_retenciones];
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
                if (parametrosUrl.f_iva) {
                    const ivaArr = Array.isArray(parametrosUrl.f_iva) ? parametrosUrl.f_iva : [parametrosUrl.f_iva];
                    MenuSelectorCheck.setSeleccionesPorKey('f-iva', ivaArr);
                }
                if (parametrosUrl.f_ieps) {
                    MenuSelectorCheck.setSeleccionesPorKey('f-ieps', [parametrosUrl.f_ieps]);
                }
                if (parametrosUrl.f_retenciones) {
                    const retArr = Array.isArray(parametrosUrl.f_retenciones) ? parametrosUrl.f_retenciones : [parametrosUrl.f_retenciones];
                    MenuSelectorCheck.setSeleccionesPorKey('f-retenciones', retArr);
                }
            }
        }
        else {
            window.habilitado = 1;
        }
    }

    // 1. Inicializamos el acordeón universal y funciones base
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
            inputId: '#buscador-impuestos',
            btnResetId: '#btn-reset-buscador-impuestos',
            onSearch: (termino) => {
                window.busqueda = termino !== undefined ? termino : $('#buscador-impuestos').val();
                window.pagina = 1;
                CargarImpuestos();
            }
        });
    }

    // 3. Carga inicial de impuestos usando variables window
    window.pagina = window.pagina || 1;
    window.registrosPorPagina = window.registrosPorPagina || 25;
    window.busqueda = $('#buscador-impuestos').val() || window.busqueda || '';

    CargarImpuestos();
});

function CargarImpuestos() {
    try {
        MostrarCargando('Obteniendo información...', false);
        window.pagina = window.pagina || 1;
        window.registrosPorPagina = window.registrosPorPagina || 25;

        const valorInputBuscador = $('#buscador-impuestos').val();
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
        const orden = window.ordenImpuestos || {
            columna: 'ID',
            direccion: 'DESC'
        };

        Obtener_Impuestos_API(window.pagina, window.registrosPorPagina, filtros, orden)
            .then(response => {
                OcultarCargando();
                if (response && response.ok) {
                    const listaDatos = response.data?.datos || [];

                    // 🌟 GUARDAR EL UNIVERSO TOTAL DE IDS FILTRADOS CON NORMALIZACIÓN A STRING
                    const idsCrudos = response.data?.todos_los_ids || listaDatos.map(c => c.ID || c.id);
                    window.todosLosIdsFiltrados = idsCrudos.map(id => String(id));

                    if (response.sinDatos || listaDatos.length === 0) {
                        if (window.carga_inicial) {
                            if (typeof Contenedor_No_Resultados === 'function') {
                                Contenedor_No_Resultados('No se encontraron esquemas de impuestos', '#contenedor-principal');
                            }
                        } else {
                            if (typeof Contenedor_No_Resultados === 'function') {
                                Contenedor_No_Resultados('No se encontraron esquemas de impuestos', '#contenedor-tarjetas');
                            }
                            $('#contenedor-resultados > div:first-child > div.w-p-100.h-30.flex').addClass('d-none');
                            $('#contenedor-paginador').addClass('d-none');
                        }

                        $("#contador-total").text(`0 esquemas`);
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
                                    CargarImpuestos();
                                },
                                callbackRegistros: (nuevoLimite) => {
                                    console.log("Cambiando registros por página a:", nuevoLimite);
                                    window.registrosPorPagina = parseInt(nuevoLimite, 10);
                                    window.pagina = 1;
                                    CargarImpuestos();
                                }
                            });
                        }

                        $("#contador-total").text(`${listaDatos.length} esquema${listaDatos.length > 1 ? 's' : ''}`);
                        console.log(listaDatos)
                        if (window.CardTemplateService) {
                            CardTemplateService.render("#contenedor-tarjetas", listaDatos, {
                                idKey: 'ID',
                                tituloKey: 'nombre',
                                badgeKey: 'total_productos_texto',
                                permisoOpciones: window.permiso_editar && window.permiso_eliminar,
                                callbackOpciones: 'AbrirMenuOpcionesImpuesto(event, ${ID}, this)',
                                configuracionCampos: [
                                    { label: 'Tasa IVA', columna: 'tasa_iva' },
                                    { label: 'Tasa IEPS', columna: 'tasa_ieps' },
                                    { label: 'Cuota Litro (IEPS)', columna: 'ieps_cuota_litro' },
                                    { label: 'Cuota Unidad (IEPS)', columna: 'ieps_cuota_unidad' },
                                    { label: 'Retención ISR', columna: 'retencion_isr' },
                                    { label: 'Retención IVA', columna: 'retencion_iva' },
                                    { label: 'Fecha Alta', columna: 'fecha_alta' },
                                    {label:'Fecha modificación', columna:'fecha_modificacion'}
                                ]
                            });
                        }
                    }

                    // 🌟 SINCRONIZAR DOM: Marca automáticamente los checkboxes de la página actual si ya están en el Set global
                    if (window.ImpuestosSelectionController && typeof window.ImpuestosSelectionController.sincronizarDOM === 'function') {
                        window.ImpuestosSelectionController.sincronizarDOM();
                    }

                    window.carga_inicial = false;
                }
            })
            .catch(error => {
                console.error("Error al filtrar impuestos:", error);
                OcultarCargando();
                MostrarMensaje('Ocurrió un error', false, false, false);
            });
    } catch (error) {
        console.log(error);
        OcultarCargando();
        MostrarMensaje('Ocurrió un error', false, false, false);
    }
}

// Función centralizada para cargar componentes y filtros iniciales
async function FuncionesIniciales() {
    const $toolbar = $('#viewer-toolbar');
    if (window.permiso_crear) {
        $toolbar.removeClass('d-none');
        if (window.CarouselButtonsNav && typeof botonesToolbarConfig !== 'undefined') {
            CarouselButtonsNav.render('#viewer-toolbar', botonesToolbarConfig);
        }
    } else {
        $toolbar.addClass('d-none');
    }

    // 2. RENDERIZA EL CARRUSEL CON LAS OPCIONES CONFIGURADAS
    if (window.FiltrosCarruselService && typeof filtrosConfiguracionImpuestos !== 'undefined') {
        FiltrosCarruselService.render(
            '#contenedor-filtros', 
            filtrosConfiguracionImpuestos, 
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
                    } else if (idBtn === 'f-iva') {
                        seleccionesActuales = window.filtrosAdicionales?.f_iva || [];
                    } else if (idBtn === 'f-ieps') {
                        seleccionesActuales = window.filtrosAdicionales?.f_ieps ? [window.filtrosAdicionales.f_ieps] : [];
                    } else if (idBtn === 'f-retenciones') {
                        seleccionesActuales = window.filtrosAdicionales?.f_retenciones || [];
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

                            if (window.ImpuestosSelectionController && typeof window.ImpuestosSelectionController.limpiar === 'function') {
                                window.ImpuestosSelectionController.limpiar();
                            }
                        } else if (idBtn === 'f-iva') {
                            window.filtrosAdicionales.f_iva = seleccionados;
                        } else if (idBtn === 'f-ieps') {
                            window.filtrosAdicionales.f_ieps = seleccionados[0] || '';
                        } else if (idBtn === 'f-retenciones') {
                            window.filtrosAdicionales.f_retenciones = seleccionados;
                        }

                        window.pagina = 1;
                        CargarImpuestos();

                        if (window.FiltrosCarruselService) {
                            FiltrosCarruselService.refrescar();
                        }
                    }
                });
            },
            (idBtn) => {
                if (idBtn === 'f-estado') {
                    return window.habilitado !== undefined && window.habilitado !== '';
                } else if (idBtn === 'f-iva') {
                    return window.filtrosAdicionales?.f_iva?.length > 0;
                } else if (idBtn === 'f-ieps') {
                    return window.filtrosAdicionales?.f_ieps !== undefined && window.filtrosAdicionales?.f_ieps !== '';
                } else if (idBtn === 'f-retenciones') {
                    return window.filtrosAdicionales?.f_retenciones?.length > 0;
                }
                return false;
            }
        );
    }
 
    // Inicialización del controlador de selección
    if (window.ImpuestosSelectionController && window.SelectionBarService) {
        const refrescarBarra = SelectionBarService.conectar(window.ImpuestosSelectionController, {
            entidad: 'impuestos',
            barra: '#barra-seleccion',
            contador: '#contador-container',
            contenedorBotones: '#acciones-masivas-container',
            botones: () => {
                const estadoActual = window.habilitado !== undefined ? parseInt(window.habilitado) : 1;
                return (estadoActual === 0) 
                    ? (window.botones_opciones_deshabilitado || []) 
                    : (window.botones_opciones_habilitado || []);
            }
        });

        window.ImpuestosSelectionController.init({
            scope: $("#contenedor-resultados"),
            checkItemClass: '.check-item',
            tarjetaClass: '.card-universal',
            claseActiva: 'seleccionada',
            checkAllId: 'check-item-all',
            onChange: refrescarBarra
        });
    }

    // 4. Configuración del menú desplegable de selección masiva
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
    
                const controlador = window.ImpuestosSelectionController;
    
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
function AbrirMenuOpcionesImpuesto(event, idImpuesto, elementoButton) {
    console.log("##")
    if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
    }

    const parametrosUrl = (window.UrlStateSyncService && typeof window.UrlStateSyncService.obtenerParametros === 'function')
        ? window.UrlStateSyncService.obtenerParametros() || {}
        : {};

    const habilitado = window.habilitado !== undefined ? parseInt(window.habilitado) : (parametrosUrl.habilitado !== undefined ? parseInt(parametrosUrl.habilitado) : 1);

    const opcionesBase = (habilitado === 0) 
        ? (window.opcionesImpuestoDeshabilitado || []) 
        : (window.opcionesImpuestoHabilitado || []);

    const opcionesPermitidas = opcionesBase.filter(op => {
        if (!op.permiso) return true;
        return window.PermisosService && typeof window.PermisosService.tienePermiso === 'function' 
            ? PermisosService.tienePermiso(op.permiso) 
            : true;
    });

    if (opcionesPermitidas.length === 0) {
        console.warn("No hay opciones disponibles para este impuesto con los permisos actuales.");
        return;
    }

    const opcionesConId = opcionesPermitidas.map(op => ({
        ...op,
        callback: () => {
            if (window.UrlStateSyncService && typeof window.UrlStateSyncService.generarUrlConEstado === 'function') {
                const paramsActuales = window.UrlStateSyncService.obtenerParametros() || {};
                window.UrlStateSyncService.generarUrlConEstado({
                    ...paramsActuales,
                    buscar: window.busqueda || paramsActuales.buscar || '',
                    pagina: window.pagina || paramsActuales.pagina || 1,
                    impuesto_seleccionado: idImpuesto,
                    accion_actual: op.texto
                });
            }

            if (typeof op.callback === 'function') {
                op.callback(idImpuesto);
            }
        }
    }));

    if (typeof Abrir_Menu_Opciones_Global === 'function') {
        Abrir_Menu_Opciones_Global(elementoButton, opcionesConId);
    } else {
        console.warn("Abrir_Menu_Opciones_Global no está disponible.");
    }
}

function Editar_Esquema_Impuesto(id) {
    CrearVentanaIframe(
        'Editar esquema de impuesto',
        '../components/gestionar.esquema.impuesto.php',
        '620px',
        true,
        true,
        function (iframeElement) {
            let datos = {
                id: id
            };
            $.messenger.send(iframeElement, 'datos_iniciales', datos);
        }
    );
}

async function Eliminar_Esquema_Impuestos(id) {
    if (!id) {
        console.error("Eliminar_Esquema_Impuestos: No se proporcionó un ID válido.");
        return false;
    }

    // 1. Mostrar la pregunta de confirmación adaptada para esquemas fiscales
    const confirmado = await MostrarPregunta({
        titulo: 'Eliminar perfil de impuestos',
        texto: `¿Estás seguro de que deseas eliminar este esquema fiscal? Esta acción no se puede deshacer.`,
        icono: 'vf-ic_fluent_delete_24_filled',
        confirmarText: 'Sí, eliminar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-danger',
        altura: 350
    });

    // 2. Si el usuario cancela, detenemos el proceso
    if (!confirmado) {
        return false;
    }

    if (typeof MostrarCargando === 'function') {
        MostrarCargando('Eliminando esquema fiscal...', false);
    }

    Eliminar_Esquema_Impuestos_AJAX(id)
}

async function Habilitar_Esquema_Impuestos(id) {
    if (!id) {
        console.error("Habilitar_Esquema_Impuestos: No se proporcionó un ID válido.");
        return false;
    }

    // 1. Mostrar la pregunta de confirmación adaptada para habilitar el esquema fiscal
    const confirmado = await MostrarPregunta({
        titulo: 'Habilitar perfil de impuestos',
        texto: `¿Estás seguro de que deseas habilitar este esquema fiscal?`,
        icono: 'vf-ic_fluent_checkmark_24_filled',
        confirmarText: 'Sí, habilitar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-primary',
        altura: 350
    });

    // 2. Si el usuario cancela, detenemos el proceso
    if (!confirmado) {
        return false;
    }

    if (typeof MostrarCargando === 'function') {
        MostrarCargando('Habilitando esquema fiscal...', false);
    }

    return await Habilitar_Esquema_Impuestos_AJAX(id);
}
async function Eliminar_Esquema_Impuestos_Masivo()
{
    const seleccionados = window.ImpuestosSelectionController.getSeleccionados();
    
    if (seleccionados.length === 0) {
        return MostrarAlerta('Selecciona al menos un cliente', 230, false);
    }
    console.log(seleccionados)
    Eliminar_Esquema_Impuestos_Masivo_AJAX(seleccionados)
    
}

async function Habilitar_Esquema_Impuestos_Masivo()
{
    const seleccionados = window.ImpuestosSelectionController.getSeleccionados();
    
    if (seleccionados.length === 0) {
        return MostrarAlerta('Selecciona al menos un cliente', 230, false);
    }
    console.log(seleccionados)
    Habilitar_Esquema_Impuestos_Masivo_AJAX(seleccionados)
    
}

function Exportar_Esquemas_Impuestos_Masivos() {

    CrearVentanaIframe(
        'Tipo de archivo',
        '../components/tipo.archivo.php',
        '520px',
        true,
        true,
        function (iframeElement) {
            let datos = {
                tipos_permitidos: '.pdf, .csv, .xml, .xls, .xlsx',
                multiple: false,
            };
            $.messenger.send(iframeElement, 'datos_iniciales', datos);
        }
    );  
}