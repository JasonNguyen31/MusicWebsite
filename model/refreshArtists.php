<?php
      session_start();
      if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
            header('Content-Type: application/json');
            echo json_encode(['error' => 'Unauthorized']);
            exit;
      }
      
      include "db_connect.php";
      $conn = connectdb();
      
      function getRandomTopArtists($conn, $limit = 3) {
            try {
                  $current_user_id = $_SESSION['user_id'];
                  
                  // Get random artists with most followers, excluding current user
                  // Add DISTINCT to prevent duplicate users in the results
                  $stmt = $conn->prepare(
                        "SELECT DISTINCT u.id, u.fullname, u.username, 
                        COALESCE(u.follower, 0) as follower, 
                        COALESCE(u.track_count, 0) as track_count, 
                        u.profile_image
                        FROM users u
                        WHERE u.id != :current_user_id
                        ORDER BY RAND(), u.follower DESC
                        LIMIT :limit"
                  );
                  $stmt->bindParam(':current_user_id', $current_user_id, PDO::PARAM_INT);
                  $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
                  $stmt->execute();
                  $artists = $stmt->fetchAll(PDO::FETCH_ASSOC);
                  
                  // Ensure no duplicate artists by username
                  $uniqueArtists = [];
                  $seenUsernames = [];
                  
                  foreach ($artists as $artist) {
                        if (!in_array(strtolower($artist['username']), $seenUsernames)) {
                              $seenUsernames[] = strtolower($artist['username']);
                              $uniqueArtists[] = $artist;
                        }
                  }
                  
                  // Check follow status for each artist
                  foreach ($uniqueArtists as &$artist) {
                        $checkStmt = $conn->prepare(
                              "SELECT * FROM user_follows 
                              WHERE follower_id = :follower_id AND following_id = :following_id"
                        );
                        $checkStmt->bindParam(':follower_id', $current_user_id, PDO::PARAM_INT);
                        $checkStmt->bindParam(':following_id', $artist['id'], PDO::PARAM_INT);
                        $checkStmt->execute();
                        $artist['is_following'] = ($checkStmt->rowCount() > 0);
                  }
                  
                  return $uniqueArtists;
            } catch(PDOException $e) {
                  return ['error' => $e->getMessage()];
            }
      }
      
      // Add cache-busting headers
      header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
      header('Cache-Control: post-check=0, pre-check=0', false);
      header('Pragma: no-cache');
      header('Content-Type: application/json');
      
      $artists = getRandomTopArtists($conn, 3);
      echo json_encode($artists);
?>