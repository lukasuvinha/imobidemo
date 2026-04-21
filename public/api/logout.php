<?php
// api/logout.php
require_once __DIR__ . '/config.php';
session_start();
session_destroy();
jsonResponse(['success' => true]);
