<?php 

/**
 * Obtiene todos los productos registrados con su información completa y detallada
 * de cada uno de sus módulos relacionados.
 * 
 * @return array Arreglo con todos los productos y sus respectivas colecciones.
 */
function Obtener_Todos_Productos_Completos(): array {
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

        if (!is_array($productos) || empty($productos)) {
            return [];
        }

        // 2. Iterar sobre cada producto para adjuntar sus colecciones hijas de manera optimizada
        foreach ($productos as &$producto) {
            $productoId = $producto['ID'];

            // Adjuntar imágenes (Paso 3)
            $producto['Imagenes'] = Consultar_PDO(
                "SELECT ID, Url, Es_Portada, Orden FROM producto_imagenes WHERE Producto_ID = :id ORDER BY Orden ASC", 
                [':id' => $productoId]
            ) ?: [];

            // Adjuntar equivalencias de medida (Paso 6)
            $producto['Equivalencias'] = Consultar_PDO(
                "SELECT ID, Presentacion, Factor_Equivalencia, Costo_Unitario FROM producto_equivalencias WHERE Producto_ID = :id", 
                [':id' => $productoId]
            ) ?: [];

            // Adjuntar precios de venta y márgenes (Paso 7)
            $producto['Precios'] = Consultar_PDO(
                "SELECT ID, Nivel_Precio, Margen_Porcentaje, Precio_Venta FROM producto_precios WHERE Producto_ID = :id", 
                [':id' => $productoId]
            ) ?: [];

            // Adjuntar atributos dinámicos (Paso 8)
            $producto['Atributos'] = Consultar_PDO(
                "SELECT ID, Atributo_Nombre, Valor FROM producto_atributos WHERE Producto_ID = :id", 
                [':id' => $productoId]
            ) ?: [];

            // Adjuntar ubicaciones en sucursales (Paso 9)
            $producto['Ubicaciones'] = Consultar_PDO(
                "SELECT ID, Sucursal_ID, Pasillo, Anaquel, Nivel FROM producto_ubicaciones WHERE Producto_ID = :id", 
                [':id' => $productoId]
            ) ?: [];

            // Adjuntar existencias e inventario (Paso 10)
            $producto['Existencias'] = Consultar_PDO(
                "SELECT ID, Sucursal_ID, Stock_Actual, Stock_Minimo, Stock_Maximo FROM producto_existencias WHERE Producto_ID = :id", 
                [':id' => $productoId]
            ) ?: [];

            // Adjuntar códigos de barras y SAT por empaque (Paso 11)
            $producto['Codigos_SAT'] = Consultar_PDO(
                "SELECT ID, Presentacion, Codigo_Barras, Clave_SAT FROM producto_codigos_sat WHERE Producto_ID = :id", 
                [':id' => $productoId]
            ) ?: [];
        }
        unset($producto); // Romper la referencia del foreach

        return $productos;

    } catch (Throwable $e) {
        error_log("Error crítico al obtener el listado completo de productos: " . $e->getMessage());
        return [];
    }
}