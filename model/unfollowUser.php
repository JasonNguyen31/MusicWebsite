<?php
      session_start();
      header('Content-Type: application/json');

      // Kiểm tra nếu người dùng đã đăng nhập
      if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
            echo json_encode(['success' => false, 'message' => 'Not logged in']);
            exit;
      }

      // Kiểm tra nếu có POST data
      if (!isset($_POST['target_user_id']) || empty($_POST['target_user_id'])) {
            echo json_encode(['success' => false, 'message' => 'Missing target user ID']);
            exit;
      }

      // Lấy ID của người dùng hiện tại và ID của người dùng cần unfollow
      $current_user_id = $_SESSION['user_id'];
      $target_user_id = $_POST['target_user_id'];

      // Kết nối đến database
      include_once "db_connect.php";
      try {
            $conn = connectdb();
            
            // Xóa bản ghi từ bảng user_follows
            $stmt = $conn->prepare("DELETE FROM user_follows WHERE follower_id = ? AND following_id = ?");
            $result = $stmt->execute([$current_user_id, $target_user_id]);
            
            if ($result && $stmt->rowCount() > 0) {
                  echo json_encode(['success' => true]);
            } else {
                  echo json_encode(['success' => false, 'message' => 'No follow relationship found']);
            }
      } catch (PDOException $e) {
            // Log lỗi và trả về thông báo lỗi
            error_log("Lỗi khi unfollow user: " . $e->getMessage());
            echo json_encode(['success' => false, 'message' => 'Database error']);
      }
?>