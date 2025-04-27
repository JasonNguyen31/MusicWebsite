<?php
    session_start();
    require_once 'db_connect.php';

    header('Content-Type: application/json');

    // Kiểm tra đăng nhập
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        echo json_encode(['success' => false, 'message' => 'Unauthorized']);
        exit;
    }

    // Kiểm tra có phải POST request không
    if ($_SERVER['REQUEST_METHOD'] !== 'POST' || !isset($_POST['track_id'])) {
        echo json_encode(['success' => false, 'message' => 'Invalid request']);
        exit;
    }

    $track_id = $_POST['track_id'];

    try {
        $conn = connectdb();
        
        // Cập nhật số lượt nghe
        $stmt = $conn->prepare("UPDATE music_tracks SET play_count = play_count + 1 WHERE track_id = ?");
        $stmt->execute([$track_id]);
        
        // Lấy số lượt nghe mới
        $stmt = $conn->prepare("SELECT play_count FROM music_tracks WHERE track_id = ?");
        $stmt->execute([$track_id]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        echo json_encode(['success' => true, 'play_count' => $result['play_count']]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
?>