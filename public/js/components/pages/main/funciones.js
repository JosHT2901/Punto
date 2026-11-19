async function Obtener_Datos_Iniciales() {
    try {
        const promesasBase = [
            ObtenerPermisosAPI(),
            ObtenerPreferenciasAPI(),
        ];

        // Ejecución limpia y en paralelo mediante Promise.allSettled
        const resultados = await Promise.allSettled(promesasBase);

        // 1. Validar permisos (índice 0)
        if (resultados[0].status === 'fulfilled') {
            // Opcional: procesar respuesta de permisos si es necesario
            console.log("Permisos cargados correctamente.");
        } else {
            console.error("Error crítico en la promesa de permisos:", resultados[0].reason);
        }

        // 2. Validar preferencias (índice 1)
        if (resultados[1].status === 'fulfilled') {
            console.log("Preferencias cargadas correctamente.");
        } else {
            console.error("Error crítico en la promesa de preferencias:", resultados[1].reason);
        }


    } catch (error) {
        console.error("Error general en Obtener_Datos_Iniciales:", error);
    }
}