


if (!window.carga_inicial_ejecutada) {
    window.carga_inicial_ejecutada = true;
    window.carga_inicial = true;
    window.vista_ventana = window.vista_ventana ?? false; // false = vista lista, true = vista tarjetas
    window.SeleccionSinChecksController = CrearSeleccionControllerSinChecks('GlobalSinChecks');
    // Variables globales para la paginación y estado
    window.offsetBiblioteca = 0;
    window.limiteBiblioteca = 20;
    window.cargandoArchivos = false;
    window.tieneMasArchivos = true;
    window.filtrosAdicionales = window.filtrosAdicionales || {};
    window.ordenActualBiblioteca = window.ordenActualBiblioteca || {};
    
    window.bibliotecaBusqueda = '';
    window.bibliotecaTipoArchivo = [];
    window.bibliotecaFechaModificacion = '';

    $(document).off('datosListos.biblioteca').on('datosListos.biblioteca', function (e, respuestaTipos) {
        // Actualizar dinámicamente el carrusel de filtros de tipos si llegó información válida
        if (respuestaTipos && respuestaTipos.ok && respuestaTipos.data) {
            const filtroTipo = window.filtrosConfiguracionBiblioteca?.find(f => f.id === 'f-tipo-archivo');
            if (filtroTipo && respuestaTipos.data.length > 0) {
                filtroTipo.opciones = respuestaTipos.data.map(t => ({
                    id: t.id,
                    texto: t.texto
                }));
            }
        }
    
        if (window.UrlStateSyncService) {
            const parametrosUrl = UrlStateSyncService.sincronizarUrlAInputs((params) => {
                // 1. Búsqueda por texto
                if (params.buscar !== undefined) {
                    window.bibliotecaBusqueda = params.buscar;
                    $('#buscador-biblioteca').val(params.buscar);
                }
                
                // 2. Límite / Registros por página
                if (params.limite !== undefined || params.registros !== undefined) {
                    window.limiteBiblioteca = parseInt(params.limite || params.registros, 10);
                }
        
                // 3. Offset o Página
                if (params.offset !== undefined) {
                    window.offsetBiblioteca = parseInt(params.offset, 10);
                }
                if (params.pagina !== undefined) {
                    const paginaActual = parseInt(params.pagina, 10);
                    // CORREGIDO: Operador de resta completo en una sola línea
                    window.offsetBiblioteca = (paginaActual - 1) * window.limiteBiblioteca;
                }
        
                // 4. Tipo de Archivo
                if (params.tipo_archivo !== undefined) {
                    window.bibliotecaTipoArchivo = Array.isArray(params.tipo_archivo) ? params.tipo_archivo : [params.tipo_archivo];
                    window.filtrosAdicionales.tipo_archivo = window.bibliotecaTipoArchivo;
                }
        
                // 5. Fecha de Modificación
                if (params.fecha_modificacion !== undefined) {
                    window.bibliotecaFechaModificacion = params.fecha_modificacion;
                    window.filtrosAdicionales.fecha_modificacion = window.bibliotecaFechaModificacion;
                }
        
                // 6. Tipo de Vista (Tarjetas vs Lista)
                if (params.vista !== undefined) {
                    window.vista_ventana = (params.vista === 'tarjetas');
                    if (typeof ActualizarBotonesVista === 'function') {
                        ActualizarBotonesVista();
                    }
                }
            });
        
            if (parametrosUrl) {
                console.log("Parámetros de biblioteca decodificados de la URL:", parametrosUrl);
        
                // Sincronización inicial de checks en MenuSelectorCheck desde la URL
                if (window.MenuSelectorCheck && typeof window.MenuSelectorCheck.setSeleccionesPorKey === 'function') {
                    if (parametrosUrl.tipo_archivo) {
                        const tipoArchivoArr = Array.isArray(parametrosUrl.tipo_archivo) ? parametrosUrl.tipo_archivo : [parametrosUrl.tipo_archivo];
                        MenuSelectorCheck.setSeleccionesPorKey('f-tipo-archivo', tipoArchivoArr);
                    }
                    if (parametrosUrl.fecha_modificacion) {
                        const fechaModArr = Array.isArray(parametrosUrl.fecha_modificacion) ? parametrosUrl.fecha_modificacion : [parametrosUrl.fecha_modificacion];
                        MenuSelectorCheck.setSeleccionesPorKey('f-fecha-modificacion', fechaModArr);
                    }
                }
            } else {
                window.bibliotecaBusqueda = '';
                window.bibliotecaTipoArchivo = [];
                window.bibliotecaFechaModificacion = '';
                window.limiteBiblioteca = 20;
                window.offsetBiblioteca = 0;
            }
        }
    
        // Inicialización del controlador de selección sin checks
        if (typeof window.SeleccionSinChecksController !== 'undefined') {
            window.SeleccionSinChecksController.init({
                scope: '#contenedor-tarjetas', 
                tarjetaClass: '.tarjeta-biblioteca',    
                claseActiva: 'activo',              
                multiSeleccion: true,               
                
                // Callback que se ejecuta automáticamente al seleccionar/deseleccionar
                onChange: function(seleccionadasSet, estado, idModificado) {
                    const totalSeleccionados = seleccionadasSet.size;
                    const $barraSeleccion = $('#barra-seleccion');
                    const $btnEliminar = $("#boton-eliminar-seleccionados");
                    
                    // 1. Actualizar contador visual
                    ActualizarContadorGenerico('#contador-seleccion', window.SeleccionSinChecksController);
                    
                    // 2. Mostrar u ocultar el botón de eliminar según window.permiso_gestion
                    if (window.permiso_gestion) {
                        $btnEliminar.removeClass('d-none');
                    } else {
                        $btnEliminar.addClass('d-none');
                    }
                    
                    // 3. Mostrar u ocultar la barra de selección y asignar eventos masivos
                    if (totalSeleccionados > 0) {
                        $barraSeleccion.removeClass('d-none');
                        if (typeof Asignar_Eventos_Botones_Seleccion === 'function') {
                            Asignar_Eventos_Botones_Seleccion();
                        }
                    } else {
                        $barraSeleccion.addClass('d-none');
                        $btnEliminar.off('click');
                        $("#boton-descargar-seleccionados").off('click');
                    }
                    
                    console.log("IDs seleccionados actualmente:", Array.from(seleccionadasSet));
                }
            });
        }
    
        CargarArchivosBiblioteca(true); 
        Funciones_Iniciales();
    });
}

