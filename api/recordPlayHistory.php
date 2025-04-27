<?php
    session_start();
    include_once "../model/db_connect.php";
    
    header('Content-Type: application/json');

    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit;
    }

    // Lấy user_id từ session
    $user_id = $_SESSION['user_id'];

    // Lấy track_id từ request
    $track_id = isset($_POST['track_id']) ? $_POST['track_id'] : null;

    if (!$track_id) {
        // Nếu không có POST data, thử lấy từ query string (cho AJAX)
        $track_id = isset($_GET['track_id']) ? $_GET['track_id'] : null;
    }

    if (!$track_id) {
        http_response_code(400);
        echo json_encode(['error' => 'Missing track_id']);
        exit;
    }

    try {
        $conn = connectdb();
        
        // Lấy thông tin track
        $trackStmt = $conn->prepare("SELECT * FROM music_tracks WHERE track_id = ?");
        $trackStmt->execute([$track_id]);
        $trackInfo = $trackStmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$trackInfo) {
            http_response_code(404);
            echo json_encode(['error' => 'Track not found']);
            exit;
        }
        
        // Xóa các bản ghi cũ của track này cho user này
        $deleteStmt = $conn->prepare("DELETE FROM play_history WHERE user_id = ? AND track_id = ?");
        $deleteStmt->execute([$user_id, $track_id]);
        
        // Thêm bản ghi mới
        $insertStmt = $conn->prepare(
            "INSERT INTO play_history (user_id, track_id, file_url, track_name, artist, image_url, play_count) 
             VALUES (?, ?, ?, ?, ?, ?, ?)"
        );
        $insertStmt->execute([
            $user_id, 
            $track_id, 
            $trackInfo['file_url'], 
            $trackInfo['track_name'], 
            $trackInfo['artist'], 
            $trackInfo['image_url'], 
            $trackInfo['play_count'] + 1
        ]);
        
        // Tăng play_count trong bảng music_tracks
        $updateStmt = $conn->prepare("UPDATE music_tracks SET play_count = play_count + 1 WHERE track_id = ?");
        $updateStmt->execute([$track_id]);
        
        echo json_encode(['success' => true, 'message' => 'Play history recorded']);
        
    } catch(PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
?>