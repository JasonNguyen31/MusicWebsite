<?php
      session_start();
      include "../model/checkAuth.php";
      // Kết nối database cho các truy vấn khác nếu cần
      include_once "../model/db_connect.php";
      $conn = connectdb();
      // Kiểm tra đăng nhập - nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
      if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
            // Thêm header để ngăn cache
            header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
            header("Cache-Control: post-check=0, pre-check=0", false);
            header("Pragma: no-cache");
            header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");
            
            header("Location: ../index.php");
            exit;
      }

      // Ngăn cache để tránh quay lại trang sau khi đăng xuất
      header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
      header("Cache-Control: post-check=0, pre-check=0", false);
      header("Pragma: no-cache");
      header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");

      // Lấy thông tin người dùng
      include "../model/getUserInfo.php";
      include "../model/getUserStats.php"; 
      
      $user_id = $_SESSION['user_id'];
      $userInfo = getUserInfo($user_id);
      $userStats = getUserStats($user_id); // Lấy thông tin stats của user
      $followingUsers = getFollowingUsers($user_id); 
      
      $user_tracks = [];
      try {
            $conn = connectdb();
            $stmt = $conn->prepare("SELECT *, tags FROM music_tracks WHERE user_id = ? ORDER BY upload_date DESC");
            $stmt->execute([$user_id]);
            $user_tracks = $stmt->fetchAll(PDO::FETCH_ASSOC);
      } catch (PDOException $e) {
            // Xử lý lỗi nếu cần
            echo "Lỗi truy vấn: " . $e->getMessage();
      }
?>
<!DOCTYPE html>
<html lang="en">
<head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <!-- Meta tags để ngăn cache -->
      <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
      <meta http-equiv="Pragma" content="no-cache">
      <meta http-equiv="Expires" content="0">
      <title>J'RSC Profile</title>
      <link rel="stylesheet" href="../assets/css/profile.css">
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
      <!-- Script ngăn quay lại trang trước đó và kiểm tra session -->
      <script type="text/javascript">
            // Kiểm tra session theo định kỳ
            function checkSession() {
                  fetch('../model/checkSession.php')
                  .then(response => response.json())
                  .then(data => {
                        if (!data.logged_in) {
                              window.location.href = '../index.php';
                        }
                  })
                  .catch(error => console.error('Error checking session:', error));
            }
            
            // Kiểm tra session mỗi 30 giây
            setInterval(checkSession, 30000);
            
            // Ngăn chặn việc quay lại bằng nút Back của trình duyệt
            history.pushState(null, null, location.href);
            window.onpopstate = function() {
                  history.go(1);
            };
    </script>
