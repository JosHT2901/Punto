// --- Core del FileViewer ---
window.FileViewer = (() => {
    const modules = [];
    let fileList = []; 
    let currentIndex = 0; 
    
    const initDOM = () => {
        if ($('#file-viewer-modal').length === 0) {
            $('body').append(`
                <div id="file-viewer-modal" class="visor-modal-overlay" style="display:none;">
                    <div class="visor-wrapper">
                        
                        <!-- Header Modernizado -->
                        <div id="file-viewer-header" class="visor-header-bar">
                            <div style="display:flex; align-items:center; gap:14px; min-width:0;">
                                <a class="btn visor-btn close-modal-btn" id="close-file-viewer" style="cursor:pointer;" title="Cerrar">
                                    <i class="ph ph-x fs-5"></i>
                                </a>
                                <div style="display:flex; flex-direction:column; min-width:0;">
                                    <span id="file-viewer-title" class="visor-doc-title"></span>
                                    <span id="file-viewer-counter" style="font-size:11px; color:#94a3b8; margin-top:2px;"></span>
                                </div>
                            </div>
                            <div id="file-viewer-header-actions" style="display:flex; gap:10px; align-items:center;"></div>
                        </div>
                        
                        <!-- Contenido Principal con Navegación Lateral Estilizada -->
                        <div style="flex:1; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden;">
                            
                            <!-- Botón Anterior -->
                            <a id="prev-file-btn" class="btn visor-btn shadow-xl" style="position:absolute; left:24px; z-index:10002; width:45px; height:45px; background:rgba(30, 41, 59, 0.8); color:#f8fafc; border:1px solid rgba(255,255,255,0.12); border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(8px);">
                                <i class="vf-ic_fluent_chevron_left_24_filled fs-6"></i>
                            </a>
                            
                            <!-- Contenedor del Archivo -->
                            <div id="file-viewer-content" class="visor-body custom-scroll"></div>
                            
                            <!-- Botón Siguiente -->
                            <a id="next-file-btn" class="btn visor-btn shadow-xl" style="position:absolute; right:24px; z-index:10002; width:45px; height:45px; background:rgba(30, 41, 59, 0.8); color:#f8fafc; border:1px solid rgba(255,255,255,0.12); border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; backdrop-filter:blur(8px);">
                                <i class="vf-ic_fluent_chevron_right_24_filled fs-6"></i>
                            </a>
                        </div>
                        
                        <!-- Toolbar Inferior Único y Aislado -->
                        <div id="file-viewer-toolbar" style="flex:0 0 auto; padding:14px 24px; display:flex; justify-content:center; gap:12px; background:rgba(15, 23, 42, 0.95); border-top:1px solid rgba(255, 255, 255, 0.08); z-index:10003;"></div>
                    </div>
                </div>
            `);

            // Estilos globales compartidos para botones de Google Material Design dentro del visor
            if ($('#file-viewer-core-styles').length === 0) {
                $('head').append(`
                    <style id="file-viewer-core-styles">
                        .btn-google { 
                            background: #3c4043; border: none; color: #e8eaed; cursor: pointer; display: flex; 
                            align-items: center; justify-content: center; height: 36px; padding: 0 16px; border-radius: 18px; 
                            font-size: 13px; font-weight: 500; gap: 8px; transition: background 0.2s ease, box-shadow 0.2s ease;
                            box-shadow: 0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15);
                            text-decoration: none;
                        }
                        .btn-google:hover { background: #5f6368; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.4), 0 4px 8px 3px rgba(0,0,0,0.15); color: #fff; }
                        .btn-google-primary { background: #8ab4f8; color: #202124; }
                        .btn-google-primary:hover { background: #aecbfa; color: #202124; }
                    </style>
                `);
            }

            const cerrarVisor = () => {
                if (window._currentFileViewerCleanup && typeof window._currentFileViewerCleanup === 'function') {
                    window._currentFileViewerCleanup();
                    window._currentFileViewerCleanup = null;
                }
                $('#file-viewer-modal').fadeOut(200);
                $('#file-viewer-content').empty();
                $('#file-viewer-toolbar').empty().removeAttr("style");
            };

            $('#close-file-viewer').on('click', cerrarVisor);
            
            $('#prev-file-btn').on('click', () => navigate(-1));
            $('#next-file-btn').on('click', () => navigate(1));

            // Soporte para navegar con teclado (Flecha izq / der / Esc)
            $(document).on('keydown', (e) => {
                if ($('#file-viewer-modal').is(':visible')) {
                    if (e.key === 'ArrowLeft') navigate(-1);
                    if (e.key === 'ArrowRight') navigate(1);
                    if (e.key === 'Escape') cerrarVisor();
                }
            });
        }
    };

    const navigate = (direction) => {
        const newIndex = currentIndex + direction;
        if (newIndex >= 0 && newIndex < fileList.length) {
            currentIndex = newIndex;
            loadSource(fileList[currentIndex]);
        }
    };

    const loadSource = async (source) => {
        if (window._currentFileViewerCleanup && typeof window._currentFileViewerCleanup === 'function') {
            window._currentFileViewerCleanup();
            window._currentFileViewerCleanup = null;
        }

        let url = '';
        let type = source.tipo_mime || 'application/octet-stream';
        let name = source.nombre_original || source.name || 'Archivo';

        if (source.blob) {
            url = source.blob;
        } else if (source instanceof File || source instanceof Blob) {
            url = URL.createObjectURL(source);
        } else {
            url = typeof source === 'string' ? source : source.ruta;
        }

        const fileData = { url, type, name };

        if (typeof MostrarCargando === 'function') {
            MostrarCargando('Abriendo archivo...', false);
        }

        // Actualizar contador en el header
        $('#file-viewer-counter').text(`Archivo ${currentIndex + 1} de ${fileList.length}`);

        const selectedModule = modules.find(mod => mod.shouldHandle(fileData));

        if (!selectedModule) {
            $('#file-viewer-title').text(fileData.name);
            $('#file-viewer-header-actions').empty();
            $('#file-viewer-toolbar').empty().removeAttr("style").hide();
            $('#file-viewer-content').css({
                'display': 'flex', 'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center',
                'background': '#0f172a', 'width': '100%', 'height': '100%', 'gap': '16px'
            });
            
            // Renderizado elegante cuando no hay vista previa disponible con botón de descarga
            $('[id^="no-preview-download-btn"]').off('click');
            $('#file-viewer-content').html(`
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; text-align: center; padding: 20px;">
                    <div style="width: 80px; height: 80px; border-radius: 20px; display: flex; align-items: center; justify-content: center; background: rgba(30, 41, 59, 0.8); border: 1px solid rgba(255,255,255,0.1);">
                        <i class="icon fs-8 vf-ic_fluent_document_24_filled" style="color: #8ab4f8;"></i>
                    </div>
                    <div>
                        <h4 style="color: #f8fafc; font-size: 16px; font-weight: 600; margin: 0 0 6px 0;">Vista previa no disponible</h4>
                        <p style="color: #94a3b8; font-size: 13px; margin: 0;">Este formato de archivo no cuenta con un visor interactivo.</p>
                    </div>
                    <button id="no-preview-download-btn" class="btn-google btn-google-primary" style="margin-top: 8px;">
                        <i class="icon fs-6 vf-ic_fluent_arrow_download_24_filled"></i>
                        <span>Descargar archivo</span>
                    </button>
                </div>
            `);

            // Evento de descarga segura para evitar about:blank
            $('#no-preview-download-btn').on('click', function() {
                const link = document.createElement('a');
                link.href = fileData.url;
                link.download = fileData.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });

            if (typeof OcultarCargando === 'function') OcultarCargando();
            
            // Mostrar u ocultar controles de navegación laterales de la galería
            $('#prev-file-btn').toggle(currentIndex > 0);
            $('#next-file-btn').toggle(currentIndex < fileList.length - 1);
            return;
        }

        try {
            $('#file-viewer-title').text(fileData.name);
            $('#file-viewer-header-actions').empty();
            $('#file-viewer-toolbar').empty().removeAttr("style").show();
            $('#file-viewer-content').empty().removeAttr("style");
            
            await selectedModule.init(
                fileData, 
                $('#file-viewer-content'), 
                $('#file-viewer-toolbar'), 
                $('#file-viewer-header-actions'), 
                (cleanupFn) => { window._currentFileViewerCleanup = cleanupFn; }
            );
            
            // Mostrar u ocultar controles de navegación según la posición en la lista
            $('#prev-file-btn').toggle(currentIndex > 0);
            $('#next-file-btn').toggle(currentIndex < fileList.length - 1);

            if (typeof OcultarCargando === 'function') OcultarCargando();
        } catch (error) {
            console.error("Error cargando módulo FileViewer:", error);
            if (typeof OcultarCargando === 'function') OcultarCargando();
            if (typeof Contenedor_No_Resultados_Con_Boton === 'function') {
                Contenedor_No_Resultados_Con_Boton('Error al cargar archivo', $('#file-viewer-content'), 'Reintentar', 'btn-danger');
            }
        }
    };

    return {
        registerModule: (mod) => modules.push(mod),
        
        open: async (source, allSources = null) => {
            initDOM();
            fileList = allSources || [source];
            // Encontrar índice de manera segura usando ID o referencia directa
            currentIndex = fileList.findIndex(item => (item.id && source.id && item.id === source.id) || (item.ID && source.ID && item.ID === source.ID) || item === source);
            if (currentIndex === -1) currentIndex = 0;
            
            await loadSource(fileList[currentIndex]);
            $('#file-viewer-modal').fadeIn(200);
        }
    };
})();