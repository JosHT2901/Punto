class TableService {
    /**
     * Renderiza una tabla minimalista, moderna, responsiva y con soporte completo para inputs.
     * @param {string} contenedorId ID del elemento contenedor (sin el #).
     * @param {Array<Object>} headers Definición de las columnas [{ field: 'key', label: 'Título', align: 'left|center|right', width: 'auto' }].
     * @param {Array<Object>} data Array de objetos o estados actuales de las filas.
     * @param {Object} [options] Opciones adicionales (emptyMessage, tableClass, responsiveClass).
     */
    static render(contenedorId, headers, data, options = {}) {
        const $container =$(`#${contenedorId}`);
        if (!$container.length) {
            console.error(`TableService: Contenedor #${contenedorId} no encontrado.`);
            return;
        }

        // Inyectar estilos minimalistas con soporte para scroll horizontal responsivo
        if (!$('#table-service-custom-styles').length) {
            $('head').append(`
                <style id="table-service-custom-styles">
                    .ts-wrapper {
                        border-radius: 8px;
                        border: 1px solid #edf2f7;
                        background: #ffffff;
                        overflow-x: auto; /* Scroll horizontal automático si la pantalla es pequeña */
                        -webkit-overflow-scrolling: touch; /* Suavidad en dispositivos móviles */
                        margin-bottom: 1rem;
                        width: 100%;
                    }
                    .ts-table {
                        width: 100%;
                        min-width: 600px; /* Ancho mínimo para forzar el scroll limpio en pantallas muy chicas */
                        margin-bottom: 0;
                        border-collapse: collapse;
                    }
                    .ts-table th {
                        background: #ffffff !important;
                        color: #64748b !important;
                        font-weight: 500;
                        font-size: 0.75rem;
                        letter-spacing: 0.03em;
                        text-transform: uppercase;
                        padding: 12px 16px;
                        border-bottom: 1px solid #e2e8f0;
                        white-space: nowrap;
                    }
                    .ts-table td {
                        padding: 12px 16px;
                        color: #334155;
                        font-size: 0.875rem;
                        border-bottom: 1px solid #f8fafc;
                        vertical-align: middle;
                        transition: background-color 0.15s ease;
                    }
                    .ts-table tbody tr:last-child td {
                        border-bottom: none;
                    }
                    .ts-table tbody tr {
                        transition: background-color 0.15s ease;
                    }
                    .ts-table tbody tr:hover {
                        background-color: #fbfcfe;
                    }
                    /* Inputs limpios y sutiles integrados al estilo minimalista */
                    .ts-table .form-control, .ts-table .form-select {
                        font-size: 0.875rem;
                        border-color: #e2e8f0;
                        border-radius: 6px;
                        padding: 5px 10px;
                        background-color: #ffffff;
                        transition: all 0.15s ease;
                    }
                    .ts-table .form-control:focus, .ts-table .form-select:focus {
                        border-color: #94a3b8;
                        box-shadow: 0 0 0 2px rgba(148, 163, 184, 0.15);
                        background-color: #fff;
                    }
                </style>
            `);
        }

        const config = $.extend({
            emptyMessage: 'No se encontraron registros disponibles.',
            tableClass: 'ts-table',
            responsiveClass: 'table-responsive ts-wrapper custom-scroll'
        }, options);

        if (!Array.isArray(data) || data.length === 0) {
            $container.html(`
                <div class="p-4 text-center bg-white border border-slate-100 rounded-8" style="color: #94a3b8;">
                    <i class="ph ph-info fs-5 mb-1 d-block text-slate-400"></i>
                    <span class="fw-medium fs-3">${config.emptyMessage}</span>
                </div>
            `);
            return;
        }

        // Construir Cabeceras (Thead)
        let thHtml = headers.map(h => {
            const alignClass = h.align ? `text-${h.align}` : 'text-start';
            const widthStyle = h.width ? `style="width: ${h.width};"` : '';
            return `<th class="${alignClass}" ${widthStyle}>${h.label}</th>`;
        }).join('');

        // Construir Cuerpo (Tbody)
        let trHtml = data.map((row, rowIndex) => {
            let tdHtml = headers.map(h => {
                const alignClass = h.align ? `text-${h.align}` : 'text-start';
                
                const cellValue = typeof h.render === 'function' 
                    ? h.render(row[h.field], row, rowIndex) 
                    : (row[h.field] !== undefined && row[h.field] !== null ? row[h.field] : '');
                
                return `<td class="${alignClass}">${cellValue}</td>`;
            }).join('');

            return `<tr data-index="${rowIndex}">${tdHtml}</tr>`;
        }).join('');

        // Ensamblar la tabla final
        const tableHtml = `
            <div class="${config.responsiveClass}">
                <table class="table ${config.tableClass}">
                    <thead>
                        <tr>${thHtml}</tr>
                    </thead>
                    <tbody>
                        ${trHtml}
                    </tbody>
                </table>
            </div>
        `;

        $container.html(tableHtml);
    }
}