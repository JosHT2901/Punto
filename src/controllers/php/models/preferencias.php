<?php

function Obtener_Preferencias_Usuario()
{
    try {
        if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
            session_start();
        }

        // 1. Obtener ID del usuario actual desde la sesión
        $usuarioId = (int) ($_SESSION['usuario']['id'] ?? $_SESSION['usuario']['ID'] ?? $_SESSION['usuario_id'] ?? 0);
        if ($usuarioId <= 0) {
            JsonResponse::error("No hay una sesión de usuario activa.", null, 401);
            return;
        }

        // 2. Consultar todas las filas clave-valor del usuario
        $filas = Consultar_PDO(
            "SELECT clave, valor 
             FROM usuarios_preferencias 
             WHERE usuario_id = :usuario_id",
            [':usuario_id' => $usuarioId]
        );

        // 3. Definir valores por defecto (si el usuario aún no guarda nada o le faltan claves nuevas)
        $preferencias = [
            'usuario_id'              => $usuarioId,
            'sucursal_default_id'     => null,
            'sucursal_comportamiento' => 'sesion',
            'sucursal_nombre'         => null,
            'sucursal_tipo'           => null,
            'seguridad_inactividad_min' => 0,
            'seguridad_2fa'           => 0,
            'reloj_formato'           => '12',
            'reloj_mostrar_segundos'  => 1,
            'tema_visual'             => 'light',
            'paginacion_tabla'        => 10
        ];

        // 4. Sobrescribir los valores por defecto con lo guardado en la base de datos
        if (!empty($filas) && is_array($filas)) {
            foreach ($filas as $fila) {
                $clave = $fila['clave'] ?? '';
                $valor = $fila['valor'] ?? null;

                if ($clave === '') {
                    continue;
                }

                // Si el valor almacenado es un JSON válido (ej. arreglo u objeto), lo decodificamos
                if (is_string($valor) && strlen($valor) > 1 && ($valor[0] === '{' || $valor[0] === '[')) {
                    $decodificado = json_decode($valor, true);
                    if (json_last_error() === JSON_ERROR_NONE) {
                        $valor = $decodificado;
                    }
                }

                $preferencias[$clave] = $valor;
            }
        }

        // 5. Normalizar tipos numéricos clave para facilitar la lectura en JavaScript
        if (!empty($preferencias['sucursal_default_id'])) {
            $preferencias['sucursal_default_id'] = (int) $preferencias['sucursal_default_id'];

            // Obtener nombre y tipo de la sucursal predeterminada si está configurada
            $sucursalInfo = Consultar_PDO(
                "SELECT nombre, tipo FROM sucursales WHERE ID = :id LIMIT 1",
                [':id' => $preferencias['sucursal_default_id']]
            );

            if (!empty($sucursalInfo[0])) {
                $preferencias['sucursal_nombre'] = $sucursalInfo[0]['nombre'];
                $preferencias['sucursal_tipo']   = $sucursalInfo[0]['tipo'];
            }
        } else {
            $preferencias['sucursal_default_id'] = null;
        }

        $preferencias['seguridad_inactividad_min'] = (int) $preferencias['seguridad_inactividad_min'];
        $preferencias['seguridad_2fa']             = (int) $preferencias['seguridad_2fa'];
        $preferencias['reloj_mostrar_segundos']    = (int) $preferencias['reloj_mostrar_segundos'];
        $preferencias['paginacion_tabla']          = (int) $preferencias['paginacion_tabla'];

        // 6. Responder con el estándar de éxito
        JsonResponse::success("Preferencias obtenidas correctamente.", $preferencias, 200);

    } catch (Throwable $e) {
        error_log("Error crítico en Obtener_Preferencias_Usuario: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al obtener las preferencias del usuario.", $e->getMessage(), 500);
    }
}

