// Thiết lập biến để lưu trữ đường dẫn ảnh đã tải thành công cuối cùng
let lastSuccessfulProfileImage = "";

// Cache ảnh người dùng vào localStorage
function cacheProfileImage(imageUrl) {
    if (imageUrl && imageUrl !== "") {
        localStorage.setItem('cachedProfileImage', imageUrl);
        lastSuccessfulProfileImage = imageUrl;
    }
}

// Lưu mô tả người dùng vào localStorage
function cacheProfileDescription(description) {
    if (description) {
        localStorage.setItem('cachedProfileDescription', description);
    }
}

// Lấy ảnh cache khi tải trang
function getCachedProfileImage() {
    return localStorage.getItem('cachedProfileImage') || "../assets/images/defaults.jpg";
}

// Lấy mô tả cache
function getCachedProfileDescription() {
    return localStorage.getItem('cachedProfileDescription') || "Describe your profile";
}

function updateProfileInfo() {
    // Trước khi fetch, sử dụng ảnh từ cache nếu có
    const cachedImage = getCachedProfileImage();
    if (cachedImage) {
        updateProfileImagesWithUrl(cachedImage);
    }
    
    // Và mô tả từ cache
    const cachedDescription = getCachedProfileDescription();
    if (cachedDescription) {
        updateProfileDescription(cachedDescription);
    }

    // Sau đó mới fetch dữ liệu mới
    fetch('../model/getUserData.php')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.error) {
                console.error('Error:', data.error);
                return;
            }

            // Kiểm tra và cập nhật hình ảnh
            if (data.profile_image && data.profile_image !== '') {
                // Kiểm tra xem ảnh có tồn tại và có thể tải được không
                imageExists(data.profile_image, function(exists) {
                    if (exists) {
                        // Cache ảnh mới
                        cacheProfileImage(data.profile_image);
                        // Cập nhật ảnh với tham số cache buster
                        updateProfileImagesWithUrl(data.profile_image + '?v=' + new Date().getTime());
                    } else {
                        // Sử dụng ảnh mặc định hoặc ảnh đã cache thành công trước đó
                        updateProfileImagesWithUrl(lastSuccessfulProfileImage || "../assets/images/defaults.jpg");
                    }
                });
            } else {
                updateProfileImagesWithUrl("../assets/images/defaults.jpg");
            }

            // Cập nhật tên người dùng
            const profileName = document.querySelector('.profile-name h1');
            if (profileName && data.fullname) {
                profileName.textContent = data.fullname;
            }
            
            // Cập nhật mô tả người dùng
            if (data.description) {
                cacheProfileDescription(data.description);
                updateProfileDescription(data.description);
            }
        })
        .catch(error => {
            console.error('Error fetching profile data:', error);
            // Sử dụng ảnh từ cache hoặc mặc định nếu có lỗi
            updateProfileImagesWithUrl(lastSuccessfulProfileImage || "../assets/images/defaults.jpg");
        });
}

// Hàm riêng để cập nhật tất cả các ảnh profile
function updateProfileImagesWithUrl(imageUrl) {
    const profileImages = document.querySelectorAll('.profile-pic');

    profileImages.forEach(img => {
        const currentSrcWithoutCache = img.src.split('?')[0];
        const newSrcWithoutCache = imageUrl.split('?')[0];

        // Nếu là ảnh trong header, chỉ cập nhật nếu ảnh khác rõ ràng (có ảnh mới)
        if (img.classList.contains('header-image')) {
            if (lastSuccessfulProfileImage && newSrcWithoutCache !== lastSuccessfulProfileImage) {
                img.src = imageUrl;
            }
        } else {
            if (currentSrcWithoutCache !== newSrcWithoutCache) {
                img.src = imageUrl;
            }
        }
    });
}

// Hàm cập nhật mô tả profile
function updateProfileDescription(description) {
    const descriptionElement = document.getElementById('profile-description');
    
    // Chỉ cập nhật nếu phần tử tồn tại và không đang trong chế độ chỉnh sửa
    if (descriptionElement && !descriptionElement.getAttribute('contenteditable')) {
        descriptionElement.textContent = description;
    }
}

// Kiểm tra ảnh hợp lệ
function imageExists(url, callback) {
    const img = new Image();
    img.onload = function() { callback(true); };
    img.onerror = function() { callback(false); };
    img.src = url;
}

const updateInterval = setInterval(updateProfileInfo, 3000);

// Cập nhật ngay khi trang tải xong
document.addEventListener('DOMContentLoaded', function() {
    // Sử dụng ảnh từ cache trước khi fetch
    const cachedImage = getCachedProfileImage();
    if (cachedImage) {
        updateProfileImagesWithUrl(cachedImage);
    }
    
    // Sử dụng mô tả từ cache
    const cachedDescription = getCachedProfileDescription();
    if (cachedDescription) {
        updateProfileDescription(cachedDescription);
    }

    // Sau đó mới cập nhật từ server
    setTimeout(updateProfileInfo, 50);
});