/* =============================================
    SERVICIO: PERMISOS SERVICE (Control de Acceso)
============================================= */
window.PermisosService = (() => {
    let _permisosUsuario = []; // Guardará los nombres de permisos limpios
    const CACHE_KEY = 'permisos_usuario';

    const inicializar = (dataPermisos) => {
        if (Array.isArray(dataPermisos)) {
            // Mapeamos para extraer únicamente un arreglo plano con los 'nombre_permiso' 
            // Ej: ['crear_categorias', 'editar_categorias', ...]
            _permisosUsuario = dataPermisos.map(p => p.nombre_permiso).filter(Boolean);
        } else {
            _permisosUsuario = [];
        }
        
        // Guardamos el arreglo plano en caché local
        localStorage.setItem(CACHE_KEY, JSON.stringify(_permisosUsuario));
    };

    const obtenerPermisos = () => {
        if (_permisosUsuario.length === 0) {
            const cached = localStorage.getItem(CACHE_KEY);
            if (cached) {
                try {
                    _permisosUsuario = JSON.parse(cached);
                } catch (e) {
                    _permisosUsuario = [];
                }
            }
        }
        return _permisosUsuario;
    };

    const tienePermiso = (permisoRequerido) => {
        if (!permisoRequerido) return true;
        const permisos = obtenerPermisos();
        if (permisos.includes('*') || permisos.includes('admin')) return true;
        return permisos.includes(permisoRequerido);
    };

    const limpiarCache = () => {
        _permisosUsuario = [];
        localStorage.removeItem(CACHE_KEY);
    };

    return {
        inicializar,
        obtenerPermisos,
        tienePermiso,
        limpiarCache
    };
})();