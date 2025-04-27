<?php
      session_start();
      require_once 'db_connect.php';

      // Check if user is logged in
      if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Bạn cần đăng nhập để thực hiện chức năng này']);
            exit;
      }

      $user_id = $_SESSION['user_id'];

      // Kiểm tra nếu có tham số full được truyền vào
      // Nếu có và giá trị là true, không áp dụng giới hạn
      // Nếu không, áp dụng giới hạn mặc định (3)
      $full = isset($_GET['full']) && $_GET['full'] === 'true';
      $limit = $full ? null : 3;

      try {
            $conn = connectdb();

            // Chuẩn bị câu truy vấn SQL - có hoặc không có LIMIT tùy thuộc vào biến $full
            if ($full) {
                  $query = "SELECT mt.* 
                        FROM user_likes ul
                        JOIN music_tracks mt ON ul.track_id = mt.track_id
                        WHERE ul.user_id = :user_id
                        ORDER BY ul.created_at DESC";
                  
                  $stmt = $conn->prepare($query);
                  $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            } else {
                  $query = "SELECT mt.* 
                        FROM user_likes ul
                        JOIN music_tracks mt ON ul.track_id = mt.track_id
                        WHERE ul.user_id = :user_id
                        ORDER BY ul.created_at DESC
                        LIMIT :limit";
                  
                  $stmt = $conn->prepare($query);
                  $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                  $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            }

            $stmt->execute();
            $tracks = $stmt->fetchAll(PDO::FETCH_ASSOC);

            header('Content-Type: application/json');
            echo json_encode([
                  'success' => true,
                  'tracks' => $tracks
            ]);

      } catch (PDOException $e) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Lỗi: ' . $e->getMessage()]);
      }