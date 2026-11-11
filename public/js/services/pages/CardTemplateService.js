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
            /* Soporte visual para la tarjeta de la sucursal actual */
            .card-universal.card-sucursal-actual {
                border-color: #bfdbfe;
                background-color: #f8fafc;
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
            console.log(element)
            const recordId = element[idKey] || '';
            const esActual = element.es_actual == 1;
            
            // Título principal con respaldo automático
            let titulo = element[tituloKey];
            if (!titulo) {
                const nom = element.Nombre || '';
                const pat = element.Apellido_Paterno || '';
                const mat = element.Apellido_Materno || '';
                titulo = `${nom} ${pat} ${mat}`.trim() || 'Sin título';
            }

            const badgeText = badgeKey && element[badgeKey] !== undefined && element[badgeKey] !== null ? element[badgeKey] : '';

            // 1. Renderizado del cuerpo detallado usando exactamente las columnas provistas
            let htmlDetalleCampos = '';
            if (window.HtmlDetailService && typeof window.HtmlDetailService.renderizarCampos === 'function') {
                htmlDetalleCampos = window.HtmlDetailService.renderizarCampos(element, configuracionCampos);
            } else {
                const inner = configuracionCampos.map(c => {
                    let val = element[c.columna] ?? element[c.columna?.replace('_Fmt', '')] ?? '---';
                    
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

            // 3. Pastilla / Badge superior + Etiqueta de "Actual" si aplica
            const htmlBadge = badgeText ? `
                <span class="card-badge-pill" title="${badgeText}">
                    ${badgeText}
                </span>
            ` : '';

            const htmlBadgeActual = esActual ? `
                <span class="rounded-6 bg-brand-blue text-brand-dark px-3 py-1 fs-1 fw-600 ml-2" style="background-color: #eff6ff; color: #03618d; border: 1px solid #bfdbfe;">Actual</span>
            ` : '';

            // 🌟 4. Input Checkbox con parada de propagación para evitar bloqueos por el contenedor clickeable
            const htmlSeleccion = `
                <div class="flex items-center justify-center pr-1" onclick="event.stopPropagation();">
                    <input type="checkbox" class="checkbox-round check-item" data-id="${recordId}" title="Seleccionar sucursal">
                </div>
            `;

            // 5. Botones adicionales en cabecera con validación de permisos individual por botón
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
                        <button type="button" class="btn btn-option w-30 h-30 rounded-md flex-center position-relative ${btn.class || ''}" onclick="event.stopPropagation(); ${fnClick}" title="${btn.title || ''}">
                            <i class="icon fs-5 ${btn.icon}"></i>
                        </button>
                    `;
                }).join('');

            // Botón de opciones unificado (3 puntos) con validación de permiso global
            if (permisoOpciones && callbackOpciones) {
                const tienePermisoOpciones = permisoOpciones === true || 
                    (typeof permisoOpciones === 'string' && window.PermisosService?.tienePermiso(permisoOpciones));

                if (tienePermisoOpciones && !esActual) {
                    const onclickFn = typeof callbackOpciones === 'function' 
                        ? callbackOpciones(element) 
                        : callbackOpciones.replace(/\${ID}/g, recordId);

                    htmlBotonesCabecera += `
                        <button type="button" class="btn btn-option w-30 h-30 rounded-md flex-center position-relative" onclick="event.stopPropagation(); ${onclickFn}" title="Opciones">
                            <i class="icon fs-5 vf-ic_fluent_more_vertical_24_filled"></i>
                        </button>
                    `;
                }
            }

            // 6. Barra de acciones inferior (Footer) con soporte para permisos opcionales
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
                            <button type="button" class="${btn.class || 'btn btn-light border border-slate-200 text-slate-700'} flex items-center gap-2 px-3 py-1.5 fs-2 fw-600 rounded-md transition-all shadow-xs" onclick="event.stopPropagation(); ${fnClick}">
                                ${btn.icon ? `<i class="icon fs-4 ${btn.icon}"></i>` : ''}
                                <span>${btn.label || ''}</span>
                            </button>
                        `;
                    }).join('');

                if (btnsFooterHtml.trim() !== '') {
                    htmlFooter = `
                        <div class="card-footer-bar" onclick="event.stopPropagation();">
                            ${btnsFooterHtml}
                        </div>
                    `;
                }
            }

            // 7. Estructura HTML final estilizada
            return `
            <div class="card card-universal my-3 ${esActual ? 'card-sucursal-actual' : ''}" data-id="${recordId}">
                <!-- CABECERA -->
                <div class="card-header-main js-header-toggle">
                    ${htmlSeleccion}
                    
                    ${htmlImagen}
                    ${htmlBadge}

                    <div class="flex-1 flex items-center justify-between min-w-0 gap-3">
                        <div class="flex items-center gap-2 min-w-0">
                            <span class="fw-700 fs-3 text-slate-800 text-truncate">
                                ${titulo}
                            </span>
                            ${htmlBadgeActual}
                        </div>

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