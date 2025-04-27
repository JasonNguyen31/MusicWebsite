<?php
session_start();
header('Content-Type: application/json');

// Check if user is logged in
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    echo json_encode(['success' => false, 'message' => 'Not authenticated']);
    exit;
}

// Check if POST request and data exists
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['description'])) {
    echo json_encode(['success' => false, 'message' => 'Invalid request']);
    exit;
}

// Get user ID and description
$user_id = $_SESSION['user_id'];
$description = trim($_POST['description']);

// Validate description
if (strlen($description) > 255) {
    echo json_encode(['success' => false, 'message' => 'Description too long (max 255 characters)']);
    exit;
}

// Connect to database
include_once "db_connect.php";
$conn = connectdb();

try {
    // Update the description in the database
    $stmt = $conn->prepare("UPDATE users SET description = :description WHERE id = :user_id");
    $stmt->bindParam(':description', $description);
    $stmt->bindParam(':user_id', $user_id);
    
    if ($stmt->execute()) {
        echo json_encode(['success' => true, 'message' => 'Profile description updated']);
    } else {
        echo json_encode(['success' => false, 'message' => 'Failed to update profile description']);
    }
} catch(PDOException $e) {
    echo json_encode(['success' => false, 'message' => 'Database error', 'error' => $e->getMessage()]);
}
?>