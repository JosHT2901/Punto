window.FileViewer.registerModule({
    name: 'PDFModule',
    shouldHandle: function(file) {
        return (file.type && file.type.includes('pdf')) || /\.pdf$/i.test(file.name);
    },
    init: function(file, $container, $toolbar, $headerActions, setRender) {
        
        // 1. Estilos unificados Google Material Design para PDF
        if ($('#pdf-module-styles').length === 0) {
            $('head').append(`
                <style id="pdf-module-styles">
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

        // Estilo del contenedor principal
        $container.css({ 
            'display': 'flex', 'flex-direction': 'column', 'align-items': 'center',
            'padding': '30px', 'overflow': 'auto', 'width': '100%', 'height': '100%', 'background': '#0f172a'
        });
        
        $container.html(`<canvas id="pdf-canvas" style="box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); background: white; margin: 0 auto; border-radius: 8px; width: 90%; max-width: 900px; display: block;"></canvas>`);
    
        // Carga asíncrona manejada con PDF.js
        pdfjsLib.getDocument(file.url).promise.then(function(pdf) {
            let pageNum = 1;
            let zoomLevel = 1.0;
            let isRendering = false;
            const canvas = document.getElementById('pdf-canvas');
            if (!canvas) return;
            const context = canvas.getContext('2d');
        
            const render = function() {
                if (isRendering) return;
                isRendering = true;
                
                pdf.getPage(pageNum).then(function(page) {
                    const containerWidth = $container.width() || 800;
                    
                    const baseScale = (containerWidth * 0.85) / page.getViewport({ scale: 1, rotation: 0 }).width;
                    const viewport = page.getViewport({ scale: baseScale * zoomLevel, rotation: 0 });
                    
                    const outputScale = window.devicePixelRatio || 1;
                    
                    canvas.width = Math.floor(viewport.width * outputScale);
                    canvas.height = Math.floor(viewport.height * outputScale);
                    canvas.style.width = Math.floor(viewport.width) + "px";
                    canvas.style.height = Math.floor(viewport.height) + "px";
                    
                    page.render({ 
                        canvasContext: context, 
                        transform: [outputScale, 0, 0, outputScale, 0, 0], 
                        viewport: viewport 
                    }).promise.then(function() {
                        $('#page-input').val(pageNum);
                        $('#total-pages').text(pdf.numPages);
                        isRendering = false;
                    });
                }).catch(function() {
                    isRendering = false;
                });
            };

            // Botones de la cabecera (Descargar e Imprimir) con estilo Google
            const createHeaderBtn = function(iconClass, title, action) {
                return $('<button>', { title: title, html: `<i class="icon fs-6 ${iconClass}"></i>`, class: 'btn-google btn-google-icon' })
                    .on('click', action)
                    .appendTo($headerActions);
            };

            // Descarga segura mediante elemento temporal para evitar about:blank
            createHeaderBtn('vf-ic_fluent_arrow_download_24_filled', 'Descargar', function() {
                const link = document.createElement('a');
                link.href = file.url;
                link.download = file.name || 'documento.pdf';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });

            createHeaderBtn('vf-ic_fluent_print_24_filled', 'Imprimir', function() { window.print(); });

            // 2. Toolbar inferior expandida al 100% con estilo Google
            $toolbar.empty().css({ 
                'display': 'flex', 'justify-content': pdf.numPages > 1 ? 'space-between' : 'center', 'align-items': 'center', 
                'padding': '14px 28px', 'width': '100%', 'box-sizing': 'border-box',
                'background': '#202124', 'border-top': '1px solid #3c4043'
            });

            const createGoogleBtn = function(iconClass, text, action, isPrimary = false, isIconOnly = false) {
                let className = isIconOnly ? 'btn-google btn-google-icon' : 'btn-google';
                if (isPrimary) className += ' btn-google-primary';
                const content = isIconOnly ? `<i class="icon fs-6 ${iconClass}"></i>` : `<i class="icon fs-6 ${iconClass}"></i><span>${text}</span>`;
                
                return $('<button>', { class: className, title: isIconOnly ? text : '' })
                    .html(content)
                    .on('click', action);
            };

            // 3. Grupo A: Navegación de páginas (Solo se muestra si el PDF tiene más de 1 página)
            if (pdf.numPages > 1) {
                const $navGroup = $('<div>', { class: 'nav-controls' })
                    .css({ 'display': 'flex', 'align-items': 'center', 'gap': '12px' })
                    .appendTo($toolbar);

                createGoogleBtn('vf-ic_fluent_chevron_left_24_filled', 'Anterior', function() { 
                    if(pageNum > 1) { pageNum--; render(); } 
                }, false, true).appendTo($navGroup);
                
                // Input de número de página estilizado
                $('<div>', { class: 'input-wrapper' })
                    .css({ 'display': 'flex', 'align-items': 'center', 'gap': '8px', 'color': '#e8eaed', 'font-size': '13px' })
                    .append(
                        $('<input>', { id: 'page-input', type: 'number', value: pageNum })
                        .css({ 'width': '55px', 'height': '32px', 'border': '1px solid #5f6368', 'border-radius': '6px', 'text-align': 'center', 'font-weight': '600', 'color': '#e8eaed', 'background': '#3c4043', 'outline': 'none' })
                        .on('keydown', function(e) { 
                            if (e.key === 'Enter') { 
                                let v = parseInt(e.target.value); 
                                if (v >= 1 && v <= pdf.numPages) { pageNum = v; render(); } 
                            } 
                        })
                    )
                    .append($('<span>', { class: 'text-slate-300' }).html('/ <span id="total-pages"></span>'))
                    .appendTo($navGroup);
            
                createGoogleBtn('vf-ic_fluent_chevron_right_24_filled', 'Siguiente', function() { 
                    if(pageNum < pdf.numPages) { pageNum++; render(); } 
                }, false, true).appendTo($navGroup);
            }
        
            // Grupo B: Controles de Zoom (siempre disponibles)
            const $zoomGroup = $('<div>', { class: 'zoom-controls' })
                .css({ 'display': 'flex', 'align-items': 'center', 'gap': '10px' })
                .appendTo($toolbar);
        
            createGoogleBtn('vf-ic_fluent_zoom_out_24_filled', 'Alejar', function() { 
                zoomLevel = Math.max(0.5, zoomLevel - 0.2); 
                render(); 
            }, false, true).appendTo($zoomGroup);

            createGoogleBtn('vf-ic_fluent_arrow_clockwise_24_filled', 'Restaurar', function() { 
                zoomLevel = 1.0; 
                render(); 
            }, true).appendTo($zoomGroup);

            createGoogleBtn('vf-ic_fluent_zoom_in_24_filled', 'Acercar', function() { 
                zoomLevel = Math.min(3.0, zoomLevel + 0.2); 
                render(); 
            }, false, true).appendTo($zoomGroup);

            render();

            // Limpieza estricta al cerrar el visor
            setRender(function() {
                try {
                    if (canvas) {
                        const ctx = canvas.getContext('2d');
                        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                    }
                } catch(e) {}
                
                if ($toolbar) $toolbar.empty().removeAttr("style");
                if ($container) $container.empty();
            });
        });
    }
});