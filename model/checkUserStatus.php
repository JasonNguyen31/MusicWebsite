<?php
      // Kết nối database
      include "db_connect.php";
      $conn = connectdb();

      // Thời gian không hoạt động tối đa (tính bằng giây)
      $inactiveTime = 1800; // 30 phút

      // Lấy thời gian hiện tại
      $currentTime = time();

      // Cập nhật trạng thái inactive cho những người dùng không hoạt động
      $stmt = $conn->prepare("UPDATE users SET status = 'inactive' 
                              WHERE last_login < DATE_SUB(NOW(), INTERVAL :inactive_time SECOND)
                              AND status = 'active'");
      $stmt->bindParam(':inactive_time', $inactiveTime, PDO::PARAM_INT);
      $stmt->execute();

      echo "User status updated successfully!";
?>