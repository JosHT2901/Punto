<?php

/**
 * Obtiene todos los productos registrados con su información completa y detallada
 * de cada uno de sus módulos relacionados.
 * 
 * @return array Arreglo con todos los productos y sus respectivas colecciones.
 */
function Obtener_Todos_Productos_Completos(): void {
    try {
        // 1. Obtener todos los productos principales con sus datos básicos, categoría, marca, fiscal y costos de compra
        $sqlPrincipal = "SELECT 
                            p.ID, p.Codigo, p.SKU, p.Descripcion, 
                            p.Categoria_ID, c.Nombre AS Categoria_Nombre,
                            p.Marca_ID, m.Nombre AS Marca_Nombre,
                            p.Habilitado, p.Fecha_Registro, p.Registrado_Por,
                            f.Clave_SAT_General, f.Perfil_Impuesto_ID, f.Contiene_Impuestos,
                            cc.Tipo_Compra, cc.Piezas_Compra, cc.Costo_Total, cc.Costo_Base_Unitario
                        FROM productos p
                        INNER JOIN categorias c ON p.Categoria_ID = c.ID
                        INNER JOIN marcas m ON p.Marca_ID = m.ID
                        LEFT JOIN producto_fiscal f ON p.ID = f.Producto_ID
                        LEFT JOIN producto_costos_compra cc ON p.ID = cc.Producto_ID
                        ORDER BY p.ID DESC";

        $productos = Consultar_PDO($sqlPrincipal);

        if (!is_array($productos)) {
            JsonResponse::error("No se pudo obtener el listado de productos.", null, 500);
            return;
        }

        // Si está vacío, podemos retornar un array vacío con un mensaje de éxito o controlado
        if (empty($productos)) {
            JsonResponse::success("No se encontraron productos registrados", [], 200);
            return;
        }

        // 2. Iterar sobre cada producto para adjuntar sus colecciones hijas de manera optimizada
        foreach ($productos as &$producto) {
            $productoId = $producto['ID'];

            // Adjuntar imágenes
            $producto['Imagenes'] = Consultar_PDO(
                "SELECT ID, Url, Es_Portada, Orden FROM producto_imagenes WHERE Producto_ID = :id ORDER BY Orden ASC",
                [':id' => $productoId]
            ) ?: [];

            // Adjuntar equivalencias de medida
            $producto['Equivalencias'] = Consultar_PDO(
                "SELECT ID, Presentacion, Factor_Equivalencia, Costo_Unitario FROM producto_equivalencias WHERE Producto_ID = :id",
                [':id' => $productoId]
            ) ?: [];

            // Adjuntar precios de venta y márgenes
            $producto['Precios'] = Consultar_PDO(
                "SELECT ID, Nivel_Precio, Margen_Porcentaje, Precio_Venta FROM producto_precios WHERE Producto_ID = :id",
                [':id' => $productoId]
            ) ?: [];

            // Adjuntar atributos dinámicos
            $producto['Atributos'] = Consultar_PDO(
                "SELECT ID, Atributo_Nombre, Valor FROM producto_atributos WHERE Producto_ID = :id",
                [':id' => $productoId]
            ) ?: [];

            // Adjuntar ubicaciones en sucursales
            $producto['Ubicaciones'] = Consultar_PDO(
                "SELECT ID, Sucursal_ID, Pasillo, Anaquel, Nivel FROM producto_ubicaciones WHERE Producto_ID = :id",
                [':id' => $productoId]
            ) ?: [];

            // Adjuntar existencias e inventario
            $producto['Existencias'] = Consultar_PDO(
                "SELECT ID, Sucursal_ID, Stock_Actual, Stock_Minimo, Stock_Maximo FROM producto_existencias WHERE Producto_ID = :id",
                [':id' => $productoId]
            ) ?: [];

            // Adjuntar códigos de barras y SAT por empaque
            $producto['Codigos_SAT'] = Consultar_PDO(
                "SELECT ID, Presentacion, Codigo_Barras, Clave_SAT FROM producto_codigos_sat WHERE Producto_ID = :id",
                [':id' => $productoId]
            ) ?: [];
        }
        unset($producto); // Romper la referencia del foreach

        // 3. Retorno estandarizado mediante JsonResponse
        JsonResponse::success("Productos obtenidos correctamente", $productos, 200);

    } catch (Throwable $e) {
        error_log("Error crítico al obtener el listado completo de productos: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error inesperado al consultar los productos.", null, 500);
    }
}