/**
 * Configura los servicios iniciales (Toolbar, Filtros, Drag & Drop, Botones de Vista y Scroll).
 */
function Funciones_Iniciales() {
    const $contenedor = $("#contenedor-principal");
  

    const $toolbar = $('#viewer-toolbar');

    if (window.permiso_gestion) {
        $toolbar.removeClass('d-none');
        if (window.CarouselButtonsNav && typeof botonesToolbarConfig !== 'undefined') {
            CarouselButtonsNav.render('#viewer-toolbar', botonesToolbarConfig);
        }
    } else {
        $toolbar.addClass('d-none');
    }

    if (window.FiltrosCarruselService && typeof filtrosConfiguracionBiblioteca !== 'undefined') {
        FiltrosCarruselService.render(
            '#contenedor-filtros',
            filtrosConfiguracionBiblioteca,
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
                    if (idBtn === 'f-tipo-archivo' && window.filtrosAdicionales?.tipo_archivo !== undefined) {
                        seleccionesActuales = Array.isArray(window.filtrosAdicionales.tipo_archivo) ?
                            window.filtrosAdicionales.tipo_archivo :
                            [String(window.filtrosAdicionales.tipo_archivo)];
                    } else if (idBtn === 'f-fecha-modificacion' && window.filtrosAdicionales?.fecha_modificacion !== undefined) {
                        seleccionesActuales = [String(window.filtrosAdicionales.fecha_modificacion)];
                    } else if (idBtn === 'f-orden-fecha' && window.filtrosAdicionales?.orden_fecha !== undefined) {
                        seleccionesActuales = [String(window.filtrosAdicionales.orden_fecha)];
                    }
                }

                MenuSelectorCheck.abrir(`#${idBtn}`, filtroSeleccionado.opciones, {
                    multiple: filtroSeleccionado.config?.multiple ?? false,
                    buscador: filtroSeleccionado.config?.buscador ?? false,
                    contenedorTags: '#contenedor-tags-filtros',
                    seleccionados: seleccionesActuales,
                    onChange: (seleccionados) => {
                        window.filtrosAdicionales = window.filtrosAdicionales || {};

                        if (idBtn === 'f-tipo-archivo') {
                            if (seleccionados && seleccionados.length > 0) {
                                window.filtrosAdicionales.tipo_archivo = seleccionados;
                                window.bibliotecaTipoArchivo = seleccionados;
                            } else {
                                delete window.filtrosAdicionales.tipo_archivo;
                                window.bibliotecaTipoArchivo = [];
                            }
                        } else if (idBtn === 'f-fecha-modificacion') {
                            const val = seleccionados[0];
                            if (val !== undefined && val !== '') {
                                window.filtrosAdicionales.fecha_modificacion = val;
                                window.bibliotecaFechaModificacion = val;
                            } else {
                                delete window.filtrosAdicionales.fecha_modificacion;
                                window.bibliotecaFechaModificacion = '';
                            }
                        } else if (idBtn === 'f-orden-fecha') {
                            const val = seleccionados[0];
                            if (val !== undefined && val !== '') {
                                window.filtrosAdicionales.orden_fecha = val;
                            } else {
                                delete window.filtrosAdicionales.orden_fecha;
                            }
                        }

                        CargarArchivosBiblioteca(true);

                        if (window.FiltrosCarruselService) {
                            FiltrosCarruselService.refrescar();
                        }
                    }
                });
            },
            (idBtn) => {
                if (idBtn === 'f-tipo-archivo') {
                    return window.filtrosAdicionales?.tipo_archivo !== undefined &&
                        (Array.isArray(window.filtrosAdicionales.tipo_archivo) ? window.filtrosAdicionales.tipo_archivo.length > 0 : window.filtrosAdicionales.tipo_archivo !== '');
                } else if (idBtn === 'f-fecha-modificacion') {
                    return window.filtrosAdicionales?.fecha_modificacion !== undefined && window.filtrosAdicionales.fecha_modificacion !== '';
                } else if (idBtn === 'f-orden-fecha') {
                    return window.filtrosAdicionales?.orden_fecha !== undefined && window.filtrosAdicionales.orden_fecha !== '';
                }
                return false;
            }
        );
    }

    if (window.DragDropService &&window.permiso_gestion) {
        window.DragDropService.init($contenedor, {
            tipo: 'archivo',
            formatos: '*',
            multiple: true,
            onDrop: function (archivos) {
                if (typeof subirArchivos === 'function') {
                    subirArchivos(archivos);
                }
            }
        });
    }

    if (window.BuscadorUniversal) {
        BuscadorUniversal.crear({
            inputId: '#buscador-biblioteca',
            btnResetId: '#btn-reset-buscador-biblioteca',
            onSearch: (termino) => {
                window.bibliotecaBusqueda = termino !== undefined ? termino : $('#buscador-biblioteca').val();
                window.offsetBiblioteca = 0;
                CargarArchivosBiblioteca(true);
            }
        });
    }

    // --- EVENTOS DE CAMBIO DE VISTA (Lista vs Tarjetas/Rejilla) ---
    $(document).off('click', '#boton-vista-lista').on('click', '#boton-vista-lista', function(e) {
        e.preventDefault();
        if (window.vista_ventana) {
            window.vista_ventana = false;
            ActualizarBotonesVista();
            CargarArchivosBiblioteca(true);
        }
    });

    $(document).off('click', '#boton-vista-ventana').on('click', '#boton-vista-ventana', function(e) {
        e.preventDefault();
        if (!window.vista_ventana) {
            window.vista_ventana = true;
            ActualizarBotonesVista();
            CargarArchivosBiblioteca(true);
        }
    });

    // --- DETECTOR DE SCROLL INFINITO CORREGIDO ---
    $(document).off('scroll', '#contenedor-tarjetas, .flex-1.overflow-auto').on('scroll', '#contenedor-tarjetas, .flex-1.overflow-auto', function() {
        const $el = $(this);
        const scrollTop = $el.scrollTop();
        const scrollHeight = $el[0].scrollHeight;
        const height = $el.innerHeight();

        if ((scrollTop + height >= scrollHeight - 100) && window.tieneMasArchivos && !window.cargandoArchivos) {
            CargarArchivosBiblioteca(false);
        }
    });

    ActualizarBotonesVista();
}

