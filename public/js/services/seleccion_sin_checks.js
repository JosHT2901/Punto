/* =============================================
    FABRICA DE CONTROLADORES DE SELECCIÓN (Sin Checks)
    - Clic normal:           ABRE el archivo (no selecciona)
    - Shift + clic:          MARCA (rango desde la última marcada)
    - Ctrl/Cmd + clic:       MARCA o DESMARCA solo esa tarjeta
    - Tarjeta ya marcada:    un clic no la abre; el DOBLE CLIC sí
============================================= */
const CrearSeleccionControllerSinChecks = (nombreControlador) => {
    const seleccionadas = new Set();
    let ultimoIdSeleccionado = null; // Ancla para el rango con Shift
    let config = {};
    let eventosLigados = false;
    let abriendoPorDobleClic = false; // true mientras se reenvía el clic que abre el archivo
    const namespaceEventos = `.seleccionSinChecksCtrl_${nombreControlador.toLowerCase().replace(/\s+/g, '_')}`;

    // Elementos internos de la tarjeta que tienen su propia acción: no abren ni marcan
    const IGNORAR = 'a, button, input, label, .no-nav, .attachment-chip, .js-header-toggle';

    const setConfig = (opciones = {}) => {
        let scopeElement = opciones.scope || document;
        if (typeof scopeElement === 'string') {
            scopeElement = document.querySelector(scopeElement) || document;
        } else if (typeof jQuery !== 'undefined' && scopeElement instanceof jQuery) {
            scopeElement = scopeElement[0] || document;
        }

        config = {
            scope: scopeElement,
            tarjetaClass: opciones.tarjetaClass || '.tarjeta-ajustable',
            claseActiva: opciones.claseActiva || 'activo',
            onChange: typeof opciones.onChange === 'function' ? opciones.onChange : null,
            // Se llama con (id, tarjeta, evento) al hacer clic normal. Si no la defines,
            // el clic normal no se toca y lo atiende el código que ya abre el archivo.
            onAbrir: typeof opciones.onAbrir === 'function' ? opciones.onAbrir : null,
            multiSeleccion: opciones.multiSeleccion !== false,
            limpiarAlClickFuera: opciones.limpiarAlClickFuera !== false
        };
    };

    const notificar = (idModificado = null, estado = null) => {
        if (config.onChange) {
            config.onChange(new Set(seleccionadas), estado, idModificado);
        }
    };

    const idDe = (tarjeta) => String(tarjeta.dataset.id || '');

    const sincronizarDOM = () => {
        if (!config.scope || typeof config.scope.querySelectorAll !== 'function') return;

        config.scope.querySelectorAll(config.tarjetaClass).forEach(tarjeta => {
            const id = idDe(tarjeta);
            if (!id) return;
            tarjeta.classList.toggle(config.claseActiva, seleccionadas.has(id));
        });
    };

    const seleccionarTodo = (marcar = true) => {
        if (!config.scope || typeof config.scope.querySelectorAll !== 'function') return;

        config.scope.querySelectorAll(config.tarjetaClass).forEach(tarjeta => {
            const id = idDe(tarjeta);
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

    // Marca todas las tarjetas entre la última marcada y la actual
    const seleccionarRango = (idDestino) => {
        const tarjetas = Array.from(config.scope.querySelectorAll(config.tarjetaClass));
        const inicio = tarjetas.findIndex(t => idDe(t) === ultimoIdSeleccionado);
        const fin = tarjetas.findIndex(t => idDe(t) === idDestino);
        if (inicio === -1 || fin === -1) return false;

        for (let i = Math.min(inicio, fin); i <= Math.max(inicio, fin); i++) {
            const tid = idDe(tarjetas[i]);
            if (tid && !tarjetas[i].classList.contains('disabled')) {
                seleccionadas.add(tid);
            }
        }
        return true;
    };

    // Marca o desmarca una sola tarjeta. Devuelve el estado final (true = marcada)
    const alternar = (id) => {
        const esActivo = seleccionadas.has(id);

        if (!config.multiSeleccion) {
            seleccionadas.clear();
            if (!esActivo) {
                seleccionadas.add(id);
                ultimoIdSeleccionado = id;
            } else {
                ultimoIdSeleccionado = null;
            }
        } else if (esActivo) {
            seleccionadas.delete(id);
            if (ultimoIdSeleccionado === id) ultimoIdSeleccionado = null;
        } else {
            seleccionadas.add(id);
            ultimoIdSeleccionado = id;
        }
        return !esActivo;
    };

    /* ---------- Manejadores ---------- */

    // Devuelve { tarjeta, id } si el evento ocurrió sobre una tarjeta válida; si no, null
    const resolverTarjeta = (e) => {
        const tarjeta = e.target.closest && e.target.closest(config.tarjetaClass);
        if (!tarjeta) return null;
        if (config.scope !== document && !config.scope.contains(tarjeta)) return null;
        if (e.target.closest(IGNORAR)) return null;
        if (tarjeta.classList.contains('disabled')) return null;
        const id = idDe(tarjeta);
        return id ? { tarjeta, id } : null;
    };

    // Escucha en fase de captura: así, cuando se marca, ningún otro código de la tarjeta llega a abrir el archivo
    const manejarClick = (e) => {
        if (e.button !== 0) return; // solo clic izquierdo
        if (abriendoPorDobleClic) return; // clic reenviado por el doble clic: dejarlo pasar para que abra

        const r = resolverTarjeta(e);
        if (!r) return;
        const { tarjeta, id } = r;

        const quiereMarcar = e.shiftKey || e.ctrlKey || e.metaKey;

        if (!quiereMarcar) {
            // Ya marcada: un clic no la abre (se abre con doble clic)
            if (seleccionadas.has(id)) {
                e.preventDefault();
                e.stopImmediatePropagation();
                return;
            }
            // Sin marcar: clic normal abre el archivo, sin tocar la selección
            if (config.onAbrir) config.onAbrir(id, tarjeta, e);
            return;
        }

        // Con Shift / Ctrl: marcar, y evitar que se abra
        e.preventDefault();
        e.stopImmediatePropagation();

        // Shift: rango desde la última marcada
        if (e.shiftKey && config.multiSeleccion && ultimoIdSeleccionado && ultimoIdSeleccionado !== id) {
            if (seleccionarRango(id)) {
                sincronizarDOM();
                notificar(id, true);
                return;
            }
        }

        // Shift sin ancla, o Ctrl/Cmd: marcar/desmarcar solo esta
        const estado = alternar(id);
        sincronizarDOM();
        notificar(id, estado);
    };

    // Doble clic sobre una tarjeta ya marcada: abrir el archivo
    const manejarDobleClic = (e) => {
        if (e.button !== 0 || e.shiftKey || e.ctrlKey || e.metaKey) return;

        const r = resolverTarjeta(e);
        if (!r || !seleccionadas.has(r.id)) return;

        e.preventDefault();
        if (config.onAbrir) {
            config.onAbrir(r.id, r.tarjeta, e);
            return;
        }

        // Sin onAbrir: se reenvía un clic para que lo atienda el código que ya abre el archivo
        abriendoPorDobleClic = true;
        try {
            r.tarjeta.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, button: 0, view: window }));
        } finally {
            abriendoPorDobleClic = false;
        }
    };

    // Evita que Shift + clic (o el doble clic) seleccione texto de la página
    const evitarSeleccionDeTexto = (e) => {
        const r = resolverTarjeta(e);
        if (!r) return;
        // Shift + clic, o doble clic sobre una tarjeta marcada
        if (e.shiftKey || (e.detail > 1 && seleccionadas.has(r.id))) {
            e.preventDefault();
        }
    };

    const manejarClickFuera = (e) => {
        if (seleccionadas.size === 0) return;
        if (e.target.closest(config.tarjetaClass)) return;

        const clickEnExcepcion = e.target.closest('.btn-opciones-archivo, .no-limpiar-seleccion, .swal2-container, .modal, .barra-seleccion, button, a');
        if (clickEnExcepcion) return;

        // Con scope = document cualquier clic en vacío limpia; con un contenedor, solo los clics fuera de él
        if (config.scope === document || !config.scope.contains(e.target)) {
            limpiar();
        }
    };

    const activarEventos = () => {
        if (eventosLigados) return;
        eventosLigados = true;

        document.addEventListener('click', manejarClick, true);
        document.addEventListener('dblclick', manejarDobleClic, true);
        document.addEventListener('mousedown', evitarSeleccionDeTexto, true);
        document.addEventListener('click', manejarClickFuera);
    };

    const destruir = () => {
        document.removeEventListener('click', manejarClick, true);
        document.removeEventListener('dblclick', manejarDobleClic, true);
        document.removeEventListener('mousedown', evitarSeleccionDeTexto, true);
        document.removeEventListener('click', manejarClickFuera);
        eventosLigados = false;
        seleccionadas.clear();
        ultimoIdSeleccionado = null;
    };

    return {
        init: (opciones) => {
            setConfig(opciones);
            activarEventos();
            sincronizarDOM();
        },
        destruir,
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