<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kirlan - Historial de Movimientos</title>
    <!-- CSS de Bootstrap (o tu framework base) -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
    <!-- Iconos (Fluent Icons / FontAwesome según uses) -->
    <link href="https://cdn.jsdelivr.net/npm/@fluentui/font-icons@1.1.0/css/fluent.min.css" rel="stylesheet">
</head>
<body class="bg-light">

    <!-- Contenedor Principal -->
    <div class="container-fluid py-4 px-4">
        
        <!-- Cabecera de la sección -->
        <div class="d-flex justify-content-between align-items-center mb-4">
            <div>
                <h2 class="h3 fw-bold text-dark mb-1">Historial de Movimientos</h2>
                <p class="text-muted mb-0">Bitácora de cambios y permisos en el sistema.</p>
            </div>
            <div>
                <a href="index.php" class="btn btn-outline-secondary btn-sm">
                    <i class="vf-ic_fluent_arrow_left_24_regular"></i> Volver al Inicio
                </a>
            </div>
        </div>

        <!-- Tarjeta de Filtros -->
        <div class="card border-0 shadow-sm mb-4">
            <div class="card-body">
                <form id="form-filtros-movimientos" class="row g-3 align-items-end">
                    <div class="col-md-4">
                        <label for="filtro-buscar" class="form-label small fw-semibold">Buscar usuario o administrador</label>
                        <input type="text" class="form-control form-control-sm" id="filtro-buscar" placeholder="Nombre o ID...">
                    </div>
                    <div class="col-md-3">
                        <label for="filtro-accion" class="form-label small fw-semibold">Acción</label>
                        <select class="form-select form-select-sm" id="filtro-accion">
                            <option value="">Todas las acciones</option>
                            <option value="Asignado">Asignado</option>
                            <option value="Retirado">Retirado</option>
                        </select>
                    </div>
                    <div class="col-md-3">
                        <label for="filtro-fecha" class="form-label small fw-semibold">Fecha</label>
                        <input type="date" class="form-control form-control-sm" id="filtro-fecha">
                    </div>
                    <div class="col-md-2 text-end">
                        <button type="submit" class="btn btn-primary btn-sm w-100">
                            <i class="vf-ic_fluent_search_24_regular"></i> Filtrar
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Tabla de Datos -->
        <div class="card border-0 shadow-sm">
            <div class="card-body p-0">
                <div class="table-responsive">
                    <table class="table table-hover align-middle mb-0" id="tabla-movimientos">
                        <thead class="table-dark">
                            <tr>
                                <th class="ps-3">ID</th>
                                <th>Administrador</th>
                                <th>Usuario Afectado</th>
                                <th>Permiso Involucrado</th>
                                <th>Acción</th>
                                <th>IP Origen</th>
                                <th class="pe-3 text-end">Fecha y Hora</th>
                            </tr>
                        </thead>
                        <tbody>
                            <!-- Ejemplo de fila estática (se llenará dinámicamente) -->
                            <tr>
                                <td class="ps-3 fw-semibold">#63</td>
                                <td>
                                    <div class="d-flex align-items-center">
                                        <span class="fw-medium text-dark">Josthin Hernandez (ID: 48)</span>
                                    </div>
                                </td>
                                <td>Josthin Hernandez (ID: 48)</td>
                                <td><span class="badge bg-light text-dark border">ver_movimiento_usuario</span></td>
                                <td><span class="badge bg-success-subtle text-success">Asignado</span></td>
                                <td class="text-muted small">127.0.0.1</td>
                                <td class="pe-3 text-end text-muted small">2026-11-17 14:35:00</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>

    </div>

    <!-- Scripts de soporte -->
    <script src="https://code.jquery.com/jquery-3.7.1.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js"></script>
    
    <script>
        $(document).ready(function() {
            console.log("Módulo de movimientos cargado correctamente.");
            
            // Aquí puedes agregar la lógica para consumir tu API o controlador PHP 
            // que devuelva los registros de `usuarios_permisos_bitacora` uniendo con `usuarios` y `permisos`.
        });
    </script>
</body>
</html>