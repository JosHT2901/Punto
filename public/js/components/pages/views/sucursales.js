/* =============================================
    CONTROLADOR DEL MÓDULO SUCURSALES
============================================= */
window.carga_inicial = true;
window.SucursalesSelectionController = window.SucursalesSelectionController || CrearSeleccionController('Sucursales');
window.filtrosAdicionales = window.filtrosAdicionales || {};

// Bandera única para evitar bloqueos o ejecuciones dobles al cargar la página
let bloqueandoCargaInicial = false;

// Limpiamos listeners previos de messenger antes de registrarlos
$.messenger.off('sucursal_guardada').on('sucursal_guardada', function (data, sourceWindow, origin) {
    ProcesarRespuestaSucursal(data);
});
$.messenger.off('sucursal_editada').on('sucursal_editada', function (data, sourceWindow, origin) {
    ProcesarRespuestaSucursal(data);
});

function ProcesarRespuestaSucursal(data) {
    console.log("Evento recibido del hijo:", data);
    if (!data) return;

    const esExitoso = data.status === 'success' || data.ok === true || (data.data && data.data.status === 'success');

    if (esExitoso) {
        if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
            ModalAPI.cerrar();
        }
        if (typeof CargarSucursales === 'function') {
            CargarSucursales();
        }
    }
}

$.messenger.on('tipo_seleccionado', function (data, sourceWindow, origin) {
    const formato = typeof data === 'object' && data.formato ? data.formato : data;
    
    // Obtenemos la selección bruta del controlador
    const seleccionBruta = window.SucursalesSelectionController ? window.SucursalesSelectionController.getSeleccionados() : [];

    // Normalizamos: Aseguramos que sea un arreglo plano de IDs (por si devuelve objetos)
    const seleccion = seleccionBruta.map(item => {
        if (typeof item === 'object' && item !== null) {
            // Extrae la propiedad ID o id si es un objeto, o el primer valor disponible
            return item.ID || item.id || Object.values(item)[0];
        }
        return item;
    }).filter(id => id !== undefined && id !== null && id !== '');

    let url = '../../../src/controllers/php/controllers/sucursales.php';
    let accion = 'exportar_sucursales';

    console.log("IDs limpios a exportar:", seleccion); // Depuración en consola del navegador

    ExportacionService.exportar(url, accion, formato, { seleccion: seleccion });
});



// 🌟 Blindaje contra doble ejecución al cargar la página
$(document).off('app:inicializada datosListos.sucursales')
  .on('app:inicializada datosListos.sucursales', async (event) => {
    if (bloqueandoCargaInicial) return;
    bloqueandoCargaInicial = true;

    // 0. Sincronizamos los parámetros de la URL, rellenamos inputs, variables globales y el estado del MenuSelectorCheck
    if (window.UrlStateSyncService) {
        window.carga_inicial = false;
        const parametrosUrl = UrlStateSyncService.sincronizarUrlAInputs((params) => {
            if (params.buscar !== undefined) {
                window.busqueda = params.buscar;
                $('#buscador-sucursal').val(params.buscar);
            }
            if (params.pagina !== undefined) {
                window.pagina = parseInt(params.pagina);
            }
            if (params.registros !== undefined || params.registros_por_p !== undefined) {
                window.registrosPorPagina = parseInt(params.registros || params.registros_por_p);
            }
            if (params.activo !== undefined) {
                window.activo = params.activo;
            }
            if (params.tipo !== undefined) {
                window.filtrosAdicionales.tipo = Array.isArray(params.tipo) ? params.tipo : [params.tipo];
            }
        });

        if (parametrosUrl) {
            if (window.MenuSelectorCheck && typeof window.MenuSelectorCheck.setSeleccionesPorKey === 'function') {
                if (parametrosUrl.activo !== undefined && parametrosUrl.activo !== '') {
                    const estadoStr = parametrosUrl.activo == 1 ? 'activo' : 'inactivo';
                    MenuSelectorCheck.setSeleccionesPorKey('f-estado', [estadoStr]);
                }
                if (parametrosUrl.tipo) {
                    const tipoArr = Array.isArray(parametrosUrl.tipo) ? parametrosUrl.tipo : [parametrosUrl.tipo];
                    MenuSelectorCheck.setSeleccionesPorKey('f-tipo', tipoArr);
                }
            }
        } else {
            window.activo = 1;
        }
    }

    // 1. Inicializamos el acordeón universal y funciones base
    if (typeof InicializarAcordeonUniversal === 'function') {
        InicializarAcordeonUniversal();
    }
    
    await FuncionesIniciales();
    
    if (window.FiltrosCarruselService) {
        FiltrosCarruselService.refrescar();
    }

    // 2. Inicializamos el Buscador Universal independiente con los IDs estandarizados
    if (window.BuscadorUniversal) {
        BuscadorUniversal.crear({
            inputId: '#buscador-sucursal',
            btnResetId: '#btn-reset-buscador-sucursal',
            onSearch: (termino) => {
                window.busqueda = termino !== undefined ? termino : $('#buscador-sucursal').val();
                window.pagina = 1;
                CargarSucursales();
            }
        });
    }

    // 3. Carga inicial de sucursales usando variables window
    window.pagina = window.pagina || 1;
    window.registrosPorPagina = window.registrosPorPagina || 25;
    window.busqueda = $('#buscador-sucursal').val() || window.busqueda || '';

    CargarSucursales();
});

