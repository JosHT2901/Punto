<?php
// Asegurarse de que la sesión esté iniciada antes de asignar valores
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Ejemplo de cómo se asignan los datos al iniciar sesión correctamente (por ejemplo, en el login.php)
$_SESSION['usuario'] = [
    'id' => 48,
    'nombre' => 'Josthin Hernandez',
    'correo' => 'josthin@correo.com',
    'imagen' => 'uploads/usuarios/48_perfil.jpg', // Ruta relativa o URL de su imagen de perfil
    'sucursal_actual'=>31
];