
window.carga_inicial = true;
window.CategoriasSelectionController = window.CategoriasSelectionController || CrearSeleccionController('Categorias');
window.filtrosAdicionales = window.filtrosAdicionales || {}; // Inicializamos como objeto global seguro


// Usar .off().on() previene que el evento se duplique si el script se carga o evalúa más de una vez
$(document).off('datosListos.categorias')
  .on('datosListos.categorias', async (event) => {
    // Evitar ejecuciones simultáneas dobles
    if (window._moduloCategoriasInicializado) return;
    window._moduloCategoriasInicializado = true;

    // 0. Sincronizamos los parámetros de la URL, rellenamos inputs, variables globales y el estado del MenuSelectorCheck
    if (window.UrlStateSyncService) {
        window.carga_inicial = false;
        const parametrosUrl = UrlStateSyncService.sincronizarUrlAInputs((params) => {
            if (params.buscar !== undefined) {
                window.busqueda = params.buscar;
                $('#buscador-categoria').val(params.buscar);
            }
            if (params.pagina !== undefined) {
                window.pagina = parseInt(params.pagina, 10) || 1;
            }
            if (params.registros !== undefined || params.registros_por_p !== undefined) {
                window.registrosPorPagina = parseInt(params.registros || params.registros_por_p, 10) || window.registrosPorPagina || 50;
            }
            if (params.habilitado !== undefined) {
                window.habilitado = params.habilitado;
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
            inputId: '#buscador-categoria',
            btnResetId: '#btn-reset-buscador-categoria',
            onSearch: (termino) => {
                window.busqueda = termino !== undefined ? termino : $('#buscador-categoria').val();
                window.pagina = 1;
                CargarCategorias();
            }
        });
    }

    // 3. Carga inicial de categorías usando variables window
    window.pagina = window.pagina || 1;
    window.registrosPorPagina = window.registrosPorPagina || 25;
    window.busqueda = $('#buscador-categoria').val() || window.busqueda || '';

    CargarCategorias();
});

function CargarCategorias() {
    try {
        MostrarCargando('Obteniendo información...', false);
        window.pagina = window.pagina || 1;
        window.registrosPorPagina = window.registrosPorPagina || 25;

        const valorInputBuscador = $('#buscador-categoria').val();
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
        const orden = window.ordenCategorias || {
            columna: 'ID',
            direccion: 'DESC'
        };

        Obtener_Categorias_API(window.pagina, window.registrosPorPagina, filtros, orden)
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
                                Contenedor_No_Resultados('No se encontraron categorías', '#contenedor-principal');
                            }
                        } else {
                            if (typeof Contenedor_No_Resultados === 'function') {
                                Contenedor_No_Resultados('No se encontraron categorías', '#contenedor-tarjetas');
                            }
                            $('#contenedor-resultados > div:first-child > div.w-p-100.h-30.flex').addClass('d-none');
                            $('#contenedor-paginador').addClass('d-none');
                        }

                        $("#contador-total").text(`0 categorías`);
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
                                    CargarCategorias();
                                },
                                callbackRegistros: (nuevoLimite) => {
                                    console.log("Cambiando registros por página a:", nuevoLimite);
                                    window.registrosPorPagina = parseInt(nuevoLimite, 10);
                                    window.pagina = 1;
                                    CargarCategorias();
                                }
                            });
                        }

                        $("#contador-total").text(`${listaDatos.length} categoría${listaDatos.length > 1 ? 's' : ''}`);

                        if (window.CardTemplateService) {
                            CardTemplateService.render("#contenedor-tarjetas", listaDatos, {
                                idKey: 'ID',
                                tituloKey: 'Nombre',
                                permisoOpciones: window.permiso_editar || window.permiso_eliminar,
                                callbackOpciones: 'AbrirMenuOpcionesCategoria(event, ${ID}, this)',
                                configuracionCampos: [
                                    { label: 'Registrada', columna: 'Fecha_Registro' },
                                    { label: 'Última Actualización', columna: 'Ultima_Actualizacion' }
                                ],
                                // 🌟 Se integrará automáticamente dentro del acordeón de cada categoría
                                renderHtmlExtra: (categoria) => {
                                    if (!categoria.atributos || !Array.isArray(categoria.atributos) || categoria.atributos.length === 0) {
                                        return `
                                            <div class="mt-3 pt-3 border-top border-light">
                                                <span class="fs-1 fw-700 text-uppercase letter-spacing-1 text-slate-400 block mb-1">Atributos asociados</span>
                                                <p class="fs-2 text-slate-500 italic">No hay atributos registrados para esta categoría.</p>
                                            </div>
                                        `;
                                    }
                        
                                    const listaBadgesAtributos = categoria.atributos.map(attr => {
                                        const nombreAttr = attr.Nombre_Atributo || attr.nombre || '';
                                        const tipoAttr = attr.Tipo_Dato || attr.tipo || 'texto';
                        
                                        return `
                                            <span class="inline-flex items-center gap-1 px-3 py-1 rounded-6 bg-brand-soft text-brand fs-2 fw-600 border border-brand-light mr-1.5 mb-1.5">
                                                <span>${nombreAttr}</span>
                                                <small class="opacity-75 fs-1 uppercase">(${tipoAttr})</small>
                                            </span>
                                        `;
                                    }).join('');
                        
                                    return `
                                        <div class="mt-3 pt-3 border-top border-light">
                                            <span class="fs-1 fw-700 text-uppercase letter-spacing-1 text-slate-400 block mb-2">Atributos asociados (${categoria.atributos.length})</span>
                                            <div class="flex flex-wrap gap-3 py-3">
                                                ${listaBadgesAtributos}
                                            </div>
                                        </div>
                                    `;
                                }
                            });
                        }
                    }

                    // 🌟 SINCRONIZAR DOM: Marca automáticamente los checkboxes de la página actual si ya están en el Set global
                    if (window.CategoriasSelectionController && typeof window.CategoriasSelectionController.sincronizarDOM === 'function') {
                        window.CategoriasSelectionController.sincronizarDOM();
                    }

                    window.carga_inicial = false;
                }
            })
            .catch(error => {
                console.error("Error al filtrar categorías:", error);
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
    console.log(window.permiso_crear);
    if (window.permiso_crear) {
        $toolbar.removeClass('d-none');
        if (window.CarouselButtonsNav && typeof botonesToolbarConfig !== 'undefined') {
            CarouselButtonsNav.render('#viewer-toolbar', botonesToolbarConfig);
        }
    } else {
        $toolbar.addClass('d-none');
    }

    // 2. RENDERIZA EL CARRUSEL CON LAS OPCIONES DE FILTRADO PARA CATEGORÍAS
    if (window.FiltrosCarruselService && typeof filtrosConfiguracionCategorias !== 'undefined') {
        FiltrosCarruselService.render(
            '#contenedor-filtros', 
            filtrosConfiguracionCategorias, 
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

                            if (window.CategoriasSelectionController && typeof window.CategoriasSelectionController.limpiar === 'function') {
                                window.CategoriasSelectionController.limpiar();
                            }
                        }

                        window.pagina = 1;
                        CargarCategorias();

                        if (window.FiltrosCarruselService) {
                            FiltrosCarruselService.refrescar();
                        }
                    }
                });
            },
            (idBtn) => {
                if (idBtn === 'f-estado') {
                    return window.habilitado !== undefined && window.habilitado !== '';
                }
                return false;
            }
        );
    }
 
    // Inicialización del controlador de selección en categorías
    if (window.CategoriasSelectionController && window.SelectionBarService) {
        const refrescarBarra = SelectionBarService.conectar(window.CategoriasSelectionController, {
            entidad: 'categorias',
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

        window.CategoriasSelectionController.init({
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
            { id: 'todos', texto: `Seleccionar todos (${window.todosLosIdsFiltrados?.length || 0} registros)` },
            { id: 'ninguno', texto: 'Deseleccionar todos' }
        ];
    
        window.MenuSelectorCheck.abrir(this, opcionesMenu, {
            multiple: false,
            buscador: false,
            onChange: (seleccionadoArray) => {
                const accion = seleccionadoArray[0];
                if (!accion) return;
    
                const controlador = window.CategoriasSelectionController;
    
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

function AbrirMenuOpcionesCategoria(event, idCategoria, elementoButton) {
    if (event && typeof event.stopPropagation === 'function') {
        event.stopPropagation();
    }

    const parametrosUrl = (window.UrlStateSyncService && typeof window.UrlStateSyncService.obtenerParametros === 'function')
        ? window.UrlStateSyncService.obtenerParametros() || {}
        : {};

    const habilitado = window.habilitado !== undefined ? parseInt(window.habilitado) : (parametrosUrl.habilitado !== undefined ? parseInt(parametrosUrl.habilitado) : 1);

    const opcionesBase = (habilitado === 0) 
        ? (window.opcionesCategoriaDeshabilitado || []) 
        : (window.opcionesCategoriaHabilitado || []);

    const opcionesPermitidas = opcionesBase.filter(op => {
        if (!op.permiso) return true;
        return window.PermisosService && typeof window.PermisosService.tienePermiso === 'function' 
            ? PermisosService.tienePermiso(op.permiso) 
            : true;
    });

    if (opcionesPermitidas.length === 0) {
        console.warn("No hay opciones disponibles para esta categoría con los permisos actuales.");
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
                    categoria_seleccionado: idCategoria,
                    accion_actual: op.texto
                });
            }

            if (typeof op.callback === 'function') {
                op.callback(idCategoria);
            }
        }
    }));

    if (typeof Abrir_Menu_Opciones_Global === 'function') {
        Abrir_Menu_Opciones_Global(elementoButton, opcionesConId);
    } else {
        console.warn("Abrir_Menu_Opciones_Global no está disponible.");
    }
}

async function Eliminar_Categoria(id) {
    const confirmado = await MostrarPregunta({
        titulo: 'Deshabilitar categoría',
        texto: '¿Estás seguro de que deseas deshabilitar esta categoría? Si tiene productos asociados, el sistema no permitirá la acción.',
        icono: 'vf-ic_fluent_delete_24_filled',
        confirmarText: 'Sí, deshabilitar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-danger',
        altura: 350
    });

    if (!confirmado) return false;
    Deshabilitar_Categoria_AJAX(id)
}

async function Restaurar_Categoria(id) {
    const confirmado = await MostrarPregunta({
        titulo: 'Habilitar categoría',
        texto: '¿Estás seguro de que deseas habilitar esta categoría?',
        icono: 'vf-ic_fluent_delete_24_filled',
        confirmarText: 'Sí, Habilitar',
        cancelarText: 'Cancelar',
        colorConfirmar: 'btn-primary',
        altura: 350
    });

    if (!confirmado) return false;
    Habilitar_Categoria_AJAX(id)
}

function ExportarCategoriasMasivas() {

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

async function Procesar_Archivo_Importar_Clientes(archivoSeleccionado) {
    try {
        console.log(archivoSeleccionado);
        const respuesta = await FileUploadService.subir(
            '../../../src/controllers/php/controllers/categorias.php', // URL del endpoint
            archivoSeleccionado,
            'importar_categorias', // La acción que leerá tu PHP en el despachador
            {},                  // Parámetros extra (objeto vacío si no requieres extras)
            'procesando archivo...' // Texto personalizado para el modal de carga en minúsculas
        );

        OcultarCargando()
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
               
            }, 1000);
        } else {
            const mensajeError = (respuesta && respuesta.mensaje) ? respuesta.mensaje : 'no se pudo procesar la importación del archivo.';
            if (typeof MostrarMensaje === 'function') {
                MostrarMensaje(mensajeError, false, false, false);
            }
        }
    } catch (error) {
        console.error("fallo en la subida:", error);
        MostrarAlerta(error.mensaje || 'error al procesar el archivo', 250, true);
    }
}