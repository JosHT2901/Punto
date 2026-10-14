function SeleccionarImagen() {
    const basePath = typeof UI_CONFIG !== 'undefined' ? UI_CONFIG.ASSETS_PATH : '../../assets/icon/';
    const imagenes = [
        basePath + 'paleta.png',
        basePath + 'astronauta.png',
        basePath + 'gato.png',
        basePath + 'monkey.png',
    ];
    return imagenes[Math.floor(Math.random() * imagenes.length)];
}