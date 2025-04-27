<?php
      session_start();
      include "db_connect.php"; 

      if ($_SERVER["REQUEST_METHOD"] == "POST") {
            $conn = connectdb();

            // Lấy dữ liệu từ form
            $fullname = $_POST["fullname"];
            $username = $_POST["username"];
            $phone = $_POST["phone"];
            $password = password_hash($_POST["password"], PASSWORD_DEFAULT);
            $country = $_POST["country"];
            $dob_day = $_POST["dob-day"];
            $dob_month = $_POST["dob-month"];
            $dob_year = $_POST["dob-year"];
            $account_type = $_POST["account-type"];

            // Tạo ngày sinh hợp lệ
            $dob = "$dob_year-$dob_month-$dob_day";

            try {
                  $sql = "INSERT INTO users (fullname, username, phone, password, dob, country, account_type) 
                        VALUES (:fullname, :username, :phone, :password, :dob, :country, :account_type)";
                  $stmt = $conn->prepare($sql);
                  $stmt->execute([
                        ':fullname' => $fullname,
                        ':username' => $username,
                        ':phone' => $phone,
                        ':password' => $password,
                        ':dob' => $dob,
                        ':country' => $country,
                        ':account_type' => $account_type
                  ]);

                  echo "success";
            } catch (PDOException $e) {
                  echo "Lỗi: " . $e->getMessage();
            }
      }
?>
