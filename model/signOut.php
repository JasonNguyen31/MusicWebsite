<?php
      // Bắt đầu session
      session_start();

      // Kết nối database để cập nhật remember_token nếu có
      if (isset($_SESSION['user_id'])) {
            try {
                  // Kết nối database
                  include "db_connect.php";
                  $conn = connectdb();

                  // Cập nhật trạng thái thành inactive
                  $updateStatus = $conn->prepare("UPDATE users SET status = 'inactive' WHERE id = :id");
                  $updateStatus->execute([':id' => $_SESSION['user_id']]);
                  
                  // Xóa token trong database nếu có
                  $stmt = $conn->prepare("UPDATE users SET remember_token = NULL WHERE id = :id");
                  $stmt->bindParam(':id', $_SESSION['user_id']);
                  $stmt->execute();
            } catch(PDOException $e) {
                  // Xử lý lỗi nếu có
            }
      }

      // Xóa cookie remember_token nếu tồn tại
      if (isset($_COOKIE['remember_token'])) {
            setcookie('remember_token', '', time() - 3600, '/');
            unset($_COOKIE['remember_token']);
      }

      // Xóa tất cả biến session
      $_SESSION = array();

      // Hủy session
      if (ini_get("session.use_cookies")) {
            $params = session_get_cookie_params();
            setcookie(session_name(), '', time() - 42000,
                  $params["path"], $params["domain"],
                  $params["secure"], $params["httponly"]
      );
      }
      session_destroy();

// Tạo trang chuyển tiếp với JavaScript để ngăn Back
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Logging out...</title>
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <script type="text/javascript">
        // Xóa lịch sử trình duyệt
        window.history.pushState(null, null, window.location.href);
        window.history.replaceState(null, null, window.location.href);
        
        // Ngăn chặn việc sử dụng nút Back
        window.onpopstate = function() {
            window.history.pushState(null, null, window.location.href);
        };
        
        // Chuyển hướng về trang đăng nhập
        window.location.replace('../index.php');
    </script>
</head>
<body>
    <p>Logging out...</p>
    
    <!-- Tự động chuyển hướng nếu JavaScript bị tắt -->
    <noscript>
        <meta http-equiv="refresh" content="0;url=../index.php">
        <p>You are being redirected to the login page. If you are not redirected, <a href="../index.php">click here</a>.</p>
    </noscript>
</body>
</html>