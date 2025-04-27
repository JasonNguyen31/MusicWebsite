<?php
      session_start();
      require_once 'db_connect.php';

      // Debug mode - hiển thị lỗi chi tiết
      ini_set('display_errors', 0);
      error_reporting(E_ALL);

      // Kiểm tra người dùng đã đăng nhập chưa (bật lại nếu đã có hệ thống login)
      if (!isset($_SESSION['user_id'])) {
            // Trả về JSON response với lỗi
            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => 'Bạn cần đăng nhập để upload file']);
            exit;
      }

      // Kiểm tra phương thức POST
      if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => 'Phương thức không hợp lệ']);
            exit;
      }

      // Debug: Kiểm tra dữ liệu nhận được
      error_log('POST: ' . print_r($_POST, true));
      error_log('FILES: ' . print_r($_FILES, true));

      // Kiểm tra xem có file được gửi lên không
      if (empty($_FILES['files'])) {
            header('Content-Type: application/json');
            echo json_encode(['status' => 'error', 'message' => 'Không có file được gửi lên']);
            exit;
      }

      // Lấy thông tin người dùng từ session
      $user_id = $_SESSION['user_id'];

      // Lấy quyền riêng tư từ form
      $privacy = isset($_POST['privacy']) ? $_POST['privacy'] : 'public';

      // Lấy fullname của người dùng từ database để hiển thị là artist
      $conn = connectdb();
      try {
            $stmt = $conn->prepare("SELECT fullname FROM users WHERE id = ?");
            $stmt->execute([$user_id]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            $user_upload = $user ? $user['fullname'] : 'Unknown User';
      } catch (PDOException $e) {
            // Nếu có lỗi, đặt tên nghệ sĩ mặc định
            $artist_upload = 'Unknown User';
      }

      // Thư mục lưu trữ file
      $upload_dir = '../uploads/tracks/';
      // Tạo thư mục nếu chưa tồn tại
      if (!file_exists($upload_dir)) {
            mkdir($upload_dir, 0777, true);
      }

      // Biến để lưu thông tin track đầu tiên được upload thành công
      $first_successful_track = null;

      // Xử lý từng file được gửi lên
      $response = [
            'status' => 'success',
            'message' => 'Upload thành công',
            'files' => []
      ];

      $files = $_FILES['files'];
      $file_count = count($files['name']);

      for ($i = 0; $i < $file_count; $i++) {
            $file_name = $files['name'][$i];
            $file_tmp = $files['tmp_name'][$i];
            $file_error = $files['error'][$i];
            $file_size = $files['size'][$i];
      
            // Kiểm tra lỗi upload
            if ($file_error !== UPLOAD_ERR_OK) {
                  $response['files'][] = [
                        'name' => $file_name,
                        'status' => 'error',
                        'message' => 'Lỗi khi upload file'
                  ];
                  continue;
            }
      
            // Kiểm tra định dạng file
            $file_ext = strtolower(pathinfo($file_name, PATHINFO_EXTENSION));
            if ($file_ext !== 'mp3') {
                  $response['files'][] = [
                        'name' => $file_name,
                        'status' => 'error',
                        'message' => 'Chỉ chấp nhận file MP3'
                  ];
                  continue;
            }
      
            // Tạo tên file mới để tránh trùng lặp
            $new_file_name = uniqid('track_') . '_' . time() . '.' . $file_ext;
            $file_destination = $upload_dir . $new_file_name;
            
            // Track name (loại bỏ phần mở rộng)
            $track_name = pathinfo($file_name, PATHINFO_FILENAME);
            
            // Di chuyển file từ tmp đến thư mục đích
            if (move_uploaded_file($file_tmp, $file_destination)) {
                  // File URL (đường dẫn tương đối)
                        $file_url = 'uploads/tracks/' . $new_file_name;
            
                  try {
                        // Thêm thông tin vào database, sử dụng fullname của user làm artist
                        $stmt = $conn->prepare("INSERT INTO music_tracks (user_id, file_url, track_name, user_upload, privacy) VALUES (?, ?, ?, ?, ?)");
                        $stmt->execute([$user_id, $file_url, $track_name, $user_upload, $privacy]);
                        $track_id = $conn->lastInsertId();
                  
                        // Lưu thông tin track đầu tiên được upload thành công
                        if ($first_successful_track === null) {
                              $first_successful_track = [
                                    'id' => $track_id,
                                    'name' => $track_name,
                                    'file_url' => $file_url,
                                    'size' => formatFileSize($file_size)
                              ];
                        }
                  
                        $response['files'][] = [
                              'name' => $file_name,
                              'status' => 'success',
                              'message' => 'File đã được upload thành công',
                              'file_url' => $file_url,
                              'track_id' => $track_id
                        ];
                  } catch (PDOException $e) {
                        // Xóa file nếu không thêm được vào database
                        unlink($file_destination);
                        
                        $response['files'][] = [
                              'name' => $file_name,
                              'status' => 'error',
                              'message' => 'Lỗi database: ' . $e->getMessage()
                        ];
                  }
            } else {
                  $response['files'][] = [
                        'name' => $file_name,
                        'status' => 'error',
                        'message' => 'Không thể di chuyển file'
                  ];
            }
      }

      // Kiểm tra xem có file nào upload thành công không
      $any_success = false;
      foreach ($response['files'] as $file) {
            if ($file['status'] === 'success') {
                  $any_success = true;
                  break;
            }
      }

      if (!$any_success) {
            $response['status'] = 'error';
            $response['message'] = 'Không có file nào được upload thành công';
            
            // Trả về JSON response nếu không có file nào upload thành công
            header('Content-Type: application/json');
            echo json_encode($response);
      } else {
            // Lưu thông tin track vào session để sử dụng ở trang uploadDetails.php
            $_SESSION['track_info'] = [
                  'id' => $first_successful_track['id'],
                  'name' => $first_successful_track['name'],
                  'file_url' => $first_successful_track['file_url'],
                  'size' => $first_successful_track['size']
            ];
      
            // Nếu có AJAX request, trả về JSON và để client xử lý redirect
            if (!empty($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest') {
                  $response['redirect'] = 'uploadDetails.php?file=' . urlencode($first_successful_track['name']);
                  header('Content-Type: application/json');
                  echo json_encode($response);
            } else {
                  // Nếu không phải AJAX request, chuyển hướng trực tiếp
                  header('Location: uploadDetails.php?file=' . urlencode($first_successful_track['name']));
            }
      }

      // Hàm định dạng kích thước file
      function formatFileSize($bytes) {
            if ($bytes >= 1073741824) {
                  return number_format($bytes / 1073741824, 2) . ' GB';
            } elseif ($bytes >= 1048576) {
                  return number_format($bytes / 1048576, 2) . ' MB';
            } elseif ($bytes >= 1024) {
                  return number_format($bytes / 1024, 2) . ' KB';
            } else {
                  return $bytes . ' B';
            }
      }
?>