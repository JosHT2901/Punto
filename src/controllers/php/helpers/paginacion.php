<?php
// helpers/Paginador.php

/**
 * Calcula los parámetros de paginación para consultas SQL y respuestas JSON.
 * 
 * @param int $total_registros Total de elementos en la base de datos.
 * @param int $pagina_actual Página solicitada.
 * @param int $registros_por_pagina Cantidad de elementos por página.
 * @return array Estructura completa de paginación.
 */
function Obtener_Paginacion(int $total_registros, int $pagina_actual = 1, int $registros_por_pagina = 10): array {
    // 1. Validaciones defensivas para evitar divisiones por cero o valores negativos
    $total_registros = max(0, $total_registros);
    $registros_por_pagina = max(1, $registros_por_pagina);

    // 2. Calculamos el total de páginas
    $total_paginas = (int) ceil($total_registros / $registros_por_pagina);
    if ($total_paginas <= 0) {
        $total_paginas = 1;
    }

    // 3. Normalizamos la página actual dentro de los límites válidos
    $pagina_actual = max(1, min($pagina_actual, $total_paginas));
    
    // 4. Calculamos el desplazamiento (offset) para la cláusula LIMIT / OFFSET de SQL
    $offset = ($pagina_actual - 1) * $registros_por_pagina;

    // 5. Rango visual de registros ('Desde' - 'Hasta')
    $desde = ($total_registros > 0) ? $offset + 1 : 0;
    $hasta = min($pagina_actual * $registros_por_pagina, $total_registros);

    // 6. Conteo real de registros devueltos en esta página específica
    $registros_en_pagina = ($total_registros > 0) ? ($hasta - $offset) : 0;

    return [
        'total_registros'     => $total_registros,
        'total_paginas'       => $total_paginas,
        'pagina_actual'       => $pagina_actual,
        'registros_por_p'     => $registros_por_pagina,
        'registros_en_pagina' => $registros_en_pagina,
        'offset'              => $offset,
        'limite'              => $registros_por_pagina, // Alias útil para la cláusula LIMIT de SQL
        'desde'               => $desde,
        'hasta'               => $hasta
    ];
}