<?php
    // Kết nối database
    session_start();
    require_once '../model/db_connect.php';
    unset($_SESSION['track_info']);
    unset($_SESSION['uploaded_file']);
    unset($_SESSION['file_url']);
    unset($_SESSION['track_id']);
    unset($_SESSION['upload_in_progress']);
    unset($_SESSION['user_upload']);

    // Xóa cả cờ báo form đã được submit trong session
    unset($_SESSION['show_success_popup']);
    unset($_SESSION['success_message']);
    unset($_SESSION['error_message']);
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

    // Hàm tính phần trăm dung lượng đã sử dụng (giả lập)
    function getUsedStoragePercentage() {
        // Trong thực tế, bạn cần tính toán dựa trên dữ liệu thực
        return 73;
    }

    // Phần trăm dung lượng đã sử dụng
    $usedPercentage = getUsedStoragePercentage();
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
    <title>Upload Track</title>
    <link rel="stylesheet" href="../assets/css/upload.css">
    <link rel="stylesheet" href="../assets/css/musicPlayer.css">
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
    
    <!-- <div class="main-container">
        <div class="header">
            <div class="usage-info">
                <span><?php echo $usedPercentage; ?>% of free uploads used</span>
                <svg class="down-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M6 9l6 6 6-6" />
                </svg>
            </div>
            <div class="usage-bar">
                <div class="usage-progress" style="width: <?php echo $usedPercentage; ?>%;"></div>
            </div>
            <button class="try-pro">Try Pro Unlimited</button>
        </div>
        
        <div class="drop-area" id="drop-zone">
            <h2>Drag and drop your tracks & albums here</h2>
            <button class="upload-btn" onclick="document.getElementById('file-input').click()">
                or choose files to upload
            </button>
            <input type="file" id="file-input" multiple style="display: none;" accept="audio/*">
            
            <div class="selected-files" id="selected-files-container">
                <div class="file-list" id="file-list"></div>
            </div>
            
            <div class="options">
                <label>
                    <input type="checkbox"> Make a playlist when multiple files are selected
                </label>
                
                <div class="radio-group">
                    <label>Privacy:</label>
                    <label>
                        <input type="radio" name="privacy" value="public" checked> Public
                    </label>
                    <label>
                        <input type="radio" name="privacy" value="private"> Private
                    </label>
                </div>
            </div>

            <div class="upload-button-container">
                <button id="upload-files-btn" class="upload-files-btn" disabled>Upload</button>
            </div>
        </div>
    </div> -->

    <!-- Main content container -->
    <div id="content-container">
        <!-- Content will be loaded here dynamically -->
    </div>

    <!-- Separate music player container -->
    <div id="music-player-container">
        <!-- Music player will be loaded here dynamically -->
    </div>

    <script src="../scripts/app.js"></script>
    <!-- <script src="../scripts/upload.js"></script> -->
    <script src="../scripts/signOut.js"></script>
    <script src="../scripts/profileDropdown.js"></script>
    <script src="../scripts/realTimeProfileUpdate.js"></script>
    <script defer src="../scripts/audioPlayer.js"></script>

    <script>
        // Khởi tạo hàm xử lý cho trang upload
        window.initUploadPage = function() {
            // Khởi tạo các sự kiện cho trang upload
            const dropZone = document.getElementById('drop-zone');
            const fileInput = document.getElementById('file-input');
            const fileList = document.getElementById('file-list');
            const selectedFilesContainer = document.getElementById('selected-files-container');
            const uploadBtn = document.getElementById('upload-files-btn');
            
            // Các hàm xử lý event cho upload
            // (Mã từ upload.js sẽ được đưa vào đây)
        };
        
        // Event listeners cho các liên kết navigation
        document.addEventListener('DOMContentLoaded', function() {
            const navLinks = document.querySelectorAll('.nav-item-active[data-page]');
            navLinks.forEach(link => {
                link.addEventListener('click', function(e) {
                    e.preventDefault();
                    const page = this.getAttribute('data-page');
                    window.app.navigateTo(page);
                });
            });
        });
    </script>
</body>
</html>