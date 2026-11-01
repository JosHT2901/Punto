window.FileViewer.registerModule({
    name: 'ExcelModule',
    shouldHandle: function(file) {
        return (file.type && (file.type.includes('sheet') || file.type.includes('csv') || file.type.includes('excel'))) || /\.(xlsx|xls|csv)$/i.test(file.name);
    },
    
    init: function(file, $container, $toolbar, $headerActions, setRender) {
        
        // 1. Estilos unificados Google Material Design para Excel / CSV
        if ($('#excel-module-styles').length === 0) {
            $('head').append(`
                <style id="excel-module-styles">
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
        $container.off().empty().css({ 
            'padding': '30px 60px', 
            'overflow': 'auto', 
            'height': '100%', 
            'width': '100%',
            'box-sizing': 'border-box',
            'background': '#0f172a',
            'display': 'flex',
            'flex-direction': 'column',
            'align-items': 'center'
        });
        
        // Toolbar inferior con estilo Google
        $toolbar.empty().css({ 
            'display': 'flex', 
            'gap': '8px', 
            'padding': '14px 28px', 
            'flex-wrap': 'wrap',
            'justify-content': 'center',
            'background': '#202124',
            'border-top': '1px solid #3c4043',
            'width': '100%',
            'box-sizing': 'border-box'
        });

        // Indicador de carga inicial
        $container.html(`
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: #94a3b8;">
                <i class="icon vf-ic_fluent_document_table_24_regular fs-9 animate-spin" style="color: #8ab4f8;"></i>
                <span class="fs-3 fw-600" style="color: #e8eaed;">Cargando documento...</span>
            </div>
        `);

        // Botones de la cabecera (Descargar e Imprimir) con estilo Google
        const createHeaderBtn = function(iconClass, title, action) {
            return $('<button>', { title: title, html: `<i class="icon fs-6 ${iconClass}"></i>`, class: 'btn-google btn-google-icon' })
                .on('click', action)
                .appendTo($headerActions);
        };

        // Descarga segura mediante enlace virtual temporal (evita about:blank)
        createHeaderBtn('vf-ic_fluent_arrow_download_24_filled', 'Descargar', function() {
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.name || 'documento.xlsx';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        createHeaderBtn('vf-ic_fluent_print_24_regular', 'Imprimir', function() { window.print(); });

        // Carga y procesamiento del archivo mediante SheetJS (XLSX, XLS, CSV)
        fetch(file.url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                // Soporte robusto para lectura de CSV con codificación UTF-8 y autodetect de celdas
                const workbook = XLSX.read(new Uint8Array(arrayBuffer), { 
                    type: 'array', 
                    cellDates: true, 
                    cellNF: true, 
                    cellText: false 
                });

                const renderSheet = function(sheetName) {
                    const html = XLSX.utils.sheet_to_html(workbook.Sheets[sheetName], { header: "" });
                    $container.empty();
                    
                    // Tarjeta contenedora de la tabla con diseño elegante
                    const $card = $('<div>', {
                        style: 'background: white; border-radius: 10px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); overflow: hidden; border: 1px solid #cbd5e1; margin: 0 auto; max-width: 1200px; width: 100%;'
                    });
                    
                    const $scrollWrapper = $('<div>', { style: 'overflow-x: auto; padding: 20px;' }).html(html);
                    $card.append($scrollWrapper);
                    $container.append($card);

                    const $table = $scrollWrapper.find('table');
                    $table.css({
                        'width': '100%',
                        'border-collapse': 'collapse',
                        'font-family': 'inherit',
                        'font-size': '13px',
                        'color': '#334155'
                    });

                    // Estilo de celdas
                    $table.find('td, th').css({ 
                        'border-bottom': '1px solid #e2e8f0', 
                        'border-right': '1px solid #f1f5f9',
                        'padding': '12px 16px',
                        'white-space': 'nowrap'
                    });

                    // Encabezado de la tabla corporativo
                    $table.find('tr:first-child').css({
                        'background-color': '#f8fafc',
                        'color': '#0f172a',
                        'font-weight': '700',
                        'border-bottom': '2px solid #cbd5e1'
                    });
                };

                // Generación de pestañas para múltiples hojas (si el formato las soporta, ej. XLSX)
                workbook.SheetNames.forEach(function(name, index) {
                    const isActive = index === 0;
                    const $btn = $('<button>', { 
                        text: name,
                        class: isActive ? 'btn-google btn-google-primary' : 'btn-google'
                    }).on('click', function() {
                        $toolbar.find('button').removeClass('btn-google-primary').addClass('btn-google');
                        $(this).removeClass('btn-google').addClass('btn-google-primary');
                        renderSheet(name);
                    });

                    $toolbar.append($btn);
                });

                // Si es un CSV o solo tiene 1 hoja, ocultamos el toolbar si no es necesario o mostramos el nombre
                if (workbook.SheetNames.length <= 1) {
                    $toolbar.hide();
                }

                // Renderizar la primera hoja por defecto
                if (workbook.SheetNames.length > 0) {
                    renderSheet(workbook.SheetNames[0]);
                }
            })
            .catch(function(err) {
                console.error("Error al procesar Excel/CSV:", err);
                $container.html(`
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; gap: 10px; color: #ef4444;">
                        <i class="icon vf-ic_fluent_warning_24_filled fs-8"></i>
                        <span class="fs-3 fw-700">Error al procesar el archivo</span>
                        <span class="fs-1 text-slate-400">No se pudo leer la estructura de la hoja de cálculo o CSV.</span>
                    </div>
                `);
            });

        // Limpieza automática al cerrar el visor
        setRender(function() {
            try {
                $container.empty();
                $toolbar.empty().removeAttr("style");
            } catch(e) {}
        });
    }
});