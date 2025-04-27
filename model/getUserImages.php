<?php
      session_start();
      include "db_connect.php";

      // Check if user is logged in
      if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true || !isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'User not logged in']);
            exit;
      }

      $userId = $_SESSION['user_id'];
      $response = ['success' => false, 'message' => 'Unknown error'];

      try {
            // Connect to database
            $conn = connectdb();
            
            // Get user image paths from database
            $stmt = $conn->prepare("SELECT profile_image, header_image FROM users WHERE id = :user_id");
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
    
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
    
            if ($user) {
                  $response = [
                        'success' => true,
                        'profile_image' => $user['profile_image'] ? '../' . $user['profile_image'] : '',
                        'header_image' => $user['header_image'] ? '../' . $user['header_image'] : ''
                  ];
            } else {
                  $response = ['success' => false, 'message' => 'User not found'];
            }
      } catch (Exception $e) {
            $response = ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
      }

      // Return JSON response
      header('Content-Type: application/json');
      echo json_encode($response);
?>