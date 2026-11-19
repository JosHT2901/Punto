window.carga_inicial = true;
if (typeof CrearSeleccionController === 'function') {
    window.MovimientosSelectionController = window.MovimientosSelectionController || CrearSeleccionController('Movimientos');
}
window.filtrosAdicionales = window.filtrosAdicionales || {};


$.messenger.on('tipo_seleccionado', function (data, sourceWindow, origin) {
    const formato = typeof data === 'object' && data.formato ? data.formato : data;
    
    // Obtenemos la selección bruta del controlador
    const seleccionBruta = window.MovimientosSelectionController ? window.MovimientosSelectionController.getSeleccionados() : [];
    console.log(seleccionBruta)
    // Normalizamos: Aseguramos que sea un arreglo plano de IDs (por si devuelve objetos)
    const seleccion = seleccionBruta.map(item => {
        if (typeof item === 'object' && item !== null) {
            // Extrae la propiedad ID o id si es un objeto, o el primer valor disponible
            return item.ID || item.id || Object.values(item)[0];
        }
        return item;
    }).filter(id => id !== undefined && id !== null && id !== '');

    let url = '../../../src/controllers/php/controllers/usuarios.php';
    let accion = 'exportar_movimientos';


    ExportacionService.exportar(url, accion, formato, { seleccion: seleccion });
});


/* =============================================
    INICIALIZACIÓN DEL MÓDULO
============================================= */
$(document).off('datosListos.movimientos')
  .on('datosListos.movimientos', async (event) => {
    // Evitar ejecuciones simultáneas dobles
    if (window._moduloMovimientosInicializado) return;
    window._moduloMovimientosInicializado = true;

    window.filtrosAdicionales = window.filtrosAdicionales || {};

    // El id del usuario consultado (y su permiso) ya lo decidió app:inicializada.
    // Aquí NO se lee ?id= ni params.id, para no saltarse esa validación.

    // 1. Sincronizamos el estado cifrado en 'q' desde UrlStateSyncService
    if (window.UrlStateSyncService && typeof window.UrlStateSyncService.sincronizarUrlAInputs === 'function') {
        window.carga_inicial = false;

        const parametrosUrl = UrlStateSyncService.sincronizarUrlAInputs((params) => {
            if (!params || typeof params !== 'object') return;

            if (params.buscar !== undefined) {
                window.busqueda = params.buscar;
                $('#buscador-movimiento').val(params.buscar);
            }
            if (params.pagina !== undefined) {
                const pag = parseInt(params.pagina, 10);
                if (!Number.isNaN(pag) && pag > 0) {
                    window.pagina = pag;
                }
            }
            if (params.registros !== undefined || params.registros_por_p !== undefined) {
                const reg = parseInt(params.registros || params.registros_por_p, 10);
                if (!Number.isNaN(reg) && reg > 0) {
                    window.registrosPorPagina = reg;
                }
            }
            if (params.modulo !== undefined) {
                window.filtrosAdicionales.modulo = Array.isArray(params.modulo)
                    ? params.modulo
                    : (params.modulo ? String(params.modulo).split(',').filter(Boolean) : []);
            }
            if (params.accion !== undefined) {
                window.filtrosAdicionales.accion = Array.isArray(params.accion)
                    ? params.accion
                    : (params.accion ? String(params.accion).split(',').filter(Boolean) : []);
            }
            if (params.columna || params.direccion) {
                window.ordenMovimientos = {
                    columna: params.columna || window.ordenMovimientos?.columna || 't.movimiento_id',
                    direccion: params.direccion || window.ordenMovimientos?.direccion || 'DESC'
                };
            }
        });

        // Reflejar en los menús de filtro lo que venía en la URL
        if (parametrosUrl && window.MenuSelectorCheck && typeof window.MenuSelectorCheck.setSeleccionesPorKey === 'function') {
            if (window.filtrosAdicionales.modulo?.length) {
                MenuSelectorCheck.setSeleccionesPorKey('f-modulo', window.filtrosAdicionales.modulo);
            }
            if (window.filtrosAdicionales.accion?.length) {
                MenuSelectorCheck.setSeleccionesPorKey('f-accion', window.filtrosAdicionales.accion);
            }
        }
    }

    if (typeof InicializarAcordeonUniversal === 'function') {
        InicializarAcordeonUniversal();
    }

    if (typeof FuncionesIniciales === 'function') {
        await FuncionesIniciales();
    }

    if (window.FiltrosCarruselService) {
        FiltrosCarruselService.refrescar();
    }

    if (window.BuscadorUniversal) {
        BuscadorUniversal.crear({
            inputId: '#buscador-movimiento',
            btnResetId: '#btn-reset-buscador-movimiento',
            onSearch: (termino) => {
                window.busqueda = termino !== undefined ? termino : $('#buscador-movimiento').val();
                window.pagina = 1;
                CargarMovimientos();
            }
        });
    }

    window.pagina = window.pagina || 1;
    window.registrosPorPagina = window.registrosPorPagina || 25;
    window.busqueda = $('#buscador-movimiento').val() || window.busqueda || '';

    CargarMovimientos();
});

