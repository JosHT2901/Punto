<?php
/**
 * Controlador de Usuarios
 * Centraliza y enruta las peticiones AJAX de manera segura.
 */

// Evitar salidas accidentales antes de tiempo
declare(strict_types=1);

// Cabecera opcional para asegurar respuesta en formato JSON (descomenta si aplica en tu proyecto)
// header('Content-Type: application/json; charset=UTF-8');
require_once __DIR__ . '/../main/controller.php';
require_once __DIR__ . '/../models/permisos.php';


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
    'obtener_permisos'         => 'Obtener_Permisos',
];

// Ejecutar el despachador central
DespacharAccion($accionesPermitidas);