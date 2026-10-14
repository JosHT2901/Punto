(function($) {
    let _subscribers = {};
    let _initialized = false;

    $.messenger = {
        /**
         * Envía un mensaje a un iframe o ventana de forma segura
         */
        send: function(target, action, data = {}, targetOrigin = '*') {
            let win = null;

            if (!target) {
                console.warn("$.messenger.send: El destino proporcionado es nulo o indefinido.", target);
                return this;
            }

            // 1. Si ya es una ventana (incluyendo window.parent, window, etc.)
            if (target === window || target === window.parent || target === window.top || (typeof target.postMessage === 'function' && typeof target.document !== 'undefined')) {
                win = target;
            } 
            // 2. Si es un elemento DOM que contiene contentWindow (un Iframe)
            else if (target.contentWindow) {
                win = target.contentWindow;
            } 
            // 3. Búsqueda a través de jQuery
            else {
                const $el =$(target);
                if ($el.length > 0) {
                    if ($el.is('iframe') &&$el[0].contentWindow) {
                        win = $el[0].contentWindow;
                    } else if ($el[0].contentWindow) {
                        win = $el[0].contentWindow;
                    }
                }
            }

            // Validación final de seguridad antes de disparar postMessage
            if (win && typeof win.postMessage === 'function') {
                const payload = {
                    source: 'AppFramework',
                    action: action,
                    data: data
                };
                win.postMessage(payload, targetOrigin);
            } else {
                console.warn("$.messenger.send: El destino proporcionado no es una ventana o iframe válido.", target);
            }

            return this;
        },

        /**
         * Suscribe una función a una acción específica
         */
        on: function(action, callback) {
            if (typeof callback !== 'function') return this;

            if (!_subscribers[action]) {
                _subscribers[action] = [];
            }
            _subscribers[action].push(callback);
            return this; 
        },

        /**
         * Remueve un callback específico o todos los de una acción
         */
        off: function(action, callback = null) {
            if (!_subscribers[action]) return this;

            if (callback) {
                _subscribers[action] = _subscribers[action].filter(cb => cb !== callback);
                if (_subscribers[action].length === 0) {
                    delete _subscribers[action];
                }
            } else {
                delete _subscribers[action];
            }
            return this; 
        },

        /**
         * Limpia todos los suscriptores
         */
        offAll: function() {
            _subscribers = {};
            return this;
        },

        /**
         * Inicializa el listener global de mensajes
         */
        init: function() {
            if (_initialized) return this;
            _initialized = true;

            setTimeout(() => {
                $(window).off('message.appframework').on('message.appframework', function(e) {
                    const originalEvent = e.originalEvent;
                    let payload;

                    try {
                        payload = typeof originalEvent.data === 'string' 
                            ? JSON.parse(originalEvent.data) 
                            : originalEvent.data;
                    } catch (err) { 
                        return; 
                    }

                    if (payload && payload.source === 'AppFramework') {
                        const action = payload.action;
                        const data = payload.data;

                        if (_subscribers[action]) {
                            _subscribers[action].forEach(cb => {
                                try {
                                    cb(data, originalEvent.source, originalEvent.origin);
                                } catch (err) {
                                    console.error(`Error ejecutando callback para la acción [${action}]:`, err);
                                }
                            });
                        }
                    }
                });
            }, 0);

            return this;
        }
    };

    // Auto-inicialización segura al cargar el script
    $.messenger.init();

})(jQuery);