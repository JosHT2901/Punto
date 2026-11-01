/**
 * Muestra un modal de conflicto reutilizable y devuelve una Promesa con la acción elegida.
 * @param {string|number} info - Nombre del elemento o cantidad de duplicados.
 * @param {boolean} esMultiples - Indica si son varios elementos.
 * @param {string} [entidad='elemento'] - Tipo de entidad (ej. 'archivo', 'imagen', 'producto').
 * @returns {Promise<string>} - Retorna 'sobreescribir', 'copia' o 'cancelar'.
 */
function MostrarConflicto(info, esMultiples, entidad = 'elemento') {
    return new Promise((resolve) => {
        const uid = Date.now();
        const contenedorId = `conflicto-wrapper-${uid}`;
        let accionResuelta = false; // Bandera para evitar doble resolución

        // Textos dinámicos adaptables a cualquier módulo
        const mensaje = esMultiples ?
            `Se han detectado <b>${info} ${entidad}s</b> que ya existen en el sistema.` :
            `El elemento <b class="text-dark" style="word-break: break-all; overflow-wrap: break-word; display: inline-block; max-width: 100%;">${info}</b> ya se encuentra registrado.`;

        const textoSobreescribir = esMultiples ? 'Sobreescribir todos' : 'Sobreescribir';
        const textoCopias = esMultiples ? 'Guardar como copias' : 'Guardar copia';

        const contenidoHtml = `
        <div id="${contenedorId}" style="width: 100%; max-width: 100%; box-sizing: border-box; padding: 10px 5px; font-family: inherit;">
            <div style="display: flex; flex-direction: column; align-items: center; text-align: center; margin-bottom: 20px;">
                <div style="width: 56px; height: 56px; background-color: #fff7ed; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; border: 2px solid #ffedd5; box-shadow: 0 4px 10px rgba(249, 115, 22, 0.1);">
                    <svg style="width: 28px; height: 28px; color: #f97316;" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                    </svg>
                </div>
                <h4 style="font-size: 18px; font-weight: 700; color: #1e293b; margin: 0 0 6px 0;">¡Conflicto de Duplicidad!</h4>
                <div style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0; width: 100%; box-sizing: border-box; padding: 0 10px;">
                    ${mensaje} ¿Cómo deseas proceder?
                </div>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 10px; width: 100%; box-sizing: border-box;">
                <button type="button" class="btn-accion-conflicto" data-accion="sobreescribir" style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 11px 16px; background-color: #ef4444; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; box-shadow: 0 2px 6px rgba(239, 68, 68, 0.25); transition: background 0.2s; box-sizing: border-box;">
                    <i class="fa fa-refresh" style="font-size: 14px;"></i> ${textoSobreescribir}
                </button>
                
                <button type="button" class="btn-accion-conflicto" data-accion="copia" style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 11px 16px; background-color: #2563eb; color: white; border: none; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; box-shadow: 0 2px 6px rgba(37, 99, 235, 0.25); transition: background 0.2s; box-sizing: border-box;">
                    <i class="fa fa-copy" style="font-size: 14px;"></i> ${textoCopias}
                </button>
                
                <button type="button" class="btn-accion-conflicto" data-accion="cancelar" style="display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; padding: 10px 16px; background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; border-radius: 8px; font-weight: 600; font-size: 13px; cursor: pointer; transition: background 0.2s; box-sizing: border-box;">
                    Cancelar proceso
                </button>
            </div>
        </div>
    `;

        // Delegación de eventos para cualquier botón de acción
        $(document).off('click', `#${contenedorId} .btn-accion-conflicto`).on('click', `#${contenedorId} .btn-accion-conflicto`, function() {
            const accion = $(this).data('accion'); // 'sobreescribir', 'copia' o 'cancelar'
            accionResuelta = true;

            // Forzar el cierre inmediato del modal usando ModalAPI
            if (window.ModalAPI && typeof window.ModalAPI.cerrar === 'function') {
                window.ModalAPI.cerrar(() => {
                    resolve(accion);
                });
            } else {
                resolve(accion);
            }
        });

        ModalAPI.abrir({
            titulo: 'Gestión de Conflictos',
            cerrarBtn: true,
            altura: 'auto',
            anchoMax: '400px',
            transparencia: true,
            onClose: () => {
                // Limpiar eventos globales del DOM
                $(document).off('click', `#${contenedorId} .btn-accion-conflicto`);

                // Si se cerró por la X, la tecla Escape o haciendo clic fuera del modal sin elegir botón
                if (!accionResuelta) {
                    resolve('cancelar');
                }
            },
            contenido: contenidoHtml
        });
    });
}