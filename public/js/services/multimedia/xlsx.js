window.FileViewer.registerModule({
    name: 'ExcelModule',
    shouldHandle: function(file) {
        return file.type.includes('sheet') || /\.(xlsx|xls|csv)$/i.test(file.name);
    },
    
    init: function(file, $container, $toolbar,$headerActions, setRender) {
        // Estilo del contenedor principal con espacio lateral para los botones de navegación
        $container.off().empty().css({ 
            'padding': '30px 60px', 
            'overflow': 'auto', 
            'height': '100%', 
            'width': '100%',
            'box-sizing': 'border-box',
            'background': '#0f172a'
        });
        
        $toolbar.empty().css({ 
            'display': 'flex', 
            'gap': '8px', 
            'padding': '12px 24px', 
            'flex-wrap': 'wrap',
            'justify-content': 'center',
            'background': '#0f172a',
            'border-top': '1px solid rgba(255, 255, 255, 0.1)'
        });

        // Indicador de carga inicial
        $container.html(`
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: #94a3b8;">
                <i class="vf-ic_fluent_document_table_24_regular fs-9 animate-spin"></i>
                <span class="fs-3 fw-600">Cargando hoja de cálculo...</span>
            </div>
        `);

        // Carga y procesamiento del archivo mediante SheetJS (XLSX)
        fetch(file.url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => {
                const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });

                const renderSheet = function(sheetName) {
                    const html = XLSX.utils.sheet_to_html(workbook.Sheets[sheetName]);
                    $container.empty();
                    
                    // Tarjeta contenedora de la tabla con diseño elegante
                    const $card =$('<div>', {
                        style: 'background: white; border-radius: 10px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); overflow: hidden; border: 1px solid #cbd5e1; margin: 0 auto; max-width: 1200px; width: 100%;'
                    });
                    
                    const $scrollWrapper =$('<div>', { style: 'overflow-x: auto; padding: 20px;' }).html(html);
                    $card.append($scrollWrapper);
                    $container.append($card);

                    const $table = $scrollWrapper.find('table');$table.css({
                        'width': '100%',
                        'border-collapse': 'collapse',
                        'font-family': 'inherit',
                        'font-size': '13px',
                        'color': '#334155'
                    });

                    // Estilo de celdas
                    $table.find('td, th').css({ 
                        'border-bottom': '1px solid #e2e8f0', 
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

                // Generación de pestañas para múltiples hojas
                workbook.SheetNames.forEach(function(name, index) {
                    const isActive = index === 0;
                    const $btn =$('<button>', { 
                        text: name,
                        class: 'btn btn-option border shadow-2xs rounded-8 px-3.5 py-2 fs-2 fw-600 transition-all',
                        style: isActive 
                            ? 'background: #2563eb; color: #fff; border-color: #1d4ed8;' 
                            : 'background: #ffffff; color: #475569; border-color: #cbd5e1;'
                    }).on('click', function() {
                        $toolbar.find('button').css({ 'background': '#ffffff', 'color': '#475569', 'border-color': '#cbd5e1' });
                        $(this).css({ 'background': '#2563eb', 'color': '#fff', 'border-color': '#1d4ed8' });
                        renderSheet(name);
                    });

                    $toolbar.append($btn);
                });

                // Renderizar la primera hoja por defecto
                if (workbook.SheetNames.length > 0) {
                    renderSheet(workbook.SheetNames[0]);
                }
            })
            .catch(function(err) {
                console.error("Error al procesar Excel:", err);
                if (typeof Contenedor_No_Resultados_Con_Boton === 'function') {
                    Contenedor_No_Resultados_Con_Boton("Error al procesar el archivo Excel", $container, "Reintentar", "btn-danger");
                } else {
                    $container.html('<div class="text-white text-center p-5">Error al cargar la hoja de cálculo.</div>');
                }
            });

        // Limpieza automática al cerrar el visor
        setRender(function() {
            $container.empty();$toolbar.empty();
        });
    }
});