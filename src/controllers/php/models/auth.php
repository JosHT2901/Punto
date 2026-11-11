<?php 
function Verificar_Credenciales_Usuario($data) {
    // 1. Obtener los datos enviados en el payload
    $nombreUsuario     = trim($data['usuario'] ?? '');
    $password          = $data['password'] ?? '';
    $pin               = trim($data['pin'] ?? '');
    $idUsuario         = $data['id_usuario'] ?? null;
    $modoAutenticacion = $data['modo_auth'] ?? 'ambos'; 

    // 2. Determinar si estamos operando con usuario explícito o mediante sesión
    $tieneUsuarioExplicito = !empty($nombreUsuario) || !empty($idUsuario);

    if (!$tieneUsuarioExplicito) {
        // Sin usuario explícito -> Rescatamos de la sesión activa
        if (isset($_SESSION['usuario']) && !empty($_SESSION['usuario']['id'])) {
            $idUsuario = $_SESSION['usuario']['id'];
        } else {
            JsonResponse::error('No se encontró una sesión activa para validar las credenciales.', 230, 200);
        }
    }

    // 3. Consultar usuario y sus credenciales haciendo JOIN entre `usuarios` y `usuarios_password`
    $sql = "SELECT u.ID, u.nombre_usuario, p.password, p.pin 
            FROM usuarios u 
            LEFT JOIN usuarios_password p ON u.ID = p.usuario_id ";
    
    $params = [];
    if (!empty($idUsuario)) {
        $sql .= "WHERE u.ID = :id";
        $params[':id'] = $idUsuario;
    } else {
        $sql .= "WHERE u.nombre_usuario = :nombre_usuario";
        $params[':nombre_usuario'] = $nombreUsuario;
    }

    $resultadoQuery = Consultar_PDO($sql, $params, false);

    $registro = null;
    if (is_array($resultadoQuery)) {
        if (isset($resultadoQuery[0]) && is_array($resultadoQuery[0])) {
            $registro = $resultadoQuery[0];
        } else {
            $registro = $resultadoQuery;
        }
    }

    if (!$registro || empty($registro['ID'])) {
        JsonResponse::error('Usuario no encontrado en el sistema.', 230, 200);
    }

    // 4. Validaciones según el contexto (Con usuario o Sin usuario)
    if ($tieneUsuarioExplicito) {
        // CASO A: CON USUARIO -> Debe validar obligatoriamente usuario y contraseña
        if (empty($password) || empty($registro['password']) || !password_verify($password, $registro['password'])) {
            JsonResponse::error('La contraseña ingresada es incorrecta.', 230, 200);
        }
    } else {
        // CASO B: SIN USUARIO (Sesión activa) -> Permite pasar si el valor ingresado coincide con la contraseña O con el PIN
        $passOk = (!empty($password) && !empty($registro['password']) && password_verify($password, $registro['password']));
        $pinOk  = (!empty($pin) && !empty($registro['pin']) && password_verify($pin, $registro['pin']));

        if (!$passOk && !$pinOk) {
            JsonResponse::error('La contraseña o el PIN ingresados son incorrectos.', 230, 200);
        }
    }

    // 5. Autenticación exitosa
    return [
        'status' => true,
        'id_usuario' => $registro['ID'],
        'usuario' => $registro['nombre_usuario']
    ];
}