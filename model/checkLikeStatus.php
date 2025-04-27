<?php
      session_start();
      require_once 'db_connect.php';

      // Kiểm tra đăng nhập
      if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Bạn cần đăng nhập để thực hiện chức năng này']);
            exit;
      }

      // Kiểm tra có phải GET request không
      if ($_SERVER['REQUEST_METHOD'] !== 'GET' || !isset($_GET['track_ids']) || empty($_GET['track_ids'])) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Thiếu thông tin bài hát']);
            exit;
      }

      $user_id = $_SESSION['user_id'];
      $track_ids_str = $_GET['track_ids'];
      $track_ids = explode(',', $track_ids_str);

      // Chuyển đổi tất cả track_ids sang kiểu int
      $track_ids = array_map('intval', $track_ids);

      try {
            $conn = connectdb();
            
            // Tạo câu lệnh SQL với các dấu hỏi tương ứng với số lượng track_id
            $placeholders = str_repeat('?,', count($track_ids) - 1) . '?';
            $sql = "SELECT track_id FROM user_likes WHERE user_id = ? AND track_id IN ($placeholders)";
            
            // Tạo mảng tham số với user_id ở đầu tiên, sau đó là các track_id
            $params = array_merge([$user_id], $track_ids);
            
            $stmt = $conn->prepare($sql);
            $stmt->execute($params);
            $liked_tracks = $stmt->fetchAll(PDO::FETCH_COLUMN, 0);
            
            $result = [];
            foreach ($track_ids as $track_id) {
                  $result[$track_id] = in_array($track_id, $liked_tracks);
            }
            
            header('Content-Type: application/json');
            echo json_encode([
                  'success' => true, 
                  'likes' => $result
            ]);
      
      } catch (PDOException $e) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Lỗi: ' . $e->getMessage()]);
      }