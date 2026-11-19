
$(document).off('app:inicializada').on('app:inicializada', async function () {
    if (typeof MostrarCargando === 'function') {
        MostrarCargando('Obteniendo información...', false);
    }

    const verificarPermiso = (permiso) => {
        return window.PermisosService && typeof window.PermisosService.tienePermiso === 'function'
            ? PermisosService.tienePermiso(permiso)
            : true;
    };

    try {
        // Id del usuario que inició sesión (window.usuario_actual)
        const usuarioActualId = window.usuario_actual ?? null;

        // Id de la URL (lectura directa sin cifrado, con fallback a UrlStateSyncService)
        const urlParams = new URLSearchParams(window.location.search);
        const params = window.UrlStateSyncService?.obtenerParametros?.() ?? null;
        const idUrl = urlParams.get('id') ?? params?.id ?? null;
        const hayIdEnUrl = idUrl !== undefined && idUrl !== null && String(idUrl).trim() !== '';

        // Es "otro usuario" solo si hay id y no coincide con el usuario actual
        const esOtroUsuario = hayIdEnUrl && String(idUrl) !== String(usuarioActualId);
        console.log(esOtroUsuario);

        window.permiso_ver = verificarPermiso('ver_movimientos_usuario');

        // Ver movimientos de otro usuario exige permiso; los propios no
        if (esOtroUsuario && !window.permiso_ver) {
            if (typeof OcultarCargando === 'function') {
                OcultarCargando();
            }
            window.location.href = '../../../pages/errores/no-permiso.php';
            return;
        }

        window.viendo_propios = !esOtroUsuario;
        window.id_usuario = esOtroUsuario ? idUrl : usuarioActualId;

        const respuesta = await window.AjaxService.enviar(
            '../../../src/controllers/php/controllers/usuarios.php',
            { accion: 'obtener_modulos_y_acciones_movimientos' }
        );
        if (respuesta && respuesta.ok && respuesta.data) {
            window.modulosMovimientos = respuesta.data.modulos || [];
            window.accionesMovimientos = respuesta.data.acciones || [];
            window.accionesPorModuloMovimientos = respuesta.data.acciones_por_modulo || {};
        } else {
            console.warn('Aviso al cargar módulos y acciones:', respuesta?.mensaje || 'Respuesta inválida');
            window.modulosMovimientos = [];
            window.accionesMovimientos = [];
            window.accionesPorModuloMovimientos = {};
        }

        $(document).trigger('datosListos.movimientos');
        OcultarCargando()
    } catch (error) {
        console.error('Error al inicializar movimientos:', error);
        if (typeof OcultarCargando === 'function') {
            OcultarCargando();
        }
        if (typeof MostrarMensaje === 'function') {
            MostrarMensaje('Ocurrió un error al cargar la información inicial', false, false, false);
        }
    }
});

function Obtener_Movimientos_API(pagina = 1, registrosPorPagina = null, filtros = {}, orden = {}) {
    const limiteRegistros = parseInt(registrosPorPagina || window.registrosPorPagina || 50, 10);
    const paginaActual = parseInt(pagina || window.pagina || 1, 10);

    const origenFiltros = {
        ...(window.filtrosAdicionales || {}),
        ...(filtros || {})
    };

    // Limpia valores vacíos y arreglos sin elementos
    const filtrosLimpios = {};
    Object.entries(origenFiltros).forEach(([clave, valor]) => {
        if (valor === undefined || valor === null || valor === '') {
            return;
        }
        if (Array.isArray(valor)) {
            const filtrados = valor.filter((item) => item !== undefined && item !== null && String(item).trim() !== '');
            if (filtrados.length > 0) {
                filtrosLimpios[clave] = filtrados;
            }
            return;
        }
        filtrosLimpios[clave] = valor;
    });

    // usuario_id (de quién son los movimientos) va separado del id del movimiento
    if (
        filtrosLimpios.usuario_id === undefined &&
        window.id_usuario !== undefined &&
        window.id_usuario !== null &&
        String(window.id_usuario).trim() !== ''
    ) {
        filtrosLimpios.usuario_id = window.id_usuario;
    }

    // Orden normalizado: el backend solo acepta t.movimiento_id, t.fecha, t.modulo y t.accion
    const ordenBase = (orden && typeof orden === 'object') ? orden : {};
    const ordenLimpio = {
        columna: ordenBase.columna || 't.movimiento_id',
        direccion: String(ordenBase.direccion || 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC'
    };

    // Actualizamos el parámetro cifrado 'q' en la URL fusionando con lo que ya existía.
    // usuario_id NO va en la URL: el usuario consultado viaja en ?id=... (cifrado) y se conserva aparte.
    if (window.UrlStateSyncService && typeof window.UrlStateSyncService.generarUrlConEstado === 'function') {
        const paramsPrevios = (typeof window.UrlStateSyncService.obtenerParametros === 'function')
            ? (window.UrlStateSyncService.obtenerParametros() || {})
            : {};

        const estadoUrl = {
            ...paramsPrevios,
            pagina: paginaActual,
            registros: limiteRegistros,
            buscar: filtrosLimpios.buscar,
            modulo: filtrosLimpios.modulo,
            accion: filtrosLimpios.accion,
            columna: ordenLimpio.columna,
            direccion: ordenLimpio.direccion
        };

        // Se omiten los vacíos para mantener la URL corta
        Object.keys(estadoUrl).forEach((clave) => {
            const v = estadoUrl[clave];
            if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) {
                delete estadoUrl[clave];
            }
        });

        window.UrlStateSyncService.generarUrlConEstado(estadoUrl, false);
    }

    // 'accion' se separa de los filtros planos para no pisar la acción del endpoint PHP
    const { accion: filtroAccion, ...filtrosSinColision } = filtrosLimpios;

    return AjaxService.enviar(
        '../../../src/controllers/php/controllers/usuarios.php',
        {
            accion: 'obtener_movimientos_paginados',
            pagina: paginaActual,
            registros_por_p: limiteRegistros,
            filtros: filtrosLimpios,
            ...(filtroAccion !== undefined ? { filtro_accion: filtroAccion } : {}),
            ...filtrosSinColision,
            ...ordenLimpio
        },
        false
    );
}