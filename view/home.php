<?php
    session_start();
    include "../model/checkAuth.php";
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

    // Kết nối database
    include "../model/db_connect.php";
    $conn = connectdb();
    
    // Kiểm tra kết nối
    if (!$conn) {
        die("Không thể kết nối đến cơ sở dữ liệu");
    }

    // Hàm lấy danh sách tracks từ database
    function getRecommendedTracks($conn, $limit = 12) {
        try {
            $stmt = $conn->prepare("SELECT * FROM music_tracks ORDER BY play_count DESC LIMIT :limit");
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Lỗi truy vấn: " . $e->getMessage();
            return [];
        }
    }
    
    $recommendedTracks = getRecommendedTracks($conn, 12);

    function getRecentlyPlayedTracks($conn, $user_id, $limit = 12) {
        try {
            $stmt = $conn->prepare(
                "SELECT * FROM play_history 
                 WHERE user_id = :user_id 
                 ORDER BY played_at DESC 
                 LIMIT :limit"
            );
            
            $stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetchAll(PDO::FETCH_ASSOC);
        } catch(PDOException $e) {
            echo "Lỗi truy vấn: " . $e->getMessage();
            return [];
        }
    }

    $user_id = $_SESSION['user_id'];
    $recentlyPlayedTracks = getRecentlyPlayedTracks($conn, $user_id, 12);

    function getTopArtists($conn, $limit = 3) {
        try {
            $current_user_id = $_SESSION['user_id'];
            $stmt = $conn->prepare(
                "SELECT u.*, COALESCE(u.follower, 0) as follower_count
                FROM users u
                WHERE u.id != :current_user_id
                ORDER BY u.follower DESC, u.id DESC
                LIMIT :limit"
            );
            $stmt->bindParam(':current_user_id', $current_user_id, PDO::PARAM_INT);
            $stmt->bindParam(':limit', $limit, PDO::PARAM_INT);
            $stmt->execute();
            
            $artists = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            // Check follow status and get track count for each artist
            foreach ($artists as &$artist) {
                // Check follow status
                $checkStmt = $conn->prepare(
                    "SELECT * FROM user_follows 
                    WHERE follower_id = :follower_id AND following_id = :following_id"
                );
                $checkStmt->bindParam(':follower_id', $current_user_id, PDO::PARAM_INT);
                $checkStmt->bindParam(':following_id', $artist['id'], PDO::PARAM_INT);
                $checkStmt->execute();
                $artist['is_following'] = ($checkStmt->rowCount() > 0);
                
                // Count tracks
                $trackStmt = $conn->prepare("SELECT COUNT(*) as track_count FROM music_tracks WHERE user_id = ?");
                $trackStmt->execute([$artist['id']]);
                $artist['track_count'] = $trackStmt->fetch(PDO::FETCH_ASSOC)['track_count'];
            }
            
            return $artists;
        } catch(PDOException $e) {
            echo "Query error: " . $e->getMessage();
            return [];
        }
    }
    
    $topArtists = getTopArtists($conn, 3);
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
    <title>Discover the top streamed music and songs online on J'RSC </title>
    <link rel="stylesheet" href="../assets/css/home.css">
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
                        <img src="" alt="Profile" class="profile-pic">
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
        <div class="content-area">
            <div class="track-container">
                <!-- More of what you like section -->
                <section class="recommendations">
                    <h3 class="section-title">More of what you like</h3>
                    <div class="tracks-container">
                        <button class="nav-arrow prev"><i class="fas fa-chevron-left"></i></button>
                        <div class="track-cards-wrapper">
                            <!-- Track cards -->
                            <?php foreach ($recommendedTracks as $track): ?>
                                <div class="track-card" data-track-id="<?php echo htmlspecialchars($track['track_id']); ?>">
                                    <div class="track-artwork">
                                        <?php if (!empty($track['image_url'])): ?>
                                            <img src="../<?php echo htmlspecialchars($track['image_url']); ?>" alt="<?php echo htmlspecialchars($track['track_name']); ?>">
                                        <?php else: ?>
                                            <img src="../assets/images/defaults.jpg" alt="Default track image">
                                        <?php endif; ?>

                                        <!-- Play button in the center -->
                                        <button class="track-play-pause" data-file="/WebDev/finalproject/uploads/tracks/<?php echo basename($track['file_url']); ?>">
                                            <i class="fas fa-play"></i>
                                        </button>

                                        <!-- Bottom controls: heart icon and three dots menu -->
                                        <div class="track-controls">
                                            <button class="love-button">
                                                <i class="fas fa-heart"></i>
                                            </button>
                                            <button class="more-options">
                                                <i class="fas fa-ellipsis-h"></i>
                                            </button>
                                        </div>

                                        <!-- Related tag remains as is -->
                                        <div class="recomment-tag">POPULAR TRACKS</div>
                                    </div>
                                    <div class="track-info">
                                        <h3 class="track-title"><?php echo htmlspecialchars($track['track_name']); ?></h3>
                                        <p class="track-artist"><?php echo htmlspecialchars($track['artist']); ?></p>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                        <button class="nav-arrow next"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </section>

                <!-- Recently Played section -->
                <section class="recently-played">
                    <h3 class="section-title">Recently Played</h3>
                    <div class="tracks-container">
                        <button class="nav-arrow prev"><i class="fas fa-chevron-left"></i></button>
                        <div class="track-cards-wrapper">
                            <!-- Track cards -->
                            <?php if (empty($recentlyPlayedTracks)): ?>
                                <div class="no-recent-tracks">
                                    <p>You haven't played any songs recently.</p>
                                </div>
                            <?php else: ?>
                                <?php foreach ($recentlyPlayedTracks as $track): ?>
                                    <div class="track-card" data-track-id="<?php echo htmlspecialchars($track['track_id']); ?>">
                                        <div class="track-artwork">
                                            <?php if (!empty($track['image_url'])): ?>
                                                <img src="../<?php echo htmlspecialchars($track['image_url']); ?>" alt="<?php echo htmlspecialchars($track['track_name']); ?>">
                                            <?php else: ?>
                                                <img src="../assets/images/defaults.jpg" alt="Default track image">
                                            <?php endif; ?>

                                            <!-- Play button in the center -->
                                            <button class="track-play-pause" data-file="/WebDev/finalproject/uploads/tracks/<?php echo basename($track['file_url']); ?>">
                                                <i class="fas fa-play"></i>
                                            </button>

                                            <!-- Bottom controls: heart icon and three dots menu -->
                                            <div class="track-controls">
                                                <button class="love-button">
                                                    <i class="fas fa-heart"></i>
                                                </button>
                                                <button class="more-options">
                                                    <i class="fas fa-ellipsis-h"></i>
                                                </button>
                                            </div>

                                            <!-- Related tag remains as is -->
                                            <div class="recomment-tag">RECENTLY TRACKS</div>
                                        </div>
                                        <div class="track-info">
                                            <h3 class="track-title"><?php echo htmlspecialchars($track['track_name']); ?></h3>
                                            <p class="track-artist"><?php echo htmlspecialchars($track['artist']); ?></p>
                                        </div>
                                    </div>
                                <?php endforeach; ?>
                            <?php endif; ?>
                        </div>
                        <button class="nav-arrow next"><i class="fas fa-chevron-right"></i></button>
                    </div>
                </section>
            </div>

            <!-- Sidebar -->
            <div class="sidebar">
                <!-- Artists You Should Follow Section -->
                <div class="artists-follow">
                    <div class="sidebar-header">
                        <h2>ARTISTS YOU SHOULD FOLLOW</h2>
                        <a href="#" class="refresh-link">
                            <i class="fas fa-refresh"></i>
                        </a>
                    </div>
                    <div class="artist-list">
                        <?php foreach ($topArtists as $artist): ?>
                            <div class="artist-item" data-user-id="<?php echo htmlspecialchars($artist['id']); ?>">
                                <div class="artist-avatar">
                                    <?php if (!empty($artist['profile_image'])): ?>
                                        <img src="../<?php echo htmlspecialchars($artist['profile_image']); ?>" alt="<?php echo htmlspecialchars($artist['fullname'] ?: $artist['username']); ?>">
                                    <?php else: ?>
                                        <img src="../assets/images/defaults.jpg" alt="Default profile">
                                    <?php endif; ?>
                                </div>
                                <div class="artist-info">
                                    <p class="artist-name"><?php echo htmlspecialchars($artist['fullname'] ?: $artist['username']); ?></p>
                                    <div class="stats-and-button">
                                        <div class="artist-stats">
                                            <span><i class="fas fa-user"></i> <?php echo number_format($artist['follower']); ?></span>
                                            <span><i class="fas fa-music"></i> <?php echo number_format($artist['track_count']); ?></span>
                                        </div>
                                        <?php
                                        // Check if current user is following this artist
                                        $isFollowing = false;
                                        try {
                                            $checkStmt = $conn->prepare(
                                                "SELECT * FROM user_follows 
                                                WHERE follower_id = :follower_id AND following_id = :following_id"
                                            );
                                            $checkStmt->bindParam(':follower_id', $_SESSION['user_id'], PDO::PARAM_INT);
                                            $checkStmt->bindParam(':following_id', $artist['id'], PDO::PARAM_INT);
                                            $checkStmt->execute();
                                            $isFollowing = ($checkStmt->rowCount() > 0);
                                        } catch(PDOException $e) {
                                            // Handle error if needed
                                        }
                                        ?>
                                        <button class="follow-btn <?php echo $isFollowing ? 'following' : ''; ?>" data-user-id="<?php echo htmlspecialchars($artist['id']); ?>">
                                            <i class="fas <?php echo $isFollowing ? 'fa-user-check' : 'fa-user-plus'; ?>"></i>
                                            <?php echo $isFollowing ? 'Following' : 'Follow'; ?>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    </div>
                </div>

                <!-- Listen History Section -->
                <div class="listening-history">
                    <div class="sidebar-header">
                        <h2>LIKED TRACKS</h2>
                        <a href="#" class="view-link">
                            <i class="fas fa-caret-down"></i>
                        </a>
                    </div>
        
                    <div class="song-list">
                        <?php if (empty($likedTracks)): ?>
                            <div class="no-liked-tracks">
                                <p>You have not liked any songs yet.</p>
                            </div>
                        <?php else: ?>
                            <?php foreach ($likedTracks as $track): ?>
                                <div class="song-item" data-track-id="<?php echo htmlspecialchars($track['track_id']); ?>">
                                    <div class="user-avatar">
                                        <?php if (!empty($track['image_url'])): ?>
                                            <img src="../<?php echo htmlspecialchars($track['image_url']); ?>" alt="<?php echo htmlspecialchars($track['track_name']); ?>">
                                        <?php else: ?>
                                            <img src="../assets/images/defaults.jpg" alt="Default track image">
                                        <?php endif; ?>
                                    </div>
                                    <div class="history-info">
                                        <p class="history-artist-name"><?php echo htmlspecialchars($track['artist']); ?></p>
                                        <p class="history-song-name"><?php echo htmlspecialchars($track['track_name']); ?></p>
                                        <div class="stats-and-button">
                                            <div class="history-stats">
                                                <span><i class="fas fa-play"></i> <?php echo number_format($track['play_count']); ?></span>
                                                <span><i class="fas fa-heart"></i> <?php echo number_format($track['like_count']); ?></span>
                                                <span><i class="fas fa-retweet"></i> 0</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="play-button-container">
                                        <button class="track-play-pause" data-file="/WebDev/finalproject/uploads/tracks/<?php echo basename($track['file_url']); ?>">
                                                <i class="fas fa-play"></i>
                                        </button>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                    </div>
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
    <script defer src="../scripts/audioPlayer.js"></script>
    <script defer src="../scripts/likeTrack.js"></script>
    <script defer src="../scripts/downloadTrack.js"></script>
    <script defer src="../scripts/profileDropdown.js"></script>
    <script src="../scripts/signOut.js"></script>
    <script src="../scripts/realTimeProfileUpdate.js"></script>
    <script src="../scripts/artistsLoader.js"></script>
    <script defer src="../scripts/recentTracksLoader.js"></script>
</body>
</html>