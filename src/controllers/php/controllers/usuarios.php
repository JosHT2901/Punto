<?php

/**
 * Controlador de Usuarios
 * Centraliza y enruta las peticiones AJAX de manera segura.
 */

// Evitar salidas accidentales antes de tiempo
declare(strict_types=1);

// Cabecera opcional para asegurar respuesta en formato JSON (descomenta si aplica en tu proyecto)
// header('Content-Type: application/json; charset=UTF-8');

require_once __DIR__ . '/../models/usuarios.php';
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
    'obtener_usuarios'         => 'Obtener_Usuarios',
    'generar_nombre_usuario' => 'Generar_Usuario_Aleatorio',
    'gestionar_usuario' => 'Gestionar_Usuario',
    'obtener_usuarios_paginados' => 'Obtener_Usuarios_Paginados',
    'obtener_informacion_usuario' => 'Obtener_Informacion_Usuario',
    'procesar_reset_administrador' => 'Procesar_Reset_Administrador',
    'actualizar_password_reset' => 'Actualizar_Password_Reset',
    'actualizar_pin_reset' => 'Actualizar_Pin_Reset',
    'actualizar_permisos_usuario' => 'Actualizar_Permisos_Usuario',
    'deshabilitar_usuario'=>'Deshabilitar_Usuario',
    'habilitar_usuario'=>'Habilitar_Usuario',
    'eliminar_usuarios_masivo'=>'Eliminar_Usuarios_Masivo',
    'exportar_usuarios_masivo'=>'Exportar_Usuarios_Masivo',
    'habilitar_usuarios_masivo'=>'Habilitar_Usuarios_Masivo',
    'importar_usuarios'=>'Importar_Usuarios',
    'actualizar_password_reset_usuario_actual'=>'Actualizar_Password_Reset_Usuario_Actual',
    'actualizar_pin_reset_usuario_actual'=>'Actualizar_Pin_Reset_Usuario_Actual',
    'cerrar_sesion_usuario'=>'Cerrar_Sesion_Usuario',
    'obtener_informacion_usuario_actual'=>'Obtener_Informacion_Usuario_Actual',
    'actualizar_informacion_usuario_actual'=>'Actualizar_Informacion_Usuario_Actual',
    'obtener_imagen_usuario'=>'Obtener_Imagen_Usuario',
    'eliminar_imagen_usuario'=>'Eliminar_Imagen_Usuario',
    'gestionar_imagen_usuario'=>'Gestionar_Imagen_Usuario',
    'obtener_movimientos_paginados'=>'Obtener_Movimientos_Paginados',
    'obtener_modulos_y_acciones_movimientos'=>'Obtener_Modulos_Y_Acciones_Movimientos',
    'exportar_movimientos'=>'Exportar_Movimientos'
];

// Ejecutar el despachador central
DespacharAccion($accionesPermitidas);
