<?php
    session_start();
    include "db_connect.php";

    // Check if user is logged in
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true || !isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'User not logged in']);
        exit;
    }

    $userId = $_SESSION['user_id'];
    $data = json_decode(file_get_contents('php://input'), true);
    $imageType = $data['type'] ?? '';
    $response = ['success' => false, 'message' => 'Unknown error'];

    try {
        // Connect to database
        $conn = connectdb();
        
        // Get current image path before updating
        $stmt = $conn->prepare("SELECT profile_image, header_image FROM users WHERE id = :user_id");
        $stmt->bindParam(':user_id', $userId);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            $oldImagePath = '';
            $columnName = '';
            
            if ($imageType === 'avatar') {
                $oldImagePath = $user['profile_image'];
                $columnName = 'profile_image';
            } elseif ($imageType === 'header') {
                $oldImagePath = $user['header_image'];
                $columnName = 'header_image';
            } else {
                echo json_encode(['success' => false, 'message' => 'Invalid image type']);
                exit;
            }
            
            // Update database to remove image reference
            $stmt = $conn->prepare("UPDATE users SET $columnName = '' WHERE id = :user_id");
            $stmt->bindParam(':user_id', $userId);
            
            if ($stmt->execute()) {
                // Delete file from server if it exists
                if ($oldImagePath && file_exists('../' . $oldImagePath)) {
                    unlink('../' . $oldImagePath);
                }
                
                $response = ['success' => true, 'message' => 'Image deleted successfully'];
            } else {
                $response = ['success' => false, 'message' => 'Failed to update database'];
            }
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