function Gestionar_Producto(array $datosCrudos): void {
    try {
        // 1. Asegurar sesión activa
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener PDO
        $pdo = Conexion();

        // 3. Validar sesión
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        $sesionId  = $_SESSION['sesion_id'] ?? ($_SESSION['id_sesion'] ?? null);

        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa. Por favor, inicia sesión nuevamente.', null, 401);
        }

        // --- NORMALIZACIÓN DE ENTRADA ---
        $datos = $datosCrudos;
        $jsonString = null;
        if (isset($datosCrudos['valor_plano']) && is_string($datosCrudos['valor_plano'])) {
            $jsonString = $datosCrudos['valor_plano'];
        } elseif (isset($datosCrudos['data']) && is_string($datosCrudos['data'])) {
            $jsonString = $datosCrudos['data'];
        }

        if (!empty($jsonString)) {
            $decodificado = json_decode($jsonString, true);
            if (is_array($decodificado)) {
                $datos = array_merge($datosCrudos, $decodificado);
            }
        }

        // Extraer elementos del Wizard de manera segura
        $identificacion = $datos['identificacion'][0] ?? ($datos['identificacion'] ?? []);
        $infoBasica     = $datos['informacionBasica'][0] ?? ($datos['informacionBasica'] ?? []);
        $fiscalData     = $datos['fiscal'][0] ?? ($datos['fiscal'] ?? []);
        $costosData     = $datos['costos'][0] ?? ($datos['costos'] ?? []);
        $formasVentaArr = $datos['formas_venta'] ?? ($costosData['formasVentaData'] ?? []);
        $preciosArr     = $datos['precios'] ?? ($datos['preciosData'] ?? ($costosData['preciosData'] ?? []));

        // Mapear variables principales
        $idProducto    = !empty($datos['id']) ? intval($datos['id']) : (!empty($identificacion['id']) ? intval($identificacion['id']) : 0);
        $codigo        = trim($identificacion['codigo'] ?? ($datos['codigo'] ?? ''));
        $sku           = trim($identificacion['sku'] ?? ($datos['sku'] ?? ''));
        $nombre        = trim($infoBasica['descripcion'] ?? ($infoBasica['nombre'] ?? ($datos['nombre'] ?? '')));
        
        $categoriaId   = !empty($infoBasica['id_categoria']) ? intval($infoBasica['id_categoria']) : (!empty($datos['categoria_id']) ? intval($datos['categoria_id']) : null);
        $marcaId       = !empty($infoBasica['id_marca']) ? intval($infoBasica['id_marca']) : (!empty($datos['marca_id']) ? intval($datos['marca_id']) : null);

        // Secciones relacionales
        $fiscal        = $fiscalData;
        $costosCompra  = $costosData;
        $formasVenta   = is_array($formasVentaArr) ? $formasVentaArr : [];
        $precios       = is_array($preciosArr) ? $preciosArr : [];
        $atributos     = $datos['atributos'] ?? [];
        $ubicaciones   = is_array($datos['ubicaciones'] ?? null) ? $datos['ubicaciones'] : [];
        $existencias   = is_array($datos['existencias'] ?? null) ? $datos['existencias'] : [];

        // 4. Validar permisos
        $tipo = trim($datos['tipo'] ?? 'unica');
        $permisoRequerido = ($tipo === 'editar') ? 'editar_productos' : 'crear_productos';
        if (!TienePermiso($pdo, $permisoRequerido)) {
            JsonResponse::error('No cuentas con los permisos necesarios para realizar esta acción.', null, 403);
        }

        // Validaciones básicas de negocio
        if (empty($nombre)) {
            JsonResponse::error('El nombre comercial del producto es obligatorio.', ['infoBasica' => $infoBasica]);
        }
        if (empty($codigo)) JsonResponse::error('El código de barras o código interno es obligatorio.');
        if (empty($sku)) JsonResponse::error('El SKU del producto es obligatorio.');

        // Iniciar Transacción SQL
        $pdo->beginTransaction();

        // --- FLUJO A: EDICIÓN DE PRODUCTO ---
        if ($tipo === 'editar') {
            if ($idProducto <= 0) {
                JsonResponse::error('El ID del producto a editar no es válido.');
            }

            $stmtAnt = $pdo->prepare("SELECT * FROM productos WHERE ID = :id");
            $stmtAnt->execute([':id' => $idProducto]);
            if (!$stmtAnt->fetch()) {
                $pdo->rollBack();
                JsonResponse::error('El producto que intentas editar no existe.');
            }

            // Validar duplicados
            $stmtCheckCod = $pdo->prepare("SELECT ID FROM productos WHERE codigo = :codigo AND ID != :id LIMIT 1");
            $stmtCheckCod->execute([':codigo' => $codigo, ':id' => $idProducto]);
            if ($stmtCheckCod->fetch()) {
                $pdo->rollBack();
                JsonResponse::error('El código ingresado ya pertenece a otro producto.');
            }

            $stmtCheckSku = $pdo->prepare("SELECT ID FROM productos WHERE sku = :sku AND ID != :id LIMIT 1");
            $stmtCheckSku->execute([':sku' => $sku, ':id' => $idProducto]);
            if ($stmtCheckSku->fetch()) {
                $pdo->rollBack();
                JsonResponse::error('El SKU ingresado ya pertenece a otro producto.');
            }

            $sqlProd = "UPDATE productos SET 
                            codigo = :codigo, sku = :sku, categoria_id = :categoria_id, 
                            nombre = :nombre, marca_id = :marca_id, 
                            modificado_por = :modificado_por, ultima_modificacion = NOW()
                        WHERE ID = :id";
            $pdo->prepare($sqlProd)->execute([
                ':codigo' => $codigo, ':sku' => $sku, ':categoria_id' => $categoriaId,
                ':nombre' => $nombre, ':marca_id' => $marcaId,
                ':modificado_por' => $usuarioId, ':id' => $idProducto
            ]);

            // Limpiar relaciones previas
            $pdo->prepare("DELETE FROM producto_formas_venta WHERE Producto_ID = ?")->execute([$idProducto]);
            $pdo->prepare("DELETE FROM producto_precios WHERE Producto_ID = ?")->execute([$idProducto]);
            $pdo->prepare("DELETE FROM producto_codigos_sat WHERE Producto_ID = ?")->execute([$idProducto]);
            $pdo->prepare("DELETE FROM producto_atributos WHERE Producto_ID = ?")->execute([$idProducto]);
            $pdo->prepare("DELETE FROM producto_ubicaciones WHERE Producto_ID = ?")->execute([$idProducto]);
            $pdo->prepare("DELETE FROM producto_existencias WHERE Producto_ID = ?")->execute([$idProducto]);
            $pdo->prepare("DELETE FROM producto_costos_compra WHERE Producto_ID = ?")->execute([$idProducto]);
            $pdo->prepare("DELETE FROM producto_fiscal WHERE Producto_ID = ?")->execute([$idProducto]);
            $pdo->prepare("DELETE FROM producto_imagenes WHERE Producto_ID = ?")->execute([$idProducto]);

        } else {
            // --- FLUJO B: CREACIÓN DE PRODUCTO ---
            $stmtCheckCod = $pdo->prepare("SELECT ID FROM productos WHERE codigo = :codigo LIMIT 1");
            $stmtCheckCod->execute([':codigo' => $codigo]);
            if ($stmtCheckCod->fetch()) {
                $pdo->rollBack();
                JsonResponse::error('El código de barras ya se encuentra registrado.');
            }

            $stmtCheckSku = $pdo->prepare("SELECT ID FROM productos WHERE sku = :sku LIMIT 1");
            $stmtCheckSku->execute([':sku' => $sku]);
            if ($stmtCheckSku->fetch()) {
                $pdo->rollBack();
                JsonResponse::error('El SKU ingresado ya se encuentra registrado.');
            }

            $sqlProd = "INSERT INTO productos (codigo, sku, categoria_id, nombre, marca_id, creado_por, habilitado) 
                        VALUES (:codigo, :sku, :categoria_id, :nombre, :marca_id, :creado_por, 1)";
            $pdo->prepare($sqlProd)->execute([
                ':codigo' => $codigo, ':sku' => $sku, ':categoria_id' => $categoriaId,
                ':nombre' => $nombre, ':marca_id' => $marcaId,
                ':creado_por' => $usuarioId
            ]);
            $idProducto = $pdo->lastInsertId();
        }

        // ==========================================
        // 6. INSERCIÓN DE DATOS RELACIONALES
        // ==========================================

        // A. Costos de Compra
        if (!empty($costosCompra)) {
            $primerPrecio = $precios[0] ?? [];
            $contieneImpuestos = !empty($costosCompra['contieneImpuestos']) || 
                                 !empty($costosCompra['con_impuestos']) || 
                                 !empty($primerPrecio['contiene_impuestos']) ? 1 : 0;

            $stmtCC = $pdo->prepare("INSERT INTO producto_costos_compra (Producto_ID, Tipo_Compra, Costo_Total, Unidades_Intermedias, Piezas_Por_Unidad, Piezas_Compra, Costo_Base_Unitario, Contiene_Impuestos) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
            $stmtCC->execute([
                $idProducto,
                $costosCompra['nombreEmpaque'] ?? ($costosCompra['tipo_compra'] ?? 'Caja'),
                $costosCompra['costoTotal'] ?? ($costosCompra['costo_total'] ?? 0),
                $costosCompra['unidades_intermedias'] ?? 1,
                $costosCompra['piezasPorEmpaque'] ?? ($costosCompra['piezas_por_empaque'] ?? 1),
                $costosCompra['cantidadCompra'] ?? ($costosCompra['cantidad_compra'] ?? 1),
                $costosCompra['costoBaseUnitario'] ?? ($costosCompra['costo_base_unitario'] ?? 0),
                $contieneImpuestos
            ]);
        }

        // B. Datos Fiscales
        if (!empty($fiscal)) {
            $stmtFis = $pdo->prepare("INSERT INTO producto_fiscal (Producto_ID, Clave_SAT_General, Perfil_Impuesto_ID, Contiene_Impuestos) VALUES (?, ?, ?, ?)");
            $stmtFis->execute([
                $idProducto,
                $fiscal['clave_sat'] ?? null,
                $fiscal['perfil_impuesto'] ?? null,
                !empty($fiscal['impuesto_data']) || !empty($fiscal['contiene_impuestos']) ? 1 : 0
            ]);
        }

        // C. Formas de Venta
        if (!empty($formasVenta) && is_array($formasVenta)) {
            $stmtFV = $pdo->prepare("INSERT INTO producto_formas_venta (Producto_ID, Presentacion, Factor_Equivalencia, codigo_barras, clave_sat, unidad) VALUES (?, ?, ?, ?, ?, ?)");
            $stmtSAT = $pdo->prepare("INSERT INTO producto_codigos_sat (Producto_ID, Presentacion, Codigo_Barras, Clave_SAT, Unidad_Medida) VALUES (?, ?, ?, ?, ?)");

            foreach ($formasVenta as $fv) {
                $presentacion = $fv['empaque'] ?? ($fv['nombreEmpaque'] ?? 'Pieza');
                $equivalencia = $fv['equivalencia'] ?? 1;
                $codBarra     = $fv['codigoBarras'] ?? $codigo;
                $claveSat     = $fv['claveSat'] ?? null;
                $unidad       = $fv['unidad'] ?? null;

                $stmtFV->execute([
                    $idProducto, $presentacion, $equivalencia, $codBarra, $claveSat, $unidad
                ]);

                if (!empty($codBarra)) {
                    $stmtSAT->execute([$idProducto, $presentacion, $codBarra, $claveSat, $unidad]);
                }
            }
        }

        // C-2. Niveles de Precios
        if (!empty($precios) && is_array($precios)) {
            $stmtPrecios = $pdo->prepare("INSERT INTO producto_precios (Producto_ID, Nivel_Precio, Margen_Porcentaje, Precio_Venta) VALUES (?, ?, ?, ?)");
            foreach ($precios as $p) {
                $nivelPrecio       = trim($p['nivel'] ?? ($p['nivel_precio'] ?? ($p['nombre'] ?? 'Público')));
                $margenPorcentaje  = floatval($p['margen'] ?? ($p['margen_porcentaje'] ?? 0));
                $precioVenta       = floatval($p['precio'] ?? ($p['precio_venta'] ?? 0));

                $stmtPrecios->execute([$idProducto, $nivelPrecio, $margenPorcentaje, $precioVenta]);
            }
        }

        // D. Atributos dinámicos
        if (!empty($atributos) && is_array($atributos)) {
            $stmtAttr = $pdo->prepare("INSERT INTO producto_atributos (Producto_ID, Atributo_Nombre, Valor, Unidad) VALUES (?, ?, ?, ?)");
            foreach ($atributos as $attr) {
                $nombreAttr = trim($attr['etiqueta'] ?? ($attr['nombre'] ?? 'Atributo'));
                $valorCrudo = $attr['valor'] ?? null;
                $unidad     = trim($attr['unidad'] ?? '') ?: null;

                if (is_array($valorCrudo)) {
                    $valorAttr = json_encode($valorCrudo, JSON_UNESCAPED_UNICODE);
                } else {
                    $valorAttr = trim(strval($valorCrudo));
                }

                if (!empty($nombreAttr)) {
                    $stmtAttr->execute([$idProducto, $nombreAttr, $valorAttr, $unidad]);
                }
            }
        }

        // E-1. Ubicaciones
        if (!empty($ubicaciones) && is_array($ubicaciones)) {
            $stmtUbi = $pdo->prepare("INSERT INTO producto_ubicaciones (Producto_ID, Sucursal_ID, Pasillo, Anaquel, Nivel) VALUES (?, ?, ?, ?, ?)");
            foreach ($ubicaciones as $ubi) {
                $sucursalId = intval($ubi['sucursal_id'] ?? 0);
                if ($sucursalId <= 0) continue;

                $ubicacionTexto = $ubi['ubicacion'] ?? '';
                $partesUbi = explode('-', $ubicacionTexto);
                $pasillo = trim($partesUbi[0] ?? '');
                $anaquel = trim($partesUbi[1] ?? '');
                $nivel   = trim($partesUbi[2] ?? '');

                $stmtUbi->execute([$idProducto, $sucursalId, $pasillo, $anaquel, $nivel]);
            }
        }

        // E-2. Existencias
        if (!empty($existencias) && is_array($existencias)) {
            $stmtExi = $pdo->prepare("INSERT INTO producto_existencias (Producto_ID, Sucursal_ID, Stock_Actual, Stock_Minimo, Stock_Maximo) VALUES (?, ?, ?, ?, ?)");
            foreach ($existencias as $exi) {
                $sucursalId = intval($exi['sucursal_id'] ?? 0);
                if ($sucursalId <= 0) continue;

                $stmtExi->execute([
                    $idProducto,
                    $sucursalId,
                    $exi['existencia'] ?? 0,
                    $exi['stockMinimo'] ?? 0,
                    $exi['stockMaximo'] ?? 0
                ]);
            }
        }

        // F. Procesamiento de Archivos e Imágenes
        $stmtImg = $pdo->prepare("INSERT INTO producto_imagenes (Producto_ID, Url, Es_Portada, Orden) VALUES (?, ?, ?, ?)");
        $directorioDestino = __DIR__ . '/../../../../public/uploads/productos/';

        if (!file_exists($directorioDestino)) {
            mkdir($directorioDestino, 0777, true);
        }

        $ordenImg = 0;
        $fuenteArchivos = !empty($datos['archivos']) ? $datos['archivos'] : $_FILES;

        if (!empty($fuenteArchivos)) {
            foreach ($fuenteArchivos as $key => $fileInfo) {
                if (strpos($key, 'imagen_') === 0 && isset($fileInfo['error']) && $fileInfo['error'] === UPLOAD_ERR_OK) {
                    $nombreOriginal = basename($fileInfo['name']);
                    $extension = pathinfo($nombreOriginal, PATHINFO_EXTENSION);
                    $nombreUnico = 'prod_' . $idProducto . '_' . uniqid() . '.' . ($extension ?: 'jpg');
                    $rutaAbsoluta = $directorioDestino . $nombreUnico;
                    $rutaRelativa = 'public/uploads/productos/' . $nombreUnico;

                    if (move_uploaded_file($fileInfo['tmp_name'], $rutaAbsoluta)) {
                        $esPortada = ($ordenImg === 0) ? 1 : 0;
                        $stmtImg->execute([$idProducto, $rutaRelativa, $esPortada, $ordenImg]);
                        $ordenImg++;
                    }
                }
            }
        }

        // ==========================================
        // G. ELIMINAR BORRADOR DEL USUARIO TRAS ÉXITO
        // ==========================================
        $stmtDelBorrador = $pdo->prepare("DELETE FROM productos_borradores WHERE usuario_id = ?");
        $stmtDelBorrador->execute([$usuarioId]);

        // Confirmar Transacción
        $pdo->commit();

        // Registrar en Bitácora
        RegistrarBitacoraAccion(
            $usuarioId,
            $sesionId,
            'PRODUCTOS',
            ($tipo === 'editar' ? 'EDITAR' : 'CREAR'),
            $idProducto,
            "Se " . ($tipo === 'editar' ? 'actualizó' : 'registró') . " el producto: {$nombre} (SKU: {$sku}, ID: {$idProducto})"
        );

        JsonResponse::success('Producto guardado exitosamente.', [
            'id'     => $idProducto,
            'nombre' => $nombre,
            'sku'    => $sku
        ], ($tipo === 'editar' ? 200 : 201));

    } catch (PDOException $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error PDO al gestionar producto: " . $e->getMessage());
        JsonResponse::error('Error de base de datos al guardar el producto: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        if (isset($pdo) && $pdo->inTransaction()) {
            $pdo->rollBack();
        }
        error_log("Error crítico al procesar producto: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado en el servidor.', null, 500);
    }
}
function Guardar_Borrador_Producto(array $datosCrudos): void {
    try {
        // 1. Asegurar sesión activa
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener PDO
        $pdo = Conexion();

        // 3. Validar sesión e ID de usuario
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa para guardar el borrador.', null, 401);
        }

        // --- NORMALIZACIÓN DE ENTRADA ---
        $datos = $datosCrudos;
        $jsonString = null;
        
        if (isset($datosCrudos['valor_plano']) && is_string($datosCrudos['valor_plano'])) {
            $jsonString = $datosCrudos['valor_plano'];
        } elseif (isset($datosCrudos['data']) && is_string($datosCrudos['data'])) {
            $jsonString = $datosCrudos['data'];
        }

        if (!empty($jsonString)) {
            $decodificado = json_decode($jsonString, true);
            if (is_array($decodificado)) {
                $datos = array_merge($datosCrudos, $decodificado);
            }
        }

        // Si los datos vienen encapsulados en la clave 'data' (como arreglo), los integramos
        if (isset($datos['data']) && is_array($datos['data'])) {
            $datos = array_merge($datos, $datos['data']);
        }

        // --- EXTRAER ID DE BORRADOR DE FORMA ROBUSTA ---
        // Lo buscamos tanto en el nivel raíz como dentro de los datos o en $_POST/$_GET por respaldo
        $borradorIdSolicitado = intval(
            $datosCrudos['borrador_id'] ?? 
            ($datos['borrador_id'] ?? 
            ($_POST['borrador_id'] ?? 0))
        );

        // --- EXTRAER CÓDIGO (Para registro/referencia) ---
        $identificacion = $datos['identificacion'][0] ?? ($datos['identificacion'] ?? []);
        $codigo = trim($identificacion['codigo'] ?? ($datos['codigo'] ?? 'TEMP_SIN_CODIGO'));

        // Codificamos todo el objeto a JSON puro para la columna LONGTEXT
        $datosJson = json_encode($datos, JSON_UNESCAPED_UNICODE);
        if ($datosJson === false) {
            JsonResponse::error('Error al serializar los datos del borrador.', null, 400);
        }

        $idBorradorExistente = null;

        // 4. Si nos mandaron un ID explícito, verificamos que pertenezca al usuario
        if ($borradorIdSolicitado > 0) {
            $stmtCheck = $pdo->prepare("SELECT id FROM productos_borradores WHERE id = :id AND usuario_id = :usuario_id LIMIT 1");
            $stmtCheck->execute([
                ':id'         => $borradorIdSolicitado, 
                ':usuario_id' => $usuarioId
            ]);
            
            if ($stmtCheck->fetch()) {
                $idBorradorExistente = $borradorIdSolicitado;
            }
        }

        // 5. Insertar o Actualizar según corresponda
        if ($idBorradorExistente) {
            // Actualizar el borrador existente
            $sql = "UPDATE productos_borradores 
                    SET datos_json = :datos_json, actualizado_at = NOW() 
                    WHERE id = :id AND usuario_id = :usuario_id";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':datos_json'   => $datosJson,
                ':id'           => $idBorradorExistente,
                ':usuario_id'   => $usuarioId
            ]);
            
            $mensaje = 'Borrador actualizado exitosamente.';
            $borradorIdFinal = $idBorradorExistente;
        } else {
            // Insertar un nuevo borrador (cada uno con su propio ID autoincremental)
            $sql = "INSERT INTO productos_borradores (usuario_id, datos_json, actualizado_at) 
                    VALUES (:usuario_id, :datos_json, NOW())";
            
            $stmt = $pdo->prepare($sql);
            $stmt->execute([
                ':usuario_id'   => $usuarioId,
                ':datos_json'   => $datosJson
            ]);
            
            $mensaje = 'Borrador guardado exitosamente.';
            $borradorIdFinal = $pdo->lastInsertId();
        }

        JsonResponse::success($mensaje, [
            'borrador_id' => intval($borradorIdFinal),
            'usuario_id'  => $usuarioId,
            'codigo'      => $codigo,
            'timestamp'   => date('Y-m-d H:i:s')
        ], 200);

    } catch (PDOException $e) {
        error_log("Error PDO al guardar borrador de producto: " . $e->getMessage());
        JsonResponse::error('Error de base de datos al guardar el borrador: ' . $e->getMessage(), null, 500);

    } catch (Throwable $e) {
        error_log("Error crítico al guardar borrador: " . $e->getMessage());
        JsonResponse::error($e->getMessage() ?: 'Ocurrió un error inesperado al guardar el borrador.', null, 500);
    }
}


