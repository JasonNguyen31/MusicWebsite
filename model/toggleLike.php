<?php
      session_start();
      require_once 'db_connect.php';

      // Kiểm tra đăng nhập
      if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Bạn cần đăng nhập để thực hiện chức năng này']);
            exit;
      }

      // Kiểm tra dữ liệu gửi lên
      if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['track_id']) || empty($_POST['track_id'])) {
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Thiếu thông tin bài hát']);
            exit;
      }

      $user_id = $_SESSION['user_id'];
      $track_id = (int)$_POST['track_id']; 

      try {
      $conn = connectdb();
      $conn->beginTransaction();
      
      // Kiểm tra xem người dùng đã thích bài hát này chưa
      $stmt = $conn->prepare("SELECT * FROM user_likes WHERE user_id = ? AND track_id = ?");
      $stmt->execute([$user_id, $track_id]);
      $liked = $stmt->fetch(PDO::FETCH_ASSOC);
      
      if ($liked) {
            // Nếu đã thích, thì xóa lượt thích
            $stmt = $conn->prepare("DELETE FROM user_likes WHERE user_id = ? AND track_id = ?");
            $stmt->execute([$user_id, $track_id]);
            
            // Giảm số lượt thích trong bảng music_tracks
            $stmt = $conn->prepare("UPDATE music_tracks SET like_count = GREATEST(like_count - 1, 0) WHERE track_id = ?");
            $stmt->execute([$track_id]);
            
            $liked_status = false;
      } else {
            // Nếu chưa thích, thêm lượt thích
            $stmt = $conn->prepare("INSERT INTO user_likes (user_id, track_id) VALUES (?, ?)");
            $stmt->execute([$user_id, $track_id]);
            
            // Tăng số lượt thích trong bảng music_tracks
            $stmt = $conn->prepare("UPDATE music_tracks SET like_count = like_count + 1 WHERE track_id = ?");
            $stmt->execute([$track_id]);
            
            $liked_status = true;
      }
      
      // Lấy số lượt thích hiện tại
      $stmt = $conn->prepare("SELECT like_count FROM music_tracks WHERE track_id = ?");
      $stmt->execute([$track_id]);
      $result = $stmt->fetch(PDO::FETCH_ASSOC);
      $likes_count = $result['like_count'];
      
      $conn->commit();
      
      header('Content-Type: application/json');
      echo json_encode([
            'success' => true, 
            'liked' => $liked_status, 
            'likes_count' => $likes_count,
            'message' => $liked_status ? 'Đã thích bài hát' : 'Đã bỏ thích bài hát'
      ]);
      
      } catch (PDOException $e) {
            $conn->rollBack();
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Lỗi: ' . $e->getMessage()]);
      }