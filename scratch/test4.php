<?php
try {
    $db = new PDO("mysql:host=localhost;dbname=alumni;charset=utf8mb4", "root", "");
    $q = $db->query("SELECT registration_no, name, school, programme FROM students LIMIT 20");
    print_r($q->fetchAll(PDO::FETCH_ASSOC));
} catch (PDOException $e) {
    echo "Connection failed: " . $e->getMessage() . "\n";
}
