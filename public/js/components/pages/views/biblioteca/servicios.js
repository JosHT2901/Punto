async function RenderizarVistaPrevia(doc, $container) {
    if (!doc || !$container || !$container.length) return;

    // Función auxiliar para convertir Base64 a ArrayBuffer de forma segura
    const base64ToArrayBuffer = (base64) => {
        try {
            const cleanBase64 = base64.includes(',') ? base64.split(',')[1] : base64;
            const binaryString = window.atob(cleanBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
            return bytes.buffer;
        } catch (e) {
            return new ArrayBuffer(0);
        }
    };

    // Respaldo visual estilizado (tarjeta con diseño de documento en lugar de un simple icono)
    const mostrarTarjetaEstilizada = (tipoTexto, colorFondo, colorTexto, iconoClase) => {
        $container.html(`
            <div style="width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; background: ${colorFondo}; color: ${colorTexto}; padding: 10px; text-align: center; border-radius: 6px;">
                <i class="icon fs-8 ${iconoClase}" style="margin-bottom: 6px; font-size: 26px;"></i>
                <span style="font-size: 8px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 100%; display: block;" title="${doc.nombre_original}">${doc.nombre_original}</span>
                <span style="font-size: 7px; opacity: 0.8; margin-top: 2px;">${tipoTexto}</span>
            </div>
        `);
    };
    if (!doc.blob) {
        mostrarTarjetaEstilizada('Archivo', '#f8fafc', '#64748b', 'vf-ic_fluent_document_24_filled');
        return;
    }

    const mime = (doc.tipo_mime || '').toLowerCase().trim();
    const ext = (doc.extension || '').toLowerCase().trim();

    try {
        // 1. Imágenes
        if (mime.startsWith('image/') || ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp'].includes(ext)) {
            $container.html(`<img src="${doc.blob}" style="width:100%; height:100%; object-fit:cover; object-position:top; display:block;">`);
            return;
        }

        // 2. Videos
        if (mime.startsWith('video/') || ['mp4', 'webm', 'ogg', 'mov'].includes(ext)) {
            $container.html(`
                <video style="width:100%; height:100%; object-fit:cover;" muted loop playsinline preload="metadata">
                    <source src="${doc.blob}" type="${mime || 'video/mp4'}">
                </video>
            `);
            return;
        }

        // 3. PDF (Renderizado prioritario por Canvas si pdfjsLib está disponible, o tarjeta de vista previa formal como imagen simulada)
        if (mime === 'application/pdf' || ext === 'pdf') {
            if (typeof pdfjsLib !== 'undefined') {
                try {
                    const buffer = base64ToArrayBuffer(doc.blob);
                    const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buffer) });
                    const pdf = await loadingTask.promise;
                    const page = await pdf.getPage(1);
                    
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    const viewport = page.getViewport({ scale: 1.2 });
                    
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;
                    
                    await page.render({ canvasContext: context, viewport: viewport }).promise;
                    
                    $container.html(`<img src="${canvas.toDataURL('image/jpeg', 0.95)}" style="width:100%; height:100%; object-fit:cover; object-position:top; display:block;">`);
                    return;
                } catch (pdfErr) {
                    console.warn("PDF.js falló:", pdfErr);
                }
            }
            
            // Si no hay PDF.js, mostramos una tarjeta visual elegante simulando una vista previa de documento PDF
            mostrarTarjetaEstilizada('Documento PDF', '#fef2f2', '#991b1b', 'vf-ic_fluent_document_pdf_24_filled');
            return;
        }

        // 4. Hojas de Cálculo (Excel / CSV)
        if (mime.includes('spreadsheet') || ['xlsx', 'xls', 'csv', 'ods'].includes(ext)) {
            if (typeof XLSX !== 'undefined') {
                try {
                    const buffer = base64ToArrayBuffer(doc.blob);
                    const workbook = XLSX.read(buffer, { type: 'array' });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    if (worksheet['!ref']) {
                        const range = XLSX.utils.decode_range(worksheet['!ref']);
                        range.e.r = Math.min(range.s.r + 11, range.e.r); 
                        range.e.c = Math.min(range.s.c + 3, range.e.c);  
                        worksheet['!ref'] = XLSX.utils.encode_range(range);
                    }

                    const html = XLSX.utils.sheet_to_html(worksheet, { header: '', footer: '' });

                    $container.html(`
                        <div style="width:100%; height:100%; overflow:hidden; background:#fff; padding:5px; font-family:sans-serif;">
                            <style>
                                .preview-table { border-collapse: collapse; width: 100%; font-size: 8px; }
                                .preview-table td { border: 1px solid #e2e8f0; padding: 2px 4px; white-space: nowrap; overflow: hidden; max-width: 50px; }
                                .preview-table tr:first-child { background: #f1f5f9; font-weight: bold; }
                            </style>
                            <div style="width:100%; height:100%; overflow:hidden;">${html.replace('<table', '<table class="preview-table"')}</div>
                        </div>
                    `);
                    return;
                } catch (xlsxErr) {
                    console.warn("SheetJS falló:", xlsxErr);
                }
            }
            
            // Tarjeta elegante de Excel si no hay librería
            mostrarTarjetaEstilizada('Hoja de cálculo', '#f0fdf4', '#166534', 'vf-ic_fluent_document_table_24_filled');
            return;
        }

        // 5. Word (DOCX)
        if (mime.includes('wordprocessingml') || ext === 'docx') {
            if (typeof mammoth !== 'undefined') {
                try {
                    const buffer = base64ToArrayBuffer(doc.blob);
                    const result = await mammoth.convertToHtml({ arrayBuffer: buffer });
                    
                    $container.html(`
                        <div style="font-size:9px; height:100%; overflow:hidden; padding:8px; background:#fff; color:#334155; line-height:1.2;">
                            ${result.value}
                        </div>
                    `);
                    return;
                } catch (wordErr) {
                    console.warn("Mammoth falló:", wordErr);
                }
            }
            
            // Tarjeta elegante de Word
            mostrarTarjetaEstilizada('Documento Word', '#eff6ff', '#1e40af', 'vf-ic_fluent_document_text_24_filled');
            return;
        }

        // 6. XML
        if (mime === 'application/xml' || mime === 'text/xml' || ext === 'xml') {
            try {
                const xmlString = window.atob(doc.blob.split(',')[1]);
                const xmlEscapado = xmlString.replace(/</g, '&lt;').replace(/>/g, '&gt;');
                
                $container.html(`
                    <div style="width:100%; height:100%; overflow:hidden; background:#1e293b; color:#38bdf8; padding:6px; font-family:monospace; font-size:7px; line-height:1.2;">
                        <pre style="margin:0; white-space:pre-wrap; word-break:break-all; overflow:hidden; height:100%;">${xmlEscapado}</pre>
                    </div>
                `);
                return;
            } catch (xmlErr) {
                console.warn("XML error:", xmlErr);
            }
        }

        // Fallback final
        mostrarTarjetaEstilizada('Archivo', '#f8fafc', '#64748b', 'vf-ic_fluent_document_24_filled');

    } catch (error) {
        console.error("Error general en RenderizarVistaPrevia:", error);
        mostrarTarjetaEstilizada('Archivo', '#f8fafc', '#64748b', 'vf-ic_fluent_document_24_filled');
    }
}