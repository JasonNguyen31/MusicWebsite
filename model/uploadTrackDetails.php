<?php
      session_start();
      require_once 'db_connect.php';
      // Thêm kiểm tra chặt chẽ hơn về session và user
      if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true || 
            !isset($_SESSION['track_info'])) {
            // Xóa tất cả các biến session liên quan đến upload
            unset($_SESSION['track_info']);
            unset($_SESSION['uploaded_file']);
            unset($_SESSION['file_url']);
            unset($_SESSION['track_id']);
            unset($_SESSION['upload_in_progress']);
            
            // Prevent caching
            header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
            header("Cache-Control: post-check=0, pre-check=0", false);
            header("Pragma: no-cache");
            header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");
            
            header("Location: ../view/upload.php");
            exit;
      }

      // Kiểm tra đăng nhập
      if (!isset($_SESSION['user_id'])) {
            $_SESSION['error_message'] = "Bạn cần đăng nhập để lưu thông tin";
            header('Location: ../index.php');
            exit;
      }

      // Kiểm tra có phải POST request không
      if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $_SESSION['error_message'] = "Phương thức không hợp lệ";
            header('Location: uploadDetails.php');
            exit;
      }

      // Kiểm tra track_id có tồn tại không
      if (!isset($_POST['track_id']) || empty($_POST['track_id'])) {
            $_SESSION['error_message'] = "Thiếu thông tin track_id";
            header('Location: ../view/upload.php');
            exit;
      }

      $track_id = $_POST['track_id'];
      $user_id = $_SESSION['user_id'];

      // Lấy các thông tin từ form
      $title = $_POST['title'] ?? '';
      $permalink = $_POST['permalink-slug'] ?? '';
      $artist_name = $_POST['artist-name'] ?? '';
      $genre = $_POST['genre'] ?? 'none';
      $tags = $_POST['tags'] ?? '';
      $lyrics = $_POST['Lyrics'] ?? '';
      $caption = $_POST['caption'] ?? '';
      $privacy = $_POST['privacy'] ?? 'public';

      // Xử lý upload hình ảnh cho track
      $image_url = '';
      if (isset($_FILES['track_image']) && $_FILES['track_image']['error'] === UPLOAD_ERR_OK) {
            $image_tmp = $_FILES['track_image']['tmp_name'];
            $image_name = $_FILES['track_image']['name'];
            $image_ext = strtolower(pathinfo($image_name, PATHINFO_EXTENSION));
            
            // Kiểm tra định dạng file
            $allowed_exts = ['jpg', 'jpeg', 'png', 'gif'];
            if (in_array($image_ext, $allowed_exts)) {
                  $new_image_name = 'track_image_' . $track_id . '_' . time() . '.' . $image_ext;
                  $upload_dir = '../uploads/images/';
                  
                  // Tạo thư mục nếu chưa tồn tại
                  if (!file_exists($upload_dir)) {
                        mkdir($upload_dir, 0777, true);
                  }

                  $destination = $upload_dir . $new_image_name;
                  
                  if (move_uploaded_file($image_tmp, $destination)) {
                        $image_url = 'uploads/images/' . $new_image_name;
                  }
            }
      }

      // Kết nối database
      $conn = connectdb();

      try {
            // Kiểm tra xem track thuộc về user hiện tại không
            $stmt = $conn->prepare("SELECT user_id FROM music_tracks WHERE track_id = ?");
            $stmt->execute([$track_id]);
            $track_data = $stmt->fetch(PDO::FETCH_ASSOC);
      
            if (!$track_data || $track_data['user_id'] != $user_id) {
                  $_SESSION['error_message'] = "Bạn không có quyền cập nhật thông tin cho track này";
                  header('Location: ../view/upload.php');
                  exit;
            }
      
            // Bắt đầu transaction để đảm bảo tính toàn vẹn dữ liệu
            $conn->beginTransaction();
            
            // Cập nhật thông tin cho track
            $update_query = "UPDATE music_tracks SET 
                              track_name = ?, 
                              permalink = ?,
                              artist = ?, 
                              genre = ?, 
                              tags = ?, 
                              lyrics = ?, 
                              caption = ?, 
                              privacy = ?";
            
            $params = [$title, $permalink, $artist_name, $genre, $tags, $lyrics, $caption, $privacy];
            
            // Thêm image_url vào câu lệnh UPDATE nếu có
            if (!empty($image_url)) {
                  $update_query .= ", image_url = ?";
                  $params[] = $image_url;
            }
      
            $update_query .= " WHERE track_id = ? AND user_id = ?";
            $params[] = $track_id;
            $params[] = $user_id;
      
            $stmt = $conn->prepare($update_query);
            $stmt->execute($params);
            
            // Tăng track_count của user lên 1
            $update_user_query = "UPDATE users SET track_count = track_count + 1 WHERE id = ?";
            $stmt_user = $conn->prepare($update_user_query);
            $stmt_user->execute([$user_id]);
            
            // Commit transaction nếu mọi thứ thành công
            $conn->commit();
      
            $_SESSION['show_success_popup'] = true;
            $_SESSION['success_message'] = "Your track upload successfully!";
            
            // Clear ALL upload session data to prevent going back
            unset($_SESSION['track_info']);
            unset($_SESSION['uploaded_file']);
            unset($_SESSION['file_url']);
            unset($_SESSION['track_id']);
            unset($_SESSION['upload_in_progress']);
            unset($_SESSION['user_upload']);
            // Đảm bảo xóa thêm bất kỳ biến session nào khác liên quan đến quá trình upload
            
            header('Location: ../view/profile.php?upload_success=1');
            exit;
      } catch (PDOException $e) {
            // Rollback transaction nếu có lỗi
            $conn->rollBack();
            $_SESSION['error_message'] = "Lỗi khi lưu thông tin: " . $e->getMessage();
            header('Location: ../view/uploadDetails.php?file=' . urlencode($_SESSION['uploaded_file']));
            exit;
      }
?>