<?php
      // Bắt đầu session
      session_start();

      // Kiểm tra trạng thái đăng nhập
      $response = array('logged_in' => false);

      if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
            $response['logged_in'] = true;
            $response['username'] = $_SESSION['username'];
      }

      // Trả về kết quả dưới dạng JSON
      header('Content-Type: application/json');
      echo json_encode($response);
?>