function Guardar_Preferencias_Usuario($data)
{
    try {
        if (session_status() === PHP_SESSION_NONE && !headers_sent()) {
            session_start();
        }

        // 1. Obtener ID del usuario activo de la sesión
        $usuarioId = (int) ($_SESSION['usuario']['id'] ?? $_SESSION['usuario']['ID'] ?? $_SESSION['usuario_id'] ?? 0);
        if ($usuarioId <= 0) {
            JsonResponse::error("No hay una sesión de usuario activa.", null, 401);
            return;
        }

        // Obtener ID de sesión activa si se almacena en la sesión
        $sesionId = $_SESSION['usuario']['sesion_id'] ?? $_SESSION['sesion_id'] ?? session_id();

        // 2. Extraer correctamente las preferencias (por si $data viene envuelto en ['preferencias' => [...]])
        $preferenciasInput = [];
        if (is_array($data)) {
            $preferenciasInput = isset($data['preferencias']) && is_array($data['preferencias']) 
                ? $data['preferencias'] 
                : $data;
        }

        // Limpiamos la 'accion' si se coló dentro del arreglo para que no la inserte como preferencia en la BD
        unset($preferenciasInput['accion']);

        if (empty($preferenciasInput)) {
            JsonResponse::error("No se recibieron datos válidos para guardar.", null, 400);
            return;
        }

        // 3. Validaciones de negocio en servidor
        if (isset($preferenciasInput['seguridad_inactividad_min'])) {
            $inactividad = (int) $preferenciasInput['seguridad_inactividad_min'];
            // Permite 0 (desactivado) o un rango de 5 a 240 minutos
            if ($inactividad < 0 || ($inactividad > 0 && $inactividad < 5) || $inactividad > 240) {
                JsonResponse::error("El tiempo de inactividad debe ser 0 o estar entre 5 y 240 minutos.", null, 400);
                return;
            }
        }

        if (isset($preferenciasInput['reloj_formato'])) {
            $formatosHoraValidos = ['g:i a', 'h:i:s A', 'H:i', 'H:i:s'];
            if (!in_array((string)$preferenciasInput['reloj_formato'], $formatosHoraValidos, true)) {
                JsonResponse::error("El formato de hora seleccionado no es válido.", null, 400);
                return;
            }
        }

        if (isset($preferenciasInput['sucursal_comportamiento'])) {
            $comportamientosValidos = ['sesion', 'actualizar'];
            if (!in_array((string)$preferenciasInput['sucursal_comportamiento'], $comportamientosValidos, true)) {
                JsonResponse::error("El comportamiento de sucursal seleccionado no es válido.", null, 400);
                return;
            }
        }

        // 4. Inserción o actualización dinámica en la base de datos (EAV: una fila por cada clave)
        $sql = "INSERT INTO usuarios_preferencias (usuario_id, clave, valor)
                VALUES (:usuario_id, :clave, :valor)
                ON DUPLICATE KEY UPDATE valor = VALUES(valor), updated_at = CURRENT_TIMESTAMP()";

        foreach ($preferenciasInput as $clave => $valor) {
            $claveLimpia = trim((string) $clave);
            if ($claveLimpia === '') continue;

            // Normalizar el valor a almacenar como cadena o nulo
            if (is_array($valor) || is_object($valor)) {
                $valorFormateado = json_encode($valor, JSON_UNESCAPED_UNICODE);
            } elseif (is_bool($valor)) {
                $valorFormateado = $valor ? '1' : '0';
            } else {
                $valorFormateado = $valor !== null ? (string) $valor : null;
            }

            Consultar_PDO($sql, [
                ':usuario_id' => $usuarioId,
                ':clave'      => $claveLimpia,
                ':valor'      => $valorFormateado
            ]);
        }

        // 5. Registrar en la bitácora de auditoría
        $ipOrigen = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
        
        if (function_exists('RegistrarBitacoraAccion')) {
            RegistrarBitacoraAccion(
                $usuarioId,
                $sesionId,
                'SISTEMA_VARIABLES',
                'ACTUALIZAR',
                null,
                "Se actualizaron las preferencias del sistema (IP: {$ipOrigen}).",
                null,
                $preferenciasInput
            );
        }

        JsonResponse::success("Preferencias guardadas correctamente.", null, 200);

    } catch (Throwable $e) {
        error_log("Error crítico en Guardar_Preferencias_Usuario: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error al guardar las preferencias.", $e->getMessage(), 500);
    }
}