<?php
return [
    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => ['*'],

    // 👇 list exact origins you will use
    'allowed_origins' => [
        'http://localhost:5175',
        'http://127.0.0.1:5175',
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:5177',
        'http://127.0.0.1:5177',
        // keep this only if you will call from the live site during testing:
        'https://harshitonline.in',
        'https://www.harshitonline.in',
        'http://harshitonline.in',
        'http://www.harshitonline.in',
    ],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => ['Content-Disposition'],

    'max_age' => 0,

    // credentials require a **non-wildcard** ACAO and matching Origin
    'supports_credentials' => true,
];
