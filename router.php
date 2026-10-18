<?php
// Router for PHP's LOCAL DEVELOPMENT SERVER ONLY. Apache uses .htaccess instead.
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
if (preg_match('~^/(?:storage/|includes/|tests/|config\.|\.git|router\.php)~', $path)) {
    http_response_code(404); header('Content-Type: text/plain'); echo 'Not Found'; return true;
}
if ($path !== '/' && is_file(__DIR__.$path)) return false;
require __DIR__.'/index.php';
