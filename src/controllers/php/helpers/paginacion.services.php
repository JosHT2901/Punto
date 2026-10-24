<?php

class PaginacionService {

    /**
     * Ejecuta una consulta paginada, filtrada y ordenada de forma genérica para cualquier tabla.
     */
    public static function obtenerPaginados(string $tabla, array $params, array $configuracion = []): array {
        try {
            // 1. Extraer página y registros por página (soportando 'registros_por_p', 'registros' o 'limit')
            $paginaActual = (int)($params['pagina'] ?? 1);
            $registrosPorPagina = (int)($params['registros_por_p'] ?? ($params['registros'] ?? 10));

            $conditions = [];
            $queryParams = [];

            // 2. Filtro general por texto (unificando la llave de configuración)
            $buscar = trim($params['buscar'] ?? '');
            $columnasBusqueda = $configuracion['columnas_busqueda'] ?? ($configuracion['columnas_busqueda_permitidas'] ?? []);
            
            if (!empty($buscar) && !empty($columnasBusqueda)) {
                $busquedaClauses = [];
                foreach ($columnasBusqueda as $index => $columna) {
                    $paramName = ":buscar_{$index}";
                    $busquedaClauses[] = "{$columna} LIKE {$paramName}";
                    $queryParams[$paramName] = "%{$buscar}%";
                }
                $conditions[] = "(" . implode(" OR ", $busquedaClauses) . ")";
            }

            // 3. Filtros específicos personalizados (soportando múltiples formatos de llaves)
            $filtrosPermitidos = $configuracion['filtros_permitidos'] ?? [];
            foreach ($filtrosPermitidos as $filtroKey) {
                $keysToTry = [
                    $filtroKey, 
                    lcfirst($filtroKey), 
                    strtolower($filtroKey), 
                    ucfirst(strtolower($filtroKey))
                ];
                
                $valorEncontrado = null;
                $encontrado = false;

                foreach ($keysToTry as $k) {
                    if (isset($params[$k]) && $params[$k] !== '') {
                        $valorEncontrado = $params[$k];
                        $encontrado = true;
                        break;
                    }
                }

                if ($encontrado) {
                    $conditions[] = "{$filtroKey} = :{$filtroKey}";
                    $queryParams[":{$filtroKey}"] = $valorEncontrado;
                }
            }

            // 💡 SOPORTE PARA CLÁUSULAS PERSONALIZADAS (custom_where)
            if (!empty($params['custom_where'])) {
                $conditions[] = "(" . $params['custom_where'] . ")";
            }

            // Construir cláusula WHERE
            $whereSql = "";
            if (!empty($conditions)) {
                $whereSql = " WHERE " . implode(" AND ", $conditions);
            }

            // 4. Ordenamiento seguro (Whitelist)
            $columnasPermitidasOrden = $configuracion['columnas_orden'] ?? ($configuracion['columnas_orden_permitidas'] ?? ['ID']);
            $columnaOrden = $params['columna'] ?? $columnasPermitidasOrden[0];
            
            if (!in_array($columnaOrden, $columnasPermitidasOrden)) {
                $columnaOrden = $columnasPermitidasOrden[0];
            }

            $direccionOrden = strtoupper($params['direccion'] ?? 'DESC');
            $direccionOrden = in_array($direccionOrden, ['ASC', 'DESC']) ? $direccionOrden : 'DESC';

            // 5. Obtener el total general de registros (respetando filtros)
            $sqlTotal = "SELECT COUNT(*) AS total FROM {$tabla}" . $whereSql;
            $resTotal = Consultar_PDO($sqlTotal, $queryParams);
            $totalRegistros = !empty($resTotal) ? (int)$resTotal[0]['total'] : 0;

            // 6. Cálculo de paginación
            $paginacionInfo = Obtener_Paginacion($totalRegistros, $paginaActual, $registrosPorPagina);

            // 7. Columnas a seleccionar
            $columnasSelect = $configuracion['columnas_select'] ?? '*';

            // 8. Consulta principal con LIMIT y OFFSET
            $sqlData = "SELECT {$columnasSelect} 
                        FROM {$tabla}" 
                        . $whereSql . 
                        " ORDER BY {$columnaOrden} {$direccionOrden} 
                        LIMIT :limit OFFSET :offset";

            $queryParams[':limit'] = (int)$paginacionInfo['limite'];
            $queryParams[':offset'] = (int)$paginacionInfo['offset'];

            $registros = Consultar_PDO($sqlData, $queryParams);
            $datos = is_array($registros) ? $registros : [];

            return [
                'exito' => true,
                'datos' => $datos,
                'paginacion' => $paginacionInfo
            ];

        } catch (Throwable $e) {
            error_log("Error crítico en PaginacionService para [{$tabla}]: " . $e->getMessage());
            return [
                'exito' => false,
                'datos' => [],
                'paginacion' => Obtener_Paginacion(0, 1, $params['registros_por_p'] ?? ($params['registros'] ?? 10))
            ];
        }
    }
}