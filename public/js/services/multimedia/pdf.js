window.FileViewer.registerModule({
    name: 'PDFModule',
    shouldHandle: function(file) {
        return file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf');
    },
    init: function(file, $container,$toolbar, $headerActions, setRender) { // 1. Estilo del contenedor principal
    $container.css({ 
            'display': 'flex', 'flex-direction': 'column', 'align-items': 'center',
            'padding': '30px', 'overflow': 'auto', 'width': '100%', 'height': '100%', 'background': '#0f172a'
        });
        
        $container.html(`<canvas id="pdf-canvas" style="box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3); background: white; margin: 0 auto; border-radius: 8px; width: 90%; max-width: 900px; display: block;"></canvas>`);
    
        // Carga asíncrona manejada de manera nativa sin bloquear la sintaxis del objeto
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

            // Botones de la cabecera (Descargar e Imprimir)
            const createHeaderBtn = function(iconClass, title, action) {
                return $('<button>', { title: title, html: `<i class="${iconClass}"></i>`, class: 'btn btn-option border border-slate-200/80 shadow-2xs rounded-8 px-2.5 py-1.5 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1 fs-2' })
                .on('click', action)
                .appendTo($headerActions);
            };

            createHeaderBtn('vf-ic_fluent_arrow_download_24_regular', 'Descargar', function() { window.open(file.url, '_blank'); });
            createHeaderBtn('vf-ic_fluent_print_24_regular', 'Imprimir', function() { window.print(); });

            // 2. Estilo y limpieza de la Barra de herramientas inferior
            $toolbar.empty().css({ 
                'display': 'flex', 'justify-content': 'center', 'align-items': 'center', 
                'gap': '15px', 'padding': '12px 24px', 
                'border-top': '1px solid rgba(255, 255, 255, 0.1)', 'background': '#0f172a'
            });
            
            const createBtn = function(iconClass, title, action) {
                return $('<button>', { title: title, html: `<i class="${iconClass}"></i>`, class: 'btn btn-option border border-slate-200/80 shadow-2xs rounded-8 px-3 py-2 text-slate-700 bg-white hover:bg-slate-50 flex items-center gap-1 fs-2 fw-600' })
                .on('click', action);
            };
        
            // 3. Grupo A: Navegación de páginas
            const $navGroup =$('<div>', { class: 'nav-controls' })
                .css({ 'display': 'flex', 'align-items': 'center', 'gap': '10px', 'padding-right': '15px', 'border-right': '1px solid rgba(255, 255, 255, 0.1)' })
                .appendTo($toolbar);
        
            createBtn('vf-ic_fluent_chevron_left_24_regular', 'Página Anterior', function() { 
                if(pageNum > 1) { pageNum--; render(); } 
            }).appendTo($navGroup);
            
            // Input de número de página
            $('<div>', { class: 'input-wrapper' })
                .css({ 'display': 'flex', 'align-items': 'center', 'gap': '6px', 'color': '#f8fafc' })
                .append(
                    $('<input>', { id: 'page-input', type: 'number', value: pageNum, class: 'border rounded-6 p-1 text-center font-semibold text-slate-900 bg-white' })
                    .css({ 'width': '55px', 'border': '1px solid #cbd5e1', 'outline': 'none' })
                    .on('keydown', function(e) { 
                        if (e.key === 'Enter') { 
                            let v = parseInt(e.target.value); 
                            if (v >= 1 && v <= pdf.numPages) { pageNum = v; render(); } 
                        } 
                    })
                )
                .append($('<span>', { class: 'fw-600 text-slate-300 fs-2' }).html('/ <span id="total-pages"></span>'))
                .appendTo($navGroup);
        
            createBtn('vf-ic_fluent_chevron_right_24_regular', 'Página Siguiente', function() { 
                if(pageNum < pdf.numPages) { pageNum++; render(); } 
            }).appendTo($navGroup);
        
            // Grupo B: Controles de Zoom
            const $zoomGroup =$('<div>', { class: 'zoom-controls' })
                .css({ 'display': 'flex', 'align-items': 'center', 'gap': '8px' })
                .appendTo($toolbar);
        
            createBtn('vf-ic_fluent_zoom_out_24_regular', 'Alejar Zoom', function() { 
                zoomLevel = Math.max(0.5, zoomLevel - 0.2); 
                render(); 
            }).appendTo($zoomGroup);

            createBtn('vf-ic_fluent_arrow_clockwise_24_regular', 'Restaurar Zoom', function() { 
                zoomLevel = 1.0; 
                render(); 
            }).appendTo($zoomGroup);

            createBtn('vf-ic_fluent_zoom_in_24_regular', 'Acercar Zoom', function() { 
                zoomLevel = Math.min(3.0, zoomLevel + 0.2); 
                render(); 
            }).appendTo($zoomGroup);$container.data('render', render);
            render();

            // Limpieza automática al cerrar el visor
            setRender(function() {
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                }
            });
        });
    }
});