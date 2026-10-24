window.FileViewer.registerModule({
    name: 'DocxModule',
    shouldHandle: (file) => file.type.includes('wordprocessingml') || file.name.toLowerCase().endsWith('.docx'),
    
    init: async (file, $container, $toolbar,$headerActions, setRender) => {
        let zoomLevel = 1.0;

        // Estilos limpios para simular una hoja de documento profesional
        $container.css({ 
            'display': 'flex', 'flex-direction': 'column', 'align-items': 'center', 
            'padding': '40px', 'overflow': 'auto', 'background': '#0f172a', 'width': '100%', 'height': '100%'
        });

        $container.html(`
            <div id="docx-wrapper" style="margin: 0 auto; max-width: 800px; width: 100%; transition: transform 0.2s ease; transform-origin: top center;">
                <div id="docx-content" style="background: white; padding: 60px; min-height: 900px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); border-radius: 8px; color: #1e293b; font-family: inherit;">
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; gap: 12px; color: #64748b;">
                        <i class="vf-ic_fluent_document_text_24_regular fs-9 animate-spin"></i>
                        <span class="fs-3 fw-600">Cargando documento...</span>
                    </div>
                </div>
            </div>
        `);

        // Función para aplicar el zoom de manera suave
        const applyZoom = () => {
            $('#docx-wrapper').css('transform', `scale(${zoomLevel})`);
        };

        try {
            const response = await fetch(file.url);
            const arrayBuffer = await response.arrayBuffer();
            
            // Verificamos que mammoth esté disponible
            if (typeof mammoth === 'undefined') {
                throw new Error('La librería Mammoth.js no está cargada.');
            }

            const result = await mammoth.convertToHtml({ arrayBuffer: arrayBuffer });
            
            $('#docx-content').html(result.value);
            $('#docx-content').find('img').css({ 'max-width': '100%', 'height': 'auto', 'border-radius': '6px' });
            $('#docx-content').find('table').addClass('table table-bordered');
        } catch (err) {
            console.error("Error al renderizar DOCX:", err);
            $('#docx-content').html(`
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; gap: 10px; color: #ef4444;">
                    <i class="vf-ic_fluent_warning_24_filled fs-8"></i>
                    <span class="fs-3 fw-700">Error al cargar el documento</span>
                    <span class="fs-1 text-slate-400">No se pudo procesar el archivo Word correctamente.</span>
                </div>
            `);
        }

        // --- Toolbar con controles de Zoom estilizados ---
        $toolbar.empty().css({ 
            'display': 'flex', 'justify-content': 'center', 'align-items': 'center', 'gap': '12px', 'padding': '12px 24px'
        });

        const createBtn = (iconClass, title, action) => 
            $('<button>', { title: title, html: `<i class="${iconClass}"></i>`, class: 'btn btn-option border border-slate-200/80 shadow-2xs rounded-8 px-3 py-2 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1 fs-2 fw-600' })
            .on('click', action);

        // Grupo de Zoom
        const $zoomGroup = $('<div>', { style: 'display: flex; gap: 8px; align-items: center;' }).appendTo($toolbar);
        
        createBtn('vf-ic_fluent_zoom_out_24_regular', 'Alejar Zoom', () => { 
            zoomLevel = Math.max(0.5, zoomLevel - 0.1); 
            applyZoom(); 
        }).appendTo($zoomGroup);
        
        const $zoomResetBtn =$('<button>', { text: 'Zoom', class: 'btn btn-option border border-slate-200/80 shadow-2xs rounded-8 px-3 py-2 text-slate-600 bg-slate-50 fs-2 fw-700' })
            .on('click', () => { zoomLevel = 1.0; applyZoom(); })
            .appendTo($zoomGroup);

        createBtn('vf-ic_fluent_zoom_in_24_regular', 'Acercar Zoom', () => { 
            zoomLevel = Math.min(2.0, zoomLevel + 0.1); 
            applyZoom(); 
        }).appendTo($zoomGroup);

        // Limpieza al cerrar o cambiar de archivo en el visor
        setRender(() => {
            $('#docx-wrapper').remove();
        });
    }
});