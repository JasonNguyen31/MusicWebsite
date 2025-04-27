<?php
function getUserInfo($user_id) {
    // Kết nối database
    include_once "db_connect.php";
    $conn = connectdb();
    // Check if user is logged in
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true || !isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'User not logged in']);
        exit;
    }
    
    $userData = [
        'fullname' => 'User',
        'profile_image' => '../assets/images/defaults.jpg',
        'description' => 'Describe your profile' // Default description
    ];
    
    try {
        $stmt = $conn->prepare("SELECT fullname, profile_image, description FROM users WHERE id = :user_id");
        $stmt->bindParam(':user_id', $user_id);
        $stmt->execute();
        
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($user) {
            $userData['fullname'] = $user['fullname'];
            
            // Kiểm tra nếu profile_image không rỗng
            if (!empty($user['profile_image'])) {
                // Điều chỉnh đường dẫn để phù hợp với cấu trúc trang web
                $userData['profile_image'] = '../uploads/users/' . $user_id . '/' . basename($user['profile_image']);
            }
            
            // Add description if exists
            if (!empty($user['description'])) {
                $userData['description'] = $user['description'];
            }
        }
        
    } catch(PDOException $e) {
        error_log("Database error: " . $e->getMessage());
    }
    
    return $userData;
}
?>