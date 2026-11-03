// Variable global para almacenar el listado actual de archivos (necesaria para la navegación del visor)
let archivosGlobales = [];

/**
 * Renderiza las tarjetas de archivos dentro del contenedor de la biblioteca usando Grid.
 */
function Renderizar_Tarjetas(archivos) {
    archivosGlobales = archivos || [];
    const $contenedor = $("#contenedor-tarjetas");
    $contenedor.empty();

    // 1. Configuramos grid y aseguramos altura 100% y scroll vertical interno
    $contenedor.removeClass('flex-column').css({
        'display': 'grid',
        'grid-template-columns': 'repeat(auto-fill, minmax(220px, 1fr))',
        'gap': '20px',
        'padding': '20px',
        'align-content': 'start',
        'overflow-y': 'auto',
        'height': '100%',
        'flex-direction': ''
    });

    if (!archivos || archivos.length === 0) {
        $contenedor.css('display', 'flex');
        if (typeof Contenedor_No_Resultados === 'function') {
            Contenedor_No_Resultados('No hay resultados', $contenedor);
        } else {
            $contenedor.html('<div style="text-align: center; color: #64748b; padding: 20px; width: 100%;">No hay resultados</div>');
        }
        return;
    }

    $contenedor.find('#contenedor-no-resultados').remove();

    let htmlCards = '';
    archivos.forEach(archivo => {
        const id = archivo.id || '';
        const nombre = archivo.nombre_original || 'Archivo sin nombre';
        const extension = (archivo.extension || 'file').toLowerCase();
        const icono = typeof FileIconService !== 'undefined' ? FileIconService.obtenerPorExtension(extension) : '../../assets/icon/file/default.png';

        let fechaTexto = '';
        const fechaFormateada = archivo.actualizado_en_formato || archivo.creado_en_formato;
        if (fechaFormateada) {
            fechaTexto = `Actualizado el ${fechaFormateada}`;
        }

        htmlCards += `
            <div class="rounded-8 flex flex-column position-relative tarjeta-biblioteca btn btn-option border-primary p-3 box-sizing tarjeta-archivo" data-id="${id}" style="height: 220px; text-align: left; cursor: pointer;">
                <div class="h-40 flex items-center justify-between w-p-100">
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                        <div class="w-40 h-p-100 flex justify-center items-center shrink-0" style="color: #4285f4;">
                            <img src="${icono}" class="w-30" >
                        </div>
                        <div class="fw-600 fs-3 flex-1 min-w-0 flex justify-start items-center">
                            <span class="text-truncate text-left d-block w-p-100" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${nombre}">${nombre}</span>
                        </div>
                    </div>
                    <div>
                        <a class="btn w-35 h-35 btn-ghost rounded-3xl flex-center btn-opciones-archivo" data-id="${id}">
                            <i class="icon fs-8 vf-ic_fluent_more_vertical_24_filled"></i>
                        </a>
                    </div>
                </div>
                <div class="flex-1 flex items-center justify-center preview-container-card overflow-hidden my-2" data-archivo-id="${id}" style="width: 100%; border-radius: 6px; background: #f8fafc;"></div>
                <div class="fw-600 fs-2 text-gray-500 w-p-100"><span class="text-left">${fechaTexto}</span></div>
            </div>
        `;
    });

    // Inyectamos las tarjetas de una sola vez
    $contenedor.html(htmlCards);

    // Sincronizar estado visual de selección si hay elementos seleccionados
    if (window.SeleccionSinChecksController && typeof window.SeleccionSinChecksController.sincronizarDOM === 'function') {
        window.SeleccionSinChecksController.sincronizarDOM();
    }

    // Renderizamos las vistas previas en cada contenedor correspondiente
    archivos.forEach(archivo => {
        const $previewContainer = $contenedor.find(`.preview-container-card[data-archivo-id="${archivo.id}"]`);
        if ($previewContainer.length && typeof RenderizarVistaPrevia === 'function') {
            RenderizarVistaPrevia(archivo, $previewContainer);
        }
    });

    // Clic IZQUIERDO normal para abrir el archivo
    $contenedor.off('click', '.tarjeta-archivo').on('click', '.tarjeta-archivo', function (e) {
        if ($(e.target).closest('.btn-opciones-archivo').length > 0) return;
        // Si se hizo clic izquierdo con Shift, evitamos abrir el archivo para priorizar selección por rango
        if (e.shiftKey) return;

        const idArchivo = $(this).data('id');
        const archivoSeleccionado = archivosGlobales.find(item => item.id == idArchivo);

        if (archivoSeleccionado) {
            if (typeof Actulizar_Apertura_Documento === 'function') {
                Actulizar_Apertura_Documento(archivoSeleccionado)
                    .then(response => {
                        if (response && response.ok) {
                            if (typeof FileViewer !== 'undefined') {
                                FileViewer.open(archivoSeleccionado, archivosGlobales);
                            }
                        } else {
                            console.warn("No se pudo registrar la apertura del documento en servidor.");
                        }
                    })
                    .catch(err => {
                        console.error("Error al registrar apertura:", err);
                        if (typeof FileViewer !== 'undefined') {
                            FileViewer.open(archivoSeleccionado, archivosGlobales);
                        }
                    });
            } else if (typeof FileViewer !== 'undefined') {
                FileViewer.open(archivoSeleccionado, archivosGlobales);
            }
        }
    });

    // 💡 EVENTO PARA ABRIR EL MENÚ DE OPCIONES EN VISTA TARJETAS
    $contenedor.off('click', '.btn-opciones-archivo').on('click', '.btn-opciones-archivo', function (e) {
        e.stopPropagation();
        const idArchivo = $(this).data('id');
        const archivoSeleccionado = archivosGlobales.find(item => item.id == idArchivo);
        if (archivoSeleccionado && typeof AbrirMenuOpcionesDocumento === 'function') {
            AbrirMenuOpcionesDocumento(e, archivoSeleccionado, this);
        }
    });
}

