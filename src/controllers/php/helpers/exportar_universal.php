<?php
declare(strict_types=1);

/**
 * Función central para ejecutar la exportación a cualquier formato desde otra función o controlador PHP.
 */
function EjecutarExportacion(string $formato, string $sql, array $params = [], string $titulo = 'Reporte del Sistema', string $archivo = 'exportacion'): void {
    $formato = strtolower(trim(str_replace('.', '', $formato)));

    $formatosValidos = ['pdf', 'csv', 'xml', 'xls', 'xlsx', 'docx', 'doc', 'txt', 'json'];
    if (!in_array($formato, $formatosValidos, true)) {
        JsonResponse::error("Formato no válido o no soportado: {$formato}", null, 400);
    }

    if (empty($sql)) {
        JsonResponse::error('La consulta SQL no fue proporcionada.', null, 400);
    }

    try {
        $sqlTrimmed = ltrim($sql);
        if (stripos($sqlTrimmed, 'SELECT') !== 0) {
            JsonResponse::error('Consulta no autorizada.', null, 403);
        }

        $registros = Consultar_PDO($sql, $params);

        if (empty($registros)) {
            JsonResponse::error('No se encontraron registros para exportar.', null, 404);
        }

        $nombreFinal = $archivo . '_' . date('Y-m-d_H-i-s') . '.' . $formato;

        switch ($formato) {
            case 'csv':
                exportarCsv($registros, $nombreFinal);
                break;
            case 'xml':
                exportarXml($registros, $nombreFinal, ucfirst($archivo));
                break;
            case 'xls':
            case 'xlsx':
                exportarExcelHtml($registros, $nombreFinal, $titulo);
                break;
            case 'pdf':
                exportarPdfReal($registros, $nombreFinal, $titulo); // <-- Usamos PDF real con librería
                break;
            case 'json':
                exportarJson($registros, $nombreFinal);
                break;
            case 'txt':
                exportarTxt($registros, $nombreFinal, $titulo);
                break;
            case 'doc':
            case 'docx':
                exportarWordHtml($registros, $nombreFinal, $titulo);
                break;
        }

    } catch (Throwable $e) {
        JsonResponse::error('Error al generar la exportación: ' . $e->getMessage(), null, 500);
    }
}


/* ==========================================================
   HELPERS Y FUNCIONES DE EXPORTACIÓN AMPLIADAS
   ========================================================== */

function formatearValorData($valor): string {
    if (is_null($valor)) return '';
    if (is_bool($valor)) return $valor ? 'Sí' : 'No';
    if (is_numeric($valor)) return (string) $valor;
    return trim((string) $valor);
}

function limpiarBufferSalida(): void {
    if (ob_get_level() > 0) ob_end_clean();
}

function exportarCsv(array $data, string $filename): void {
    limpiarBufferSalida();
    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    
    $output = fopen('php://output', 'w');
    fprintf($output, chr(0xEF).chr(0xBB).chr(0xBF));

    if (!empty($data)) {
        // 1. Agregamos el parámetro de escape explicito `'"'` en la cabecera
        fputcsv($output, array_keys($data[0]), ',', '"', '"');
        
        foreach ($data as $row) {
            $filaLimpia = [];
            foreach ($row as $val) $filaLimpia[] = formatearValorData($val);
            
            // 2. Agregamos el parámetro de escape explicito `'"'` en los datos
            fputcsv($output, $filaLimpia, ',', '"', '"');
        }
    }
    fclose($output);
    exit;
}

function exportarXml(array $data, string $filename, string $raiz): void {
    limpiarBufferSalida();
    header('Content-Type: application/xml; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');

    $xml = new SimpleXMLElement("<{$raiz}List/>");
    foreach ($data as $row) {
        $item = $xml->addChild('Item');
        foreach ($row as $key => $value) {
            $nombreTag = preg_replace('/[^a-zA-Z0-9_]/', '_', $key);
            $item->addChild($nombreTag, htmlspecialchars(formatearValorData($value), ENT_QUOTES, 'UTF-8'));
        }
    }
    echo $xml->asXML();
    exit;
}

function exportarExcelHtml(array $data, string $filename, string $titulo): void {
    limpiarBufferSalida();
    header('Content-Type: application/vnd.ms-excel; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');

    echo '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">';
    echo '<head><meta charset="UTF-8"><title>' . htmlspecialchars($titulo) . '</title></head>';
    echo '<body><h3>' . htmlspecialchars($titulo) . '</h3><table border="1">';
    
    echo '<tr style="background-color: #03618d; color: #ffffff; font-weight: bold;">';
    foreach (array_keys($data[0]) as $col) echo '<th>' . htmlspecialchars(str_replace('_', ' ', $col)) . '</th>';
    echo '</tr>';

    foreach ($data as $row) {
        echo '<tr>';
        foreach ($row as $val) {
            $valLimpio = formatearValorData($val);
            $align = is_numeric($val) && !is_string($val) ? 'right' : 'left';
            echo '<td align="' . $align . '">' . htmlspecialchars($valLimpio) . '</td>';
        }
        echo '</tr>';
    }
    echo '</table></body></html>';
    exit;
}