function Obtener_Borradores_Productos(): void {
    try {
        // 1. Asegurar sesión activa
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener ID de usuario de forma segura
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa para recuperar los borradores.', null, 401);
        }

        // 3. Consultar la lista completa de borradores del usuario ordenados por fecha
        $sql = "SELECT id, datos_json, actualizado_at 
                FROM productos_borradores 
                WHERE usuario_id = :usuario_id 
                ORDER BY actualizado_at DESC";

        $resultados = Consultar_PDO($sql, [':usuario_id' => $usuarioId]);

        if (empty($resultados) || !is_array($resultados)) {
            JsonResponse::success("No se encontraron borradores guardados.", []);
            return;
        }

        // 4. Procesar cada borrador para extraer información clave para la vista (Nombre, SKU, Código)
        $listaBorradores = [];
        foreach ($resultados as $row) {
            $datos = json_decode($row['datos_json'], true) ?? [];
            
            // Extracción segura de metadatos desde el JSON del wizard
            $identificacion = $datos['identificacion'][0] ?? ($datos['identificacion'] ?? []);
            $infoBasica     = $datos['informacionBasica'][0] ?? ($datos['informacionBasica'] ?? []);

            $nombre = trim($infoBasica['descripcion'] ?? ($infoBasica['nombre'] ?? ($datos['nombre'] ?? 'Sin nombre')));
            $sku    = trim($identificacion['sku'] ?? ($datos['sku'] ?? 'N/D'));
            $codigo = trim($identificacion['codigo'] ?? ($datos['codigo'] ?? 'N/D'));

            $listaBorradores[] = [
                'id'             => $row['id'],
                'nombre'         => $nombre !== '' ? $nombre : 'Borrador sin nombre',
                'sku'            => $sku !== '' ? $sku : 'Sin SKU',
                'codigo'         => $codigo !== '' ? $codigo : 'Sin código',
                'actualizado_at' => date('d M Y, H:i', strtotime($row['actualizado_at']))
            ];
        }

        // Retornamos el listado completo estandarizado
        JsonResponse::success("Borradores obtenidos correctamente", $listaBorradores);

    } catch (Throwable $e) {
        // Registramos el error internamente y respondemos con error controlado
        error_log("Error crítico al obtener los borradores de productos: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error inesperado al consultar los borradores.", null, 500);
    }
}

