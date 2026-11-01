<?php
/**
 * Controlador de Usuarios
 * Centraliza y enruta las peticiones AJAX de manera segura.
 */

// Evitar salidas accidentales antes de tiempo
declare(strict_types=1);

// Cabecera opcional para asegurar respuesta en formato JSON (descomenta si aplica en tu proyecto)
// header('Content-Type: application/json; charset=UTF-8');

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
    'obtener_variables'         => 'Obtener_Variables_Sistema',
    'guardar_variables'=>'Gestionar_Variables_Sistema',
    'obtener_informacion_empresa'=>'Obtener_Informacion_Empresa',
    'guardar_informacion_empresa'=>'Guardar_Informacion_Empresa',
    'gestionar_logo_empresa'=>'Gestionar_Logo_Empresa',
    'obtener_logo_empresa'=>'Obtener_Logo_Empresa',
    'eliminar_logo_empresa'=>'Eliminar_Logo_Empresa'
];

// Ejecutar el despachador central
DespacharAccion($accionesPermitidas);