/**
 * Anexa más tarjetas al final en la paginación infinita manteniendo el Grid.
 */
function Anexar_Tarjetas(archivosNuevos) {
    if (!archivosNuevos || archivosNuevos.length === 0) return;

    archivosGlobales = archivosGlobales.concat(archivosNuevos);
    const $contenedor = $("#contenedor-tarjetas");
    $contenedor.find('#contenedor-no-resultados').remove();

    let htmlCards = '';
    archivosNuevos.forEach(archivo => {
        const id = archivo.id || '';
        const nombre = archivo.nombre_original || 'Archivo sin nombre';
        const extension = (archivo.extension || 'file').toLowerCase();
        const icono = typeof FileIconService !== 'undefined' ? FileIconService.obtenerPorExtension(extension) : '../../assets/icon/file/default.png';

        let fechaTexto = '';
        const fechaFormateada = archivo.actualizado_en_formato || archivo.creado_en_formato;
        if (fechaFormateada) {
            fechaTexto = `Actualizado el ${fechaFormateada}`;
        }

        htmlCards += `
            <div class="rounded-8 flex flex-column position-relative btn btn-option border-primary p-3 box-sizing tarjeta-biblioteca tarjeta-archivo" data-id="${id}" style="height: 220px; text-align: left; cursor: pointer;">
                <div class="h-40 flex items-center justify-between w-p-100">
                    <div class="flex items-center gap-2 flex-1 min-w-0">
                        <div class="w-40 h-p-100 flex justify-center items-center shrink-0" style="color: #4285f4;">
                            <img src="${icono}" class="w-30" >
                        </div>
                        <div class="fw-600 fs-3 flex-1 min-w-0 flex justify-start items-center">
                            <span class="text-truncate text-left d-block w-p-100" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${nombre}">${nombre}</span>
                        </div>
                    </div>
                    <div>
                        <a class="btn w-35 h-35 btn-ghost rounded-3xl flex-center btn-opciones-archivo" data-id="${id}">
                            <i class="icon fs-8 vf-ic_fluent_more_vertical_24_filled"></i>
                        </a>
                    </div>
                </div>
                <div class="flex-1 flex items-center justify-center preview-container-card overflow-hidden my-2" data-archivo-id="${id}" style="width: 100%; border-radius: 6px; background: #f8fafc;"></div>
                <div class="fw-600 fs-2 text-gray-500 w-p-100"><span class="text-left">${fechaTexto}</span></div>
            </div>
        `;
    });

    $contenedor.append(htmlCards);

    if (window.SeleccionSinChecksController && typeof window.SeleccionSinChecksController.sincronizarDOM === 'function') {
        window.SeleccionSinChecksController.sincronizarDOM();
    }

    archivosNuevos.forEach(archivo => {
        const $previewContainer = $contenedor.find(`.preview-container-card[data-archivo-id="${archivo.id}"]:empty`);
        if ($previewContainer.length && typeof RenderizarVistaPrevia === 'function') {
            RenderizarVistaPrevia(archivo, $previewContainer);
        }
    });
}

