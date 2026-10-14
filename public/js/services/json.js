// Objeto global de caché (asegúrate de tenerlo definido previamente, ej: const cacheJSON = {};)
if (typeof cacheJSON === 'undefined') {
    window.cacheJSON = {};
}

function CargarJSON(url) {
    // 1. Si ya tenemos el dato completo en caché, devolvemos una promesa resuelta
    if (cacheJSON[url] && !window.cacheJSON[url]._isPromise) {
        return $.Deferred().resolve(cacheJSON[url]).promise();
    }

    // 2. Si la petición ya está en curso (es una promesa activa), devolvemos esa misma promesa 
    // para evitar hacer peticiones duplicadas simultáneas al servidor.
    if (window.cacheJSON[url] && window.cacheJSON[url]._isPromise) {
        return window.cacheJSON[url];
    }

    // 3. Si no existe, hacemos la petición AJAX y la guardamos temporalmente como promesa
    const ajaxPromise = $.ajax({
        url: url,
        method: "GET",
        dataType: "json"
    }).done(function (data) {
        // Al terminar con éxito, guardamos el dato real reemplazando la promesa en el caché
        window.cacheJSON[url] = data;
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.error("Error al cargar JSON:", url, textStatus, errorThrown);
        // Si falla, borramos la entrada del caché para permitir futuros reintentos
        delete window.cacheJSON[url];
    });

    // Marcamos la promesa activa para identificarla mientras viaja la red
    ajaxPromise._isPromise = true;
    window.cacheJSON[url] = ajaxPromise;

    return ajaxPromise;
}