window.FileViewer.registerModule({
    name: 'DocxModule',
    shouldHandle: (file) => (file.type && file.type.includes('wordprocessingml')) || /\.docx$/i.test(file.name),
    
    init: async (file, $container, $toolbar, $headerActions, setRender) => {
        let zoomLevel = 1.0;

        // 1. Estilos unificados Google Material Design para DOCX
        if ($('#docx-module-styles').length === 0) {
            $('head').append(`
                <style id="docx-module-styles">
                    .btn-google { 
                        background: #3c4043; border: none; color: #e8eaed; cursor: pointer; display: flex; 
                        align-items: center; justify-content: center; height: 36px; padding: 0 16px; border-radius: 18px; 
                        font-size: 13px; font-weight: 500; gap: 8px; transition: background 0.2s ease, box-shadow 0.2s ease;
                        box-shadow: 0 1px 2px 0 rgba(0,0,0,0.3), 0 1px 3px 1px rgba(0,0,0,0.15);
                    }
                    .btn-google:hover { background: #5f6368; box-shadow: 0 1px 3px 0 rgba(0,0,0,0.4), 0 4px 8px 3px rgba(0,0,0,0.15); }
                    .btn-google-primary { background: #8ab4f8; color: #202124; }
                    .btn-google-primary:hover { background: #aecbfa; }
                    .btn-google-icon { width: 36px; padding: 0; border-radius: 50%; }
                </style>
            `);
        }

        // Estilo del contenedor principal simulando hoja de documento profesional
        $container.css({ 
            'display': 'flex', 'flex-direction': 'column', 'align-items': 'center', 
            'padding': '40px', 'overflow': 'auto', 'background': '#0f172a', 'width': '100%', 'height': '100%'
        });

        $container.html(`
            <div id="docx-wrapper" style="margin: 0 auto; max-width: 800px; width: 100%; transition: transform 0.2s ease; transform-origin: top center;">
                <div id="docx-content" style="background: white; padding: 60px; min-height: 900px; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); border-radius: 8px; color: #1e293b; font-family: inherit;">
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 400px; gap: 12px; color: #64748b;">
                        <i class="icon vf-ic_fluent_document_text_24_filled fs-9 animate-spin"></i>
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
                    <i class="icon vf-ic_fluent_warning_24_filled fs-8"></i>
                    <span class="fs-3 fw-700">Error al cargar el documento</span>
                    <span class="fs-1 text-slate-400">No se pudo procesar el archivo Word correctamente.</span>
                </div>
            `);
        }

        // Botones de la cabecera (Descargar e Imprimir) con estilo Google
        const createHeaderBtn = function(iconClass, title, action) {
            return $('<button>', { title: title, html: `<i class="icon fs-6 ${iconClass}"></i>`, class: 'btn-google btn-google-icon' })
                .on('click', action)
                .appendTo($headerActions);
        };

        // Descarga segura mediante elemento temporal (evita about:blank)
        createHeaderBtn('vf-ic_fluent_arrow_download_24_filled', 'Descargar', function() {
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.name || 'documento.docx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        createHeaderBtn('vf-ic_fluent_print_24_filled', 'Imprimir', function() { window.print(); });

        // --- Toolbar inferior expandida al 100% con estilo Google ---
        $toolbar.empty().css({ 
            'display': 'flex', 'justify-content': 'center', 'align-items': 'center', 'gap': '12px', 
            'padding': '14px 28px', 'width': '100%', 'box-sizing': 'border-box',
            'background': '#202124', 'border-top': '1px solid #3c4043'
        });

        const createGoogleBtn = (iconClass, text, action, isPrimary = false, isIconOnly = false) => {
            let className = isIconOnly ? 'btn-google btn-google-icon' : 'btn-google';
            if (isPrimary) className += ' btn-google-primary';
            const content = isIconOnly ? `<i class="icon fs-6 ${iconClass}"></i>` : `<i class="icon fs-6 ${iconClass}"></i><span>${text}</span>`;
            
            return $('<button>', { class: className, title: isIconOnly ? text : '' })
                .html(content)
                .on('click', action)
                .appendTo($toolbar);
        };

        // Grupo de Zoom con botones estilizados
        createGoogleBtn('vf-ic_fluent_zoom_out_24_filled', 'Alejar', () => { 
            zoomLevel = Math.max(0.5, zoomLevel - 0.1); 
            applyZoom(); 
        }, false, true);
        
        createGoogleBtn('vf-ic_fluent_arrow_clockwise_24_filled', 'Restaurar', () => { 
            zoomLevel = 1.0; 
            applyZoom(); 
        }, true);

        createGoogleBtn('vf-ic_fluent_zoom_in_24_filled', 'Acercar', () => { 
            zoomLevel = Math.min(2.0, zoomLevel + 0.1); 
            applyZoom(); 
        }, false, true);

        // Limpieza estricta al cerrar o cambiar de archivo en el visor
        setRender(() => {
            try {
                $('#docx-wrapper').remove();
            } catch(e) {}

            if ($toolbar) $toolbar.empty().removeAttr("style");
            if ($container) $container.empty();
        });
    }
});