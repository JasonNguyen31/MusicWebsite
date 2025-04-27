<?php
    // File: ../model/getUserData.php
    session_start();
    header('Content-Type: application/json');

    // Kiểm tra đăng nhập
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        echo json_encode(['error' => 'Not logged in']);
        exit;
    }

    include_once "getUserInfo.php";
    $user_id = $_SESSION['user_id'];

    // Lấy thông tin người dùng cập nhật
    $userInfo = getUserInfo($user_id);

    // Thêm timestamp để ngăn cache
    $userInfo['profile_image'] = $userInfo['profile_image'] . '?t=' . time();

    // Đảm bảo description tồn tại trong response
    if (!isset($userInfo['description'])) {
        $userInfo['description'] = 'Describe your profile';
    }

    echo json_encode($userInfo);
?>