function CargarSucursales() {
    try {
        
        window.pagina = window.pagina || 1;
        window.registrosPorPagina = window.registrosPorPagina || 25;

        const valorInputBuscador = $('#buscador-sucursal').val();
        if (valorInputBuscador !== undefined) {
            window.busqueda = valorInputBuscador;
        }

        const filtros = {
            ...(window.filtrosAdicionales || {}),
            activo: window.activo !== undefined ? window.activo : 1,
            buscar: window.busqueda || ''
        };

        console.log("Enviando filtros a API:", filtros);

        // 🌟 Recuperamos el orden actual desde el estado global (o por defecto ID DESC)
        const orden = window.ordenSucursales || {
            columna: 'ID',
            direccion: 'DESC'
        };

        Obtener_Sucursales_API(window.pagina, window.registrosPorPagina, filtros, orden)
            .then(response => {
                OcultarCargando();
                if (response && response.ok) {
                    console.log(response)
                    const listaDatos = response.data?.datos || [];
                    window.sucursalActualId=response.data.sucursal_actual_id
                    // 🌟 GUARDAR EL UNIVERSO TOTAL DE IDS FILTRADOS CON NORMALIZACIÓN A STRING
                    const idsCrudos = response.data?.todos_los_ids || listaDatos.map(s => s.ID || s.id);
                    window.todosLosIdsFiltrados = idsCrudos.map(id => String(id));

                    if (response.sinDatos || listaDatos.length === 0) {
                        if (window.carga_inicial) {
                            if (typeof Contenedor_No_Resultados === 'function') {
                                Contenedor_No_Resultados('No se encontraron sucursales', '#contenedor-principal');
                            }
                        } else {
                            if (typeof Contenedor_No_Resultados === 'function') {
                                Contenedor_No_Resultados('No se encontraron sucursales', '#contenedor-tarjetas');
                            }
                            $('#contenedor-resultados > div:first-child > div.w-p-100.h-30.flex').addClass('d-none');
                            $('#contenedor-paginador').addClass('d-none');
                        }

                        $("#contador-total").text(`0 sucursales`);
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
                                    CargarSucursales();
                                },
                                callbackRegistros: (nuevoLimite) => {
                                    console.log("Cambiando registros por página a:", nuevoLimite);
                                    window.registrosPorPagina = parseInt(nuevoLimite, 10);
                                    window.pagina = 1;
                                    CargarSucursales();
                                }
                            });
                        }

                        $("#contador-total").text(`${listaDatos.length} sucursal${listaDatos.length > 1 ? 'es' : ''}`);
                        if (window.CardTemplateService) {
                            CardTemplateService.render("#contenedor-tarjetas", listaDatos, {
                                idKey: 'ID',
                                tituloKey: 'nombre',
                                badgeKey: 'tipo',
                                esActualKey: 'es_sucursal_actual', // Clave que viene de PHP para marcar la sucursal actual
                                permisoOpciones: window.permiso_editar && window.permiso_eliminar,
                                callbackOpciones: 'AbrirMenuOpcionesSucursal(event, ${ID}, this)',
                                configuracionCampos: [
                                    { label: 'Tipo', columna: 'tipo' },
                                    { label:'Localidad',columna:'localidad'},
                                    { label: 'Municipio', columna: 'municipio' },
                                    { label: 'Entidad Federativa', columna: 'entidad_federativa' },
                                    { label: 'Teléfono', columna: 'telefono' },
                                    { label: 'WhatsApp', columna: 'whatsapp' },
                                    { label: 'Registrada', columna: 'fecha_creacion' }
                                ]
                            });
                        }
                    }

                    // 🌟 SINCRONIZAR DOM: Marca automáticamente los checkboxes de la página actual si ya están en el Set global
                    if (window.SucursalesSelectionController && typeof window.SucursalesSelectionController.sincronizarDOM === 'function') {
                        window.SucursalesSelectionController.sincronizarDOM();
                    }

                    window.carga_inicial = false;
                }
            })
            .catch(error => {
                console.error("Error al filtrar sucursales:", error);
                OcultarCargando();
                MostrarMensaje('Ocurrió un error', false, false, false);
            });
    } catch (error) {
        console.log(error);
        OcultarCargando();
        MostrarMensaje('Ocurrió un error', false, false, false);
    }
}