/**
 * Carga los archivos desde la API con soporte para paginación y scroll infinito.
 * @param {boolean} reiniciar - Si es true, reinicia el offset a 0 y limpia el contenedor.
 * @returns {Promise<void>}
 */
async function CargarArchivosBiblioteca(reiniciar = false) {
    if (window.cargandoArchivos) return;

    if (reiniciar) {
        window.offsetBiblioteca = 0;
        window.tieneMasArchivos = true;
    }

    if (!window.tieneMasArchivos) return;

    return new Promise((resolve) => {
        try {
            if (window.offsetBiblioteca > 0) {
                $("#contenedor-cargando").removeClass('d-none');
            }

            window.limiteBiblioteca = window.limiteBiblioteca || 20;
            window.offsetBiblioteca = window.offsetBiblioteca || 0;

            // Inicializar el objeto global para almacenar los usuarios asignados por ID de archivo si no existe
            window.usuariosAsignadosBiblioteca = window.usuariosAsignadosBiblioteca || {};

            const filtros = {
                ...(window.filtrosAdicionales || {}),
                buscar: window.bibliotecaBusqueda || '',
                tipo_archivo: window.bibliotecaTipoArchivo || [],
                fecha_modificacion: window.bibliotecaFechaModificacion || ''
            };

            const orden = window.ordenActualBiblioteca || {
                columna: 'creado_en',
                direccion: 'DESC'
            };

            window.cargandoArchivos = true;

            Obtener_Archivos_Biblioteca_API(window.offsetBiblioteca, window.limiteBiblioteca, filtros, orden)
                .then(response => {
                    $("#contenedor-cargando").addClass('d-none');

                    if (response && response.ok) {
                        const archivos = response.data?.archivos || [];
                        const paginacion = response.data?.paginacion || {};
                        const total = paginacion.total || archivos.length;

                        // Almacenar los usuarios asignados de cada archivo en la variable global window
                        archivos.forEach(archivo => {
                            const archivoId = archivo.id || archivo.ID;
                            if (archivoId) {
                                // Guarda el array de usuarios asignados (o vacío si es público/sin permiso)
                                window.usuariosAsignadosBiblioteca[archivoId] = archivo.usuarios_asignados || [];
                            }
                        });

                        const $contenedor = $("#contenedor-tarjetas");

                        if (response.sinDatos || (window.offsetBiblioteca === 0 && archivos.length === 0)) {
                            $contenedor.empty();
                            if (typeof Contenedor_No_Resultados === 'function') {
                                Contenedor_No_Resultados('No hay resultados', $contenedor);
                            } else {
                                $contenedor.html('<div style="text-align: center; color: #64748b; padding: 20px;">No hay resultados</div>');
                            }
                            $("#contador-total").text(`0 archivos`);
                        } else {
                            if (window.offsetBiblioteca === 0) {
                                if (window.vista_ventana) {
                                    Renderizar_Tarjetas(archivos);
                                } else {
                                    Renderizar_Filas_Archivos(archivos);
                                }
                            } else {
                                if (window.vista_ventana) {
                                    Anexar_Tarjetas(archivos);
                                } else {
                                    Anexar_Filas_Archivos(archivos);
                                }
                            }

                            $("#contador-total").text(`${total} archivo${total === 1 ? '' : 's'}`);
                        }

                        // Actualizar variables de paginación
                        window.offsetBiblioteca = paginacion.siguiente_offset ?? (window.offsetBiblioteca + archivos.length);
                        window.tieneMasArchivos = paginacion.tiene_mas ?? (archivos.length === window.limiteBiblioteca);
                        
                        if (window.carga_inicial) {
                            if (typeof OcultarCargando === 'function') {
                                OcultarCargando();
                            }
                        }
                        window.carga_inicial = false;
                    }
                    resolve();
                })
                .catch(error => {
                    console.error("Error al obtener archivos de la biblioteca:", error);
                    $("#contenedor-cargando").addClass('d-none');
                    if (typeof MostrarMensaje === 'function') {
                        MostrarMensaje('Ocurrió un error', false, false, false);
                    }
                    resolve();
                })
                .finally(() => {
                    window.cargandoArchivos = false;
                });

        } catch (error) {
            console.error("Error crítico en CargarArchivosBiblioteca:", error);
            $("#contenedor-cargando").addClass('d-none');
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje('Ocurrió un error', false, false, false);
            }
            window.cargandoArchivos = false;
            resolve();
        }
    });
}