function Renderizar_Filas_Archivos(archivos) {
    archivosGlobales = archivos || [];
    const $contenedor = $("#contenedor-tarjetas");
    $contenedor.empty();

    $contenedor.css({
        'display': 'flex',
        'flex-direction': 'column',
        'grid-template-columns': '',
        'gap': '',
        'align-content': '',
        'padding': '0px',
        'overflow-y': 'hidden',
        'height': '100%'
    }).addClass('flex-column');

    if (!archivos || archivos.length === 0) {
        if (typeof Contenedor_No_Resultados === 'function') {
            Contenedor_No_Resultados('No hay resultados', $contenedor);
        } else {
            $contenedor.html('<div style="text-align: center; color: #64748b; padding: 20px;">No hay resultados</div>');
        }
        return;
    }

    let htmlFilas = '';
    archivos.forEach(archivo => {
        const id = archivo.id || '';
        const nombre = archivo.nombre_original || 'Archivo sin nombre';
        const extension = (archivo.extension || 'file').toLowerCase();
        const rutaIcono = typeof FileIconService !== 'undefined' ? FileIconService.obtenerPorExtension(extension) : '../../assets/icon/file/default.png';

        let tamanoFormateado = '0 KB';
        if (archivo.tamano_bytes) {
            const kb = archivo.tamano_bytes / 1024;
            tamanoFormateado = kb > 1024 ? (kb / 1024).toFixed(2) + ' MB' : kb.toFixed(1) + ' KB';
        }

        let fechaTexto = 'Sin fecha';
        const fechaRaw = archivo.actualizado_en || archivo.creado_en;
        if (fechaRaw) {
            const fechaObj = new Date(fechaRaw);
            fechaTexto = !isNaN(fechaObj) ? fechaObj.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }) : fechaRaw;
        }

        htmlFilas += `
            <div class="w-p-100 h-50 py-2 px-2 flex justify-center items-center my-1 gap-3 btn btn-ghost p-0 tarjeta-biblioteca fila-archivo" data-id="${id}" style="border-top:1px solid #cacaca; border-bottom:1px solid #cacaca; cursor: pointer;">
                <div class="flex-1 flex items-center min-w-0">
                    <div class="w-30 flex justify-center items-center shrink-0">
                        <img src="${rutaIcono}" class="w-20" >
                    </div>
                    <div class="flex-1 fw-600 fs-3 min-w-0 text-left flex justify-start items-center">
                        <span class="text-truncate text-left d-block w-p-100" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${nombre}">${nombre}</span>
                    </div>
                </div>
                <div class="w-150 h-p-100 flex justify-start items-center shrink-0"><span class="fw-600 fs-3 text-gray-600">${fechaTexto}</span></div>
                <div class="w-150 h-p-100 flex justify-start items-center shrink-0"><span class="fw-600 fs-3 text-gray-600">${tamanoFormateado}</span></div>
                <div class="w-40 h-p-100 flex justify-center items-center shrink-0">
                    <a class="btn btn-secondary rounded-md flex-center shrink-0 w-30 h-30 btn-opciones-archivo" data-id="${id}">
                        <i class="vf-ic_fluent_more_vertical_24_filled"></i>
                    </a>
                </div>
            </div>
        `;
    });

    const estructuraCompleta = `
        <div class="w-p-100 h-40 flex fs-3 gap-3 px-2 border-bottom shrink-0">
            <div class="flex-1 flex">
                <div class="flex-1 flex justify-start items-center">
                    <span class="rounded-8 bg-brand-soft px-2 h-30 flex items-center justify-center text-brand-blue fw-600 lh-1">Nombre</span>
                </div>
                <div class="w-40 h-p-100 flex items-center justify-center">
                    <a class="btn btn-ghost rounded-3xl flex-center shrink-0 w-30 h-30 btn-ordenar-nombre" title="Ordenar por nombre"><i class="vf-ic_fluent_arrow_sort_24_filled"></i></a>
                </div>
            </div>
            <div class="w-150 h-p-100 flex shrink-0">
                <div class="flex-1 flex justify-start items-center">
                    <span class="rounded-8 bg-brand-soft px-2 h-30 flex items-center justify-center text-brand-blue fw-600 lh-1">Carga</span>
                </div>
                <div class="w-40 h-p-100 flex items-center justify-center">
                    <a class="btn btn-ghost rounded-3xl flex-center shrink-0 w-30 h-30 btn-ordenar-fecha" title="Ordenar por fecha"><i class="vf-ic_fluent_arrow_sort_24_filled"></i></a>
                </div>
            </div>
            <div class="w-150 h-p-100 flex shrink-0">
                <div class="flex-1 flex justify-start items-center">
                    <span class="rounded-8 bg-brand-soft px-2 h-30 flex items-center justify-center text-brand-blue fw-600 lh-1">Tamaño</span>
                </div>
                <div class="w-40 h-p-100 flex items-center justify-center">
                    <a class="btn btn-ghost rounded-3xl flex-center shrink-0 w-30 h-30 btn-ordenar-tamano" title="Ordenar por tamaño"><i class="vf-ic_fluent_arrow_sort_24_filled"></i></a>
                </div>
            </div>
            <div class="w-40 h-p-100 flex justify-center items-center shrink-0"></div>
        </div>
        <div class="flex-1 overflow-auto w-p-100 flex-column min-h-0 custom-scroll px-1" id="contenedor-filas-scroll">
            ${htmlFilas}
        </div>
    `;

    $contenedor.html(estructuraCompleta);

    if (window.SeleccionSinChecksController && typeof window.SeleccionSinChecksController.sincronizarDOM === 'function') {
        window.SeleccionSinChecksController.sincronizarDOM();
    }

    // Evento de clic en la fila: registra apertura y abre el visor si es exitoso
    $contenedor.off('click', '.fila-archivo').on('click', '.fila-archivo', function (e) {
        if ($(e.target).closest('.btn-opciones-archivo').length > 0) return;
        if (e.shiftKey) return;

        const idArchivo = $(this).data('id');
        const archivoSeleccionado = archivosGlobales.find(item => item.id == idArchivo);

        if (archivoSeleccionado) {
            Actulizar_Apertura_Documento(archivoSeleccionado)
                .then(response => {
                    if (response && response.ok) {
                        if (typeof FileViewer !== 'undefined') {
                            FileViewer.open(archivoSeleccionado, archivosGlobales);
                        }
                    } else {
                        console.warn("No se pudo registrar la apertura del documento en servidor.");
                        MostrarAlerta('No se puede abrir el documento', 230, false)
                    }
                })
                .catch(err => {
                    console.error("Error al registrar apertura:", err);
                    MostrarAlerta('No se puede abrir el documento', 230, false)
                });
        }
    });

    // 💡 EVENTO PARA ABRIR EL MENÚ DE OPCIONES EN VISTA LISTA
    $contenedor.off('click', '.btn-opciones-archivo').on('click', '.btn-opciones-archivo', function (e) {
        e.stopPropagation();
        const idArchivo = $(this).data('id');
        const archivoSeleccionado = archivosGlobales.find(item => item.id == idArchivo);
        if (archivoSeleccionado && typeof AbrirMenuOpcionesDocumento === 'function') {
            AbrirMenuOpcionesDocumento(e, archivoSeleccionado, this);
        }
    });

    // 🌟 💡 EVENTOS DE ORDENAMIENTO (NOMBRE, FECHA, TAMAÑO)
    const manejarOrdenamiento = (columna) => {
        window.ordenArchivos = window.ordenArchivos || { columna: 'creado_en', direccion: 'DESC' };
        
        // Si hace clic en la misma columna, alterna la dirección; si es otra, pone ASC por defecto
        if (window.ordenArchivos.columna === columna) {
            window.ordenArchivos.direccion = window.ordenArchivos.direccion === 'ASC' ? 'DESC' : 'ASC';
        } else {
            window.ordenArchivos.columna = columna;
            window.ordenArchivos.direccion = 'ASC';
        }

        // Si tienes una función global para recargar con el nuevo orden, invócala aquí:
        if (typeof CargarArchivos === 'function') {
            CargarArchivos();
        } else {
            // Fallback: ordenar localmente el array global si no hay llamada al servidor inmediata
            archivosGlobales.sort((a, b) => {
                let valA = a[columna] || '';
                let valB = b[columna] || '';
                
                if (columna === 'tamano_bytes') {
                    valA = Number(valA) || 0;
                    valB = Number(valB) || 0;
                }

                if (valA < valB) return window.ordenArchivos.direccion === 'ASC' ? -1 : 1;
                if (valA > valB) return window.ordenArchivos.direccion === 'ASC' ? 1 : -1;
                return 0;
            });
            Renderizar_Filas_Archivos(archivosGlobales);
        }
    };

    $contenedor.off('click', '.btn-ordenar-nombre').on('click', '.btn-ordenar-nombre', function (e) {
        e.stopPropagation();
        manejarOrdenamiento('nombre_original');
    });

    $contenedor.off('click', '.btn-ordenar-fecha').on('click', '.btn-ordenar-fecha', function (e) {
        e.stopPropagation();
        manejarOrdenamiento('creado_en'); // O 'actualizado_en' según corresponda
    });

    $contenedor.off('click', '.btn-ordenar-tamano').on('click', '.btn-ordenar-tamano', function (e) {
        e.stopPropagation();
        manejarOrdenamiento('tamano_bytes');
    });
}

