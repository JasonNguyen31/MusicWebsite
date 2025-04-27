<?php
      session_start();
      require_once 'db_connect.php';

      // Kiểm tra đăng nhập
      if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Unauthorized access']);
            exit;
      }

      // Kiểm tra track_id
      if (!isset($_GET['track_id']) || empty($_GET['track_id'])) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Track ID is required']);
            exit;
      }

      $track_id = $_GET['track_id'];

      try {
            $conn = connectdb();
            
            // Lấy thông tin bài hát
            $stmt = $conn->prepare("SELECT * FROM music_tracks WHERE track_id = :track_id");
            $stmt->bindParam(':track_id', $track_id, PDO::PARAM_INT);
            $stmt->execute();
            
            $track = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if (!$track) {
                  header('Content-Type: application/json');
                  echo json_encode(['success' => false, 'message' => 'Track not found']);
                  exit;
            }
    
            // Tăng số lượt tải xuống (nếu muốn theo dõi)
            // $updateStmt = $conn->prepare("UPDATE music_tracks SET download_count = download_count + 1 WHERE track_id = :track_id");
            // $updateStmt->bindParam(':track_id', $track_id, PDO::PARAM_INT);
            // $updateStmt->execute();
      
            // Trả về thông tin bài hát
            header('Content-Type: application/json');
            echo json_encode([
                  'success' => true,
                  'track_id' => $track['track_id'],
                  'track_name' => $track['track_name'],
                  'artist' => $track['artist'],
                  'file_url' => $track['file_url'],
                  'image_url' => $track['image_url']
            ]);
    
      } catch (PDOException $e) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
            exit;
      }