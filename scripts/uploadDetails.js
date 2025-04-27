// file uploadDetails.js
document.addEventListener('DOMContentLoaded', function() {
    if (sessionStorage.getItem('form_submitted') === 'true') {
        // Xóa cờ báo form đã được submit
        sessionStorage.removeItem('form_submitted');
        // Xóa thêm bất kỳ dữ liệu form nào đã lưu
        clearFormDataFromLocalStorage();
    }

    // Đảm bảo xóa cờ form_submitted khi tải trang uploadDetails
    sessionStorage.removeItem('form_submitted');

    // Xử lý sự kiện cho nút upload image
    const uploadImageBtn = document.querySelector('.upload-image-btn');
    const imageUploadInput = document.getElementById('image-upload');
    const placeholderImage = document.querySelector('.placeholder-image');
    let imageUploaded = false; // Biến để theo dõi trạng thái upload ảnh

    if (uploadImageBtn && imageUploadInput) {
        uploadImageBtn.addEventListener('click', function() {
            imageUploadInput.click();
        });
        
        // Thêm sự kiện click cho placeholder image để cho phép thay đổi ảnh
        placeholderImage.addEventListener('click', function() {
            imageUploadInput.click();
        });
        
        imageUploadInput.addEventListener('change', function() {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    // Cập nhật hình ảnh placeholder
                    placeholderImage.style.backgroundImage = `url(${e.target.result})`;
                    placeholderImage.style.backgroundSize = 'cover';
                    placeholderImage.style.backgroundPosition = 'center';
                    
                    // Ẩn nút upload image sau khi đã tải ảnh lên
                    uploadImageBtn.style.display = 'none';
                    
                    // Thêm lớp CSS để chỉ ra rằng ảnh đã được tải lên
                    placeholderImage.classList.add('has-image');
                    
                    // Đánh dấu đã upload ảnh và xóa class error nếu có
                    imageUploaded = true;
                    placeholderImage.classList.remove('error');
                    
                    // Loại bỏ thông báo lỗi nếu có
                    const errorElement = document.querySelector('.track-image .error-message');
                    if (errorElement) {
                        errorElement.remove();
                    }
                    
                    // Có thể thêm tooltip hoặc hint rằng có thể click để thay đổi ảnh
                    placeholderImage.title = "Click to change";
                }
                
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    
    // Xử lý tự động cập nhật permalink từ title
    const titleInput = document.getElementById('title');
    const permalinkSlugInput = document.getElementById('permalink-slug');
    const fullPermalinkInput = document.getElementById('full-permalink');
    const permalinkContainer = document.querySelector('.permalink-container');
    let permalinkEdited = false;
    
    function updateFullPermalink() {
        const baseUrl = "";
        fullPermalinkInput.value = baseUrl + permalinkSlugInput.value;
    }
    
    if (titleInput && permalinkSlugInput) {
        titleInput.addEventListener('input', function() {
            if (!permalinkEdited) {
                const slug = this.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                permalinkSlugInput.value = slug;
                updateFullPermalink();
            }
        });
        
        // Khi người dùng chỉnh sửa permalink, đánh dấu đã chỉnh sửa
        permalinkSlugInput.addEventListener('input', function() {
            permalinkEdited = true;
            updateFullPermalink();
        });
        
        // Xử lý nút chỉnh sửa permalink
        const editBtn = document.querySelector('.edit-btn');
        if (editBtn) {
            editBtn.addEventListener('click', function() {
                permalinkContainer.classList.add('editing');
                permalinkSlugInput.focus();
                permalinkSlugInput.select();
                
                // Đổi text của nút thành "Done"
                this.textContent = "Done";
                
                // Tạo event handler để xử lý khi click ra ngoài
                const clickOutsideHandler = function(e) {
                    if (!permalinkContainer.contains(e.target) || e.target === editBtn) {
                        permalinkContainer.classList.remove('editing');
                        editBtn.textContent = "Edit";
                        document.removeEventListener('click', clickOutsideHandler);
                    }
                };
                
                // Thêm click handler sau một khoảng thời gian nhỏ để tránh trigger ngay lập tức
                setTimeout(() => {
                    document.addEventListener('click', clickOutsideHandler);
                }, 10);
            });
        }
    }
    
    // Xử lý đếm ký tự cho trường caption
    const captionTextarea = document.getElementById('caption');
    const characterCount = document.querySelector('.character-count');
    const maxLength = 140;
    
    if (captionTextarea && characterCount) {
        captionTextarea.addEventListener('input', function() {
            const remainingChars = maxLength - this.value.length;
            characterCount.textContent = remainingChars;
            
            // Hiển thị số ký tự còn lại màu đỏ nếu quá giới hạn
            if (remainingChars < 0) {
                characterCount.style.color = '#ff0000';
            } else {
                characterCount.style.color = '#999';
            }
        });
    }
    
    // Xử lý trường lyrics - kiểm tra độ dài tối thiểu
    const lyricsTextarea = document.getElementById('Lyrics');
    if (lyricsTextarea) {
        lyricsTextarea.addEventListener('input', function() {
            // Xóa thông báo lỗi nếu đã nhập đủ
            if (this.value.length >= 700) {
                this.classList.remove('error');
                const errorElement = this.nextElementSibling;
                if (errorElement && errorElement.classList.contains('error-message')) {
                    errorElement.remove();
                }
            }
        });
    }

    function validateTags(tagsString) {
        // Tách các tag bằng dấu cách, dấu phẩy hoặc dấu chấm phẩy
        const tags = tagsString.split(/[\s,;]+/).filter(tag => tag.trim() !== '');
        
        // Kiểm tra xem mỗi tag có bắt đầu bằng # không
        const invalidTags = tags.filter(tag => !tag.startsWith('#'));
        
        return {
            valid: invalidTags.length === 0,
            invalidTags: invalidTags,
            totalTags: tags.length
        };
    }
    
    // Xử lý trường tags - kiểm tra đủ 2 tags
    const tagsInput = document.getElementById('tags');
    if (tagsInput) {
        tagsInput.addEventListener('input', function() {
            // Xóa thông báo lỗi trước đó
            const errorElement = this.nextElementSibling;
            if (errorElement && errorElement.classList.contains('error-message')) {
                errorElement.remove();
            }
            
            const result = validateTags(this.value);
            const tags = this.value.split(/[\s,;]+/).filter(tag => tag.trim() !== '');
            
            // Kiểm tra cả số lượng tag tối thiểu và tiền tố #
            if (tags.length >= 2 && result.valid) {
                this.classList.remove('error');
            } else if (tags.length < 2) {
                // Chỉ hiển thị lỗi "tối thiểu 2 tag" nếu đó là vấn đề chính
                this.classList.add('error');
            } else if (!result.valid) {
                // Hiển thị lỗi về tiền tố #
                this.classList.add('error');
                const errorMsg = createErrorMessage(`Các tag phải bắt đầu bằng ký hiệu #. Tag không hợp lệ: ${result.invalidTags.join(', ')}`);
                this.parentNode.insertBefore(errorMsg, this.nextSibling);
            }
        });
    }
    
    // Xử lý trường genre
    const genreSelect = document.getElementById('genre');
    if (genreSelect) {
        genreSelect.addEventListener('change', function() {
            if (this.value !== 'none') {
                this.classList.remove('error');
                const errorElement = this.nextElementSibling;
                if (errorElement && errorElement.classList.contains('error-message')) {
                    errorElement.remove();
                }
            }
        });
    }
    
    // Hàm tạo thông báo lỗi
    function createErrorMessage(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        errorElement.textContent = message;
        errorElement.style.color = 'red';
        errorElement.style.fontSize = '13px';
        errorElement.style.marginTop = '14px';
        return errorElement;
    }
    
    // Lưu dữ liệu form khi người dùng nhập để phòng trường hợp reload
    const formInputs = document.querySelectorAll('#upload-details-form input, #upload-details-form textarea, #upload-details-form select');
    formInputs.forEach(input => {
        input.addEventListener('input', function() {
            // Lưu giá trị vào localStorage
            localStorage.setItem('form_' + this.id, this.value);
        });
        
        // Đối với radio button
        if (input.type === 'radio') {
            input.addEventListener('change', function() {
                if (this.checked) {
                    localStorage.setItem('form_' + this.name, this.value);
                }
            });
        }
    });
    
    // Khôi phục dữ liệu form khi tải trang
    function restoreFormData() {
        formInputs.forEach(input => {
            const storedValue = localStorage.getItem('form_' + input.id);
            
            // Nếu có giá trị đã lưu
            if (storedValue !== null) {
                if (input.type === 'radio') {
                    if (input.value === localStorage.getItem('form_' + input.name)) {
                        input.checked = true;
                    }
                } else {
                    input.value = storedValue;
                }
            }
        });
        
        // Khôi phục giá trị cho select genre
        const genreValue = localStorage.getItem('form_genre');
        if (genreValue) {
            document.getElementById('genre').value = genreValue;
        }
    }
    
    // Gọi hàm khôi phục khi tải trang
    window.addEventListener('load', function() {
        // Chỉ khôi phục nếu đang ở trang chi tiết và có dữ liệu lưu trữ
        if (document.getElementById('upload-details-form')) {
            restoreFormData();
        }
    });
    
    // Xử lý sự kiện reload trang - không cần làm gì vì dữ liệu đã được lưu sẵn
    window.addEventListener('beforeunload', function(e) {
        // Không hiển thị hộp thoại xác nhận khi reload
        delete e['returnValue'];
    });
    

    // Hàm xóa dữ liệu form trong localStorage 
    function clearFormDataFromLocalStorage() {
        // Thu thập tất cả các khóa cần xóa trước
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('form_')) {
                keysToRemove.push(key);
            }
        }
        
        // Sau đó xóa từng khóa
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log("Đã xóa:", key);
        });
        
        console.log("Đã xóa " + keysToRemove.length + " mục form từ localStorage");
    }

    // Thay thế đoạn mã xóa localStorage trong sự kiện click của nút Cancel
    document.querySelector('.btn-cancel').addEventListener('click', function() {
        if (confirm('Are you sure you want to cancel? Any changes will not be saved and the uploaded file will be deleted.')) {
            clearFormDataFromLocalStorage();
            
            const trackId = document.querySelector('input[name="track_id"]').value;
            
            fetch('../model/cancelUpload.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                body: 'track_id=' + trackId
            })
            .then(response => response.json())
            .then(data => {
                console.log('Cancel response:', data);
                window.location.href = '../view/upload.php';
            })
            .catch(error => {
                console.error('Error:', error);
                window.location.href = '../view/upload.php';
            });
        }
    });

    // Create a function to show the wave animation when saving
    function showSavingAnimation() {
        // Create overlay for the animation
        const overlay = document.createElement('div');
        overlay.className = 'saving-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.23)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        
        // Create container for wave text
        const waveContainer = document.createElement('div');
        waveContainer.className = 'wave-container';
        waveContainer.style.fontSize = '23px';
        waveContainer.style.textAlign = 'center';
        waveContainer.style.minHeight = '50px';
        
        // Add styles for the animation
        const style = document.createElement('style');
        style.textContent = `
            
            .wave-letter {
                display: inline-block;
                color: #4CAF50;
                font-weight: bold;
                animation: wavyText 0.5s ease forwards;
                transform: translateY(0);
                opacity: 0;
            }
            
            .wave-space {
                display: inline-block;
                width: 0.3em;
            }
            
            @keyframes wavyText {
                0% {
                    transform: translateY(0);
                    opacity: 0;
                }
                40% {
                    transform: translateY(-15px);
                    opacity: 1;
                }
                100% {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            .wave-container {
                text-align: center;
                font-size: 20px;
                min-height: 50px;
            }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(overlay);
        overlay.appendChild(waveContainer);
        
        createWaveText("Your Track Is Saving...", waveContainer);
        startRepeatingWaveEffect(waveContainer, "Your Track Is Saving...", 6); 
        
        return new Promise(resolve => setTimeout(resolve, 6000)); 
    }
    
    // Function to create wave text effect
    function createWaveText(text, container) {
        // Clear current content of container
        container.innerHTML = '';
        
        // Create span for each letter
        for (let i = 0; i < text.length; i++) {
            if (text[i] === ' ') {
                // If it's a space, create a special span
                const space = document.createElement('span');
                space.className = 'wave-space';
                container.appendChild(space);
            } else {
                // If it's a regular letter
                const letter = document.createElement('span');
                letter.className = 'wave-letter';
                letter.textContent = text[i];
                letter.style.animationDelay = `${i * 0.08}s`; // Increasing delay for each letter
                container.appendChild(letter);
            }
        }
    }
    
    // Function to repeat wave effect until duration ends
    function startRepeatingWaveEffect(container, text, duration) {
        createWaveText(text, container);
        
        // Calculate time to complete one animation
        const animationTime = text.length * 0.08 + 0.5; // Delay of last letter + animation time
        
        // Repeat effect until duration ends
        let startTime = Date.now();
        const interval = setInterval(() => {
            const elapsedTime = (Date.now() - startTime) / 1000; // Convert to seconds
            
            // If time has elapsed or container is no longer in DOM, stop effect
            if (elapsedTime >= duration || !document.body.contains(container)) {
                clearInterval(interval);
                return;
            }
            
            // If one animation cycle has completed, restart
            if (elapsedTime % animationTime < 0.1) {
                createWaveText(text, container);
            }
        }, 100); // Check every 100ms
    }

    // Xử lý form submit
    const uploadForm = document.getElementById('upload-details-form');
    if (uploadForm) {
        uploadForm.addEventListener('submit', function(e) {
            // Ngăn form submit mặc định
            e.preventDefault();
            clearFormDataFromLocalStorage();
            // Xóa tất cả thông báo lỗi cũ
            document.querySelectorAll('.error-message').forEach(el => el.remove());
            
            // Biến kiểm tra lỗi
            let isValid = true;
            let firstErrorField = null;
            
            // 1. Kiểm tra ảnh đã được upload chưa
            if (!imageUploaded) {
                isValid = false;
                placeholderImage.classList.add('error');
                const trackImageContainer = document.querySelector('.track-image');
                trackImageContainer.appendChild(createErrorMessage("Vui lòng tải lên hình ảnh cho track"));
                
                if (!firstErrorField) {
                    firstErrorField = placeholderImage;
                }
            }
            
            // 2. Kiểm tra genre đã được chọn chưa
            if (genreSelect.value === 'none') {
                isValid = false;
                genreSelect.classList.add('error');
                if (!genreSelect.nextElementSibling || !genreSelect.nextElementSibling.classList.contains('error-message')) {
                    genreSelect.parentNode.insertBefore(createErrorMessage("Vui lòng chọn thể loại"), genreSelect.nextSibling);
                }
                
                if (!firstErrorField) {
                    firstErrorField = genreSelect;
                }
            }
            
            // 3. Kiểm tra tags (ít nhất 2 tags)
            const tagsValidation = validateTags(tagsInput.value);
            const tags = tagsInput.value.split(/[\s,;]+/).filter(tag => tag.trim() !== '');

            if (tags.length < 2 || !tagsValidation.valid) {
                isValid = false;
                tagsInput.classList.add('error');
                
                // Xóa thông báo lỗi hiện có
                if (tagsInput.nextElementSibling && tagsInput.nextElementSibling.classList.contains('error-message')) {
                    tagsInput.nextElementSibling.remove();
                }
                
                // Tạo thông báo lỗi phù hợp
                let errorMessage = "";
                if (tags.length < 2) {
                    errorMessage = "Vui lòng nhập ít nhất 2 tags";
                }
                
                if (!tagsValidation.valid) {
                    if (errorMessage) errorMessage += " và đảm bảo tất cả các tag đều bắt đầu bằng ký hiệu #";
                    else errorMessage = "Tất cả các tag phải bắt đầu bằng ký hiệu #. Tag không hợp lệ: " + tagsValidation.invalidTags.join(', ');
                }
                
                tagsInput.parentNode.insertBefore(createErrorMessage(errorMessage), tagsInput.nextSibling);
                
                if (!firstErrorField) {
                    firstErrorField = tagsInput;
                }
            }
            
            // 4. Kiểm tra lyrics đã nhập và đủ dài chưa
            if (!lyricsTextarea.value.trim() || lyricsTextarea.value.length < 700) {
                isValid = false;
                lyricsTextarea.classList.add('error');
                if (!lyricsTextarea.nextElementSibling || !lyricsTextarea.nextElementSibling.classList.contains('error-message')) {
                    lyricsTextarea.parentNode.insertBefore(
                        createErrorMessage("Vui lòng nhập lời bài hát (tối thiểu 700 ký tự, hiện tại: " + lyricsTextarea.value.length + " ký tự)"),
                        lyricsTextarea.nextSibling
                    );
                }
                
                if (!firstErrorField) {
                    firstErrorField = lyricsTextarea;
                }
            }
            
            // Kiểm tra các trường bắt buộc khác
            const requiredFields = document.querySelectorAll('[required]');
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    isValid = false;
                    field.classList.add('error');
                    if (!field.nextElementSibling || !field.nextElementSibling.classList.contains('error-message')) {
                        field.parentNode.insertBefore(createErrorMessage("Trường này không được để trống"), field.nextSibling);
                    }
                    
                    if (!firstErrorField) {
                        firstErrorField = field;
                    }
                }
            });
            
            // Kiểm tra độ dài caption
            if (captionTextarea && captionTextarea.value.length > maxLength) {
                isValid = false;
                captionTextarea.classList.add('error');
                if (!captionTextarea.nextElementSibling || !captionTextarea.nextElementSibling.classList.contains('error-message')) {
                    captionTextarea.parentNode.insertBefore(
                        createErrorMessage("Caption không được vượt quá 140 ký tự."),
                        captionTextarea.nextSibling
                    );
                }
                
                if (!firstErrorField) {
                    firstErrorField = captionTextarea;
                }
            }
            
            if (!isValid) {
                // Focus vào trường lỗi đầu tiên
                if (firstErrorField) {
                    firstErrorField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => {
                        firstErrorField.focus();
                    }, 500);
                }
            } else {
                clearFormDataFromLocalStorage();
                // Nếu hợp lệ, xóa dữ liệu khỏi localStorage và submit form
                // formInputs.forEach(input => {
                //     localStorage.removeItem('form_' + input.id);
                // });
                // localStorage.removeItem('form_privacy');
                showSavingAnimation().then(() => {
                    // Set a flag in sessionStorage to indicate form was submitted
                    sessionStorage.setItem('form_submitted', 'true');
                    
                    // Submit the form
                    this.submit();
                });
                // showSavingAnimation().then(() => {
                //     this.submit();
                // });
            }
        });
    }
});