function Obtener_Borrador_Producto_Detalle($datos): void {
    try {
        // 1. Asegurar sesión activa
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener ID de usuario de forma segura
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa para recuperar el borrador.', null, 401);
        }

        // 3. Obtener el ID del borrador desde GET o POST (ej. ?borrador_id=5 o mediante token descifrado si aplica)
        $borradorId = $datos['id_borrador'] ?? null;

        if (empty($borradorId)) {
            JsonResponse::error('No se especificó el ID del borrador.', null, 400);
        }

        // 4. Consultar el borrador específico asegurando que pertenezca al usuario en sesión
        $sql = "SELECT id, datos_json, actualizado_at 
                FROM productos_borradores 
                WHERE id = :id AND usuario_id = :usuario_id 
                LIMIT 1";

        $resultado = Consultar_PDO($sql, [
            ':id'         => $borradorId, 
            ':usuario_id' => $usuarioId
        ]);

        if (empty($resultado) || !is_array($resultado)) {
            JsonResponse::error("No se encontró el borrador especificado o no tienes permisos para verlo.", $datos, 404);
        }

        $borrador = $resultado[0];
        $datosDecodificados = json_decode($borrador['datos_json'], true);

        // 5. Retornar el detalle completo con los datos listos para el wizard
        JsonResponse::success("Borrador obtenido correctamente", [
            'id'             => $borrador['id'],
            'datos'          => $datosDecodificados,
            'actualizado_at' => $borrador['actualizado_at']
        ]);

    } catch (Throwable $e) {
        error_log("Error crítico al obtener el detalle del borrador: " . $e->getMessage());
        JsonResponse::error("Ocurrió un error inesperado al consultar el detalle del borrador.", null, 500);
    }
}

