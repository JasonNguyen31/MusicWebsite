<?php
      function addToPlayHistory($user_id, $track_id) {
            try {
                  $conn = connectdb();
                  
                  // Lấy thông tin track từ bảng music_tracks
                  $trackStmt = $conn->prepare("SELECT file_url, track_name, artist, image_url, play_count FROM music_tracks WHERE track_id = ?");
                  $trackStmt->execute([$track_id]);
                  $trackInfo = $trackStmt->fetch(PDO::FETCH_ASSOC);
                  
                  if (!$trackInfo) {
                        return false; // Track không tồn tại
                  }
                  
                  // Kiểm tra xem track_id đã tồn tại cho user này chưa
                  $checkStmt = $conn->prepare("SELECT id FROM play_history WHERE user_id = ? AND track_id = ?");
                  $checkStmt->execute([$user_id, $track_id]);
            
                  if ($checkStmt->rowCount() > 0) {
                        // Nếu đã tồn tại, cập nhật thời gian played_at mới nhất và thông tin track
                        $updateStmt = $conn->prepare(
                              "UPDATE play_history SET 
                              played_at = CURRENT_TIMESTAMP,
                              file_url = ?,
                              track_name = ?,
                              artist = ?,
                              image_url = ?,
                              play_count = ? 
                              WHERE user_id = ? AND track_id = ?"
                        );
                        $updateStmt->execute([
                              $trackInfo['file_url'],
                              $trackInfo['track_name'],
                              $trackInfo['artist'],
                              $trackInfo['image_url'],
                              $trackInfo['play_count'],
                              $user_id,
                              $track_id
                        ]);
                  } else {
                        // Nếu chưa tồn tại, thêm bản ghi mới với đầy đủ thông tin
                        $insertStmt = $conn->prepare(
                              "INSERT INTO play_history (
                              user_id, track_id, file_url, track_name, artist, image_url, play_count
                              ) VALUES (?, ?, ?, ?, ?, ?, ?)"
                        );
                        $insertStmt->execute([
                              $user_id,
                              $track_id,
                              $trackInfo['file_url'],
                              $trackInfo['track_name'],
                              $trackInfo['artist'],
                              $trackInfo['image_url'],
                              $trackInfo['play_count']
                        ]);
                  }
                  return true;
            } catch(PDOException $e) {
                  error_log("Error adding play history: " . $e->getMessage());
                  return false;
            }
      }

      function incrementPlayCount($track_id) {
            try {
                  $conn = connectdb();
                  $stmt = $conn->prepare("UPDATE music_tracks SET play_count = play_count + 1 WHERE track_id = ?");
                  $stmt->execute([$track_id]);
                  return true;
            } catch(PDOException $e) {
                  error_log("Error incrementing play count: " . $e->getMessage());
                  return false;
            }
      }
?>