/**
 * Actualiza la clase 'activo' en los botones de vista según el estado de window.vista_ventana.
 */
/**
 * Actualiza la clase 'activo' en los botones de vista según el estado de window.vista_ventana
 * y sincroniza el cambio cifrado en la URL.
 */
function ActualizarBotonesVista() {
    if (window.vista_ventana) {
        $("#boton-vista-lista").removeClass('activo');
        $("#boton-vista-ventana").addClass('activo');
    } else {
        $("#boton-vista-lista").addClass('activo');
        $("#boton-vista-ventana").removeClass('activo');
    }
}

function AbrirMenuOpcionesDocumento(event, archivo, elementoButton) {
    if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
    }

    if (!archivo) {
        console.warn("AbrirMenuOpcionesDocumento: No se proporcionó un objeto de archivo válido.");
        return;
    }

    const idArchivo = archivo.id || archivo.ID;

    // 1. Obtener los parámetros actuales desde la URL cifrada
    const parametrosUrl = (window.UrlStateSyncService && typeof window.UrlStateSyncService.obtenerParametros === 'function')
        ? window.UrlStateSyncService.obtenerParametros() || {}
        : {};

    // 2. Seleccionar el arreglo de opciones para documentos
    const opcionesBase = window.opcionesDocumentoBiblioteca || [];

    // 3. Filtrar las opciones según los permisos del usuario
    const opcionesPermitidas = opcionesBase.filter(op => {
        if (!op.permiso) return true;
        return window.PermisosService && typeof window.PermisosService.tienePermiso === 'function' 
            ? PermisosService.tienePermiso(op.permiso) 
            : true;
    });

    if (opcionesPermitidas.length === 0) {
        console.warn("No hay opciones disponibles para este documento con los permisos actuales.");
        return;
    }

    // 4. Mapear los callbacks para inyectar el objeto archivo y asegurar la actualización del estado cifrado en la URL
    const opcionesConArchivo = opcionesPermitidas.map(op => ({
        ...op,
        callback: () => {
            if (window.UrlStateSyncService && typeof window.UrlStateSyncService.generarUrlConEstado === 'function') {
                const paramsActuales = window.UrlStateSyncService.obtenerParametros() || {};
                window.UrlStateSyncService.generarUrlConEstado({
                    ...paramsActuales,
                    buscar: window.bibliotecaBusqueda || paramsActuales.buscar || '',
                    offset: window.offsetBiblioteca !== undefined ? window.offsetBiblioteca : (paramsActuales.offset || 0),
                    limite: window.limiteBiblioteca || paramsActuales.limite || 20,
                    vista: window.vista_ventana ? 'tarjetas' : 'lista',
                    archivo_seleccionado: idArchivo,
                    accion_actual: op.texto
                });
            }

            if (typeof op.callback === 'function') {
                // Pasamos el objeto archivo completo para que cualquier opción (ver, descargar, info, copiar, etc.) lo aproveche
                op.callback(archivo);
            }
        }
    }));

    // 5. Abrir el menú global de opciones con el elemento button de referencia
    if (typeof Abrir_Menu_Opciones_Global === 'function') {
        Abrir_Menu_Opciones_Global(elementoButton, opcionesConArchivo);
    } else {
        console.warn("Abrir_Menu_Opciones_Global no está disponible.");
    }
}

