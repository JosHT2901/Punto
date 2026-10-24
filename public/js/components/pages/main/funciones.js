async function Obtener_Datos_Iniciales() {
    const promesasBase = [
        ObtenerPermisosAPI()
    ];

    // Ejecución limpia mediante Promise.allSettled
    const resultados = await Promise.allSettled(promesasBase);

    // Opcional: Validar si hubo algún rechazo general a nivel de red/promesa
    if (resultados[0].status === 'rejected') {
        console.error("Error crítico en la promesa de permisos:", resultados[0].reason);
    }
}