// Función centralizada para inicializar catálogos, carrusel y selección
async function FuncionesIniciales() {
    if (window.CarouselButtonsNav && typeof botonesToolbarConfig !== 'undefined') {
        CarouselButtonsNav.render('#viewer-toolbar', botonesToolbarConfig);
    }

    // 2. RENDERIZA EL CARRUSEL CON LAS OPCIONES DE FILTRADO
    if (window.FiltrosCarruselService && typeof filtrosConfiguracionSucursales !== 'undefined') {
        FiltrosCarruselService.render(
            '#contenedor-filtros', 
            filtrosConfiguracionSucursales, 
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
                        if (window.activo !== undefined && window.activo !== '') {
                            seleccionesActuales = [window.activo == 1 ? 'activo' : 'inactivo'];
                        }
                    } else if (idBtn === 'f-tipo') {
                        seleccionesActuales = window.filtrosAdicionales?.tipo || [];
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
                                window.activo = 1;
                            } else if (seleccionados.includes('inactivo')) {
                                window.activo = 0;
                            } else {
                                window.activo = undefined;
                            }

                            if (window.SucursalesSelectionController && typeof window.SucursalesSelectionController.limpiar === 'function') {
                                window.SucursalesSelectionController.limpiar();
                            }
                        } else if (idBtn === 'f-tipo') {
                            window.filtrosAdicionales.tipo = seleccionados;
                        }

                        window.pagina = 1;
                        CargarSucursales();

                        if (window.FiltrosCarruselService) {
                            FiltrosCarruselService.refrescar();
                        }
                    }
                });
            },
            (idBtn) => {
                if (idBtn === 'f-estado') {
                    return window.activo !== undefined && window.activo !== '';
                } else if (idBtn === 'f-tipo') {
                    return window.filtrosAdicionales?.tipo?.length > 0;
                }
                return false;
            }
        );
    }

    // 3. Inicialización del controlador de selección conectado a la barra flotante
    if (window.SucursalesSelectionController && window.SelectionBarService) {
        
        const refrescarBarra = SelectionBarService.conectar(window.SucursalesSelectionController, {
            entidad: 'sucursales',
            barra: '#barra-seleccion',
            contador: '#contador-container',
            contenedorBotones: '#acciones-masivas-container',
            botones: () => {
                const estadoActual = window.activo !== undefined ? parseInt(window.activo) : 1;
                return (estadoActual === 0) 
                    ? (window.botones_opciones_deshabilitado || []) 
                    : (window.botones_opciones_habilitado || []);
            }
        });

        window.SucursalesSelectionController.init({
            scope: $("#contenedor-resultados"),
            checkItemClass: '.check-item',
            tarjetaClass: '.card-universal',
            claseActiva: 'seleccionada',
            checkAllId: 'check-item-all',
            onChange: refrescarBarra
        });
    }

    // 4. Configuración del menú desplegable de selección masiva (Página actual vs Todos)
    $(document).off('click.abrirMenuSel').on('click.abrirMenuSel', '#btn-menu-seleccion', function(e) {
        e.preventDefault();
        e.stopPropagation();
    
        const opcionesMenu = [
            { id: 'pagina', texto: 'Seleccionar página actual' },
            { id: 'todos', texto: `Seleccionar todas (${window.todosLosIdsFiltrados?.length || 0} registros)` },
            { id: 'ninguno', texto: 'Deseleccionar todas' }
        ];
    
        window.MenuSelectorCheck.abrir(this, opcionesMenu, {
            multiple: false,
            buscador: false,
            onChange: (seleccionadoArray) => {
                const accion = seleccionadoArray[0];
                if (!accion) return;
    
                const controlador = window.SucursalesSelectionController;
    
                if (accion === 'pagina') {
                    if (typeof controlador.limpiar === 'function') {
                        controlador.limpiar();
                    }
                    
                    // 🌟 Seleccionar únicamente los elementos de la página actual que SÍ tienen checkbox (omitiendo la sucursal actual)
                    $('#contenedor-tarjetas input.check-item').each(function() {
                        const id = $(this).attr('data-id');
                        if (id && typeof controlador.agregar === 'function') {
                            controlador.agregar(String(id));
                        }
                    });
                    
                    if (typeof controlador.sincronizarDOM === 'function') {
                        controlador.sincronizarDOM();
                    }
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

function AbrirMenuOpcionesSucursal(event, idSucursales, elementoButton) {
    if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
    }

    // 1. Obtener los parámetros actuales desde la URL cifrada
    const parametrosUrl = (window.UrlStateSyncService && typeof window.UrlStateSyncService.obtenerParametros === 'function')
        ? window.UrlStateSyncService.obtenerParametros() || {}
        : {};

    const habilitado = parametrosUrl.activo !== undefined ? parseInt(parametrosUrl.activo) : 1;
    console.log(habilitado)
    // 2. Seleccionar el arreglo de opciones según el estatus en la URL
    const opcionesBase = (habilitado === 0) 
        ? (window.opcionesSucursalDeshabilitado || []) 
        : (window.opcionesSucursalHabilitado || []);

    // 🌟 2.1 Identificar si esta sucursal es la sucursal actual del usuario
    // Puedes definir window.sucursalActualId desde tu PHP principal (ej. la sucursal del usuario en sesión)
    const sucursalActualId = window.sucursalActualId || null;
    const esSucursalActual = sucursalActualId && (String(sucursalActualId) === String(idSucursales));
    console.log(sucursalActualId)
    // 3. Filtrar las opciones según los permisos y ocultar la de eliminar si es la sucursal actual
    const opcionesPermitidas = opcionesBase.filter(op => {
        // Si es la sucursal actual, filtramos/ocultamos la opción de eliminar (puedes validar por texto o id de la opción)
        if (esSucursalActual) {
            const textoAccion = (op.texto || op.accion || '').toLowerCase();
            if (textoAccion.includes('eliminar')) {
                return false;
            }
        }

        if (!op.permiso) return true;
        return window.PermisosService && typeof window.PermisosService.tienePermiso === 'function' 
            ? PermisosService.tienePermiso(op.permiso) 
            : true;
    });

    if (opcionesPermitidas.length === 0) {
        console.warn("No hay opciones disponibles para esta sucursal con los permisos actuales.");
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
                    sucursal_seleccionada: idSucursales,
                    accion_actual: op.texto
                });
            }

            if (typeof op.callback === 'function') {
                op.callback(idSucursales);
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
function EditarSucursal(id)
{
    CrearVentanaIframe(
        'Editar sucursal',
        '../components/gestionar.sucursal.php',
        '620px',
        true,
        true,
        function (iframeElement) {
            // Empaquetamos los datos con la propiedad 'localidades'
            let datos = {
                id: id
            };

            // Enviamos al iframe recién creado usando la acción 'codigo_postal'
            $.messenger.send(iframeElement, 'datos_iniciales', datos);
        }
    );
}

async function Procesar_Archivo_Importar_Sucursales(archivoSeleccionado) {
    try {
        console.log(archivoSeleccionado);
        const respuesta = await FileUploadService.subir(
            '../../../src/controllers/php/controllers/sucursales.php', // URL del endpoint
            archivoSeleccionado,
            'importar_sucursales', // La acción que leerá tu PHP en el despachador
            {},                    // Parámetros extra (objeto vacío si no requieres extras)
            'procesando archivo...' // Texto personalizado para el modal de carga en minúsculas
        );

        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }

        if (respuesta && respuesta.ok) {
            MostrarMensaje(respuesta.mensaje, true, false, false);
            setTimeout(() => {
                if (typeof ModalAPI !== 'undefined' && typeof ModalAPI.cerrar === 'function') {
                    ModalAPI.cerrar();
                }
                
                CrearVentanaIframe(
                    'información del proceso',
                    '../components/informacion.php',
                    '620px',
                    true,
                    true,
                    function (iframeElement) {
                        $.messenger.send(iframeElement, 'informacion', respuesta);
                    }
                );  

                // Refrescar el listado de sucursales automáticamente
                if (typeof CargarSucursales === 'function') {
                    CargarSucursales();
                }
               
            }, 1000);
        } else {
            const mensajeError = (respuesta && respuesta.mensaje) ? respuesta.mensaje : 'No se pudo procesar la importación del archivo.';
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(mensajeError, false, false, false);
            }
        }
    } catch (error) {
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        console.error("Fallo en la subida:", error);
        MostrarAlerta(error.mensaje || 'Error al procesar el archivo', 250, true);
    }
}

function ExportarSucursalesMasivas() {

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