/* =============================================
    DATOS Y RENDER
============================================= */

// Normaliza el id del movimiento y toma de la sesión solo lo relativo al origen del evento
function AplanarSesionesMovimientos(lista) {
    const vacio = '—';

    return lista.map(mov => {
        const s = mov.sesion;
        const idMov = mov.movimiento_id ?? mov.id ?? mov.ID ?? '';

        return {
            ...mov,
            id: idMov,
            movimiento_id: idMov,
            ses_sucursal: s?.sucursal ?? vacio,
            ses_ip: s?.IP || vacio,
            ses_dispositivo: s?.user_agent || vacio,
            ses_aplicativo: s?.aplicativo || vacio
        };
    });
}

function CargarMovimientos() {
    try {
        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Procesando información...', false);
        }

        window.pagina = window.pagina || 1;
        window.registrosPorPagina = window.registrosPorPagina || 25;

        const valorInputBuscador = $('#buscador-movimiento').val();
        if (valorInputBuscador !== undefined) {
            window.busqueda = valorInputBuscador;
        }

        const filtros = {
            ...(window.filtrosAdicionales || {}),
            buscar: window.busqueda || ''
        };

        // Usuario cuyos movimientos se consultan (decidido en app:inicializada)
        if (window.id_usuario !== undefined && window.id_usuario !== null && String(window.id_usuario).trim() !== '') {
            filtros.usuario_id = window.id_usuario;
        }

        const orden = window.ordenMovimientos || {
            columna: 't.movimiento_id',
            direccion: 'DESC'
        };

        Obtener_Movimientos_API(window.pagina, window.registrosPorPagina, filtros, orden)
            .then(response => {
                if (typeof OcultarCargando === 'function') {
                    OcultarCargando();
                }

                // Un fallo del servidor ahora se informa en lugar de quedarse en silencio
                if (!response || !response.ok) {
                    console.error('Respuesta de movimientos no válida:', response);
                    if (typeof MostrarMensaje === 'function') {
                        MostrarMensaje(response?.mensaje || 'No se pudieron obtener los movimientos', false, false, false);
                    }
                    return;
                }

                const datosNormalizados = AplanarSesionesMovimientos(response.data?.datos || []);

                const idsCrudos = response.data?.todos_los_ids || datosNormalizados.map(c => c.movimiento_id);
                window.todosLosIdsFiltrados = idsCrudos.map(id => String(id));

                if (response.sinDatos || datosNormalizados.length === 0) {
                    if (window.carga_inicial) {
                        if (typeof Contenedor_No_Resultados === 'function') {
                            Contenedor_No_Resultados('No se encontraron movimientos', '#contenedor-principal');
                        }
                    } else {
                        if (typeof Contenedor_No_Resultados === 'function') {
                            Contenedor_No_Resultados('No se encontraron movimientos', '#contenedor-tarjetas');
                        }
                        $('#contenedor-resultados > div:first-child > div.w-p-100.h-30.flex').addClass('d-none');
                        $('#contenedor-paginador').addClass('d-none');
                    }

                    $("#contador-total").text('0 movimientos');
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
                                CargarMovimientos();
                            },
                            callbackRegistros: (nuevoLimite) => {
                                window.registrosPorPagina = parseInt(nuevoLimite, 10);
                                window.pagina = 1;
                                CargarMovimientos();
                            }
                        });
                    }

                    // Total real si el backend lo informa; si no, los de la página actual
                    const pag = response.data?.paginacion;
                    const total = Number(pag?.total_registros ?? pag?.totalRegistros ?? datosNormalizados.length);
                    $("#contador-total").text(`${total} movimiento${total !== 1 ? 's' : ''}`);

                    if (window.CardTemplateService) {
                        CardTemplateService.render("#contenedor-tarjetas", datosNormalizados, {
                            idKey: 'movimiento_id',
                            tituloKey: 'modulo',
                            badgeKey: 'accion',
                            permisoOpciones: false,
                            configuracionCampos: [
                                { label: 'Usuario', columna: 'usuario_nombre' },
                                { label: 'Módulo', columna: 'modulo' },
                                { label: 'Acción', columna: 'accion' },
                                { label: 'Descripción', columna: 'descripcion' },
                                { label: 'Fecha', columna: 'fecha' },

                                // ---- Origen del movimiento (sesión) ----
                                { label: 'Sucursal', columna: 'ses_sucursal' },
                                { label: 'IP', columna: 'ses_ip' },
                                { label: 'Dispositivo', columna: 'ses_dispositivo' },
                                { label: 'Aplicativo', columna: 'ses_aplicativo' }
                            ]
                        });
                    }
                }

                if (window.MovimientosSelectionController && typeof window.MovimientosSelectionController.sincronizarDOM === 'function') {
                    window.MovimientosSelectionController.sincronizarDOM();
                }

                window.carga_inicial = false;
            })
            .catch(error => {
                console.error("Error al filtrar movimientos:", error);
                if (typeof OcultarCargando === 'function') {
                    OcultarCargando();
                }
                if (typeof MostrarMensaje === 'function') {
                    MostrarMensaje('Ocurrió un error', false, false, false);
                }
            });
    } catch (error) {
        console.error(error);
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error', false, false, false);
        }
    }
}

