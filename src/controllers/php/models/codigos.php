<?php 

function Generar_SKU(): string {
    try {
        $maxNumero = 0;

        // 1. Obtener el ID más alto de la tabla oficial de productos
        $sqlProductos = "SELECT ID FROM productos ORDER BY ID DESC LIMIT 1";
        $resultadoProductos = Consultar_PDO($sqlProductos);
        
        if (is_array($resultadoProductos) && count($resultadoProductos) > 0) {
            $ultimoRegistro = reset($resultadoProductos);
            $ultimoId = isset($ultimoRegistro['ID']) ? (int)$ultimoRegistro['ID'] : (int)reset($ultimoRegistro);
            if ($ultimoId > $maxNumero) {
                $maxNumero = $ultimoId;
            }
        }

        // 2. Revisar todos los borradores en 'productos_borradores' para evitar duplicados en curso
        $sqlBorradores = "SELECT datos_json FROM productos_borradores";
        $resultadoBorradores = Consultar_PDO($sqlBorradores);

        if (is_array($resultadoBorradores) && count($resultadoBorradores) > 0) {
            foreach ($resultadoBorradores as $row) {
                $datos = json_decode($row['datos_json'], true);
                if (!is_array($datos)) continue;

                // Extracción segura del SKU dentro del JSON del borrador
                $identificacion = $datos['identificacion'][0] ?? ($datos['identificacion'] ?? []);
                $skuBorrador = trim($identificacion['sku'] ?? ($datos['sku'] ?? ''));

                if (!empty($skuBorrador) && $skuBorrador !== 'N/D' && $skuBorrador !== 'Sin SKU') {
                    // Extraer los dígitos del SKU existente (ej. "PRD-00058" -> 58)
                    if (preg_match('/(\d+)/', $skuBorrador, $matches)) {
                        $numeroSku = (int)$matches[1];
                        if ($numeroSku > $maxNumero) {
                            $maxNumero = $numeroSku;
                        }
                    }
                }
            }
        }

        // 3. El siguiente SKU se basa en el número más alto encontrado + 1
        $siguienteId = $maxNumero + 1;

        // Generamos el SKU con el formato estándar (Ej: PRD-00059)
        $skuGenerado = 'PRD-' . str_pad($siguienteId, 5, '0', STR_PAD_LEFT);

        return $skuGenerado;

    } catch (Throwable $e) {
        // Registramos el error internamente y retornamos un respaldo basado en timestamp
        error_log("Error crítico al generar SKU: " . $e->getMessage());
        return 'PRD-' . time();
    }
}

function Generar_Codigo_Barras(): string {
    try {
        // Consultamos el último ID registrado para mantener una secuencia ordenada
        $sql = "SELECT ID FROM productos ORDER BY ID DESC LIMIT 1";
        $resultado = Consultar_PDO($sql);

        $siguienteId = 1;
        if (is_array($resultado) && count($resultado) > 0) {
            $ultimoRegistro = reset($resultado);
            $ultimoId = isset($ultimoRegistro['ID']) ? (int)$ultimoRegistro['ID'] : (int)reset($ultimoRegistro);
            $siguienteId = $ultimoId + 1;
        }

        // Generamos un formato numérico estándar (Ej: 7501000000048)
        // Puedes usar un prefijo de país/empresa simulado (ej. 750 para México) seguido del ID con ceros a la izquierda
        $codigoBarras = '750' . str_pad($siguienteId, 10, '0', STR_PAD_LEFT);

        return $codigoBarras;

    } catch (Throwable $e) {
        // En caso de error, generamos un respaldo numérico basado en el timestamp actual
        error_log("Error crítico al generar código de barras: " . $e->getMessage());
        return '750' . time();
    }
}