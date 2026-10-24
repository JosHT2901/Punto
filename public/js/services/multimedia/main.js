// --- Core del FileViewer ---
window.FileViewer = (() => {
    const modules = [];
    let fileList = []; 
    let currentIndex = 0; 
    
    const initDOM = () => {
        if ($('#file-viewer-modal').length === 0) {
            $('body').append(`
                <div id="file-viewer-modal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(15, 23, 42, 0.9); z-index:9999; backdrop-filter:blur(12px)">
                    <div style="display:flex; flex-direction:column; height:100%; width:100%;">
                        <!-- Header -->
                        <div id="viewer-header" style="flex:0 0 65px; background:rgba(15, 23, 42, 0.95); color:white; padding:0 20px; display:flex; align-items:center; border-bottom: 1px solid rgba(255,255,255,0.1);">
                            <a class="btn btn-option border border-slate-700 rounded-8 p-2 text-slate-300 bg-slate-800 hover:bg-slate-700" id="close-viewer" style="cursor:pointer;" title="Cerrar">
                                <i class="vf-ic_fluent_dismiss_24_regular fs-5"></i>
                            </a>
                            <span id="viewer-title" style="margin-left:15px; font-weight:700; font-size: 15px; color: #f8fafc;" class="texto-truncado"></span>
                            <div id="viewer-header-actions" style="margin-left:auto; display:flex; gap:8px; align-items:center;"></div>
                        </div>
                        
                        <!-- Contenido Principal con Navegación Lateral -->
                        <div style="flex:1; display:flex; align-items:center; position:relative; overflow:hidden;">
                            <a id="prev-file" class="btn btn-ghost rounded-full flex justify-center items-center shadow-lg" style="position:absolute; left:20px; z-index:10002; width:45px; height:45px; background:rgba(15, 23, 42, 0.7); color:white; border:1px solid rgba(255,255,255,0.1); cursor:pointer;">
                                <i class="vf-ic_fluent_chevron_left_24_filled fs-6"></i>
                            </a>
                            
                            <div id="viewer-content" class="contenedor" style="flex:1; height:100%; overflow:auto; display:flex; flex-direction:column; align-items:center; justify-content:center;"></div>
                            
                            <a id="next-file" class="btn btn-ghost rounded-full flex justify-center items-center shadow-lg" style="position:absolute; right:20px; z-index:10002; width:45px; height:45px; background:rgba(15, 23, 42, 0.7); color:white; border:1px solid rgba(255,255,255,0.1); cursor:pointer;">
                                <i class="vf-ic_fluent_chevron_right_24_filled fs-6"></i>
                            </a>
                        </div>
                        
                        <!-- Toolbar Inferior -->
                        <div id="viewer-toolbar" style="flex:0 0 auto; padding:12px; display:flex; justify-content:center; gap:8px; background:rgba(15, 23, 42, 0.95); border-top:1px solid rgba(255,255,255,0.1);"></div>
                    </div>
                </div>
            `);

            $('#close-viewer').on('click', () => {
                $('#file-viewer-modal').fadeOut(200);
            });
            
            $('#prev-file').on('click', () => navigate(-1));
            $('#next-file').on('click', () => navigate(1));
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
        let url = '';
        let type = source.tipo_mime || 'application/pdf';
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

        const selectedModule = modules.find(mod => mod.shouldHandle(fileData));

        if (!selectedModule) {
            $('#viewer-title').text(fileData.name);
            $('#viewer-header-actions').empty();
            $('#viewer-toolbar').empty().removeAttr("style");
            $('#viewer-content').empty();
            
            if (typeof Contenedor_No_Resultados_Con_Boton === 'function') {
                Contenedor_No_Resultados_Con_Boton('Vista previa no disponible', $('#viewer-content'), 'Descargar', 'btn-primary');
            } else {
                $('#viewer-content').html('<div class="text-white">Vista previa no disponible.</div>');
            }

            if (typeof OcultarCargando === 'function') OcultarCargando();
            $('#prev-file, #next-file').hide();
            return;
        }

        try {
            $('#viewer-title').text(fileData.name);
            $('#viewer-header-actions').empty();
            $('#viewer-toolbar').empty().removeAttr("style");
            $('#viewer-content').empty().removeAttr("style");
            
            let renderFunc = null;
            await selectedModule.init(fileData, $('#viewer-content'), $('#viewer-toolbar'), $('#viewer-header-actions'), (fn) => { renderFunc = fn; });
            
            // Mostrar u ocultar controles de navegación según la posición en la lista
            $('#prev-file').toggle(currentIndex > 0);
            $('#next-file').toggle(currentIndex < fileList.length - 1);

            if (typeof OcultarCargando === 'function') OcultarCargando();
        } catch (error) {
            console.error("Error cargando módulo FileViewer:", error);
            if (typeof OcultarCargando === 'function') OcultarCargando();
            if (typeof Contenedor_No_Resultados_Con_Boton === 'function') {
                Contenedor_No_Resultados_Con_Boton('Error al cargar archivo', $('#viewer-content'), 'Reintentar', 'btn-danger');
            }
        }
    };

    return {
        registerModule: (mod) => modules.push(mod),
        
        open: async (source, allSources = null) => {
            initDOM();
            fileList = allSources || [source];
            
            // Encontrar índice de manera segura usando ID o referencia directa
            currentIndex = fileList.findIndex(item => (item.ID && source.ID && item.ID === source.ID) || item === source);
            if (currentIndex === -1) currentIndex = 0;
            
            await loadSource(fileList[currentIndex]);
            $('#file-viewer-modal').fadeIn(200);
        }
    };
})();