function Eliminar_Borrador_Producto($datos): void {
    try {
        // 1. Asegurar sesión activa
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener PDO
        $pdo = Conexion();

        // 3. Validar sesión e ID de usuario
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa para realizar esta acción.', null, 401);
        }

        // 4. Obtener el ID del borrador desde POST o GET
        $borradorId = intval($datos['borrador_id']);
        if ($borradorId <= 0) {
            JsonResponse::error('No se especificó un ID de borrador válido.', null, 400);
        }

        // 5. Ejecutar la eliminación asegurando que pertenezca al usuario en sesión
        $sql = "DELETE FROM productos_borradores WHERE id = :id AND usuario_id = :usuario_id";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([
            ':id'         => $borradorId,
            ':usuario_id' => $usuarioId
        ]);

        if ($stmt->rowCount() > 0) {
            JsonResponse::success("Borrador eliminado correctamente.", ['borrador_id' => $borradorId], 200);
        } else {
            JsonResponse::error("No se encontró el borrador o no tienes permisos para eliminarlo.", null, 404);
        }

    } catch (PDOException $e) {
        error_log("Error PDO al eliminar borrador: " . $e->getMessage());
        JsonResponse::error('Error de base de datos al eliminar el borrador.', null, 500);

    } catch (Throwable $e) {
        error_log("Error crítico al eliminar borrador: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error inesperado al eliminar el borrador.', null, 500);
    }
}

