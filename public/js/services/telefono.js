/**
 * Módulo UI Centralizado para la gestión de Teléfonos con intl-tel-input
 */
const TelefonosUI = {

    // Configuración base por defecto
    configDefault: {
        initialCountry: "mx",
        separateDialCode: true,
        preferredCountries: ["mx", "us"],
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@18.5.2/build/js/utils.js"
    },

    // Mapa de longitudes máximas permitidas (número nacional sin contar código de área)
    longitudesMaximas: {
        mx: 10, // México
        us: 10, // Estados Unidos
        ca: 10, // Canadá
        es: 9, // España
        co: 10, // Colombia
        ar: 10, // Argentina
        pe: 9, // Perú
        cl: 9, // Chile
        br: 11 // Brasil
    },

    /**
     * Inicializa uno o varios selectores de teléfono
     * @param {string|jQuery} selector - ID, clase o elemento jQuery
     * @returns {Array|Object|null} Instancia(s) de intlTelInput o null
     */
    init: function (selector) {
        const $elements = $(selector);
        if (!$elements.length) return null;

        if (typeof window.intlTelInput !== 'function') {
            console.error("El plugin intlTelInput no está cargado en el proyecto.");
            return null;
        }

        const instancias = [];
        const self = this;

        $elements.each((_, el) => {
            const $el = $(el);

            // Evitar doble inicialización
            if ($el.data('iti')) {
                instancias.push($el.data('iti'));
                return;
            }

            // Inicializar intlTelInput
            const iti = window.intlTelInput(el, self.configDefault);

            // Guardar la instancia en el data del elemento
            $el.data('iti', iti);

            // Función para actualizar el límite dinámico según el país seleccionado
            const aplicarLimitePais = () => {
                const countryData = iti.getSelectedCountryData();
                const iso = countryData && countryData.iso2 ? countryData.iso2.toLowerCase() : 'mx';
                const maxLen = self.longitudesMaximas[iso] || 15; // 15 como respaldo general seguro

                // Aplicar atributo maxlength nativo de HTML y guardar referencia
                $el.attr('maxlength', maxLen);

                // Recortar el valor actual si excede el nuevo límite al cambiar de país
                let valorLimpio = $el.val().replace(/\D/g, '');
                if (valorLimpio.length > maxLen) {
                    $el.val(valorLimpio.substring(0, maxLen));
                }
            };

            // Aplicar límite inicial
            aplicarLimitePais();

            // Actualizar límite si el usuario cambia de bandera
            $el.off('countrychange.itiPhone').on('countrychange.itiPhone', function () {
                aplicarLimitePais();
            });

            // Filtrar letras y bloquear estrictamente al rebasar el límite mientras escribe
            $el.off('input.itiPhone').on('input.itiPhone', function () {
                let valorLimpio = this.value.replace(/\D/g, '');
                const countryData = iti.getSelectedCountryData();
                const iso = countryData && countryData.iso2 ? countryData.iso2.toLowerCase() : 'mx';
                const maxLen = self.longitudesMaximas[iso] || 15;

                if (valorLimpio.length > maxLen) {
                    valorLimpio = valorLimpio.substring(0, maxLen);
                }

                this.value = valorLimpio;
            });

            instancias.push(iti);
        });

        return $elements.length === 1 ? instancias[0] : instancias;
    },
    /**
     * Limpia el valor del teléfono y restablece el país por defecto
     * @param {string|jQuery} selector - ID o clase del input
     */
    limpiar: function (selector) {
        const $el = $(selector);
        if (!$el.length) return;

        const iti = $el.data('iti');
        if (iti) {
            // Borra el input y regresa al país por defecto inicial
            $el.val('');
            iti.setCountry(this.configDefault.initialCountry);
        } else {
            $el.val('');
        }
    },
    /**
     * Establece el valor del teléfono y actualiza la bandera automáticamente
     * @param {string|jQuery} selector - ID o clase del input
     * @param {string} valor - El número (con o sin prefijo, ej. +521234567890)
     */
    setValor: function (selector, valor) {
        const $el = $(selector);
        if (!$el.length) return;

        const iti = $el.data('iti');
        if (iti && valor) {
            iti.setNumber(valor.toString().trim());
        } else {
            $el.val(valor || '');
        }
    },

    /**
     * Obtiene el número con formato internacional (ej. +521234567890)
     * @param {string|jQuery} selector - ID o clase del input
     * @returns {string}
     */
    getValor: function (selector) {
        const $el = $(selector);
        if (!$el.length) return '';

        const iti = $el.data('iti');
        return iti ? iti.getNumber() : $el.val().trim();
    },

    /**
     * Valida si el número es correcto y cumple con la longitud exacta del país seleccionado
     * @param {string|jQuery} selector - ID o clase del input
     * @returns {boolean}
     */
    esValido: function (selector) {
        const $el = $(selector);
        if (!$el.length) return false;

        const iti = $el.data('iti');
        return iti ? iti.isValidNumber() : false;
    }
};