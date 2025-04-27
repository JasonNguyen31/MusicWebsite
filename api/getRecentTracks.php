<?php
      session_start();
      include "../model/db_connect.php";
      
      // Ngăn chặn cache
      header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
      header("Cache-Control: post-check=0, pre-check=0", false);
      header("Pragma: no-cache");
      header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");

      // Kiểm tra xem người dùng đã đăng nhập chưa
      if (!isset($_SESSION['user_id'])) {
            http_response_code(401);
            echo json_encode(['error' => 'User not authenticated']);
            exit;
      }

      $user_id = $_SESSION['user_id'];
      $conn = connectdb();

      if (!$conn) {
            http_response_code(500);
            echo json_encode(['error' => 'Database connection failed']);
            exit;
      }

      // Lấy các bài hát đã phát gần đây
      function getRecentlyPlayedTracks($conn, $user_id, $limit = 12) {
            try {
                  $stmt = $conn->prepare(
                        "SELECT * FROM play_history 
                        LEFT JOIN music_tracks ON play_history.track_id = music_tracks.track_id
                        WHERE play_history.user_id = :user_id 
                        ORDER BY played_at DESC 
                        LIMIT :limit"
                  );
                  
                  $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
                  $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                  $stmt->execute();
                  return $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch(PDOException $e) {
                  return ['error' => $e->getMessage()];
            }
      }

      $recentTracks = getRecentlyPlayedTracks($conn, $user_id, 12);

      // Trả về dưới dạng JSON
      header('Content-Type: application/json');
      echo json_encode($recentTracks);
?>