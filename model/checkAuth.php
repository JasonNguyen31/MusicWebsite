<?php
// Bắt đầu session nếu chưa bắt đầu
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Kiểm tra đăng nhập
if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
    // Chuyển hướng về trang đăng nhập
    header("Location: ../index.php");
    exit;
}

// Thêm header để ngăn cache trang
header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");
?>

<!-- Thêm script vào phần head của trang bảo vệ -->
<script type="text/javascript">
    // Xoá cache trang và lịch sử trình duyệt
    window.history.forward();
    
    // Vô hiệu hóa nút back
    function noBack() {
        window.history.forward();
    }
    
    // Kiểm tra trang được tải từ cache
    window.addEventListener('pageshow', function(event) {
        if (event.persisted) {
            // Nếu trang được tải từ cache (nút Back/Forward)
            window.location.reload(true);
        }
    });
    
    // Chạy khi trang tải xong
    window.addEventListener('load', noBack);
    // Chạy khi trang unload
    window.addEventListener('unload', function() {
        void(0);
    });
</script>