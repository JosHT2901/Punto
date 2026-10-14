const TimelineUI = (() => {
    
    const inyectarEstilos = () => {
        if (document.getElementById('timeline-styles')) return;
        const style = document.createElement('style');
        style.id = 'timeline-styles';
        style.innerHTML = `
            .tl-wrapper { 
                height: 44px;
                background: #ffffff; 
                border-radius: 22px; 
                border: 1px solid #e2e8f0;
                box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -2px rgba(0, 0, 0, 0.02);
                display: flex;
                align-items: center;
                width: 100%;
                overflow-x: auto;
                scrollbar-width: none;
                position: relative;
                padding: 0 4px;
            }
            .tl-wrapper::-webkit-scrollbar { display: none; }

            .tl-container { 
                display: flex; 
                align-items: center; 
                gap: 6px;
                padding: 0 8px;
                margin: 0 auto;
                width: max-content;
                scroll-behavior: smooth;
            }
            
            .tl-node { 
                display: flex; 
                align-items: center; 
                gap: 6px;
                flex-shrink: 0;
                padding: 4px 10px;
                border-radius: 16px;
                background: #f8fafc;
                border: 1px solid #f1f5f9;
                opacity: 0.6;
                transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                height: 32px;
                cursor: default !important; /* Deshabilitado visualmente */
                user-select: none;
                pointer-events: none !important; /* Evita cualquier interacción */
            }

            .tl-node.active { 
                opacity: 1; 
                background: #eff6ff; 
                border-color: #bfdbfe;
                box-shadow: 0 2px 4px rgba(59, 130, 246, 0.1);
            }
            
            .tl-node.done { 
                opacity: 0.9; 
                background: #f0fdf4; 
                border-color: #bbf7d0;
            }

            .tl-circle { 
                width: 20px; 
                height: 20px; 
                border-radius: 50%; 
                background: #ffffff; 
                border: 1.5px solid #cbd5e1; 
                display: flex; 
                align-items: center; 
                justify-content: center; 
                font-size: 10px; 
                font-weight: 600;
                color: #64748b;
                transition: all 0.25s ease;
            }

            .tl-label { 
                font-size: 11px; 
                color: #475569; 
                font-weight: 500; 
                white-space: nowrap; 
                transition: color 0.25s ease;
            }
            
            .tl-node.active .tl-circle { 
                background: #3b82f6; 
                border-color: #3b82f6; 
                color: #ffffff; 
            }
            
            .tl-node.active .tl-label { 
                color: #1e40af; 
                font-weight: 700; 
            }
            
            .tl-node.done .tl-circle { 
                background: #10b981; 
                border-color: #10b981; 
                color: #ffffff; 
            }

            .tl-node.done .tl-label {
                color: #065f46;
                font-weight: 600;
            }
        `;
        document.head.appendChild(style);
    };

    return {
        Renderizar: (selector, pasos, pasoActualId) => {
            inyectarEstilos();
            const contenedor = document.querySelector(selector);
            if (!contenedor) return;

            contenedor.innerHTML = '';
            const wrapper = document.createElement('div');
            wrapper.className = 'tl-wrapper';
            
            const tlContainer = document.createElement('div');
            tlContainer.className = 'tl-container';

            let nodoActivoElement = null;
            const indiceActivo = pasos.findIndex(p => p.id === pasoActualId);

            pasos.forEach((paso, index) => {
                const node = document.createElement('div');
                const esActivo = paso.id === pasoActualId;
                const esCompletado = indiceActivo !== -1 && index < indiceActivo;

                node.className = `tl-node ${esActivo ? 'active' : ''} ${esCompletado ? 'done' : ''}`;
                
                if (esActivo) nodoActivoElement = node;

                node.innerHTML = `
                    <div class="tl-circle">${esCompletado ? '✓' : index + 1}</div>
                    <span class="tl-label">${paso.label}</span>
                `;

                // Se eliminó el event listener de clic para que ya no sea interactivo

                tlContainer.appendChild(node);
            });

            wrapper.appendChild(tlContainer);
            contenedor.appendChild(wrapper);

            const centrarPaso = () => {
                if (nodoActivoElement) {
                    const scrollLeft = nodoActivoElement.offsetLeft - (wrapper.offsetWidth / 2) + (nodoActivoElement.offsetWidth / 2);
                    wrapper.scrollTo({ left: scrollLeft, behavior: 'smooth' });
                }
            };

            centrarPaso();
            const resizeObserver = new ResizeObserver(centrarPaso);
            resizeObserver.observe(wrapper);
        }
    };
})();

// --- Configuración de pasos ---

// Función única para actualizar y centrar el indicador del paso actual en el timeline
function ActualizarTimelineActivo(idPasodestino) {
    TimelineUI.Renderizar('#contenedor-timeline', listaDePasosWizard, idPasodestino);
}