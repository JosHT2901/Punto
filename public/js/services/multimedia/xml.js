window.FileViewer.registerModule({
    name: 'XmlModule',
    shouldHandle: function(file) {
        return (file.type && file.type.includes('xml')) || /\.xml$/i.test(file.name);
    },
    
    init: async function(file, $container, $toolbar, $headerActions, setRender) {
        
        // 1. Estilos Material Design / Google Workspace para XML
        if ($('#xml-module-styles').length === 0) {
            $('head').append(`
                <style id="xml-module-styles">
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

                    /* Estilos para el visor de código XML */
                    .xml-code-container {
                        background: #1e1e1e;
                        color: #d4d4d4;
                        font-family: 'Courier New', Courier, monospace;
                        font-size: 13px;
                        line-height: 1.5;
                        padding: 24px;
                        border-radius: 8px;
                        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
                        overflow: auto;
                        width: 100%;
                        max-width: 900px;
                        max-height: 100%;
                        box-sizing: border-box;
                        text-align: left;
                        border: 1px solid #3c4043;
                    }
                    .xml-tag { color: #569cd6; }
                    .xml-attr-name { color: #9cdcfe; }
                    .xml-attr-value { color: #ce9178; }
                    .xml-comment { color: #6a9955; }
                </style>
            `);
        }

        // Estilo del contenedor principal
        $container.css({ 
            'display': 'flex', 'flex-direction': 'column', 'align-items': 'center', 'justify-content': 'center',
            'padding': '40px', 'overflow': 'auto', 'width': '100%', 'height': '100%', 'background': '#0f172a'
        });

        // Indicador de carga inicial
        $container.html(`
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #94a3b8;">
                <i class="icon vf-ic_fluent_code_24_regular fs-9 animate-spin" style="color: #8ab4f8;"></i>
                <span class="fs-3 fw-600" style="color: #e8eaed;">Leyendo archivo XML...</span>
            </div>
        `);

        // Botones de la cabecera (Descargar e Imprimir) con estilo Google
        const createHeaderBtn = function(iconClass, title, action) {
            return $('<button>', { title: title, html: `<i class="icon fs-6 ${iconClass}"></i>`, class: 'btn-google btn-google-icon' })
                .on('click', action)
                .appendTo($headerActions);
        };

        // Descarga segura mediante enlace temporal (evita about:blank)
        createHeaderBtn('vf-ic_fluent_arrow_download_24_filled', 'Descargar', function() {
            const link = document.createElement('a');
            link.href = file.url;
            link.download = file.name || 'documento.xml';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });

        createHeaderBtn('vf-ic_fluent_print_24_regular', 'Imprimir', function() { window.print(); });

        // Toolbar inferior al 100% con estilo Google (vacía inicialmente o con información útil)
        $toolbar.empty().css({ 
            'display': 'flex', 'justify-content': 'center', 'align-items': 'center', 
            'padding': '14px 28px', 'width': '100%', 'box-sizing': 'border-box',
            'background': '#202124', 'border-top': '1px solid #3c4043'
        });

        try {
            const response = await fetch(file.url);
            const textData = await response.text();

            // Función para escapar HTML y formatear el XML de manera limpia
            const escapeHtml = (unsafe) => {
                return unsafe
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                    .replace(/"/g, "&quot;")
                    .replace(/'/g, "&#039;");
            };

            // Intentar formatear y colorear sintaxis básica del XML de forma segura
            const formatXml = (xml) => {
                let formatted = '';
                let indent = '';
                const tab = '    ';
                xml.split(/>\s*</).forEach((node) => {
                    if (node.match(/^\/\w/)) {
                        indent = indent.substring(tab.length);
                    }
                    formatted += indent + '<' + node + '>\r\n';
                    if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('!--')) {
                        indent += tab;
                    }
                });
                return formatted.substring(1, formatted.length - 3);
            };

            const cleanText = formatXml(textData);
            
            // Inyectar el contenedor con el código XML formateado
            $container.html(`
                <pre class="xml-code-container"><code>${escapeHtml(cleanText)}</code></pre>
            `);

            // Agregar un botón de copiar contenido en la barra inferior
            const $copyBtn = $('<button>', { class: 'btn-google' })
                .html(`<i class="icon fs-6 vf-ic_fluent_copy_24_regular"></i><span>Copiar XML</span>`)
                .on('click', function() {
                    navigator.clipboard.writeText(textData).then(() => {
                        const $span = $(this).find('span');
                        const originalText = $span.text();
                        $span.text('¡Copiado!');
                        setTimeout(() => $span.text(originalText), 2000);
                    });
                })
                .appendTo($toolbar);

        } catch (err) {
            console.error("Error al procesar XML:", err);
            $container.html(`
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 300px; gap: 10px; color: #ef4444;">
                    <i class="icon vf-ic_fluent_warning_24_filled fs-8"></i>
                    <span class="fs-3 fw-700" style="color: #f87171;">Error al procesar el archivo XML</span>
                    <span class="fs-1 text-slate-400">El archivo está corrupto o no se pudo leer correctamente.</span>
                </div>
            `);
            $toolbar.hide();
        }

        // Limpieza estricta al cerrar el visor
        setRender(function() {
            try {
                $container.empty();
                $toolbar.empty().removeAttr("style");
            } catch(e) {}
        });
    }
});