function Eliminar_Borradores_Masivos(array $datosCrudos): void {
    try {
        // 1. Asegurar sesión activa
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        // 2. Obtener PDO
        $pdo = Conexion();

        // 3. Validar sesión e ID de usuario
        $usuarioId = $_SESSION['usuario']['id'] ?? ($_SESSION['usuario_id'] ?? ($_SESSION['id_usuario'] ?? 0));
        if (empty($usuarioId)) {
            JsonResponse::error('No hay una sesión activa para realizar esta acción.', null, 401);
        }

        // --- NORMALIZACIÓN DE ENTRADA ---
        $idsBorradores = $datosCrudos['ids'] ?? ($_POST['ids'] ?? []);
        
        if (is_string($idsBorradores)) {
            $idsBorradores = json_decode($idsBorradores, true) ?? explode(',', $idsBorradores);
        }

        if (!is_array($idsBorradores) || empty($idsBorradores)) {
            JsonResponse::error('No se seleccionaron borradores para eliminar.', null, 400);
        }

        $processed = [];
        $failed = [];

        // Consultamos id y datos_json ya que la tabla no tiene columnas sueltas de nombre
        $stmtCheck = $pdo->prepare("SELECT id, datos_json FROM productos_borradores WHERE id = :id AND usuario_id = :usuario_id LIMIT 1");
        $stmtDelete = $pdo->prepare("DELETE FROM productos_borradores WHERE id = :id AND usuario_id = :usuario_id");

        // Procesar uno por uno para categorizar correctamente en success o error
        foreach ($idsBorradores as $idCrudo) {
            $id = intval($idCrudo);
            if ($id <= 0) {
                $failed[] = [
                    "id" => $idCrudo,
                    "reason" => "ID inválido o no numérico."
                ];
                continue;
            }

            try {
                // Verificar existencia y pertenencia al usuario
                $stmtCheck->execute([':id' => $id, ':usuario_id' => $usuarioId]);
                $borrador = $stmtCheck->fetch(PDO::FETCH_ASSOC);

                if ($borrador) {
                    // Extraer el nombre/título desde el JSON si existe
                    $datosDecodificados = json_decode($borrador['datos_json'], true) ?? [];
                    $nombreBorrador = $datosDecodificados['nombre'] ?? ($datosDecodificados['titulo'] ?? "Borrador #{$id}");

                    // Ejecutar eliminación
                    $stmtDelete->execute([':id' => $id, ':usuario_id' => $usuarioId]);
                    
                    // Guardamos los detalles completos para el reporte visual
                    $processed[] = [
                        "id" => $id,
                        "nombre" => $nombreBorrador
                    ];
                } else {
                    $failed[] = [
                        "id" => $id,
                        "reason" => "El borrador no existe o no pertenece al usuario."
                    ];
                }
            } catch (Throwable $ex) {
                $failed[] = [
                    "id" => $id,
                    "reason" => $ex->getMessage()
                ];
            }
        }

        // Respuesta limpia utilizando el método masivo de JsonResponse
        JsonResponse::massive("Proceso de eliminación masiva completado.", $processed, $failed, 200);

    } catch (Throwable $e) {
        error_log("Error crítico al eliminar borradores masivos: " . $e->getMessage());
        JsonResponse::error('Ocurrió un error inesperado al procesar la eliminación masiva: ' . $e->getMessage(), null, 500);
    }
}