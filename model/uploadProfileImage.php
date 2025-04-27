<?php
      session_start();
      include "db_connect.php";

      if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true || !isset($_SESSION['user_id'])) {
            echo json_encode(['success' => false, 'message' => 'User not logged in']);
            exit;
      }

      $userId = $_SESSION['user_id'];
      $uploadType = $_POST['upload_type'] ?? '';
      $response = ['success' => false, 'message' => 'Unknown error'];

      $conn = connectdb();

      $uploadsDir = '../uploads/users/' . $userId;
      if (!file_exists($uploadsDir)) {
            mkdir($uploadsDir, 0755, true);
      }

      try {
            // Lấy đường dẫn ảnh hiện tại từ database trước khi cập nhật
            $stmt = $conn->prepare("SELECT profile_image, header_image FROM users WHERE id = :user_id");
            $stmt->bindParam(':user_id', $userId);
            $stmt->execute();
            $user = $stmt->fetch(PDO::FETCH_ASSOC);
            
            $oldImagePath = '';
      
            if ($uploadType === 'avatar') {
                  if (isset($_FILES['avatar_image']) && $_FILES['avatar_image']['error'] === UPLOAD_ERR_OK) {
                        $file = $_FILES['avatar_image'];
                        $oldImagePath = $user['profile_image'];
                        
                        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

                        if (!in_array($file['type'], $allowedTypes)) {
                              echo json_encode(['success' => false, 'message' => 'Invalid file type. Please upload a JPEG, PNG, GIF, or WEBP image.']);
                              exit;
                        }
      
                        $fileName = 'profile_' . time() . '_' . bin2hex(random_bytes(8)) . '.jpg';
                        $filePath = $uploadsDir . '/' . $fileName;
      
                        if (move_uploaded_file($file['tmp_name'], $filePath)) {
                              $stmt = $conn->prepare("UPDATE users SET profile_image = :image_path WHERE id = :user_id");
                              $relativePath = 'uploads/users/' . $userId . '/' . $fileName;
                              $stmt->bindParam(':image_path', $relativePath);
                              $stmt->bindParam(':user_id', $userId);
            
                              if ($stmt->execute()) {
                                    // Xóa ảnh cũ nếu tồn tại
                                    if ($oldImagePath && file_exists('../' . $oldImagePath)) {
                                          unlink('../' . $oldImagePath);
                                    }
                        
                                    $response = ['success' => true, 'message' => 'Profile image uploaded successfully', 'image_path' => '../' . $relativePath];
                              } else {
                                    $response = ['success' => false, 'message' => 'Failed to update database'];
                              }
                        } else {
                              $response = ['success' => false, 'message' => 'Failed to move uploaded file'];
                        }
                  } else {
                        $response = ['success' => false, 'message' => 'No file uploaded or upload error'];
                  }
            } elseif ($uploadType === 'header') {
                  if (isset($_FILES['header_image']) && $_FILES['header_image']['error'] === UPLOAD_ERR_OK) {
                        $file = $_FILES['header_image'];
                        $oldImagePath = $user['header_image'];
                        
                        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
                        if (!in_array($file['type'], $allowedTypes)) {
                              echo json_encode(['success' => false, 'message' => 'Invalid file type. Please upload a JPEG, PNG, GIF, or WEBP image.']);
                              exit;
                        }
      
                        $fileName = 'header_' . time() . '_' . bin2hex(random_bytes(8)) . '.jpg';
                        $filePath = $uploadsDir . '/' . $fileName;
            
                        if (move_uploaded_file($file['tmp_name'], $filePath)) {
                              $stmt = $conn->prepare("UPDATE users SET header_image = :image_path WHERE id = :user_id");
                              $relativePath = 'uploads/users/' . $userId . '/' . $fileName;
                              $stmt->bindParam(':image_path', $relativePath);
                              $stmt->bindParam(':user_id', $userId);
            
                              if ($stmt->execute()) {
                                    // Xóa ảnh cũ nếu tồn tại
                                    if ($oldImagePath && file_exists('../' . $oldImagePath)) {
                                          unlink('../' . $oldImagePath);
                                    }
                        
                                    $response = ['success' => true, 'message' => 'Header image uploaded successfully', 'image_path' => '../' . $relativePath];
                              } else {
                                    $response = ['success' => false, 'message' => 'Failed to update database'];
                              }
                        } else {
                              $response = ['success' => false, 'message' => 'Failed to move uploaded file'];
                        }
                  } else {
                        $response = ['success' => false, 'message' => 'No file uploaded or upload error'];
                  }
            } else {
                  $response = ['success' => false, 'message' => 'Invalid upload type'];
            }
      } catch (Exception $e) {
            $response = ['success' => false, 'message' => 'Error: ' . $e->getMessage()];
      }

      header('Content-Type: application/json');
      echo json_encode($response);
?>