/**
 * Anexa más filas al final en la paginación infinita (vista lista).
 */
function Anexar_Filas_Archivos(archivosNuevos) {
    if (!archivosNuevos || archivosNuevos.length === 0) return;

    archivosGlobales = archivosGlobales.concat(archivosNuevos);
    const $scrollContainer = $("#contenedor-filas-scroll");
    if (!$scrollContainer.length) return;

    let htmlFilas = '';
    archivosNuevos.forEach(archivo => {
        const id = archivo.id || '';
        const nombre = archivo.nombre_original || 'Archivo sin nombre';
        const extension = (archivo.extension || 'file').toLowerCase();
        const rutaIcono = typeof FileIconService !== 'undefined' ? FileIconService.obtenerPorExtension(extension) : '../../assets/icon/file/default.png';

        let tamanoFormateado = '0 KB';
        if (archivo.tamano_bytes) {
            const kb = archivo.tamano_bytes / 1024;
            tamanoFormateado = kb > 1024 ? (kb / 1024).toFixed(2) + ' MB' : kb.toFixed(1) + ' KB';
        }

        let fechaTexto = 'Sin fecha';
        const fechaRaw = archivo.actualizado_en || archivo.creado_en;
        if (fechaRaw) {
            const fechaObj = new Date(fechaRaw);
            fechaTexto = !isNaN(fechaObj) ? fechaObj.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
            }) : fechaRaw;
        }

        htmlFilas += `
            <div class="w-p-100 h-50 py-2 px-2 flex justify-center items-center my-1 gap-3 btn btn-ghost p-0 fila-archivo tarjeta-biblioteca " data-id="${id}" style="border-top:1px solid #cacaca; border-bottom:1px solid #cacaca; cursor: pointer;">
                <div class="flex-1 flex items-center min-w-0">
                    <div class="w-30 flex justify-center items-center shrink-0">
                        <img src="${rutaIcono}" class="w-20" >
                    </div>
                    <div class="flex-1 fw-600 fs-3 min-w-0 text-left flex justify-start items-center">
                        <span class="text-truncate text-left d-block w-p-100" style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${nombre}">${nombre}</span>
                    </div>
                </div>
                <div class="w-150 h-p-100 flex justify-start items-center shrink-0"><span class="fw-600 fs-3 text-gray-600">${fechaTexto}</span></div>
                <div class="w-150 h-p-100 flex justify-start items-center shrink-0"><span class="fw-600 fs-3 text-gray-600">${tamanoFormateado}</span></div>
                <div class="w-40 h-p-100 flex justify-center items-center shrink-0">
                    <a class="btn btn-secondary rounded-md flex-center shrink-0 w-30 h-30 btn-opciones-archivo" data-id="${id}">
                        <i class="vf-ic_fluent_more_vertical_24_filled"></i>
                    </a>
                </div>
            </div>
        `;
    });

    $scrollContainer.append(htmlFilas);

    if (window.SeleccionSinChecksController && typeof window.SeleccionSinChecksController.sincronizarDOM === 'function') {
        window.SeleccionSinChecksController.sincronizarDOM();
    }
}