<?php
      session_start();
      if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Unauthorized']);
            exit;
      }
      
      // Check the submitted data
      if (!isset($_POST['user_id']) || !is_numeric($_POST['user_id'])) {
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Invalid user ID']);
            exit;
      }
      
      include "db_connect.php";
      $conn = connectdb();
      
      $follower_id = $_SESSION['user_id'];
      $following_id = (int)$_POST['user_id'];
      
      // Cannot follow yourself
      if ($follower_id == $following_id) {
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Cannot follow yourself']);
            exit;
      }
      
      try {
            // Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
            $conn->beginTransaction();
            
            // Check if already following
            $checkStmt = $conn->prepare(
                  "SELECT * FROM user_follows 
                  WHERE follower_id = :follower_id AND following_id = :following_id"
            );
            $checkStmt->bindParam(':follower_id', $follower_id, PDO::PARAM_INT);
            $checkStmt->bindParam(':following_id', $following_id, PDO::PARAM_INT);
            $checkStmt->execute();
            
            $isFollowing = ($checkStmt->rowCount() > 0);
            $timestamp = date('Y-m-d H:i:s');
            
            // Lấy thông tin hiện tại để kiểm tra sau
            $getUserFollowing = $conn->prepare("SELECT following FROM users WHERE id = :follower_id");
            $getUserFollowing->bindParam(':follower_id', $follower_id, PDO::PARAM_INT);
            $getUserFollowing->execute();
            $currentFollowing = $getUserFollowing->fetchColumn();
            
            $getUserFollower = $conn->prepare("SELECT follower FROM users WHERE id = :following_id");
            $getUserFollower->bindParam(':following_id', $following_id, PDO::PARAM_INT);
            $getUserFollower->execute();
            $currentFollower = $getUserFollower->fetchColumn();
            
            if ($isFollowing) {
                  // If already following, unfollow
                  $stmt = $conn->prepare(
                  "DELETE FROM user_follows 
                  WHERE follower_id = :follower_id AND following_id = :following_id"
                  );
                  $stmt->bindParam(':follower_id', $follower_id, PDO::PARAM_INT);
                  $stmt->bindParam(':following_id', $following_id, PDO::PARAM_INT);
                  $stmt->execute();
                  
                  // Thay vì +/- 1, chúng ta sẽ tính lại chính xác số lượng
                  // Đếm số người đang theo dõi user đích
                  $countFollowers = $conn->prepare("SELECT COUNT(*) FROM user_follows WHERE following_id = :following_id");
                  $countFollowers->bindParam(':following_id', $following_id, PDO::PARAM_INT);
                  $countFollowers->execute();
                  $followerCount = $countFollowers->fetchColumn();
                  
                  // Đếm số người mà user hiện tại đang theo dõi
                  $countFollowing = $conn->prepare("SELECT COUNT(*) FROM user_follows WHERE follower_id = :follower_id");
                  $countFollowing->bindParam(':follower_id', $follower_id, PDO::PARAM_INT);
                  $countFollowing->execute();
                  $followingCount = $countFollowing->fetchColumn();
                  
                  // Cập nhật follower count cho người bị unfollow
                  $updateFollowerCount = $conn->prepare("UPDATE users SET follower = :count WHERE id = :following_id");
                  $updateFollowerCount->bindParam(':count', $followerCount, PDO::PARAM_INT);
                  $updateFollowerCount->bindParam(':following_id', $following_id, PDO::PARAM_INT);
                  $updateFollowerCount->execute();
                  
                  // Cập nhật following count cho người thực hiện unfollow
                  $updateFollowingCount = $conn->prepare("UPDATE users SET following = :count WHERE id = :follower_id");
                  $updateFollowingCount->bindParam(':count', $followingCount, PDO::PARAM_INT);
                  $updateFollowingCount->bindParam(':follower_id', $follower_id, PDO::PARAM_INT);
                  $updateFollowingCount->execute();
                  
                  $result = [
                    'status' => 'unfollowed',
                    'newFollowerCount' => $followerCount,
                    'newFollowingCount' => $followingCount
                  ];
            } else {
                  // If not following, follow
                  $stmt = $conn->prepare(
                  "INSERT INTO user_follows (follower_id, following_id, followed_at) 
                  VALUES (:follower_id, :following_id, :followed_at)"
                  );
                  $stmt->bindParam(':follower_id', $follower_id, PDO::PARAM_INT);
                  $stmt->bindParam(':following_id', $following_id, PDO::PARAM_INT);
                  $stmt->bindParam(':followed_at', $timestamp);
                  $stmt->execute();
                  
                  // Đếm số người đang theo dõi user đích
                  $countFollowers = $conn->prepare("SELECT COUNT(*) FROM user_follows WHERE following_id = :following_id");
                  $countFollowers->bindParam(':following_id', $following_id, PDO::PARAM_INT);
                  $countFollowers->execute();
                  $followerCount = $countFollowers->fetchColumn();
                  
                  // Đếm số người mà user hiện tại đang theo dõi
                  $countFollowing = $conn->prepare("SELECT COUNT(*) FROM user_follows WHERE follower_id = :follower_id");
                  $countFollowing->bindParam(':follower_id', $follower_id, PDO::PARAM_INT);
                  $countFollowing->execute();
                  $followingCount = $countFollowing->fetchColumn();
                  
                  // Cập nhật follower count cho người được follow
                  $updateFollowerCount = $conn->prepare("UPDATE users SET follower = :count WHERE id = :following_id");
                  $updateFollowerCount->bindParam(':count', $followerCount, PDO::PARAM_INT);
                  $updateFollowerCount->bindParam(':following_id', $following_id, PDO::PARAM_INT);
                  $updateFollowerCount->execute();
                  
                  // Cập nhật following count cho người thực hiện follow
                  $updateFollowingCount = $conn->prepare("UPDATE users SET following = :count WHERE id = :follower_id");
                  $updateFollowingCount->bindParam(':count', $followingCount, PDO::PARAM_INT);
                  $updateFollowingCount->bindParam(':follower_id', $follower_id, PDO::PARAM_INT);
                  $updateFollowingCount->execute();
                  
                  // Get a new artist to replace this one
                  $newArtistStmt = $conn->prepare(
                  "SELECT u.*, u.id as id, u.fullname as fullname, u.username as username, 
                  COALESCE(u.follower, 0) as follower, 
                  COALESCE(u.track_count, 0) as track_count,
                  u.profile_image
                  FROM users u
                  LEFT JOIN user_follows uf ON u.id = uf.following_id AND uf.follower_id = :follower_id
                  WHERE u.id != :follower_id
                  AND u.id != :following_id
                  AND uf.follower_id IS NULL
                  ORDER BY RAND()
                  LIMIT 1"
                  );
                  $newArtistStmt->bindParam(':follower_id', $follower_id, PDO::PARAM_INT);
                  $newArtistStmt->bindParam(':following_id', $following_id, PDO::PARAM_INT);
                  $newArtistStmt->execute();
                  $newArtist = $newArtistStmt->fetch(PDO::FETCH_ASSOC);
                  
                  $result = [
                  'status' => 'followed',
                  'newArtist' => $newArtist ?: null,
                  'newFollowerCount' => $followerCount,
                  'newFollowingCount' => $followingCount
                  ];
            }
            
            // Commit transaction
            $conn->commit();
            
            header('Content-Type: application/json');
            echo json_encode($result);
            
      } catch(PDOException $e) {
            // Nếu có lỗi, rollback lại để tránh dữ liệu bị sai lệch
            $conn->rollBack();
            
            header('Content-Type: application/json');
            echo json_encode(['error' => $e->getMessage()]);
      }
?>