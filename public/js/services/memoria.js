/**
 * Servicio global de almacenamiento en memoria para la aplicación.
 */
window.MemoriaLocal = (function () {
    const _storage = {};

    return {
        Guardar: function (contexto, data, claveUnica = "id") {
            if (!contexto || !data?.[claveUnica]) return { ok: false, error: "Contexto o ID inválido" };

            _storage[contexto] = _storage[contexto] || [];
            const idx = _storage[contexto].findIndex(item => item[claveUnica] === data[claveUnica]);

            if (idx !== -1) {
                _storage[contexto][idx] = { ..._storage[contexto][idx], ...data, _updated: Date.now() };
            } else {
                _storage[contexto].push({ ...data, _created: Date.now() });
            }
            return { ok: true, data: _storage[contexto][idx !== -1 ? idx : _storage[contexto].length - 1] };
        },

        GuardarMasivo: function (contexto, arrayData) {
            if (!contexto || !Array.isArray(arrayData)) return { ok: false };
            _storage[contexto] = arrayData.map(item => ({ ...item, _updated: Date.now() }));
            return { ok: true, count: _storage[contexto].length };
        },

        ObtenerTodo: (contexto) => _storage[contexto] ? [..._storage[contexto]] : [],

        ObtenerPorId: (contexto, id, claveUnica = "id") => _storage[contexto]?.find(item => item[claveUnica] === id) || null,

        Eliminar: function (contexto, id, claveUnica = "id") {
            if (!_storage[contexto]) return false;
            const len = _storage[contexto].length;
            _storage[contexto] = _storage[contexto].filter(item => item[claveUnica] !== id);
            return _storage[contexto].length < len;
        },

        LimpiarContexto: (contexto) => { _storage[contexto] = []; return true; },

        VerMemoria: () => _storage
    };
})();