<?php 

function Generar_SKU(): string {
    try {
        $sql = "SELECT ID FROM productos ORDER BY ID DESC LIMIT 1";
        
        // Ejecutamos la consulta usando tu helper
        $resultado = Consultar_PDO($sql);
        
        // Verificamos si obtuvimos resultados y determinamos el siguiente número
        $siguienteId = 1;
        if (is_array($resultado) && count($resultado) > 0) {
            // Dependiendo de si Consultar_PDO retorna asociativo o numérico, tomamos el ID
            $ultimoRegistro = reset($resultado);
            $ultimoId = isset($ultimoRegistro['ID']) ? (int)$ultimoRegistro['ID'] : (int)reset($ultimoRegistro);
            $siguienteId = $ultimoId + 1;
        }

        // Generamos el SKU con un formato estándar (Ej: PRD-00048)
        $skuGenerado = 'PRD-' . str_pad($siguienteId, 5, '0', STR_PAD_LEFT);

        return $skuGenerado;

    } catch (Throwable $e) {
        // Registramos el error internamente y retornamos un respaldo basado en timestamp para no detener el flujo
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