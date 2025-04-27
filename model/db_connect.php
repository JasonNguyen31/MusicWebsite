<?php
      function connectdb(){
            // Thông tin kết nối cơ sở dữ liệu
            $servername = 'localhost';     
            $dbname = 'jrsc_database'; 
            $username = 'root';      
            $password = '';          

            try {
            $conn = new PDO("mysql:host=$servername;dbname=$dbname;charset=utf8mb4", $username, $password);
            
            $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            } catch(PDOException $e) {
                  echo "Lỗi kết nối: " . $e->getMessage();
            }
            return $conn;
      }
?>