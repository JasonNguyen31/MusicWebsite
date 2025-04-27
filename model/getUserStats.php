<?php
      function getUserStats($user_id) {
            try {
                  $conn = connectdb();
                  
                  // Đếm số followers (người theo dõi mình)
                  $stmt = $conn->prepare("SELECT COUNT(*) as follower_count FROM user_follows WHERE follower_id = ?");
                  $stmt->execute([$user_id]);
                  $follower_count = $stmt->fetch(PDO::FETCH_ASSOC)['follower_count'];
                  
                  // Đếm số following (mình theo dõi người khác)
                  $stmt = $conn->prepare("SELECT COUNT(*) as following_count FROM user_follows WHERE following_id = ?");
                  $stmt->execute([$user_id]);
                  $following_count = $stmt->fetch(PDO::FETCH_ASSOC)['following_count'];
                  
                  // Đếm số tracks
                  $stmt = $conn->prepare("SELECT COUNT(*) as track_count FROM music_tracks WHERE user_id = ?");
                  $stmt->execute([$user_id]);
                  $track_count = $stmt->fetch(PDO::FETCH_ASSOC)['track_count'];
                  
                  return [
                        'follower_count' => $follower_count,
                        'following_count' => $following_count,
                        'track_count' => $track_count
                  ];
            } catch (PDOException $e) {
                  // Xử lý lỗi
                  error_log("Lỗi khi lấy thông tin user stats: " . $e->getMessage());
                  return [
                        'follower_count' => 0,
                        'following_count' => 0,
                        'track_count' => 0
                  ];
            }
      }

      // Lấy danh sách người dùng mà user hiện tại đang follow
      function getFollowingUsers($user_id) {
            try {
                $conn = connectdb();
                
                // Join bảng user_follows với users để lấy thông tin chi tiết của người được follow
                // user_id = follower_id khi người dùng hiện tại follow người khác
                $stmt = $conn->prepare("
                    SELECT u.*, 
                          (SELECT COUNT(*) FROM user_follows WHERE following_id = u.id) as follower_count,
                          (SELECT COUNT(*) FROM music_tracks WHERE user_id = u.id) as track_count
                    FROM users u
                    INNER JOIN user_follows uf ON u.id = uf.following_id
                    WHERE uf.follower_id = ?
                    ORDER BY uf.followed_at DESC
                ");
                $stmt->execute([$user_id]);
                return $stmt->fetchAll(PDO::FETCH_ASSOC);
            } catch (PDOException $e) {
                // Xử lý lỗi
                error_log("Lỗi khi lấy danh sách following: " . $e->getMessage());
                return [];
            }
        }
?>