</head>
<body>
      <div class="navbar">
            <div class="navbar-inner">
                  <div class="logo" onclick="window.location.href='home.php'" style="cursor: pointer;"> 
                        <img src="../assets/images/logo.png" alt="J'RSC: Stream and listen to music online" class="hero-logo">
                  </div>

                  <div class="main-nav">
                        <a href="home.php" class="nav-item-active home">Home</a>
                        <a href="#" class="nav-item-active">Library</a>
                        <a href="upload.php" class="nav-item-active upload">Upload</a>
                  </div>

                  <div class="search-container">
                        <div class="search-wrapper">
                              <input type="text" class="search-bar" placeholder="Search...">
                              <i class="fas fa-search search-icon"></i>
                        </div>
                  </div>
                  
                  <!-- <div class="auth-buttons">
                        <a href="#" class="sign-in">Sign in</a>
                        <a href="#" class="create-account">Create account</a>
                  </div> -->

                  <div class="user-controls">
                        <div class="profile-container">
                              <div class="profile-image">
                                    <img src="../assets/images/defaults.jpg" alt="Profile" class="profile-pic">
                                    <i class="fas fa-chevron-down"></i>
                              </div>
                              
                              <div class="profile-dropdown">
                                    <ul>
                                          <li onclick="window.location.href='profile.php'" style="cursor: pointer;">
                                                <i class="fas fa-user"></i> Profile
                                          </li>
                                          <li><i class="fas fa-heart"></i> Likes</li>
                                          <li><i class="fas fa-broadcast-tower"></i> Stations</li>
                                          <li><i class="fas fa-users"></i> Following</li>
                                          <li><i class="fas fa-music"></i> Tracks</li>
                                          <li onclick="logoutUser()"><i class="fas fa-sign-out-alt"></i> Sign Out</li>
                                    </ul>
                              </div>
                        </div>

                        <div class="notificate">
                              <i class="fas fa-bell"></i>
                        </div>
                  </div>
            </div>
      </div>
      <div class="main-container">
            <div class="profile-header">
                  <div class="header-image">
                        <img src="">
                        <button class="upload-header-btn">Upload header image</button>
                  </div>
                  <div class="profile-info">
                        <div class="profile-avatar">
                              <img src="">
                              <button class="upload-avatar-btn">Upload image</button>
                        </div>
                        <div class="profile-name">
                              <h1><?php echo htmlspecialchars($userInfo['fullname']); ?></h1>
                              <h2 id="profile-description" class="editable-description" aria-placeholder="Des"><?php echo htmlspecialchars($userInfo['description'] ?? 'Describe your profile'); ?></h2>
                        </div>
                  </div>
            </div>

            <div class="content-area">
                  <div class="track-container">
                        <div class="navbar-profile">
                              <ul class="nav-links">
                                    <li class="nav-item active"><a href="#">All</a></li>
                                    <li class="nav-item"><a href="#">Popular tracks</a></li>
                                    <li class="nav-item"><a href="#">Tracks</a></li>
                                    <li class="nav-item"><a href="#">Albums</a></li>
                                    <li class="nav-item"><a href="#">Playlists</a></li>
                                    <li class="nav-item"><a href="#">Reposts</a></li>
                              </ul>
                        </div>

                        <div class="track-header">
                              <h2>Recently Upload</h2>
                        </div>

                        <div class="track-list-container">
                              <?php if (empty($user_tracks)): ?>
                                    <div class="no-tracks">
                                          <p>You don't have any songs yet. Be the first to <a href="upload.php">upload</a> your song!</p>
                                    </div>
                              <?php else: ?>
                                    <?php foreach ($user_tracks as $track): ?>
                                          <div class="track-item" data-track-id="<?php echo $track['track_id']; ?>">
                                                <div class="track-image">
                                                      <?php if (!empty($track['image_url'])): ?>
                                                            <img src="../<?php echo htmlspecialchars($track['image_url']); ?>" alt="<?php echo htmlspecialchars($track['track_name']); ?>">
                                                      <?php else: ?>
                                                            <img src="../assets/images/defaults.jpg" alt="Default track image">
                                                      <?php endif; ?>
                                                </div>

                                                <div class="track-info">
                                                      <div class="play-button-container">
                                                            <button class="track-play-pause" data-file="/WebDev/finalproject/uploads/tracks/<?php echo basename($track['file_url']); ?>">
                                                                  <i class="fas fa-play"></i>
                                                            </button>
                                                      </div>

                                                      <div class="track-artist-info">
                                                            <span class="track-artist"><?php echo htmlspecialchars($track['artist']); ?></span>
                                                            <span class="track-time"><?php echo date('d/m/Y', strtotime($track['upload_date'])); ?></span>
                                                      </div>
                                                      
                                                      <div class="title-and-genre">
                                                            <div class="track-title"><?php echo htmlspecialchars($track['track_name']); ?></div>
                                                            <div class="track-genre" data-tags="<?php echo htmlspecialchars($track['tags']); ?>"></div>
                                                      </div>

                                                      <div class="track-actions">
                                                            <div class="track-stats">
                                                                  <button class="stat-button like-button">
                                                                        <i class="fas fa-heart"></i> <?php echo $track['like_count'] ?? 0; ?>
                                                                  </button>
                                                                  <button class="stat-button repost-button">
                                                                        <i class="fas fa-retweet"></i> <?php echo $track['reposts_count'] ?? 0; ?>
                                                                  </button>
                                                                  <button class="stat-button share-track-button">
                                                                        <i class="fas fa-share-square"></i>
                                                                  </button>
                                                                  <button class="stat-button copy-button" data-permalink="<?php echo htmlspecialchars($track['permalink']); ?>">
                                                                        <i class="far fa-copy"></i>
                                                                  </button>
                                                                  <button class="stat-button more-button">
                                                                        <i class="fas fa-ellipsis-h"></i>
                                                                  </button>
                                                            </div>
                                                            <div class="track-play-info">
                                                                  <span class="track-plays"><i class="fas fa-play"></i> <?php echo $track['play_count'] ?? 0; ?></span>
                                                                  <span class="track-comments"><i class="fas fa-comment"></i> <?php echo $track['comments_count'] ?? 0; ?></span>
                                                            </div>
                                                      </div>
                                                </div>
                                          </div>
                                    <?php endforeach; ?>
                              <?php endif; ?>
                        </div>
                  </div>

                  <div class="sidebar">
                        <div class="sidebar-actions">
                              <button class="action-button share-button">
                                    <i class="fas fa-share-square"></i> 
                              </button>
                              <button class="action-button edit-button">
                                    <i class="fas fa-pencil-alt"></i> 
                              </button>
                        </div>

                        <div class="stats-counters">
                              <div class="stat-counter">
                                    <div class="stat-label">Followers</div>
                                    <div class="stat-number"><?php echo $userStats['following_count']; ?></div>
                              </div>
                              <div class="stat-counter">
                                    <div class="stat-label">Following</div>
                                    <div class="stat-number"><?php echo $userStats['follower_count']; ?></div>
                              </div>
                              <div class="stat-counter">
                                    <div class="stat-label">Tracks</div>
                                    <div class="stat-number"><?php echo $userStats['track_count']; ?></div>
                              </div>
                        </div>

                        <div class="artists-follow">
                              <div class="sidebar-header">
                                    <h3><?php echo $userStats['follower_count']; ?> FOLLOWING</h3>
                                    <a href="#" class="view-all">View all</a>
                              </div>

                              <div class="artist-list">
                                    <?php if (empty($followingUsers)): ?>
                                          <p>You are not following anyone yet.</p>
                                    <?php else: ?>
                                          <?php foreach ($followingUsers as $index => $user): ?>
                                                <?php if ($index < 3): ?>
                                                      <div class="artist-item" data-user-id="<?php echo $user['id']; ?>">
                                                            <div class="artist-avatar">
                                                            <?php if (!empty($user['profile_image'])): ?>
                                                                  <img src="../<?php echo htmlspecialchars($user['profile_image']); ?>" alt="<?php echo htmlspecialchars($user['fullname']); ?>">
                                                            <?php else: ?>
                                                                  <img src="../assets/images/defaults.jpg" alt="Default avatar">
                                                            <?php endif; ?>
                                                            </div>
                                                            <div class="artist-info">
                                                            <p class="artist-name"><?php echo htmlspecialchars($user['fullname']); ?></p>
                                                            <div class="stats-and-button">
                                                                  <div class="artist-stats">
                                                                        <span><i class="fas fa-user"></i> <?php echo $user['follower_count']; ?></span>
                                                                        <span><i class="fas fa-music"></i> <?php echo $user['track_count']; ?></span>
                                                                  </div>
                                                                  <button class="unfollow-btn" data-user-id="<?php echo $user['id']; ?>">
                                                                        Unfollow
                                                                  </button>
                                                            </div>
                                                            </div>
                                                      </div>
                                                <?php endif; ?>
                                          <?php endforeach; ?>
                                    <?php endif; ?>
                              </div>
                        </div>
                  </div>
            </div>  
      </div>

      <div id="followingPopup" class="popup-container">
            <div class="popup-content">
                  <div class="popup-header">
                        <h3>Following List:</h3>
                        <button class="close-popup"><i class="fas fa-times"></i></button>
                  </div>
                  <div class="popup-body">
                        <div class="all-following-list">
                              <?php if (empty($followingUsers)): ?>
                                    <p>You are not following anyone yet.</p>
                              <?php else: ?>
                                    <?php foreach ($followingUsers as $user): ?>
                                          <div class="artist-item" data-user-id="<?php echo $user['id']; ?>">
                                                <div class="artist-avatar">
                                                      <?php if (!empty($user['profile_image'])): ?>
                                                            <img src="../<?php echo htmlspecialchars($user['profile_image']); ?>" alt="<?php echo htmlspecialchars($user['fullname']); ?>">
                                                      <?php else: ?>
                                                            <img src="../assets/images/defaults.jpg" alt="Default avatar">
                                                      <?php endif; ?>
                                                </div>
                                                <div class="artist-info">
                                                      <p class="artist-name"><?php echo htmlspecialchars($user['fullname']); ?></p>
                                                      <div class="stats-and-button">
                                                            <div class="artist-stats">
                                                            <span><i class="fas fa-user"></i> <?php echo $user['follower_count']; ?></span>
                                                            <span><i class="fas fa-music"></i> <?php echo $user['track_count']; ?></span>
                                                            </div>
                                                            <button class="unfollow-btn" data-user-id="<?php echo $user['id']; ?>">
                                                                  Unfollow
                                                            </button>
                                                      </div>
                                                </div>
                                          </div>
                                    <?php endforeach; ?>
                              <?php endif; ?>
                        </div>
                  </div>
            </div>
      </div>
      
      <div class="music-player">
            <div class="player-controls">
                  <button class="control-btn skip-back"><i class="fas fa-step-backward"></i></button>
                  <button class="control-btn play-pause"><i class="fas fa-play"></i></button>
                  <button class="control-btn skip-forward"><i class="fas fa-step-forward"></i></button>
                  <button class="control-btn repeat"><i class="fas fa-redo"></i></button>

                  <span class="current-time"></span>
                  <div class="progress-bar">
                        <input type="range" min="0" max="100" value="0" class="seek-bar">
                  </div>
                  <span class="total-time"></span>

                  <div class="volume-container">
                        <button class="control-btn volume"><i class="fas fa-volume-up"></i></button>
                        <div class="volume-slider">
                              <div class="volume-bar">
                                    <div class="volume-level" style="height: 100%;"></div>
                              </div>
                        </div>
                  </div>
                  
                  <div class="song-info">
                        <img src="" alt="Track cover">
                        <div class="song-details">
                              <span class="song-title"></span>
                              <span class="song-artist"></span>
                        </div>
                  </div>
                  
                  <div class="song-actions">
                        <button class="song-action-btn like"><i class="fas fa-heart"></i></button>
                        <button class="song-action-btn playlist"><i class="fas fa-user-plus"></i></button>
                        <button class="song-action-btn more-options"><i class="fas fa-stream"></i></button>
                  </div>
            </div>
      </div>

      <script src="../scripts/manageFollowing.js"></script>
      <script src="../scripts/profileDropdown.js"></script>
      <script src="../scripts/uploadImage.js"></script>
      <script src="../scripts/signOut.js"></script>
      <script defer src="../scripts/likeTrack.js"></script>
      <script src="../scripts/realTimeProfileUpdate.js"></script>
      <script src="../scripts/editDescription.js"></script>
      <script src="../scripts/loadingTrack.js"></script>
      <script defer src="../scripts/audioPlayer.js"></script>
      <script defer src="../scripts/likeTrack.js"></script>
</body>
</html>