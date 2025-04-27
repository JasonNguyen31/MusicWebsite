<?php
    session_start();
    include "db_connect.php";

    if (isset($_POST['check_username'])) {
        $conn = connectdb();
        $username = $_POST['check_username'];
        
        try {
            $stmt = $conn->prepare("SELECT COUNT(*) FROM users WHERE username = :username");
            $stmt->execute([':username' => $username]);
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