document.addEventListener('DOMContentLoaded', function() {
    // Get references to image containers
    const profileAvatarContainer = document.querySelector('.profile-avatar');
    const headerImageContainer = document.querySelector('.header-image');
    
    // Biến toàn cục để theo dõi dropdown nào đang mở
    let openDropdownType = null;
    
    // Create hidden file input elements
    const avatarFileInput = document.createElement('input');
    avatarFileInput.type = 'file';
    avatarFileInput.accept = 'image/*';
    avatarFileInput.style.display = 'none';
    document.body.appendChild(avatarFileInput);
    
    const headerFileInput = document.createElement('input');
    headerFileInput.type = 'file';
    headerFileInput.accept = 'image/*';
    headerFileInput.style.display = 'none';
    document.body.appendChild(headerFileInput);
    
    // Load user images on page load
    loadUserImages();
    
    // Handle avatar file selection
    avatarFileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const formData = new FormData();
            formData.append('avatar_image', this.files[0]);
            formData.append('upload_type', 'avatar');
            
            uploadImage(formData, '.profile-avatar img');
        }
    });
    
    // Handle header file selection
    headerFileInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            const formData = new FormData();
            formData.append('header_image', this.files[0]);
            formData.append('upload_type', 'header');
            
            uploadImage(formData, '.header-image img');
        }
    });
    
    // Function to upload image to server
    function uploadImage(formData, imageSelector) {
        document.body.style.cursor = 'wait';
        
        fetch('../model/uploadProfileImage.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update the image in the UI
                const imageElement = document.querySelector(imageSelector);
                if (imageElement) {
                    imageElement.src = data.image_path + '?t=' + new Date().getTime(); // Add timestamp to prevent caching
                    
                    // Update UI for the container
                    if (imageSelector === '.profile-avatar img') {
                        setupImageContainer(profileAvatarContainer, 'avatar', true);
                    } else {
                        setupImageContainer(headerImageContainer, 'header', true);
                    }
                }
            } else {
                alert('Error uploading image: ' + data.message);
            }
        })
        .catch(error => {
            console.error('Error uploading image:', error);
            alert('Error uploading image. Please try again.');
        })
        .finally(() => {
            document.body.style.cursor = 'default';
        });
    }
    
    // Function to delete image with confirmation dialog
    function deleteImage(imageType) {
        showDeleteConfirmation(function(confirmed) {
            if (!confirmed) return;
            
            fetch('../model/deleteProfileImage.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ type: imageType })
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update UI
                    if (imageType === 'avatar') {
                        const img = document.querySelector('.profile-avatar img');
                        if (img) img.src = '';
                        setupImageContainer(profileAvatarContainer, 'avatar', false);
                    } else {
                        const img = document.querySelector('.header-image img');
                        if (img) img.src = '';
                        setupImageContainer(headerImageContainer, 'header', false);
                    }
                } else {
                    alert('Error deleting image: ' + data.message);
                }
            })
            .catch(error => {
                console.error('Error deleting image:', error);
                alert('Error deleting image. Please try again.');
            });
        });
    }
    
    // Show delete confirmation dialog
    function showDeleteConfirmation(callback) {
        // Create confirmation dialog
        const confirmationContainer = document.createElement('div');
        confirmationContainer.className = 'delete-confirmation';
        
        confirmationContainer.innerHTML = `
            <div class="confirmation-dialog">
                <h2>Are you sure?</h2>
                <p>Please confirm that you want to delete this image. This action cannot be reversed.</p>
                <div class="confirmation-buttons">
                    <button class="btn-cancel">Cancel</button>
                    <button class="btn-delete">Delete</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(confirmationContainer);
        
        // Add event listeners for buttons
        const cancelBtn = confirmationContainer.querySelector('.btn-cancel');
        const deleteBtn = confirmationContainer.querySelector('.btn-delete');
        
        cancelBtn.addEventListener('click', function() {
            document.body.removeChild(confirmationContainer);
            callback(false);
        });
        
        deleteBtn.addEventListener('click', function() {
            document.body.removeChild(confirmationContainer);
            callback(true);
        });
        
        // Allow closing by clicking outside
        confirmationContainer.addEventListener('click', function(e) {
            if (e.target === confirmationContainer) {
                document.body.removeChild(confirmationContainer);
                callback(false);
            }
        });
    }
    
    // Đóng tất cả các dropdown đang mở
    function closeAllDropdowns() {
        // Đóng tất cả dropdown và cập nhật trạng thái nút
        const allDropdowns = document.querySelectorAll('.image-dropdown');
        const allButtons = document.querySelectorAll('.update-avatar-btn, .update-header-btn');
        
        allDropdowns.forEach(dropdown => {
            dropdown.style.display = 'none';
        });
        
        allButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        openDropdownType = null;
    }
    
    // Function to setup image container based on whether image exists
    function setupImageContainer(container, type, hasImage = false) {
        if (!container) return;
        
        // Clear existing buttons and dropdowns
        const existingBtn = container.querySelector('.upload-' + type + '-btn, .update-' + type + '-btn');
        const existingDropdown = container.querySelector('.image-dropdown');
        
        if (existingBtn) existingBtn.remove();
        if (existingDropdown) existingDropdown.remove();
        
        // Add image element if it doesn't exist
        let imgElement = container.querySelector('img');
        if (!imgElement) {
            imgElement = document.createElement('img');
            imgElement.alt = '';
            container.prepend(imgElement);
        }
        
        if (hasImage) {
            // Create update image button with specific class
            const updateBtn = document.createElement('button');
            updateBtn.className = 'update-' + type + '-btn';
            updateBtn.textContent = type === 'avatar' ? 'Update image' : 'Update header image';
            container.appendChild(updateBtn);
            
            // Create dropdown
            const dropdown = document.createElement('div');
            dropdown.className = 'image-dropdown';
            dropdown.id = type + '-dropdown';
            dropdown.style.display = 'none';
            
            // Tạo nội dung HTML cho dropdown
            dropdown.innerHTML = `
                <div class="dropdown-item replace-image">Replace image</div>
                <div class="dropdown-item delete-image">Delete image</div>
            `;
            
            // Định vị dropdown
            if (type === 'avatar') {
                // Tạo container riêng cho dropdown của avatar để có thể định vị bên ngoài
                const dropdownContainer = document.createElement('div');
                dropdownContainer.className = 'avatar-dropdown-container';
                dropdownContainer.appendChild(dropdown);
                
                // Thêm vào DOM ở vị trí phù hợp
                document.querySelector('.profile-info').appendChild(dropdownContainer);
            } else {
                // Dropdown của header vẫn ở trong container
                container.appendChild(dropdown);
            }
            
            // Toggle dropdown khi click vào nút update
            updateBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Ngăn bubbling
                
                // Kiểm tra xem dropdown này đã mở hay chưa
                const isThisDropdownOpen = (openDropdownType === type);
                
                // Đóng tất cả dropdown trước
                closeAllDropdowns();
                
                // Nếu dropdown này chưa mở, thì mở nó
                if (!isThisDropdownOpen) {
                    dropdown.style.display = 'block';
                    updateBtn.classList.add('active');
                    openDropdownType = type;
                }
            });
            
            // Handle replace image
            dropdown.querySelector('.replace-image').addEventListener('click', () => {
                if (type === 'avatar') {
                    avatarFileInput.click();
                } else {
                    headerFileInput.click();
                }
                closeAllDropdowns();
            });
            
            // Handle delete image
            dropdown.querySelector('.delete-image').addEventListener('click', () => {
                deleteImage(type);
                closeAllDropdowns();
            });
        } else {
            // Create upload button
            const uploadBtn = document.createElement('button');
            uploadBtn.className = 'upload-' + type + '-btn';
            uploadBtn.textContent = type === 'avatar' ? 'Upload image' : 'Upload header image';
            container.appendChild(uploadBtn);
            
            // Add click event listener to the button
            uploadBtn.addEventListener('click', function() {
                if (type === 'avatar') {
                    avatarFileInput.click();
                } else {
                    headerFileInput.click();
                }
            });
        }
    }
    
    // Function to load user images from database
    function loadUserImages() {
        fetch('../model/getUserImages.php')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Update profile avatar and setup container
                const profileAvatar = document.querySelector('.profile-avatar img');
                const hasProfileImage = data.profile_image && data.profile_image !== '';
                
                if (profileAvatar && hasProfileImage) {
                    profileAvatar.src = data.profile_image + '?t=' + new Date().getTime();
                }
                setupImageContainer(profileAvatarContainer, 'avatar', hasProfileImage);
                
                // Update header image and setup container
                const headerImage = document.querySelector('.header-image img');
                const hasHeaderImage = data.header_image && data.header_image !== '';
                
                if (headerImage && hasHeaderImage) {
                    headerImage.src = data.header_image + '?t=' + new Date().getTime();
                }
                setupImageContainer(headerImageContainer, 'header', hasHeaderImage);
            }
        })
        .catch(error => {
            console.error('Error loading user images:', error);
        });
    }
    
    // Đóng dropdown khi click bất kỳ đâu trên trang
    document.addEventListener('click', function(event) {
        // Nếu click không phải vào dropdown hay button update
        if (!event.target.closest('.image-dropdown') && 
            !event.target.classList.contains('update-avatar-btn') && 
            !event.target.classList.contains('update-header-btn')) {
            closeAllDropdowns();
        }
    });

    document.addEventListener('DOMContentLoaded', function() {
        const uploadAvatarBtn = document.querySelector('.upload-avatar-btn');
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        
        uploadAvatarBtn.addEventListener('click', function() {
            fileInput.click();
        });
        
        fileInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const formData = new FormData();
                formData.append('avatar', this.files[0]);
                
                fetch('../model/uploadProfileImage.php', {
                    method: 'POST',
                    body: formData
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Gọi hàm cập nhật sau khi upload thành công
                        refreshProfileAfterUpload();
                        alert('Avatar updated successfully!');
                    } else {
                        alert('Error: ' + data.message);
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    alert('An error occurred during upload.');
                });
            }
        });
    });
});