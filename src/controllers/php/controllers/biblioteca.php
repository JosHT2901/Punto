<?php
/**
 * Controlador de Usuarios
 * Centraliza y enruta las peticiones AJAX de manera segura.
 */

// Evitar salidas accidentales antes de tiempo
declare(strict_types=1);

// Cabecera opcional para asegurar respuesta en formato JSON (descomenta si aplica en tu proyecto)
// header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../models/biblioteca.php';
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
    'obtener_archivos_biblioteca'         => 'Obtener_Archivos_Biblioteca',
    'subir_archivos_biblioteca'=>'Subir_Archivos_Biblioteca',
    'obtener_tipos_archivos'=>'Obtener_Tipos_Archivos_Biblioteca',
    'actualizar_apertura_documento'=>'Registrar_Apertura_Documento_Biblioteca',
    'eliminar_archivo'=>'Eliminar_Archivo_Biblioteca',
    'crear_copia_archivo'=>'Crear_Copia_Archivo_Biblioteca',
    'eliminar_archivos_multiples'=>'Eliminar_Multiples_Archivos_Biblioteca',
    'descargar_archivo_individual'=>'Descargar_Archivo_Individual',
    'descargar_archivos_zip'=>'Descargar_Multiples_Archivos_Zip',
    'cambiar_nombre_archivo'=>'Cambiar_Nombre_Archivo_Biblioteca',
    'asignar_usuarios_archivo'=>'Guardar_Asignacion_Archivo_Usuarios'
];

// Ejecutar el despachador central
DespacharAccion($accionesPermitidas);