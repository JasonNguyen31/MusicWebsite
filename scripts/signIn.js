document.addEventListener('DOMContentLoaded', function() {
    // Check if sign-in modal exists in the DOM
    const signInModal = document.getElementById('signin-modal');
    
    // If modal doesn't exist, show an error in console
    if (!signInModal) {
        console.error('Sign-in modal not found in DOM. Make sure to add the HTML to your page.');
        return;
    }

    // Get DOM elements
    const closeButton = signInModal.querySelector('.close-modal');
    const signInButtons = document.querySelectorAll('.sign-in, .signin-link');
    
    // Thêm CSS để cải thiện giao diện và hiệu ứng
    const style = document.createElement('style');
    style.textContent += `
        .loading-message {
            margin: 10px 0;
            padding: 10px;
            border-radius: 4px;
        }

        .loading-spinner {
            display: inline-block;
            width: 20px;
            height: 20px;
            margin-left: 10px;
            border: 3px solid rgba(0,0,0,0.1);
            border-radius: 50%;
            border-top-color: #4CAF50;
            animation: spin 1s ease-in-out infinite;
            vertical-align: middle;
        }

        @keyframes spin {
            to { transform: rotate(360deg); }
        }
        
        /* Hiệu ứng chữ nhảy từng chữ cái */
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
        
        /* Container cho hiệu ứng sóng */
        .wave-container {
            text-align: center;
            font-size: 16px;
            min-height: 40px;
        }
        
        .error-message {
            color: #ff3333;
            font-size: 14px;
            margin-top: 5px;
            display: none;
        }
        .input-error {
            border-color: #ff3333;
        }
        .password-wrapper {
            position: relative;
            width: 100%;
        }
        .toggle-password {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            user-select: none;
        }
    `;
    document.head.appendChild(style);
    
    signInButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
    });

    closeButton.addEventListener('click', () => {
        closeModal();
    });

    const modalContent = signInModal.querySelector('.modal-login-content');
    let isDragging = false;

    signInModal.addEventListener('mousedown', (e) => {
        if (!modalContent.contains(e.target)) {
            isDragging = true;
        }
    });
    
    signInModal.addEventListener('mouseup', (e) => {
        if (isDragging && !modalContent.contains(e.target)) {
            closeModal();
        }
        isDragging = false;
    });

    createPasswordToggle('signin-password');

    // Clear errors when input changes
    setupErrorClearingOnInput();

    // Add functionality to switch between sign-in and sign-up modals
    const createAccountLink = document.querySelector('#signin-modal .create-account-link');
    if (createAccountLink) {
        createAccountLink.addEventListener('click', function(e) {
            e.preventDefault();
            closeModal();
            
            // Trigger sign-up modal
            const createAccountButtons = document.querySelectorAll('.create-account, .create-account-btn');
            if (createAccountButtons.length > 0) {
                setTimeout(() => {
                    createAccountButtons[0].click();
                }, 300);
            }
        });
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

    // Functions
    function openModal() {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');
        document.body.classList.add('modal-open');
        signInModal.style.display = 'block';
        
        setTimeout(() => {
            signInModal.classList.add('visible');
        }, 10);
        
        resetForm();
    }
    
    function closeModal() {
        signInModal.classList.remove('visible');
        
        setTimeout(() => {
            signInModal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }, 300);
        
        resetForm();
    }

    function createPasswordToggle(passwordFieldId) {
        const passwordField = document.getElementById(passwordFieldId);
        const wrapper = document.createElement('div');
        wrapper.className = 'password-wrapper';
        
        // Đặt input vào wrapper
        passwordField.parentNode.insertBefore(wrapper, passwordField);
        wrapper.appendChild(passwordField);
        
        // Tạo nút toggle
        const toggleButton = document.createElement('span');
        toggleButton.className = 'toggle-password';
        toggleButton.innerHTML = '👁️';
        toggleButton.addEventListener('click', function() {
              if (passwordField.type === 'password') {
                    passwordField.type = 'text';
                    toggleButton.innerHTML = '👁️‍🗨️';
              } else {
                    passwordField.type = 'password';
                    toggleButton.innerHTML = '👁️';
              }
        });
        
        wrapper.appendChild(toggleButton);
    }

    createPasswordToggle('password');

    function validateField(field) {
        const id = field.id;
        const value = field.value.trim();
        const errorSpan = document.getElementById(`${id}-error`);
        
        if (!errorSpan) return true;
        
        errorSpan.style.display = 'none';
        field.classList.remove('input-error');
        
        if (!value) {
            let errorMsg = '';
            
            if (id === 'signin-username') {
                errorMsg = 'Please enter your accoutname';
            } else if (id === 'signin-password') {
                errorMsg = 'Please enter your password';
            }
            
            errorSpan.textContent = errorMsg;
            errorSpan.style.display = 'block';
            field.classList.add('input-error');
            return false;
        }
        
        return true;
    }

    function validateForm() {
        let isValid = true;
        resetErrorMessages();
        
        // Validate required fields
        const requiredFields = document.querySelectorAll('#signin-form .required-field');
        requiredFields.forEach(field => {
            if (!validateField(field)) {
                isValid = false;
            }
        });
        
        // Focus first error field
        if (!isValid) {
            const firstErrorField = document.querySelector('#signin-form .input-error');
            if (firstErrorField) {
                firstErrorField.focus();
            }
        }
        
        return isValid;
    }

    function resetErrorMessages() {
        const errorMessages = document.querySelectorAll('#signin-form .error-message');
        const inputFields = document.querySelectorAll('#signin-form input');
        
        errorMessages.forEach(error => {
            error.style.display = 'none';
        });
        
        inputFields.forEach(input => {
            input.classList.remove('input-error');
        });
        
        // Remove any form-level error message
        const formErrors = document.querySelectorAll('#signin-form > .error-message');
        formErrors.forEach(error => {
            error.remove();
        });
    }
    
    function resetForm() {
        resetErrorMessages();
        // We don't reset form values to allow users to continue entering data
    }

    function setupErrorClearingOnInput() {
        // For text and password inputs
        const textInputs = document.querySelectorAll('#signin-form input[type="text"], #signin-form input[type="password"]');
        textInputs.forEach(input => {
            input.addEventListener('input', function() {
                const errorSpan = document.getElementById(`${this.id}-error`);
                if (errorSpan) {
                    errorSpan.style.display = 'none';
                    this.classList.remove('input-error');
                }
            });
        });
    }

    document.getElementById("signin-form").addEventListener("submit", function(e) {
        e.preventDefault();
        
        // Validate form
        if (!validateForm()) {
            return;
        }
        
        const form = e.target;
        const formData = new FormData(form);
        
        // Hiển thị loading trước khi gửi request
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-message';
        loadingDiv.style.display = 'block';
        loadingDiv.style.marginBottom = '15px';
        loadingDiv.style.textAlign = 'center';
        loadingDiv.innerHTML = '<div class="loading-spinner"></div>';
        
        const formFirstChild = form.firstChild;
        form.insertBefore(loadingDiv, formFirstChild);
        
        // Make API call to sign in
        fetch("model/signIn.php", {
            method: "POST",
            body: formData
        })
        .then(res => res.text())
        .then(data => {
            console.log("Server response:", data);
            if (data.trim() === "success") {
                // Xóa loading spinner
                loadingDiv.innerHTML = '<div id="success-message" class="wave-container"></div>';
                
                // Tạo hiệu ứng văn bản nhảy lên từng chữ và lặp lại
                const successMessage = document.getElementById("success-message");
                startRepeatingWaveEffect(successMessage, "Login Successful! Please wait...", 3.5);
                
                // Delay 3.5 giây trước khi chuyển hướng
                setTimeout(() => {
                    window.location.href = 'view/home.php';
                }, 6000); // 3.5 giây
                
            } else {
                // Xóa loading message
                loadingDiv.remove();
                
                // Show error message
                const errorDiv = document.createElement('div');
                errorDiv.className = 'error-message';
                errorDiv.style.display = 'block';
                errorDiv.style.marginBottom = '15px';
                errorDiv.style.color = '#ff3333';
                errorDiv.style.textAlign = 'center';
                
                if (data.includes("invalid")) {
                    errorDiv.textContent = "Invalid username or password!";
                } else {
                    errorDiv.textContent = "An error occurred. Please try again.";
                }
                
                form.insertBefore(errorDiv, formFirstChild);
            }
        })
        .catch(err => {
            // Xóa loading message
            loadingDiv.remove();
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.style.display = 'block';
            errorDiv.style.marginBottom = '15px';
            errorDiv.textContent = "Network error: " + err;
            
            form.insertBefore(errorDiv, formFirstChild);
        });
    });
});