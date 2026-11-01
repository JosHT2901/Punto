/* =============================================
    FABRICA DE CONTROLADORES DE SELECCIÓN (Sin Checks - Con Rango Shift + Clic Izquierdo y Excepciones de Clic)
============================================= */
const CrearSeleccionControllerSinChecks = (nombreControlador) => {
    const seleccionadas = new Set();
    let ultimoIdSeleccionado = null; // Para recordar el último elemento y hacer rangos con Shift
    let config = {};
    let eventosLigados = false;
    let namespaceEventos = `.seleccionSinChecksCtrl_${nombreControlador.toLowerCase().replace(/\s+/g, '_')}`;

    const setConfig = (opciones = {}) => {
        let scopeElement = opciones.scope || document;
        if (typeof scopeElement === 'string') {
            scopeElement = document.querySelector(scopeElement) || document;
        } else if (scopeElement instanceof jQuery) {
            scopeElement = scopeElement[0] || document;
        }

        config = {
            scope: scopeElement, 
            tarjetaClass: opciones.tarjetaClass || '.tarjeta-ajustable',
            claseActiva: opciones.claseActiva || 'activo',
            onChange: typeof opciones.onChange === 'function' ? opciones.onChange : null,
            multiSeleccion: opciones.multiSeleccion !== false,
            limpiarAlClickFuera: opciones.limpiarAlClickFuera !== false
        };
    };

    const notificar = (idModificado = null, estado = null) => {
        if (config.onChange) {
            config.onChange(new Set(seleccionadas), estado, idModificado);
        }
    };

    const sincronizarDOM = () => {
        if (!config.scope || typeof config.scope.querySelectorAll !== 'function') return;

        config.scope.querySelectorAll(config.tarjetaClass).forEach(tarjeta => {
            const id = String(tarjeta.dataset.id || '');
            if (!id) return;

            const activo = seleccionadas.has(id);
            tarjeta.classList.toggle(config.claseActiva, activo);
        });
    };

    const seleccionarTodo = (marcar = true) => {
        if (!config.scope || typeof config.scope.querySelectorAll !== 'function') return;

        const tarjetas = config.scope.querySelectorAll(config.tarjetaClass);
        
        tarjetas.forEach(tarjeta => {
            const id = String(tarjeta.dataset.id || '');
            if (id && !tarjeta.classList.contains('disabled')) {
                marcar ? seleccionadas.add(id) : seleccionadas.delete(id);
            }
        });

        sincronizarDOM();
        notificar(null, marcar);
    };

    const limpiar = () => {
        if (seleccionadas.size === 0) return;
        seleccionadas.clear();
        ultimoIdSeleccionado = null;
        sincronizarDOM();
        notificar(null, false);
    };

    const activarEventos = () => {
        if (eventosLigados) return;
        eventosLigados = true;
    
        // Clic izquierdo (click) individual y con Shift (rango)
        $(document).off(`click${namespaceEventos}`).on(`click${namespaceEventos}`, config.tarjetaClass, function(e) {
            // Validar que sea clic izquierdo principal (e.button === 0)
            if (e.button !== 0) return;

            if (config.scope !== document && !$.contains(config.scope, this)) {
                return;
            }

            const ignorarSeleccion = $(e.target).closest('a, button, input, label, .no-nav, .attachment-chip, .js-header-toggle').length;
            if (ignorarSeleccion) return;
            
            const tarjeta = this;
            if (tarjeta.classList.contains('disabled')) return;

            const id = String(tarjeta.dataset.id || '');
            if (!id) return;

            // LÓGICA DE SELECCIÓN POR RANGO CON SHIFT (MAYÚS) + CLIC IZQUIERDO
            if (e.shiftKey && ultimoIdSeleccionado && ultimoIdSeleccionado !== id && config.multiSeleccion) {
                e.preventDefault();
                e.stopImmediatePropagation();

                const todasLasTarjetas = Array.from(config.scope.querySelectorAll(config.tarjetaClass));
                let indexInicio = -1;
                let indexFin = -1;

                todasLasTarjetas.forEach((t, idx) => {
                    const tid = String(t.dataset.id || '');
                    if (tid === ultimoIdSeleccionado) indexInicio = idx;
                    if (tid === id) indexFin = idx;
                });

                if (indexInicio !== -1 && indexFin !== -1) {
                    const inicio = Math.min(indexInicio, indexFin);
                    const fin = Math.max(indexInicio, indexFin);

                    for (let i = inicio; i <= fin; i++) {
                        const tid = String(todasLasTarjetas[i].dataset.id || '');
                        if (tid && !todasLasTarjetas[i].classList.contains('disabled')) {
                            seleccionadas.add(tid);
                        }
                    }

                    sincronizarDOM();
                    notificar(id, true);
                    return;
                }
            }

            // Comportamiento normal (clic izquierdo simple)
            const esActivo = seleccionadas.has(id);

            if (!config.multiSeleccion) {
                seleccionadas.clear();
                if (!esActivo) {
                    seleccionadas.add(id);
                    ultimoIdSeleccionado = id;
                } else {
                    ultimoIdSeleccionado = null;
                }
            } else {
                if (esActivo) {
                    seleccionadas.delete(id);
                    if (ultimoIdSeleccionado === id) ultimoIdSeleccionado = null;
                } else {
                    seleccionadas.add(id);
                    ultimoIdSeleccionado = id;
                }
            }
            
            sincronizarDOM();
            notificar(id, !esActivo);
        });

        // Limpiar selección si se hace clic fuera del contenedor
        if (config.limpiarAlClickFuera) {
            $(document).off(`click${namespaceEventos}_fuera`).on(`click${namespaceEventos}_fuera`, function(e) {
                if (seleccionadas.size === 0) return;

                const clickEnTarjeta = $(e.target).closest(config.tarjetaClass).length > 0;
                
                // 💡 EXCEPCIONES AMPLIADAS: Agregamos .barra-seleccion, botones masivos y elementos interactivos generales
                const clickEnExcepcion = $(e.target).closest('.btn-opciones-archivo, .no-limpiar-seleccion, .swal2-container, .modal, .barra-seleccion, button, a').length > 0;

                if (!clickEnTarjeta && !clickEnExcepcion) {
                    if (!$.contains(config.scope, e.target) && config.scope !== e.target) {
                        limpiar();
                    }
                }
            });
        }
    };

    return {
        init: (opciones) => {
            setConfig(opciones);
            activarEventos();
            sincronizarDOM();
        },
        sincronizarDOM,
        seleccionarTodo,
        getSeleccionados: () => Array.from(seleccionadas),
        total: () => seleccionadas.size,
        limpiar,
        existe: (id) => seleccionadas.has(String(id)),
        agregar: (id) => {
            if (id !== undefined && id !== null && String(id).trim() !== '') {
                const idStr = String(id);
                if (!config.multiSeleccion) {
                    seleccionadas.clear();
                }
                seleccionadas.add(idStr);
                ultimoIdSeleccionado = idStr;
                sincronizarDOM();
                notificar(idStr, true);
            }
        },
        remover: (id) => {
            if (id !== undefined && id !== null) {
                const idStr = String(id);
                if (seleccionadas.has(idStr)) {
                    seleccionadas.delete(idStr);
                    if (ultimoIdSeleccionado === idStr) ultimoIdSeleccionado = null;
                    sincronizarDOM();
                    notificar(idStr, false);
                }
            }
        }
    };
};