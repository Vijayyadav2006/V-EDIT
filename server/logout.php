<?php
session_start(); // Initialize session
session_unset(); // Unset all session variables
session_destroy(); // Destroy the session
header("Location: /d:/Real_time_Editor/client/src/component/Login.js"); // Redirect to the login page
exit();
?>
