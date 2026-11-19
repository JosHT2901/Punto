async function ObtenerPermisosAPI() {
    try {
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/permisos.php', {
            accion: 'obtener_permisos'
        });

        // Validamos el estándar { ok: true, data: [...] } de tu backend
        if (respuesta && respuesta.ok) {
            const listaPermisos = respuesta.data || [];
            
            // Inicializamos el PermisosService global con la data obtenida
            if (window.PermisosService) {
                PermisosService.inicializar(listaPermisos);
            }
            return listaPermisos;
        } else {
            console.warn("Aviso al cargar permisos:", respuesta?.mensaje || "Respuesta inválida");
            return [];
        }
    } catch (error) {
        console.error("Error al obtener permisos:", error);
        return [];
    }
}

async function ObtenerPreferenciasAPI() {
    try {
        const respuesta = await window.AjaxService.enviar('../../../src/controllers/php/controllers/preferencias.php', {
            accion: 'obtener_preferencias'
        });

        // Validamos el estándar del backend (ok o success)
        if (respuesta && (respuesta.ok || respuesta.success === true)) {
            const datos = respuesta.data || respuesta.datos || {};

            // Normalizamos con respaldos seguros coincidiendo con las claves dinámicas de PHP
            const preferencias = {
                ...datos,
                sucursal_default_id:       datos.sucursal_default_id !== null ? Number(datos.sucursal_default_id) : null,
                sucursal_comportamiento:   datos.sucursal_comportamiento || 'sesion',
                formatosFecha:datos.formatosFecha,
                seguridad_inactiva_min:datos.seguridad_inactiva_min,
                seguridad_2fa:datos.seguridad_2fa,
                reloj_formato:datos.reloj_formato,
                paginacion_tabla:          Number(datos.paginacion_tabla || 10)
            };
            // Exponemos globalmente las preferencias para uso en tablas, reloj y seguridad
            window.PreferenciasUsuario = preferencias;
            window.registrosPorPagina = preferencias.paginacion_tabla;
            window.usuario_actual=preferencias.usuario_id

            // Notificamos a otros módulos (como el reloj del navbar o la vista de preferencias)
            document.dispatchEvent(new CustomEvent('preferencias:cargadas', {
                detail: preferencias
            }));

            return preferencias;
        } else {
            console.warn("Aviso al cargar preferencias:", respuesta?.mensaje || "Respuesta inválida");
            return null;
        }
    } catch (error) {
        console.error("Error al obtener preferencias:", error);
        return null;
    }
}

