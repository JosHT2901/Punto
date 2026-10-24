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