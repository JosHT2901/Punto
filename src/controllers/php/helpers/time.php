<?php
// helpers/time.php

/**
 * Formatea una fecha al idioma español con diversas opciones de visualización.
 * 
 * @string $fecha Fecha en formato válido (DateTime compatible).
 * @bool $mostrarHora Si es true, añade la hora en formato 24h.
 * @bool $formatoCorto Si es true, usa formato abreviado de mes (ej. 15 ene 2026).
 * @bool $mostrarDiaSemana Si es true, antepone el día de la semana (ej. lunes, 15 de enero de 2026).
 */
function FormatearFechaEspanol(
    string $fecha,
    bool $mostrarHora = false,
    bool $formatoCorto = false,
    bool $mostrarDiaSemana = false
): string {
    if (empty(trim($fecha))) {
        return '';
    }

    try {
        $date = new DateTime($fecha);
    } catch (Exception $e) {
        return 'Fecha inválida';
    }

    // Listas estáticas eficientes
    static $dias = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
    static $mesesLargos = [1 => 'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    static $mesesCortos = [1 => 'ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

    $diaSemana = $dias[(int)$date->format('w')];
    $diaMes    = $date->format('j');
    $mes       = (int)$date->format('n');
    $anio      = $date->format('Y');

    // Construcción del cuerpo de la fecha
    if ($formatoCorto) {
        $fechaTexto = "{$diaMes} {$mesesCortos[$mes]} {$anio}";
    } else {
        $fechaTexto = "{$diaMes} de {$mesesLargos[$mes]} de {$anio}";
    }

    // Anteponer el día de la semana si se solicita
    if ($mostrarDiaSemana) {
        $fechaTexto = "{$diaSemana}, {$fechaTexto}";
    }

    // Capitalizar la primera letra de toda la cadena de forma segura
    $fechaTexto = mb_strtoupper(mb_substr($fechaTexto, 0, 1)) . mb_substr($fechaTexto, 1);

    // Agregar hora si se solicita
    if ($mostrarHora) {
        $fechaTexto .= ' a las ' . $date->format('H:i') . ' h';
    }

    return $fechaTexto;
}