/**
 * Genera un archivo PDF real utilizando la librería Dompdf
 */
function exportarPdfReal(array $data, string $filename, string $titulo): void {
    limpiarBufferSalida();

    // Verificamos si Dompdf está instalado en el proyecto (ej. vía Composer)
    // Si usas otra ruta o autoload, asegúrate de requerirlo previamente en tu bootstrap
    if (!class_exists('Dompdf\Dompdf')) {
        JsonResponse::error('La librería Dompdf no está instalada en el servidor. Ejecute composer require dompdf/dompdf', null, 500);
    }

    // Construimos el HTML limpio para el PDF
    $html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>' . htmlspecialchars($titulo) . '</title>';
    $html .= '<style>
                body { font-family: Helvetica, Arial, sans-serif; font-size: 10px; color: #333; } 
                h2 { color: #03618d; text-align: center; margin-bottom: 15px; font-size: 14px; } 
                table { width: 100%; border-collapse: collapse; margin-top: 10px; } 
                th, td { border: 1px solid #ddd; padding: 6px; text-align: left; } 
                th { background-color: #03618d; color: #fff; font-weight: bold; } 
                tr:nth-child(even) { background-color: #f9f9f9; }
                .text-right { text-align: right; }
              </style>';
    $html .= '</head><body>';
    $html .= '<h2>' . htmlspecialchars($titulo) . '</h2>';
    $html .= '<p style="text-align: right; font-size: 8px; color: #666;">Generado: ' . date('d/m/Y H:i') . '</p>';
    $html .= '<table>';
    
    $html .= '<tr>';
    foreach (array_keys($data[0]) as $col) {
        $html .= '<th>' . htmlspecialchars(str_replace('_', ' ', $col)) . '</th>';
    }
    $html .= '</tr>';

    foreach ($data as $row) {
        $html .= '<tr>';
        foreach ($row as $val) {
            $valLimpio = formatearValorData($val);
            $cls = (is_numeric($val) && !is_string($val)) ? ' class="text-right"' : '';
            $html .= '<td' . $cls . '>' . htmlspecialchars($valLimpio) . '</td>';
        }
        $html .= '</tr>';
    }
    $html .= '</table></body></html>';

    // Instanciamos Dompdf
    $dompdf = new Dompdf\Dompdf();
    $dompdf->loadHtml($html);
    
    // Configuramos tamaño de papel y orientación (Carta / Horizontal o Vertical)
    $dompdf->setPaper('letter', 'landscape'); // 'landscape' para tablas anchas con muchas columnas
    $dompdf->render();

    // Forzamos la descarga del PDF binario real
    $dompdf->stream($filename, ["Attachment" => true]);
    exit;
}

function exportarJson(array $data, string $filename): void {
    limpiarBufferSalida();
    header('Content-Type: application/json; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');

    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT | JSON_THROW_ON_ERROR);
    exit;
}

function exportarTxt(array $data, string $filename, string $titulo): void {
    limpiarBufferSalida();
    header('Content-Type: text/plain; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');

    echo "=== " . mb_strtoupper($titulo) . " ===\n";
    echo "Fecha: " . date('d/m/Y H:i:s') . "\n\n";

    if (!empty($data)) {
        $columnas = array_keys($data[0]);
        echo implode("\t", $columnas) . "\n";
        echo str_repeat("-", 80) . "\n";

        foreach ($data as $row) {
            $linea = [];
            foreach ($row as $val) {
                $linea[] = formatearValorData($val);
            }
            echo implode("\t", $linea) . "\n";
        }
    }
    exit;
}

function exportarWordHtml(array $data, string $filename, string $titulo): void {
    limpiarBufferSalida();
    header('Content-Type: application/vnd.ms-word; charset=utf-8');
    header('Content-Disposition: attachment; filename="' . $filename . '"');

    echo '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">';
    echo '<head><meta charset="UTF-8"><title>' . htmlspecialchars($titulo) . '</title></head>';
    echo '<body>';
    echo '<h2 style="color: #03618d; text-align: center;">' . htmlspecialchars($titulo) . '</h2>';
    echo '<p style="font-size: 10px; color: #666; text-align: right;">Generado el: ' . date('d/m/Y H:i') . '</p>';
    echo '<table border="1" cellspacing="0" cellpadding="5" style="border-collapse: collapse; width: 100%; font-family: Arial; font-size: 11px;">';
    
    echo '<tr style="background-color: #03618d; color: #ffffff; font-weight: bold;">';
    foreach (array_keys($data[0]) as $col) {
        echo '<th style="padding: 6px; border: 1px solid #999;">' . htmlspecialchars(str_replace('_', ' ', $col)) . '</th>';
    }
    echo '</tr>';

    foreach ($data as $row) {
        echo '<tr>';
        foreach ($row as $val) {
            echo '<td style="padding: 5px; border: 1px solid #ddd;">' . htmlspecialchars(formatearValorData($val)) . '</td>';
        }
        echo '</tr>';
    }

    echo '</table></body></html>';
    exit;
}