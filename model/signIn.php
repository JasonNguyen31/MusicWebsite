<?php
      session_start();
      include "db_connect.php";

      if ($_SERVER["REQUEST_METHOD"] == "POST") {
            $conn = connectdb();

            // Lấy dữ liệu từ form
            $username = $_POST["username"];
            $password = $_POST["password"];

            try {
                  // Tìm kiếm user theo username
                  $sql = "SELECT * FROM users WHERE username = :username";
                  $stmt = $conn->prepare($sql);
                  $stmt->execute([':username' => $username]);
                  
                  // Kiểm tra nếu tìm thấy user
                  if ($stmt->rowCount() > 0) {
                        $user = $stmt->fetch(PDO::FETCH_ASSOC);
                        
                        // Kiểm tra password đã mã hóa
                        if (password_verify($password, $user['password'])) {
                              // Đăng nhập thành công
                              // Cập nhật trạng thái thành active
                              $updateStatus = $conn->prepare("UPDATE users SET status = 'active' WHERE id = :id");
                              $updateStatus->execute([':id' => $user['id']]);
                              
                              // Lưu thông tin user vào session
                              $_SESSION['user_id'] = $user['id'];
                              $_SESSION['username'] = $user['username'];
                              $_SESSION['fullname'] = $user['fullname'];
                              $_SESSION['account_type'] = $user['account_type'];
                              $_SESSION['country'] = $user['country'];
                              $_SESSION['phone'] = $user['phone'];
                              $_SESSION['dob'] = $user['dob'];
                              $_SESSION['profile_image'] = isset($user['profile_image']) ? $user['profile_image'] : 'default.jpg';
                              $_SESSION['logged_in'] = true;
                              
                              // Cập nhật thời gian đăng nhập cuối cùng
                              $updateLastLogin = $conn->prepare("UPDATE users SET last_login = NOW() WHERE id = :id");
                              $updateLastLogin->execute([':id' => $user['id']]);
                              
                              // Xử lý remember me nếu được chọn
                              if (isset($_POST['remember-me']) && $_POST['remember-me'] == 'on') {
                                    // Tạo token ngẫu nhiên
                                    $token = bin2hex(random_bytes(32));
                                    
                                    // Lưu token vào cookie, thời hạn 30 ngày
                                    setcookie('remember_token', $token, time() + 30 * 24 * 60 * 60, '/');
                                    
                                    // Lưu token vào database
                                    $sql = "UPDATE users SET remember_token = :token WHERE id = :id";
                                    $stmt = $conn->prepare($sql);
                                    $stmt->execute([
                                          ':token' => $token,
                                          ':id' => $user['id']
                                    ]);
                              }
                              
                              echo "success";
                        } else {
                              // Password không đúng
                              echo "invalid";
                        }
                  } else {
                        // Không tìm thấy username
                        echo "invalid";
                  }
            } catch (PDOException $e) {
                  echo "error: " . $e->getMessage();
                  error_log("SignIn Error: " . $e->getMessage());
            }
      }
?>