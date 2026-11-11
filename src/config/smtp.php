<?php

declare(strict_types=1);

return [
    'host'       => $_ENV['SMTP_HOST'] ?? getenv('SMTP_HOST') ?: 'smtp.ionos.mx',
    'username'   => $_ENV['SMTP_USERNAME'] ?? getenv('SMTP_USERNAME') ?: 'contacto@tiendas-etcetera.com',
    'password'   => $_ENV['SMTP_PASSWORD'] ?? getenv('SMTP_PASSWORD') ?: 'Hola$290105',
    'port'       => (int) ($_ENV['SMTP_PORT'] ?? getenv('SMTP_PORT') ?: 587),
    'secure'     => $_ENV['SMTP_SECURE'] ?? getenv('SMTP_SECURE') ?: 'tls',
    'from_email' => $_ENV['SMTP_FROM_EMAIL'] ?? getenv('SMTP_FROM_EMAIL') ?: 'contacto@tiendas-etcetera.com',
    'from_name'  => $_ENV['SMTP_FROM_NAME'] ?? getenv('SMTP_FROM_NAME') ?: 'Etcétera de México'
];