function Asignar_Eventos_Botones_Seleccion()
{
    $("#boton-eliminar-seleccionados").off('click').on('click',function(e)
    {
        Eliminar_Archivos_Multiples()
    })

    $("#boton-descargar-seleccionados").off('click').on('click',function(e)
    {
        Descargar_Archivos_Seleccionados()
    })
}

function Cambiar_Nombre_Archivo(archivo)
{
  // Suponiendo que tienes esto:
const nombreOriginal = archivo.nombre_original;

// 1. Quitar la extensión de forma segura:
const nombreSinExtension = nombreOriginal.substring(0, nombreOriginal.lastIndexOf('.')) || nombreOriginal;

    CrearVentanaIframe(
        'Cambiar nombre del archivo',
        '../components/input.php',
        '380px',
        true,
        true,
        function (iframeElement) {
            let datos = {
                label: 'Ingresa el nombre del archivo',
                placeholder: 'Nombre del archivo',
                type_input: 'text',
                mayus:false,
                valor:nombreSinExtension,
                evento:'nombre_archivo',
                mensajes: { vacio: 'Ingresa un nombre para el archivo', error: '' }
            };
            $.messenger.send(iframeElement, 'datos_iniciales', datos);
            $.messenger.on('nombre_archivo', function (data, sourceWindow, origin) {
                if(data)
                {
                    Cambiar_Nombre_Archivo_Ajax(archivo,data.opcion)
                }
             })
        }
    );
}

function Asignar_Archivo_Usuarios(archivo) {
    // Extraer el ID de forma segura ya sea un objeto o directamente el ID
    const archivoId = typeof archivo === 'object' ? (archivo.id || archivo.ID) : archivo;
    const usuariosAsignados = window.usuariosAsignadosBiblioteca?.[archivoId] || [];

    CrearVentanaIframe(
        'Seleccionar usuarios',
        '../components/seleccionar.php',
        '620px',
        true,
        true,
        function (iframeElement) {
            let datos = {
                titulo: 'Seleccionar usuarios',
                usuarios: window.usuarios,
                columnas: ['nombre', 'nombre_usuario'],
                evento: 'seleccionar_usuarios_asignar_documentos',
                seleccionados: usuariosAsignados // Pasamos los IDs previamente asignados
            };

            $.messenger.send(iframeElement, 'iniciar_seleccion', datos);

            // Evitar acumulación de listeners con .off() antes del .on()
            $.messenger.off('seleccionar_usuarios_asignar_documentos');
            $.messenger.on('seleccionar_usuarios_asignar_documentos', function(data, sourceWindow, origin) {
                Asignar_Archivo_Usuarios_Ajax(archivo,data)
            });
        }
    );  
}