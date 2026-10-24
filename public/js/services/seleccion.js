/* =============================================
    FABRICA DE CONTROLADORES DE SELECCIÓN (Optimizado y Robusto)
============================================= */
const CrearSeleccionController = (nombreControlador) => {
    const seleccionadas = new Set();
    let config = {};
    let eventosLigados = false;
    let namespaceEventos = `.seleccionCtrl_${nombreControlador.toLowerCase().replace(/\s+/g, '_')}`;

    const setConfig = (opciones = {}) => {
        let checkAll = opciones.checkAllId || null;
        if (checkAll && !checkAll.startsWith('#') && !checkAll.startsWith('.')) {
            checkAll = '#' + checkAll;
        }

        config = {
            scope: opciones.scope || document, 
            checkItemClass: opciones.checkItemClass || '.check-item',
            checkAllId: checkAll,
            tarjetaClass: opciones.tarjetaClass || '.tarjeta-ajustable',
            claseActiva: opciones.claseActiva || 'activo',
            onChange: typeof opciones.onChange === 'function' ? opciones.onChange : null,
            clickTarjetaSelecciona: opciones.clickTarjetaSelecciona !== false 
        };
    };

    const notificar = (idModificado = null, estado = null) => {
        if (config.onChange) {
            config.onChange(new Set(seleccionadas), estado, idModificado);
        }
    };

    const sincronizarDOM = () => {
        const root = config.scope instanceof jQuery ? config.scope[0] : config.scope;
        if (!root) return;

        root.querySelectorAll(config.checkItemClass).forEach(check => {
            const id = String(check.dataset.id || '');
            if (!id) return;

            const activo = seleccionadas.has(id);
            check.checked = activo;

            const tarjeta = check.closest(config.tarjetaClass);
            if (tarjeta) {
                tarjeta.classList.toggle(config.claseActiva, activo);
            }
        });
        actualizarCheckAll();
    };

    const actualizarCheckAll = () => {
        if (!config.checkAllId) return;
        const root = config.scope instanceof jQuery ? config.scope[0] : config.scope;
        if (!root) return;
        
        const checkAll = root.querySelector(config.checkAllId) || document.querySelector(config.checkAllId);
        const habilitados = root.querySelectorAll(`${config.checkItemClass}:not(:disabled)`);
        
        if (!checkAll) return;
        if (habilitados.length === 0) {
            checkAll.checked = false;
            checkAll.indeterminate = false;
            return;
        }

        const todosSeleccionados = [...habilitados].every(c => seleccionadas.has(String(c.dataset.id)));
        const algunoSeleccionado = [...habilitados].some(c => seleccionadas.has(String(c.dataset.id)));

        checkAll.checked = todosSeleccionados;
        checkAll.indeterminate = algunoSeleccionado && !todosSeleccionados;
    };

    const seleccionarTodo = (marcar = true) => {
        const root = config.scope instanceof jQuery ? config.scope[0] : config.scope;
        if (!root) return;

        const habilitados = root.querySelectorAll(`${config.checkItemClass}:not(:disabled)`);
        
        habilitados.forEach(check => {
            const id = String(check.dataset.id || '');
            if (id) {
                marcar ? seleccionadas.add(id) : seleccionadas.delete(id);
            }
        });

        sincronizarDOM();
        notificar(config.checkAllId, marcar);
    };

    const activarEventos = () => {
        if (eventosLigados) return;
        eventosLigados = true;
    
        // 1. Cambio en check individual
        $(document).off(`change${namespaceEventos}`).on(`change${namespaceEventos}`, config.checkItemClass, function(e) {
            if (config.scope !== document && !$.contains(config.scope instanceof jQuery ? config.scope[0] : config.scope, this)) {
                return;
            }

            e.stopPropagation();
            const id = String(this.dataset.id || '');
            if (!id) return;

            const marcado = this.checked;
            marcado ? seleccionadas.add(id) : seleccionadas.delete(id);
            
            const tarjeta = this.closest(config.tarjetaClass);
            if (tarjeta) tarjeta.classList.toggle(config.claseActiva, marcado);
            
            actualizarCheckAll();
            notificar(id, marcado);
        });
    
        // 2. Click en tarjeta
        $(document).off(`click${namespaceEventos}`).on(`click${namespaceEventos}`, config.tarjetaClass, function(e) {
            if (config.scope !== document && !$.contains(config.scope instanceof jQuery ? config.scope[0] : config.scope, this)) {
                return;
            }

            const ignorarSeleccion = $(e.target).closest('a, button, input, label, .no-nav, .attachment-chip, .js-header-toggle').length;
            if (ignorarSeleccion) return;
            
            if (config.clickTarjetaSelecciona) {
                const check = this.querySelector(config.checkItemClass);
                if (!check || check.disabled) return;
    
                const id = String(check.dataset.id || '');
                if (!id) return;

                const nuevoEstado = !seleccionadas.has(id);
                nuevoEstado ? seleccionadas.add(id) : seleccionadas.delete(id);
                
                sincronizarDOM();
                notificar(id, nuevoEstado);
            }
        });
    
        // 3. Check All
        if (config.checkAllId) {
            $(document).off(`change${namespaceEventos}_all`).on(`change${namespaceEventos}_all`, config.checkAllId, function() {
                seleccionarTodo(this.checked);
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
        limpiar: () => {
            seleccionadas.clear();
            sincronizarDOM();
            notificar(null, false);
        },
        existe: (id) => seleccionadas.has(String(id)),
        // Método seguro para inyectar IDs externos masivos normalizados a String
        agregar: (id) => {
            if (id !== undefined && id !== null && String(id).trim() !== '') {
                seleccionadas.add(String(id));
                sincronizarDOM();
                notificar(String(id), true);
            }
        }
    };
};

// --- INSTANCIAS ---
window.SeleccionController = CrearSeleccionController('Global');
window.NavegacionTarjetasController = CrearSeleccionController('Navegacion');

/* =============================================
    UI: ACTUALIZADOR DE CONTADORES (Optimizado)
============================================= */
function ActualizarContadorGenerico(contenedor, controller) {
    const $cont = $(contenedor);
    const total = controller.total();
    
    if (total > 0) {
        $cont.html(`
            <div class="h-30 flex justify-center items-center text-blue-03618d px-2 fs-3 bg-btn-option-bg rounded-2xl fw-600 animate-fade-in">
                <span class="texto-truncado">${total} seleccionados</span>
            </div>
        `);
    } else {
        $cont.empty();
    }
}