/* =============================================
    COMPONENTES Y FILTROS INICIALES
============================================= */
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

    const formatearTextoFiltro = (valor) => {
        const texto = String(valor || '').replace(/[_-]+/g, ' ').trim();
        return texto.charAt(0).toUpperCase() + texto.slice(1);
    };

    const opcionesModulos = (window.modulosMovimientos || []).map((modulo) => ({
        id: modulo,
        texto: formatearTextoFiltro(modulo)
    }));

    const obtenerOpcionesAcciones = () => {
        const modulosSeleccionados = window.filtrosAdicionales?.modulo || [];
        const mapaAcciones = window.accionesPorModuloMovimientos || {};
        let listaAcciones = [];

        if (Array.isArray(modulosSeleccionados) && modulosSeleccionados.length > 0) {
            const setAcciones = new Set();
            modulosSeleccionados.forEach((mod) => {
                (mapaAcciones[mod] || []).forEach((acc) => setAcciones.add(acc));
            });
            listaAcciones = Array.from(setAcciones);
        } else {
            listaAcciones = window.accionesMovimientos || [];
        }

        return listaAcciones.map((accion) => ({
            id: accion,
            texto: formatearTextoFiltro(accion)
        }));
    };

    if (window.FiltrosCarruselService && typeof filtrosConfiguracionMovimientos !== 'undefined') {
        const configuracionFiltros = filtrosConfiguracionMovimientos.map((filtro) => {
            if (filtro.id === 'f-modulo') {
                return {
                    ...filtro,
                    opciones: opcionesModulos.length > 0 ? opcionesModulos : (filtro.opciones || [])
                };
            }
            if (filtro.id === 'f-accion') {
                return {
                    ...filtro,
                    opciones: obtenerOpcionesAcciones()
                };
            }
            return filtro;
        });

        FiltrosCarruselService.render(
            '#contenedor-filtros',
            configuracionFiltros,
            (filtroSeleccionado, idBtn) => {
                let opcionesActuales = filtroSeleccionado?.opciones || [];

                if (idBtn === 'f-modulo' && opcionesModulos.length > 0) {
                    opcionesActuales = opcionesModulos;
                } else if (idBtn === 'f-accion') {
                    opcionesActuales = obtenerOpcionesAcciones();
                }

                if (!opcionesActuales.length) return;

                if (window.MenuSelectorCheck && typeof window.MenuSelectorCheck.cerrar === 'function') {
                    window.MenuSelectorCheck.cerrar();
                }

                let seleccionesActuales = [];
                if (window.MenuSelectorCheck && typeof window.MenuSelectorCheck.getSeleccionadosPorKey === 'function') {
                    seleccionesActuales = window.MenuSelectorCheck.getSeleccionadosPorKey(idBtn);
                }

                MenuSelectorCheck.abrir(`#${idBtn}`, opcionesActuales, {
                    multiple: filtroSeleccionado.config?.multiple ?? true,
                    buscador: filtroSeleccionado.config?.buscador ?? false,
                    contenedorTags: '#contenedor-tags-filtros',
                    seleccionados: seleccionesActuales,
                    onChange: (seleccionados) => {
                        window.filtrosAdicionales = window.filtrosAdicionales || {};

                        if (idBtn === 'f-modulo') {
                            window.filtrosAdicionales.modulo = seleccionados;

                            // Limpiar acciones que ya no correspondan al módulo seleccionado
                            if (Array.isArray(window.filtrosAdicionales.accion) && window.filtrosAdicionales.accion.length > 0) {
                                const accionesValidas = new Set(obtenerOpcionesAcciones().map((op) => op.id));
                                window.filtrosAdicionales.accion = window.filtrosAdicionales.accion.filter((acc) =>
                                    accionesValidas.has(acc)
                                );
                            }
                        } else if (idBtn === 'f-accion') {
                            window.filtrosAdicionales.accion = seleccionados;
                        }

                        window.pagina = 1;
                        CargarMovimientos();

                        if (window.FiltrosCarruselService) {
                            FiltrosCarruselService.refrescar();
                        }
                    }
                });
            },
            (idBtn) => {
                if (idBtn === 'f-modulo') {
                    return window.filtrosAdicionales?.modulo?.length > 0;
                }
                if (idBtn === 'f-accion') {
                    return window.filtrosAdicionales?.accion?.length > 0;
                }
                return false;
            }
        );
    }

    if (window.MovimientosSelectionController && window.SelectionBarService) {
        const refrescarBarra = SelectionBarService.conectar(window.MovimientosSelectionController, {
            entidad: 'movimientos',
            barra: '#barra-seleccion',
            contador: '#contador-container',
            contenedorBotones: '#acciones-masivas-container',
            botones: window.botones_opciones
        });

        window.MovimientosSelectionController.init({
            scope: $("#contenedor-resultados"),
            checkItemClass: '.check-item',
            tarjetaClass: '.card-universal',
            claseActiva: 'seleccionada',
            checkAllId: 'check-item-all',
            onChange: refrescarBarra
        });
    }

    $(document).off('click.abrirMenuSel').on('click.abrirMenuSel', '#btn-menu-seleccion', function (e) {
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

                const controlador = window.MovimientosSelectionController;

                if (accion === 'pagina') {
                    if (typeof controlador.limpiar === 'function') {
                        controlador.limpiar();
                    }
                    controlador.seleccionarTodo(true);
                } else if (accion === 'todos') {
                    if (window.todosLosIdsFiltrados && Array.isArray(window.todosLosIdsFiltrados)) {
                        window.todosLosIdsFiltrados.forEach(id => {
                            if (typeof controlador.agregar === 'function') {
                                controlador.agregar(String(id));
                            }
                        });
                    }
                    controlador.sincronizarDOM();
                } else if (accion === 'ninguno') {
                    controlador.limpiar();
                }
            }
        });
    });
}

function ExportarMovimientosMasivos()
{
    CrearVentanaIframe(
        'Tipo de archivo',
        '../components/tipo.archivo.php',
        '520px',
        true,
        true,
        function (iframeElement) {
            let datos = {
                tipos_permitidos: '.csv, .xml, .xls, .xlsx',
                multiple: false,
            };
            $.messenger.send(iframeElement, 'datos_iniciales', datos);
        }
    );  
}