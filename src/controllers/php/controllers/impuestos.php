<?php
/**
 * Controlador de Usuarios
 * Centraliza y enruta las peticiones AJAX de manera segura.
 */

// Evitar salidas accidentales antes de tiempo
declare(strict_types=1);

// Cabecera opcional para asegurar respuesta en formato JSON (descomenta si aplica en tu proyecto)
// header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../models/impuestos.php';
require_once __DIR__ . '/../models/ajustes.php';
require_once __DIR__ . '/../main/controller.php';

// Validar estrictamente que la petición sea por POST (seguridad básica para AJAX)
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405); // Method Not Allowed
    echo json_encode([
        'status' => false,
        'mensaje' => 'Método no permitido.'
    ]);
    exit;
}

// Obtener la acción de forma segura eliminando espacios en blanco accidentales
$accion = trim($_POST['accion'] ?? '');

// Mapeo de acciones permitidas
$accionesPermitidas = [
    'obtener_esquemas_fiscales'         => 'Obtener_Esquemas_Fiscales',
    'guardar_esquema_fiscal'=>'Guardar_Esquema_Fiscal',
    'obtener_esquemas_impuestos_paginados'=>'Obtener_Esquemas_Impuestos_Paginados',
    'obtener_impuesto_por_id'=>'Obtener_Esquema_Impuesto_Por_Id',
    'actualizar_esquema_fiscal'=>'Actualizar_Esquema_Fiscal',
    'eliminar_esquema_fiscal'=>'Eliminar_Esquema_Fiscal',
    'habilitar_esquema_fiscal'=>'Habilitar_Esquema_Fiscal',
    'habilitar_esquemas_fiscales'=>'Habilitar_Esquemas_Fiscales',
    'eliminar_esquemas_fiscales'=>'Eliminar_Esquemas_Fiscales',
    'exportar_esquemas'=>'Exportar_Esquemas_Fiscales'
];

// Ejecutar el despachador central
DespacharAccion($accionesPermitidas);