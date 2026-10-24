/* =============================================
    SERVICIO: CARD TEMPLATE SERVICE (Estilo Moderno & Elegante)
============================================= */
window.CardTemplateService = (() => {

    // Inyectamos estilos modernos si no existen en el documento
    const inyectarEstilosCards = () => {
        if ($("#card-template-styles").length) return;
        const css = `
            .card-universal {
                background: #ffffff;
                border: 1px solid #e5e7eb;
                border-radius: 10px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.02);
                margin-bottom: 12px;
                transition: all 0.2s ease-in-out;
                overflow: hidden;
            }
            .card-universal:hover {
                box-shadow: 0 6px 16px rgba(0, 0, 0, 0.06);
                border-color: #cbd5e1;
            }
            .card-header-main {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 16px;
                background: #f8fafc;
                border-bottom: 1px solid #f1f5f9;
                min-height: 54px;
                cursor: pointer;
                user-select: none;
                transition: background 0.15s ease;
            }
            .card-header-main:hover {
                background: #f1f5f9;
            }
            .card-badge-pill {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                height: 28px;
                width: 130px; /* Tamaño fijo uniforme para todas las tarjetas */
                min-width: 130px;
                max-width: 130px;
                padding: 0 10px;
                background: #eff6ff;
                color: #03618d;
                border: 1px solid #bfdbfe;
                border-radius: 6px;
                font-size: 12px;
                font-weight: 600;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            /* Ocultar la pastilla en pantallas menores a 768px (móviles y tablets pequeñas) */
            @media (max-width: 667.98px) {
                .card-badge-pill {
                    display: none !important;
                }
            }
            .card-footer-bar {
                display: flex;
                align-items: center;
                justify-content: flex-end;
                gap: 8px;
                padding: 10px 16px;
                background: #f8fafc;
                border-top: 1px solid #f1f5f9;
            }
        `;
        $('<style>').attr("id", "card-template-styles").html(css).appendTo('head');
    };

    const render = (contenedor, datos, options = {}) => {
        if (!contenedor) return;
        const $target = $(contenedor);
        if ($target.length === 0) return;

        inyectarEstilosCards();
        $target.empty();

        const listaElementos = Array.isArray(datos) ? datos : (datos ? [datos] : []);
        if (listaElementos.length === 0) return;

        const {
            idKey = 'ID',
            tituloKey = 'nombre_completo',
            badgeKey = null,                    
            imagenKey = null,                    
            imagenDefault = '../..//imges/default.png',
            configuracionCampos = [],            
            permisoOpciones = false,             
            callbackOpciones = '',               
            botonesCabecera = [],                
            botonesFooter = []                   
        } = options;

        const htmlTarjetas = listaElementos.map(element => {
            const recordId = element[idKey] || '';
            
            // Título principal con respaldo automático
            let titulo = element[tituloKey];
            if (!titulo) {
                const nom = element.Nombre || '';
                const pat = element.Apellido_Paterno || '';
                const mat = element.Apellido_Materno || '';
                titulo = `${nom} ${pat} ${mat}`.trim() || 'Sin título';
            }

            const badgeText = badgeKey && element[badgeKey] !== undefined && element[badgeKey] !== null ? element[badgeKey] : '';

            // 1. Renderizado del cuerpo detallado usando HtmlDetailService
            let htmlDetalleCampos = '';
            if (window.HtmlDetailService && typeof window.HtmlDetailService.renderizarCampos === 'function') {
                htmlDetalleCampos = window.HtmlDetailService.renderizarCampos(element, configuracionCampos);
            } else {
                const inner = configuracionCampos.map(c => {
                    let val = element[c.columna] ?? element[c.columna?.replace('_Fmt', '')] ?? '---';
                    if (c.columna === 'Habilitado' || c.columna === 'estado') {
                        val = val == 1 ? '<span class="text-success fw-700">● ACTIVO</span>' : '<span class="text-danger fw-700">● INACTIVO</span>';
                    }
                    return `
                        <div class="flex flex-column gap-1 p-2 border-bottom-light" style="flex: 1 1 200px;">
                            <label class="fs-1 fw-700 text-uppercase letter-spacing-1 text-slate-400">${c.label}</label>
                            <div class="fs-2 fw-600 text-slate-700 word-break-all">${val}</div>
                        </div>`;
                }).join('');
                htmlDetalleCampos = `<div class="flex flex-wrap gap-2 w-p-100">${inner}</div>`;
            }

            // 2. Imagen / Miniatura opcional con marco estilizado
            const htmlImagen = imagenKey ? `
                <img src="${element[imagenKey] || imagenDefault}" alt="Img" class="w-35 h-35 rounded-md object-fit-cover border border-slate-200 shadow-xs" onerror="this.src='${imagenDefault}'">
            ` : '';

            // 3. Pastilla / Badge superior (con título tooltip para ver texto largo si se llega a recortar)
            const htmlBadge = badgeText ? `
                <span class="card-badge-pill" title="${badgeText}">
                    ${badgeText}
                </span>
            ` : '';

            // 4. Botones adicionales en cabecera con validación de permisos individual por botón
            let htmlBotonesCabecera = botonesCabecera
                .filter(btn => {
                    if (!btn.permiso) return true;
                    return window.PermisosService && typeof window.PermisosService.tienePermiso === 'function' 
                        ? PermisosService.tienePermiso(btn.permiso) 
                        : true;
                })
                .map(btn => {
                    const fnClick = typeof btn.onclick === 'function' 
                        ? btn.onclick(element) 
                        : (btn.onclick || '').replace(/\${ID}/g, recordId);

                    return `
                        <button type="button" class="btn btn-option w-30 h-30 rounded-md flex-center position-relative ${btn.class || ''}" onclick="${fnClick}" title="${btn.title || ''}">
                            <i class="icon fs-5 ${btn.icon}"></i>
                        </button>
                    `;
                }).join('');

            // Botón de opciones unificado (3 puntos) con validación de permiso global
            if (permisoOpciones && callbackOpciones) {
                const tienePermisoOpciones = permisoOpciones === true || 
                    (typeof permisoOpciones === 'string' && window.PermisosService?.tienePermiso(permisoOpciones));

                if (tienePermisoOpciones) {
                    const onclickFn = typeof callbackOpciones === 'function' 
                        ? callbackOpciones(element) 
                        : callbackOpciones.replace(/\${ID}/g, recordId);

                    htmlBotonesCabecera += `
                        <button type="button" class="btn btn-option w-30 h-30 rounded-md flex-center position-relative" onclick="${onclickFn}" title="Opciones">
                            <i class="icon fs-5 vf-ic_fluent_more_vertical_24_filled"></i>
                        </button>
                    `;
                }
            }

            // 5. Barra de acciones inferior (Footer) con soporte para permisos opcionales
            let htmlFooter = '';
            if (Array.isArray(botonesFooter) && botonesFooter.length > 0) {
                const btnsFooterHtml = botonesFooter
                    .filter(btn => {
                        if (!btn.permiso) return true;
                        return window.PermisosService && typeof window.PermisosService.tienePermiso === 'function' 
                            ? PermisosService.tienePermiso(btn.permiso) 
                            : true;
                    })
                    .map(btn => {
                        const fnClick = typeof btn.onclick === 'function' 
                            ? btn.onclick(element) 
                            : (btn.onclick || '').replace(/\${ID}/g, recordId);

                        return `
                            <button type="button" class="${btn.class || 'btn btn-light border border-slate-200 text-slate-700'} flex items-center gap-2 px-3 py-1.5 fs-2 fw-600 rounded-md transition-all shadow-xs" onclick="${fnClick}">
                                ${btn.icon ? `<i class="icon fs-4 ${btn.icon}"></i>` : ''}
                                <span>${btn.label || ''}</span>
                            </button>
                        `;
                    }).join('');

                if (btnsFooterHtml.trim() !== '') {
                    htmlFooter = `
                        <div class="card-footer-bar">
                            ${btnsFooterHtml}
                        </div>
                    `;
                }
            }

            // 6. Estructura HTML final estilizada
            return `
            <div class="card card-universal my-3" data-id="${recordId}">
                <!-- CABECERA -->
                <div class="card-header-main js-header-toggle">
                    <div class="flex items-center justify-center pr-1">
                        <input type="checkbox" class="checkbox-round check-item" data-id="${recordId}">
                    </div>
                    
                    ${htmlImagen}
                    ${htmlBadge}

                    <div class="flex-1 flex items-center justify-between min-w-0 gap-3">
                        <span class="fw-700 fs-3 text-slate-800">
                            ${titulo}
                        </span>

                        <div class="flex items-center gap-1">
                            ${htmlBotonesCabecera}
                            <button type="button" class="btn btn-option w-30 h-30 rounded-md flex-center position-relative js-btn-toggle" title="Ver detalles">
                                <i class="icon fs-5 vf-ic_fluent_chevron_down_24_filled js-icon-toggle transition-transform duration-200"></i>
                            </button>
                        </div>
                    </div>
                </div>

                <!-- CUERPO DESPLEGABLE -->
                <div class="w-p-100 p-3 bg-white js-panel-toggle" style="display:none">
                    ${htmlDetalleCampos}
                </div>

                <!-- FOOTER / ACCIONES INFERIORES -->
                ${htmlFooter}
            </div>`;
        }).join('');

        $target.html(htmlTarjetas);
    };

    return { render };
})();