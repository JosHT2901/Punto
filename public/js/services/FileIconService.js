/* =============================================
   SERVICIO: FILE ICON SERVICE (Independiente y Blindado)
============================================= */
window.FileIconService = (function () {
    // Validación segura de UI_CONFIG antes de imprimir en consola
    if (typeof UI_CONFIG !== 'undefined') {
        console.log("UI_CONFIG cargado:", UI_CONFIG);
    }

    const RUTA_BASE_DEF = (typeof UI_CONFIG !== 'undefined' && UI_CONFIG.ICON_PATH) 
        ? `${UI_CONFIG.ICON_PATH}/file/` 
        : '../../icons/file/';

    const mapaIconos = {
        'xlsx': 'excel.png', 'xls': 'excel.png', 'csv': 'excel.png',
        'pdf': 'pdf.png',
        'docx': 'word.png', 'doc': 'word.png',
        'jpg': 'image.png', 'jpeg': 'image.png', 'png': 'image.png', 'gif': 'image.png', 'svg': 'image.png',
        'zip': 'zip.png', 'rar': 'zip.png', 
        'xml': 'xml.png', 
        'txt': 'txt.png', 'log': 'txt.png', 'ini': 'txt.png', 'env': 'txt.png', 'conf': 'txt.png', 'md': 'txt.png',
        'js': 'code.png', 'css': 'code.png', 'html': 'code.png',
        'sql': 'sql.png',
        'ttf': 'ttf.png', 'otf': 'otf.png', 'woff': 'woff.png', 'woff2': 'woff.png',
        'mp3': 'music.png', 'wav': 'music.png', 'ogg': 'music.png', 'flac': 'music.png', 'aac': 'music.png',
        'mp4': 'video.png', 'avi': 'video.png', 'mkv': 'video.png', 'mov': 'video.png', 'wmv': 'video.png',
        'json': 'json.png'
    };

    const mapaMime = {
        'application/pdf': 'pdf',
        'application/msword': 'doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
        'application/vnd.ms-excel': 'xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
        'text/plain': 'txt',
        'text/markdown': 'md',
        'text/csv': 'csv',
        'text/html': 'html',
        'text/css': 'css',
        'application/javascript': 'js',
        'text/javascript': 'js',
        'application/json': 'json',
        'image/jpeg': 'jpg',
        'image/png': 'png',
        'image/gif': 'gif',
        'image/svg+xml': 'svg',
        'audio/mpeg': 'mp3',
        'audio/wav': 'wav',
        'audio/ogg': 'ogg',
        'audio/aac': 'aac',
        'video/mp4': 'mp4',
        'video/x-msvideo': 'avi',
        'video/x-matroska': 'mkv',
        'video/quicktime': 'mov',
        'application/zip': 'zip',
        'application/x-rar-compressed': 'rar',
        'application/xml': 'xml',
        'text/xml': 'xml'
    };

    const obtenerPorExtension = (ext, rutaBase = RUTA_BASE_DEF) => {
        // Validación estricta y limpieza de espacios o puntos múltiples
        if (!ext || typeof ext !== 'string') return `${rutaBase}default.png`;
        
        const extension = ext.replace(/^\.+/, '').trim().toLowerCase();
        const nombreIcono = mapaIconos[extension] || 'default.png';
        
        return `${rutaBase}${nombreIcono}`;
    };

    const obtenerExtensionPorMime = (mimeType) => {
        if (!mimeType || typeof mimeType !== 'string') return 'bin';
        return mapaMime[mimeType.trim().toLowerCase()] || 'bin';
    };

    const obtenerPorMime = (mimeType, rutaBase = RUTA_BASE_DEF) => {
        const extension = obtenerExtensionPorMime(mimeType);
        return obtenerPorExtension(extension, rutaBase);
    };

    return {
        obtenerPorExtension,
        obtenerExtensionPorMime,
        obtenerPorMime
    };

})();