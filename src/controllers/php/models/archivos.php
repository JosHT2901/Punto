<?php 
function Descargar_Plantilla($Datos) {
    try {
        // Verificamos si llegó la acción correcta (opcional pero recomendado)
        $url = $_POST['url'] ?? '';
        $rutaArchivo = __DIR__ . $url; 
        $nombreDescarga=$_POST['nombre']??'plantilla.xlsx';

        // 1. Validar si el archivo existe físicamente
        if (!file_exists($rutaArchivo)) {
            // Usamos código 404 para indicar que el archivo no se encontró
            JsonResponse::error("El archivo de plantilla no se encuentra disponible en el servidor.", null, 404);
        }

        // 2. Limpiar búfer para evitar corrupción de bytes binarios
        if (ob_get_level() > 0) {
            ob_end_clean();
        }


        // 4. Configurar los headers HTTP para descarga de archivos binarios
        header('Content-Description: File Transfer');
        header('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        header('Content-Disposition: attachment; filename="' . $nombreDescarga . '"');
        header('Content-Transfer-Encoding: binary');
        header('Expires: 0');
        header('Cache-Control: must-revalidate');
        header('Pragma: public');
        header('Content-Length: ' . filesize($rutaArchivo));

        // 5. Leer y enviar el archivo al flujo de salida
        readfile($rutaArchivo);
        exit;

    } catch (Exception $e) {
        // Si ocurre cualquier excepción imprevista, la mandamos como JSON estructurado
        JsonResponse::error("Ocurrió un error al procesar la descarga: " . $e->getMessage(), null, 500);
    }
}
