<?php
    session_start();
    require_once '../model/db_connect.php';
    // Kiểm tra đăng nhập - nếu chưa đăng nhập, chuyển hướng đến trang đăng nhập
    if (!isset($_SESSION['logged_in']) || $_SESSION['logged_in'] !== true) {
        // Thêm header để ngăn cache
        header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
        header("Cache-Control: post-check=0, pre-check=0", false);
        header("Pragma: no-cache");
        header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");
        
        header("Location: ../index.php");
        exit;
    }

    // Ngăn cache để tránh quay lại trang sau khi đăng xuất
    header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
    header("Cache-Control: post-check=0, pre-check=0", false);
    header("Pragma: no-cache");
    header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");

    // Kiểm tra xem có thông tin track trong session không
    if (isset($_SESSION['track_info'])) {
        $trackInfo = $_SESSION['track_info'];
        $fileName = $trackInfo['name'];
        $fileSize = $trackInfo['size'];
        $fileUrl = $trackInfo['file_url'];
        $trackId = $trackInfo['id'];

        $_SESSION['upload_in_progress'] = true;
    } else {
        // Không cho phép truy cập nếu không có thông tin file
        header("Location: upload.php");
        exit;
    }

    $uploadedSize = $fileSize; // Đã upload xong
    $defaultTitle = pathinfo($fileName, PATHINFO_FILENAME);

    // Kiểm tra xem có đang trong quá trình upload hay không
    if (!isset($_SESSION['upload_in_progress']) || $_SESSION['upload_in_progress'] !== true) {
        // Nếu không phải đang trong quá trình upload, chuyển hướng về trang upload
        unset($_SESSION['track_info']);
        unset($_SESSION['uploaded_file']);
        unset($_SESSION['file_url']);
        unset($_SESSION['track_id']);
        unset($_SESSION['upload_in_progress']);
        header("Location: upload.php");
        exit;
    }

    // Kiểm tra token bảo mật để ngăn CSRF
    // if (!isset($_SESSION['upload_token']) || 
    //     !isset($_GET['token']) || 
    //     $_SESSION['upload_token'] !== $_GET['token']) {
    //     // Token không hợp lệ, chuyển hướng về trang upload
    //     header("Location: upload.php");
    //     exit;
    // }

    // Lấy thông tin artist từ database 
    $conn = connectdb();
    $userUpload = 'username'; // Giá trị mặc định

    try {
        $stmt = $conn->prepare("SELECT mt.user_id, u.fullname 
                               FROM music_tracks mt 
                               JOIN users u ON mt.user_id = u.id 
                               WHERE mt.track_id = ?");
        $stmt->execute([$trackId]);
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        if ($result) {
            $userUpload = $result['fullname'];
        }
    } catch (PDOException $e) {
        // Nếu có lỗi, giữ giá trị mặc định
        header("Location: upload.php?error=database");
        exit;
    }
        
    //     if ($result) {
    //         // THÊM: Đảm bảo track thuộc về người dùng hiện tại
    //         if ($result['user_id'] != $_SESSION['user_id']) {
    //             // Track này không thuộc về người dùng hiện tại
    //             header("Location: upload.php");
    //             exit;
    //         }
    //         $artistName = $result['fullname'];
    //     } else {
    //         // Track không tồn tại trong database
    //         header("Location: upload.php");
    //         exit;
    //     }
    // } catch (PDOException $e) {
    //     // Có lỗi truy vấn database
    //     header("Location: upload.php?error=database");
    //     exit;
    // }

    // Lưu thông tin file vào session để sử dụng khi xử lý form
    $_SESSION['uploaded_file'] = $fileName;
    $_SESSION['file_size'] = $fileSize;
    $_SESSION['file_url'] = $fileUrl;
    $_SESSION['track_id'] = $trackId;
    $_SESSION['user_upload'] = $userUpload;

    // Hiển thị thông báo lỗi nếu có
    if (isset($_SESSION['error_message'])) {
        $error_message = $_SESSION['error_message'];
        unset($_SESSION['error_message']);
    }
?>

<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- Meta tags để ngăn cache -->
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    <title>Track Details</title>
    <link rel="stylesheet" href="../assets/css/uploadDetails.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <!-- Script ngăn quay lại trang trước đó và kiểm tra session -->
    <script type="text/javascript">
        // Kiểm tra session theo định kỳ
        function checkSession() {
            fetch('../model/checkSession.php')
                .then(response => response.json())
                .then(data => {
                    if (!data.logged_in) {
                        window.location.href = '../index.php';
                    }
                })
                .catch(error => console.error('Error checking session:', error));
        }
        
        // Kiểm tra session mỗi 30 giây
        setInterval(checkSession, 30000);
        
        // Ngăn chặn việc quay lại bằng nút Back của trình duyệt
        history.pushState(null, null, location.href);
        window.onpopstate = function() {
            history.go(1);
        };
    </script>
</head>
<body>
<div class="container">
        <?php if(isset($error_message)): ?>
            <div class="error-message"><?php echo htmlspecialchars($error_message); ?></div>
        <?php endif; ?>
        
        <div class="upload-status">
            <div class="file-name" id="display-filename"><?php echo htmlspecialchars($fileName); ?>.mp3</div>
            <div class="upload-progress" style="color: #4CAF50;"><?php echo htmlspecialchars($uploadedSize); ?> uploaded successfully</div>
        </div>

        <div class="tabs">
            <a href="#" class="tab active" data-tab="basic-info">Basic info</a>
        </div>

        <form id="upload-details-form" action="../model/uploadTrackDetails.php" method="POST" enctype="multipart/form-data">
            <input type="hidden" name="track_id" value="<?php echo $trackId; ?>">
            <input type="hidden" name="file_url" value="<?php echo htmlspecialchars($fileUrl); ?>">
            <!-- THÊM: Token bảo mật để ngăn CSRF -->
            <!-- <input type="hidden" name="upload_token" value="<?php echo htmlspecialchars($_SESSION['upload_token']); ?>"> -->
            
            <div class="content">
                <!-- Basic Info Tab -->
                <div class="tab-content active" id="basic-info-content">
                    <div class="main-content">
                        <div class="left-column">
                            <div class="track-image">
                                <div class="placeholder-image"></div>
                                <button type="button" class="upload-image-btn">
                                    <i class="fa-solid fa-camera"></i>
                                </button>
                                <input type="file" id="image-upload" name="track_image" accept="image/*" hidden>
                            </div>
                        </div>
                        
                        <div class="right-column">
                            <div class="form-group">
                                <label for="title">Title <span class="required">*</span></label>
                                <input type="text" id="title" name="title" value="<?php echo htmlspecialchars($defaultTitle); ?>" class="form-control" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="permalink">Permalink <span class="required">*</span></label>
                                <div class="permalink-container">
                                    <div class="permalink-wrapper">
                                        <span class="base-url">j'rsc.com/<?php echo htmlspecialchars($userUpload); ?>/</span>
                                        <input type="text" id="permalink-slug" name="permalink-slug" 
                                            value="<?php echo htmlspecialchars(strtolower(str_replace(' ', '-', $defaultTitle))); ?>" 
                                            class="permalink-input" required>
                                    </div>
                                    <button type="button" class="edit-btn">Edit</button>
                                </div>
                                <input type="hidden" id="full-permalink" name="permalink" 
                                    value="j'rsc.com/<?php echo htmlspecialchars($userUpload); ?>/<?php echo htmlspecialchars(strtolower(str_replace(' ', '-', $defaultTitle))); ?>">
                            </div>

                            <div class="form-group">
                                <label for="artist-name">Artist Name <span class="required">*</span></label>
                                <input type="text" id="artist-name" name="artist-name" placeholder="Enter artist name" class="form-control" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="genre">Genre</label>
                                <select id="genre" name="genre" class="form-control">
                                    <option value="none">None</option>
                                    <option value="electronic">Electronic</option>
                                    <option value="rock">Rock</option>
                                    <option value="pop">Pop</option>
                                    <option value="hip-hop">Hip Hop</option>
                                    <option value="jazz">Jazz</option>
                                    <option value="classical">Classical</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="tags">Additional tags</label>
                                <input type="text" id="tags" name="tags" placeholder="Add tags to describe the genre and mood of your track" class="form-control">
                            </div>
                            
                            <div class="form-group">
                                <label for="Lyrics">Lyrics</label>
                                <textarea id="Lyrics" name="Lyrics" class="form-control textarea" placeholder="Lyrics of your track"></textarea>
                            </div>
                            
                            <div class="form-group">
                                <label for="caption">Caption <span class="info-icon" title="Add a brief caption to your post">ⓘ</span></label>
                                <div class="caption-container">
                                    <textarea id="caption" name="caption" placeholder="Add a caption to your post (optional)" class="form-control textarea caption-textarea"></textarea>
                                </div>
                            </div>
                            
                            <div class="form-group">
                                <label>Privacy:</label>
                                <div class="radio-group">
                                    <div class="radio-option">
                                        <input type="radio" id="public" name="privacy" value="public" checked>
                                        <label for="public" class="radio-label">
                                            <span class="radio-title">Public</span>
                                            <span class="radio-description">Anyone will be able to listen to this track.</span>
                                        </label>
                                    </div>
                                    
                                    <div class="radio-option">
                                        <input type="radio" id="private" name="privacy" value="private">
                                        <label for="private" class="radio-label">
                                            <span class="radio-title">Private</span>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-footer">
                    <div class="required-notice"><span>*</span> Required fields</div>
                    <div class="action-buttons">
                        <button type="button" class="btn btn-cancel" onclick="cancelUpload()">Cancel</button>
                        <button type="submit" class="btn btn-save">Save</button>
                    </div>
                </div>
            </div>
        </form>
    </div>
    <script>
        // Đảm bảo xóa sessionStorage liên quan đến form khi vào trang này
        sessionStorage.removeItem('form_submitted');
    </script>
    <script src="../scripts/uploadDetails.js"></script>
</body>
</html>