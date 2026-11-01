function Obtener_Usuarios_API(pagina = 1, registrosPorPagina = 25, filtros = {}, orden = {}) {
    // 1. Sincronizar y cifrar el estado actual en la URL del navegador fusionando con lo que ya existía
    if (window.UrlStateSyncService && typeof window.UrlStateSyncService.generarUrlConEstado === 'function') {
        // Recuperar parámetros anteriores si existen en la URL cifrada
        const paramsPrevios = (typeof window.UrlStateSyncService.obtenerParametros === 'function') 
            ? window.UrlStateSyncService.obtenerParametros() || {} 
            : {};

        window.UrlStateSyncService.generarUrlConEstado({
            ...paramsPrevios, // Mantiene cualquier otro parámetro previo de la sesión
            pagina: pagina,
            registros: registrosPorPagina,
            ...filtros,
            ...orden
        });
    }

    // 2. Usamos el método 'enviar' de nuestro AjaxService independiente
    return AjaxService.enviar(
        '../../../src/controllers/php/controllers/usuarios.php', // URL del endpoint
        {
            accion: 'obtener_usuarios_paginados',
            pagina: pagina,
            registros_por_p: registrosPorPagina,
            ...filtros, // Expande los filtros dinámicos del módulo
            ...orden    // Expande el ordenamiento
        },
        false // esFormData (false ya que enviamos un objeto plano)
    );
}