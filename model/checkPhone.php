<?php
    session_start();
    include "db_connect.php";

    if (isset($_POST['check_phone'])) {
        $conn = connectdb();
        $phone = $_POST['check_phone'];
        
        try {
            $stmt = $conn->prepare("SELECT COUNT(*) FROM users WHERE phone = :phone");
            $stmt->execute([':phone' => $phone]);
            $count = $stmt->fetchColumn();
            
            if ($count > 0) {
                echo "exists";
            } else {
                echo "available";
            }
        } catch (PDOException $e) {
            echo "error";
        }
    }
?>