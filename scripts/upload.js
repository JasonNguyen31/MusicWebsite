const fileInput = document.getElementById('file-input');
const fileList = document.getElementById('file-list');
const uploadBtn = document.getElementById('upload-files-btn');
const dropZone = document.getElementById('drop-zone');

// Xử lý khi chọn file từ input
fileInput.addEventListener('change', function() {
    displaySelectedFiles(this.files);
});

// Xử lý khi kéo thả file vào drop zone
dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');
});

dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    e.stopPropagation();
    this.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    
    // Kiểm tra xem các file có phải là file audio không
    let validFiles = true;
    for (let i = 0; i < files.length; i++) {
        if (!files[i].type.startsWith('audio/')) {
            validFiles = false;
            break;
        }
    }
    
    if (validFiles) {
        fileInput.files = files;
        displaySelectedFiles(files);
    } else {
        alert('Please upload only audio files.');
    }
});

// Hàm hiển thị tên file đã chọn
function displaySelectedFiles(files) {
    fileList.innerHTML = '';
    
    if (files.length > 0) {
        document.getElementById('selected-files-container').style.display = 'block';
        uploadBtn.disabled = false;
        
        for (let i = 0; i < files.length; i++) {
            const fileItem = document.createElement('div');
            fileItem.className = 'file-item';
            
            const fileName = document.createElement('span');
            fileName.className = 'file-name';
            fileName.textContent = files[i].name;
            
            const removeBtn = document.createElement('button');
            removeBtn.className = 'remove-file';
            removeBtn.innerHTML = '<i class="fas fa-times"></i>';
            removeBtn.setAttribute('data-index', i);
            removeBtn.onclick = function() {
                removeFile(this.getAttribute('data-index'));
            };
            
            fileItem.appendChild(fileName);
            fileItem.appendChild(removeBtn);
            fileList.appendChild(fileItem);
        }
    } else {
        document.getElementById('selected-files-container').style.display = 'none';
        uploadBtn.disabled = true;
    }
}

// Hàm xóa file từ danh sách
function removeFile(index) {
    // Vì không thể sửa đổi trực tiếp FileList, chúng ta cần tạo một DataTransfer mới
    const dt = new DataTransfer();
    const files = fileInput.files;
    
    for (let i = 0; i < files.length; i++) {
        if (i != index) {
            dt.items.add(files[i]);
        }
    }
    
    fileInput.files = dt.files;
    displaySelectedFiles(fileInput.files);
}

// Hàm tạo hiệu ứng chữ nhảy lên từng chữ cái 
function createWaveText(text, container) {
    // Xóa nội dung hiện tại của container
    container.innerHTML = '';
    
    // Tạo span cho mỗi chữ cái
    for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') {
            // Nếu là khoảng trắng, tạo một span đặc biệt
            const space = document.createElement('span');
            space.className = 'wave-space';
            container.appendChild(space);
        } else {
            // Nếu là chữ cái thông thường
            const letter = document.createElement('span');
            letter.className = 'wave-letter';
            letter.textContent = text[i];
            letter.style.animationDelay = `${i * 0.08}s`; // Độ trễ tăng dần cho mỗi chữ
            container.appendChild(letter);
        }
    }
}

// Lặp lại hiệu ứng sóng cho đến khi hết thời gian
function startRepeatingWaveEffect(container, text, duration) {
    createWaveText(text, container);
    
    // Tính thời gian để hoàn thành một hiệu ứng
    const animationTime = text.length * 0.08 + 0.5; // Độ trễ của chữ cuối cùng + thời gian animation
    
    // Lặp lại hiệu ứng cho đến khi hết thời gian
    let startTime = Date.now();
    const interval = setInterval(() => {
        const elapsedTime = (Date.now() - startTime) / 1000; // Đổi thành giây
        
        // Nếu đã hết thời gian hoặc container không còn trong DOM, dừng hiệu ứng
        if (elapsedTime >= duration || !document.body.contains(container)) {
            clearInterval(interval);
            return;
        }
        
        // Nếu đã hoàn thành một chu kỳ hiệu ứng, bắt đầu lại
        if (elapsedTime % animationTime < 0.1) {
            createWaveText(text, container);
        }
    }, 100); // Kiểm tra mỗi 100ms
}

// Xử lý nút upload với chuyển hướng sau khi upload thành công
uploadBtn.addEventListener('click', function() {
    // Hiển thị loading
    this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
    this.disabled = true;
    
    // Lấy thông tin privacy
    const privacy = document.querySelector('input[name="privacy"]:checked').value;
    
    // Tạo FormData và gửi lên server
    const formData = new FormData();
    for (let i = 0; i < fileInput.files.length; i++) {
        // Thêm từng file vào FormData - đây là cách đúng để gửi files
        formData.append('files[]', fileInput.files[i]);
    }
    formData.append('privacy', privacy);
    
    // Gửi request lên server với header X-Requested-With để server biết đây là AJAX request
    fetch('../model/uploadProcess.php', {
        method: 'POST',
        body: formData,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    })
    .then(response => response.json())
    .then(data => {
        console.log('Success:', data);
        
        if (data.status === 'success') {
            // Nếu server trả về URL để redirect, chuyển hướng đến trang đó
            // if (data.redirect) {
            //     window.location.href = data.redirect;
            // }
            // Tạo overlay hiệu ứng full màn hình
            const overlay = document.createElement('div');
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.width = '100%';
            overlay.style.height = '100%';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.16)';
            overlay.style.zIndex = '9999';
            overlay.style.display = 'flex';
            overlay.style.justifyContent = 'center';
            overlay.style.alignItems = 'center';
            
            // Tạo container cho hiệu ứng wave text
            const waveContainer = document.createElement('div');
            waveContainer.className = 'wave-container';
            waveContainer.style.fontSize = '23px';
            waveContainer.style.textAlign = 'center';
            waveContainer.style.minHeight = '50px';
            
            // Thêm vào DOM
            overlay.appendChild(waveContainer);
            document.body.appendChild(overlay);
            
            // CSS cho hiệu ứng
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
            
            // Bắt đầu hiệu ứng chữ nhảy lặp lại trong 10 giây
            startRepeatingWaveEffect(waveContainer, "Upload Successful! Redirecting...", 10);
            
            // Đợi 10 giây rồi chuyển hướng
            setTimeout(() => {
                window.location.href = 'uploadDetails.php';
            }, 10000);
        } else {
            // Hiển thị thông báo lỗi
            alert(data.message);
            
            // Khôi phục nút upload
            uploadBtn.innerHTML = 'Upload';
            uploadBtn.disabled = false;
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Có lỗi xảy ra khi upload file');
        
        // Khôi phục nút upload
        uploadBtn.innerHTML = 'Upload';
        uploadBtn.disabled = false;
    });
});