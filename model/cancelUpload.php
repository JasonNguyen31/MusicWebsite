<?php
      session_start();
      require_once 'db_connect.php';

      // Kiểm tra AJAX request
      if (empty($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) != 'xmlhttprequest') {
            header('HTTP/1.1 403 Forbidden');
            echo json_encode(['status' => 'error', 'message' => 'Forbidden']);
            exit;
      }

      // Kiểm tra người dùng đã đăng nhập
      if (!isset($_SESSION['user_id'])) {
            echo json_encode(['status' => 'error', 'message' => 'Unauthorized']);
            exit;
      }

      // Kiểm tra track_id
      if (!isset($_POST['track_id']) || empty($_POST['track_id'])) {
            echo json_encode(['status' => 'error', 'message' => 'Track ID is required']);
            exit;
      }

      $track_id = $_POST['track_id'];
      $user_id = $_SESSION['user_id'];

      try {
            $conn = connectdb();
            
            // Lấy thông tin về file cần xóa
            $stmt = $conn->prepare("SELECT file_url FROM music_tracks WHERE track_id = ? AND user_id = ?");
            $stmt->execute([$track_id, $user_id]);
            $track = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$track) {
                  echo json_encode(['status' => 'error', 'message' => 'Track not found or not owned by you']);
                  exit;
            }
      
            // Đường dẫn đầy đủ đến file
            $file_path = '../' . $track['file_url'];
            
            // Xóa file khỏi hệ thống nếu tồn tại
            if (file_exists($file_path)) {
                  unlink($file_path);
            }
      
            // Xóa bản ghi từ database
            $stmt = $conn->prepare("DELETE FROM music_tracks WHERE track_id = ? AND user_id = ?");
            $result = $stmt->execute([$track_id, $user_id]);
            
            if ($result) {
                  // Xóa thông tin track khỏi session
                  if (isset($_SESSION['track_info'])) {
                        unset($_SESSION['track_info']);
                  }
                  
                  echo json_encode(['status' => 'success', 'message' => 'Track deleted successfully']);
            } else {
                  echo json_encode(['status' => 'error', 'message' => 'Failed to delete track']);
            }
      } catch (PDOException $e) {
            echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
      }
?>