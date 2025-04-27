document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra xem modal đã được thêm vào DOM chưa
    const modalExists = document.getElementById('signup-modal');
    
    if (!modalExists) {
        console.error('Modal đăng ký không tồn tại trong DOM');
        return;
    }

    // Lấy các phần tử DOM
    const modal = document.getElementById('signup-modal');
    const closeButton = document.querySelector('.close-modal');
    const createAccountButtons = document.querySelectorAll('.create-account, .create-account-btn');
    
    // Đối tượng lưu trữ mã quốc gia điện thoại
    const phoneCountryCodes = {
        'VN': '+84',
        'US': '+1',
        'UK': '+44',
        'FR': '+33',
        'DE': '+49',
        'JP': '+81',
        'AU': '+61'
    };

    // Khởi tạo các trường ngày/năm
    initializeDateDropdowns();
    
    // Thêm sự kiện change cho trường quốc gia để cập nhật mã quốc gia điện thoại
    const countrySelect = document.getElementById('country');
    const phoneInput = document.getElementById('phone');
    
    // Tạo phần tử hiển thị mã quốc gia
    const phoneContainer = document.createElement('div');
    phoneContainer.className = 'phone-container';
    phoneInput.parentNode.insertBefore(phoneContainer, phoneInput);
    phoneContainer.appendChild(phoneInput);
    
    const countryCodeSpan = document.createElement('span');
    countryCodeSpan.className = 'country-code';
    phoneContainer.insertBefore(countryCodeSpan, phoneInput);

    phoneInput.setAttribute('maxlength', '9');
    phoneInput.setAttribute('pattern', '[0-9]*');
    phoneInput.setAttribute('inputmode', 'numeric');

    // Thêm CSS cho phone container
    const style = document.createElement('style');
    style.textContent = `
          .phone-container {
                display: flex;
                align-items: center;
                width: 100%;
          }
          .country-code {
                display: inline-block;
                padding: 10px 8px;
                border: 1px solid #ddd;
                border-right: none;
                border-radius: 4px 0 0 4px;
                background-color: #f5f5f5;
                font-size: 16px;
                color: #333;
                min-width: 50px;
                text-align: center;
          }
          #phone {
                border-top-left-radius: 0;
                border-bottom-left-radius: 0;
                flex: 1;
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
          /* Success popup styling */
          .success-popup {
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background-color: #fff;
                padding: 20px;
                border-radius: 5px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.2);
                z-index: 1001; 
                text-align: center;
          }
          .success-popup h3 {
                color: #4CAF50;
                margin-bottom: 15px;
          }
          .success-popup button {
                margin-top: 15px;
                padding: 8px 15px;
                background-color: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
          }
          .popup-overlay {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0,0,0,0.5);
                z-index: 1000;
          }
          /* Thêm hiệu ứng cho modal */
          #signup-modal {
                opacity: 0;
                transition: opacity 0.3s ease;
          }
          #signup-modal.visible {
                opacity: 1;
          }
    `;
    document.head.appendChild(style);

    // Tạo phần tử hiển thị lỗi cho các trường
    const fields = ['fullname', 'username', 'phone', 'password', 'confirm-password'];
    fields.forEach(field => {
          const input = document.getElementById(field);
          const errorSpan = document.createElement('span');
          errorSpan.className = 'error-message';
          errorSpan.id = `${field}-error`;
          input.parentNode.appendChild(errorSpan);
    });

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
    createPasswordToggle('confirm-password');

    // Tạo popup thành công
    const successPopup = document.createElement('div');
    successPopup.className = 'success-popup';
    successPopup.innerHTML = `
          <h3>Registration Successful!</h3>
          <p>Thank you for signing up!!! Your account has been successfully created.</p>
          <button id="close-success-popup">Close</button>
    `;

    document.body.appendChild(successPopup);

    const popupOverlay = document.createElement('div');
    popupOverlay.className = 'popup-overlay';
    document.body.appendChild(popupOverlay);

    document.getElementById('close-success-popup').addEventListener('click', function() {
          successPopup.style.display = 'none';
          popupOverlay.style.display = 'none';
          // Đóng modal đăng ký
          closeModal();
    });

    // Ngăn chặn validation mặc định của HTML5
    const form = document.getElementById('signup-form');
    if (form) {
          // Tắt validation mặc định của HTML5
          form.setAttribute('novalidate', '');
    
          // Thêm sự kiện input cho tất cả các trường input required
          const requiredInputs = form.querySelectorAll('input[required], select[required]');
          requiredInputs.forEach(input => {
                // Bỏ thuộc tính required để tránh thông báo mặc định
                input.removeAttribute('required');
                
                // Thêm class để đánh dấu là trường bắt buộc (cho CSS)
                input.classList.add('required-field');
                
                // Thêm sự kiện để validate khi thay đổi giá trị
                input.addEventListener('input', function(e) {
                      validateField(this);
                });
                
                input.addEventListener('blur', function(e) {
                      validateField(this);
                });
          });
    }

    // Kiểm tra tên người dùng đã tồn tại chưa
    const usernameInput = document.getElementById('username');
    
    // Kiểm tra tên tài khoản trong khi người dùng nhập
    usernameInput.addEventListener('input', function() {
        checkUsernameFormat(this.value);
    });
    
    // Kiểm tra tên tài khoản đã tồn tại sau khi người dùng rời khỏi trường
    usernameInput.addEventListener('blur', function() {
        if (this.value.trim() !== '') {
            // Kiểm tra format trước
            if (checkUsernameFormat(this.value)) {
                // Nếu format hợp lệ thì mới kiểm tra sự tồn tại
                checkExistingUsername(this.value);
            }
        }
    });
    
    // Hàm kiểm tra định dạng tên tài khoản
    function checkUsernameFormat(username) {
        const errorSpan = document.getElementById('username-error');
        const hasAccent = /[áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪỆÉÈẺẼẸÊẾỀỂỄỆÍÌỈĨỊÓÒỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÚÙỦŨỤƯỨỪỬỮỰÝỲỶỸỴĐ]/;
        
        if (hasAccent.test(username)) {
            errorSpan.textContent = 'Account name cannot contain accents';
            errorSpan.style.display = 'block';
            usernameInput.classList.add('input-error');
            return false;
        } else {
            // Nếu không có lỗi về dấu, xóa thông báo lỗi
            errorSpan.style.display = 'none';
            usernameInput.classList.remove('input-error');
            return true;
        }
    }

    // Hàm kiểm tra tên người dùng trên server
    function checkExistingUsername(username) {
        console.log("Checking if username exists:", username);
        const formData = new FormData();
        formData.append('check_username', username);
        
        fetch('model/checkUsername.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            console.log("Username check response:", data);
            const errorSpan = document.getElementById('username-error');
            if (data.trim() === 'exists') {
                console.log("Username already exists");
                errorSpan.textContent = 'This account name is already in use';
                errorSpan.style.display = 'block';
                usernameInput.classList.add('input-error');
            }
        })
        .catch(error => {
            console.error('Username check error:', error);
        });
    }

    phoneInput.addEventListener('input', function() {
          // Chỉ giữ lại các ký tự số
          this.value = this.value.replace(/\D/g, '');

          // Xóa số 0 ở đầu nếu có
          if (this.value.startsWith('0')) {
              this.value = this.value.replace(/^0+/, '');
          }
    });

    // Kiểm tra số điện thoại đã tồn tại chưa
    phoneInput.addEventListener('blur', function() {
        if (this.value.trim() !== '' && this.value.length === 9) {
            checkExistingPhone(this.value);
        }
    });

    // Hàm kiểm tra số điện thoại trên server
    function checkExistingPhone(phone) {
        console.log("Checking if phone exists:", phone);
        const formData = new FormData();

        // Lấy mã quốc gia và số điện thoại
        const countryCode = document.querySelector('.country-code').textContent;
        const fullPhone = countryCode + phone;
        formData.append('check_phone', fullPhone);
        
        fetch('model/checkPhone.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(data => {
            console.log("Phone check response:", data);
            const errorSpan = document.getElementById('phone-error');
            if (data.trim() === 'exists') {
                console.log("Phone already exists");
                errorSpan.textContent = 'Phone number is used';
                errorSpan.style.display = 'block';
                phoneInput.classList.add('input-error');
            }
        })
        .catch(error => {
            console.error('Lỗi kiểm tra số điện thoại:', error);
        });
    }

    // Cập nhật mã quốc gia khi thay đổi quốc gia
    countrySelect.addEventListener('change', function() {
          updateCountryCode();
          
          // Đảm bảo rằng số điện thoại hiện tại không có số 0 ở đầu
          if (phoneInput.value.startsWith('0')) {
                phoneInput.value = phoneInput.value.replace(/^0+/, '');
          }
    });

    // Hàm cập nhật mã quốc gia
    function updateCountryCode() {
          const selectedCountry = countrySelect.value;
          if (selectedCountry && phoneCountryCodes[selectedCountry]) {
                countryCodeSpan.textContent = phoneCountryCodes[selectedCountry];
          } else {
                countryCodeSpan.textContent = '';
          }
    }

    // Kiểm tra mật khẩu theo thời gian thực
    const passwordInput = document.getElementById('password');
    passwordInput.addEventListener('input', function() {
          validatePasswordStrength(this.value);
    });

    // Thêm sự kiện blur để hiển thị thông báo lỗi khi focus ra khỏi trường
    passwordInput.addEventListener('blur', function() {
          validatePasswordStrength(this.value);
    });

    // Mở modal khi bấm vào bất kỳ nút "Create account" nào
    createAccountButtons.forEach(button => {
          button.addEventListener('click', () => {
                openModal();
          });
    });

    // Hàm mở modal với hiệu ứng
    function openModal() {
        const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
        document.documentElement.style.setProperty('--scrollbar-width', scrollbarWidth + 'px');
        document.body.classList.add('modal-open');
        modal.style.display = 'block';
        
        // Thêm hiệu ứng fade in
        setTimeout(() => {
            modal.classList.add('visible');
        }, 10);
        
        updateCountryCode();
        resetForm();
    }
    
    function closeModal() {
        modal.classList.remove('visible');
        
        // Đợi kết thúc animation
        setTimeout(() => {
            modal.style.display = 'none';
            document.body.classList.remove('modal-open');
        }, 300);
        
        resetForm();
    }

    // Đóng modal khi bấm vào nút X
    closeButton.addEventListener('click', () => {
        closeModal();
    });

    // Đóng modal khi bấm ra ngoài
    const modalContent = modal.querySelector('.modal-register-content');

    let isDragging = false;

    // Nếu bắt đầu click vào modal (bên ngoài form), đánh dấu là "bắt đầu kéo"
    modal.addEventListener('mousedown', (e) => {
          if (!modalContent.contains(e.target)) {
                isDragging = true;
          }
    });
    
    modal.addEventListener('mouseup', (e) => {
          // Nếu bắt đầu là kéo (mousedown) và thả ra đúng vùng modal → mới đóng
          if (isDragging && !modalContent.contains(e.target)) {
                closeModal();
          }
          isDragging = false;
    });

    // Hàm khởi tạo dropdown cho ngày và năm
    function initializeDateDropdowns() {
          // Khởi tạo dropdown ngày
          const daySelect = document.getElementById('dob-day');
          for (let day = 1; day <= 31; day++) {
                const option = document.createElement('option');
                option.value = day;
                option.textContent = day;
                daySelect.appendChild(option);
          }
          
          // Khởi tạo dropdown năm
          const yearSelect = document.getElementById('dob-year');
          const currentYear = new Date().getFullYear();
          for (let year = currentYear; year >= currentYear - 100; year--) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                yearSelect.appendChild(option);
          }
    }

    // Hàm validate từng trường
    function validateField(field) {
        const id = field.id;
        const value = field.value.trim();
        console.log(`Validating ${id}: (type: ${field.type}, nodeName: ${field.nodeName})`);
        console.log(`Value: "${value}", Is Checkbox: ${field.type === 'checkbox'}, Is checked: ${field.checked}`);
        const errorSpan = document.getElementById(`${id}-error`);
        
        if (!errorSpan) return true; // Nếu không có error span, coi như field valid
        
        // Xóa thông báo lỗi trước đó
        errorSpan.style.display = 'none';
        field.classList.remove('input-error');
        
        // Với checkbox cần kiểm tra checked thay vì value
        if (field.type === 'checkbox') {
            return true; // Checkbox sẽ được kiểm tra riêng ở hàm validateForm
        }
        
        // Với select box (như country, date fields) 
        if (field.nodeName === 'SELECT' && value) {
            return true; // Select có giá trị là hợp lệ
        }

        // Kiểm tra trường trống
        if (!value) {
            let errorMsg = 'Please do not leave this field blank!';
        
            // Điều chỉnh thông báo theo trường cụ thể
            switch(id) {
                    case 'fullname':
                        errorMsg = 'Full name cannot be blank';
                        break;
                    case 'username':
                        errorMsg = 'Account name cannot be blank';
                        break;
                    case 'phone':
                        errorMsg = 'Phone number cannot be blank';
                        break;
                    case 'password':
                        errorMsg = 'Password cannot be blank';
                        break;
                    case 'confirm-password':
                        errorMsg = 'Confirm password cannot be blank';
                        break;
            }
        
            errorSpan.textContent = errorMsg;
            errorSpan.style.display = 'block';
            field.classList.add('input-error');
            return false;
        }
        
        // Kiểm tra riêng cho tên tài khoản (không được có dấu)
        if (id === 'username') {
            return checkUsernameFormat(value);
        }
        
        // Kiểm tra riêng cho số điện thoại
        if (id === 'phone' && value.length !== 9) {
            errorSpan.textContent = 'Phone number must have 9 digits';
            errorSpan.style.display = 'block';
            field.classList.add('input-error');
            return false;
        }
        
        // Kiểm tra riêng cho mật khẩu
        if (id === 'password') {
            return validatePasswordStrength(value);
        }
        
        // Kiểm tra xác nhận mật khẩu
        if (id === 'confirm-password') {
            const password = document.getElementById('password').value;
            if (value !== password) {
                    errorSpan.textContent = 'Password and confirm password do not match!';
                    errorSpan.style.display = 'block';
                    field.classList.add('input-error');
                    return false;
            }
        }
        
        return true;
    }
    
    // Hàm kiểm tra độ mạnh của mật khẩu
    function validatePasswordStrength(password) {
          const passwordInput = document.getElementById('password');
          const errorSpan = document.getElementById('password-error');
          
          // Nếu trường trống, không hiển thị lỗi về độ mạnh mật khẩu
          if (!password) {
                errorSpan.textContent = 'Password can not be blank';
                errorSpan.style.display = 'block';
                passwordInput.classList.add('input-error');
                return false;
          }
          
          // Kiểm tra độ dài
          if (password.length < 6) {
                errorSpan.textContent = 'Password must be at least 6 characters';
                errorSpan.style.display = 'block';
                passwordInput.classList.add('input-error');
                return false;
          }
          
          // Mật khẩu hợp lệ
          errorSpan.style.display = 'none';
          passwordInput.classList.remove('input-error');
          return true;
    }

    // Hàm reset tất cả thông báo lỗi
    function resetErrorMessages() {
          const errorMessages = document.querySelectorAll('.error-message');
          const inputFields = document.querySelectorAll('input');
          
          errorMessages.forEach(error => {
                error.style.display = 'none';
          });
          
          inputFields.forEach(input => {
                input.classList.remove('input-error');
          });
          
          // Xóa thông báo lỗi ở đầu form nếu có
          const formErrors = document.querySelectorAll('#signup-form > .error-message');
          formErrors.forEach(error => {
                error.remove();
          });
    }
    
    // Hàm reset form và thông báo lỗi
    function resetForm() {
        resetErrorMessages();
        // Không reset giá trị form để người dùng có thể tiếp tục nhập
    }

    // Focus vào trường lỗi đầu tiên
    function focusFirstError() {
        const firstErrorField = document.querySelector('.input-error');
        if (firstErrorField) {
            firstErrorField.focus();
        }
    }

    // Hàm kiểm tra dữ liệu form
    function validateForm() {
        console.log("Starting form validation");
        let isValid = true;
        resetErrorMessages();
        
        // Kiểm tra từng trường bắt buộc
        // const requiredFields = form.querySelectorAll('[required]');
        const requiredFields = form.querySelectorAll('.required-field');
        console.log("Required fields count:", requiredFields.length);
    
        requiredFields.forEach(field => {
            console.log(`Validating field: ${field.id}, value: ${field.value.trim()}`);
            if (!validateField(field)) {
                console.log(`Field ${field.id} validation failed`);
                isValid = false;
            }
        });
        
        // Kiểm tra ngày sinh
        const dobDay = document.getElementById('dob-day').value;
        const dobMonth = document.getElementById('dob-month').value;
        const dobYear = document.getElementById('dob-year').value;  
        console.log(`Date of Birth: ${dobDay}/${dobMonth}/${dobYear}`);

        if (!dobDay || !dobMonth || !dobYear) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Please select full date of birth';
            errorMessage.style.display = 'block';
          
            const dobContainer = document.getElementById('dob-day').parentNode;
            const existingError = dobContainer.querySelector('.error-message');
            if (existingError) {
                  existingError.style.display = 'block';
            } else {
                  dobContainer.appendChild(errorMessage);
            }
            isValid = false;
        } else {
            // Nếu đã điền đủ ngày tháng năm, xóa thông báo lỗi nếu có
            const dobContainer = document.getElementById('dob-day').parentNode;
            const existingError = dobContainer.querySelector('.error-message');
            if (existingError) {
                existingError.style.display = 'none';
            }
        }
        
        // Kiểm tra quốc gia
        const selectedCountry = document.getElementById('country').value;
        if (!selectedCountry) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'Please select country';
            errorMessage.style.display = 'block';
        
            const countryContainer = document.getElementById('country').parentNode;
            const existingError = countryContainer.querySelector('.error-message');
            if (existingError) {
                existingError.style.display = 'block';
            } else {
                countryContainer.appendChild(errorMessage);
            }
            isValid = false;
        } else {
            // Nếu đã chọn quốc gia, xóa thông báo lỗi nếu có
            const countryContainer = document.getElementById('country').parentNode;
            const existingError = countryContainer.querySelector('.error-message');
            if (existingError) {
                existingError.style.display = 'none';
            }
        }
        
        // Kiểm tra đồng ý điều khoản
        const termsCheckbox = document.getElementById('terms');
        if (!termsCheckbox.checked) {
            const errorMessage = document.createElement('div');
            errorMessage.className = 'error-message';
            errorMessage.textContent = 'You must agree to the terms of use and privacy policy!';
            errorMessage.style.display = 'block';
        
            const termsContainer = termsCheckbox.parentNode;
            const existingError = termsContainer.querySelector('.error-message');
            if (existingError) {
                existingError.style.display = 'block';
            } else {
                termsContainer.appendChild(errorMessage);
            }
            isValid = false;
        } else {
            // Nếu đã đồng ý điều khoản, xóa thông báo lỗi nếu có
            const termsContainer = termsCheckbox.parentNode;
            const existingError = termsContainer.querySelector('.error-message');
            if (existingError) {
                existingError.style.display = 'none';
            }
        }
        
        // Focus vào trường lỗi đầu tiên nếu có
        if (!isValid) {
            focusFirstError();
        }
        console.log("Form validation result:", isValid);
        return isValid;
    }
    
    // Hàm xóa lỗi ngay khi người dùng nhập
    function clearErrorOnInput() {
        // Lấy tất cả input của form (text, password, select)
        const allInputs = document.querySelectorAll('#signup-form input[type="text"], #signup-form input[type="password"], #signup-form input[type="tel"], #signup-form select');
        
        // Thêm event listener input cho tất cả các input
        allInputs.forEach(input => {
            input.addEventListener('input', function() {
                // Lấy phần tử error span liên kết với input này
                const errorSpan = document.getElementById(`${this.id}-error`);
                if (errorSpan) {
                    // Ẩn thông báo lỗi
                    errorSpan.style.display = 'none';
                    // Xóa style lỗi
                    this.classList.remove('input-error');
                }
            });
        });
        
        // Xử lý đặc biệt cho checkbox và radio button
        const checkboxes = document.querySelectorAll('#signup-form input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                // Tìm thông báo lỗi gần nhất trong container cha
                const container = this.parentNode;
                const errorMsg = container.querySelector('.error-message');
                if (errorMsg) {
                    errorMsg.style.display = 'none';
                }
            });
        });
        
        // Xử lý đặc biệt cho các trường ngày tháng
        const dateFields = document.querySelectorAll('#dob-day, #dob-month, #dob-year');
        dateFields.forEach(field => {
            field.addEventListener('change', function() {
                // Tìm bất kỳ thông báo lỗi liên quan đến ngày
                const container = document.getElementById('dob-day').parentNode;
                const errorMsg = container.querySelector('.error-message');
                if (errorMsg) {
                    errorMsg.style.display = 'none';
                }
            });
        });

        // Xử lý đặc biệt cho trường quốc gia
        countrySelect.addEventListener('change', function() {
            const container = this.parentNode;
            const errorMsg = container.querySelector('.error-message');
            if (errorMsg) {
                errorMsg.style.display = 'none';
            }
        });
    }

    // Gọi hàm clearErrorOnInput để thiết lập các event listener
    clearErrorOnInput();
    
    document.getElementById("signup-form").addEventListener("submit", function(e) {
        e.preventDefault();
        console.log("Form submitted");
        console.log("Form validation result:", validateForm());
        
        // Log ra giá trị của các trường quan trọng
        console.log("Username:", document.getElementById('username').value);
        console.log("Phone:", document.getElementById('phone').value);
        console.log("Password:", document.getElementById('password').value.replace(/./g, '*'));

        // Kiểm tra form trước khi gửi
        if (!validateForm()) {
            console.log("Form validation failed");
            return; // Dừng lại nếu form không hợp lệ
        }
    
        const form = e.target;
        const formData = new FormData(form);

        // Lấy mã điện thoại quốc gia và số điện thoại
        const countryCode = document.querySelector('.country-code').textContent;
        const phoneNumber = document.getElementById('phone').value;
        // Kết hợp mã quốc gia và số điện thoại 
        const fullPhoneNumber = countryCode + phoneNumber;
        
        // Loại bỏ số điện thoại cũ và thêm số đầy đủ
        formData.delete('phone');
        formData.append('phone', fullPhoneNumber);

        console.log("Full phone number to be saved:", fullPhoneNumber);

        fetch("model/signUp.php", {
              method: "POST",
              body: formData
        })
    
        .then(res => res.text())
        .then(data => {
              if (data.trim() === "success") {
                    successPopup.style.display = 'block';
                    popupOverlay.style.display = 'block';
                    form.reset(); 
              } else {
                    // Kiểm tra các thông báo lỗi cụ thể
                    if (data.includes("username")) {
                        const usernameError = document.getElementById('username-error');
                        usernameError.textContent = "This account name is already in use";
                        usernameError.style.display = 'block';
                        document.getElementById('username').classList.add('input-error');
                        document.getElementById('username').focus();
                    } else if (data.includes("phone")) {
                        const phoneError = document.getElementById('phone-error');
                        phoneError.textContent = "This phone number is already in use";
                        phoneError.style.display = 'block';
                        document.getElementById('phone').classList.add('input-error');
                        document.getElementById('phone').focus();
                    } 
              }
        })
        .catch(err => {
              const errorDiv = document.createElement('div');
              errorDiv.className = 'error-message';
              errorDiv.style.display = 'block';
              errorDiv.style.marginBottom = '15px';
              errorDiv.textContent = "Network error: " + err;
              
              const formFirstChild = form.firstChild;
              form.insertBefore(errorDiv, formFirstChild);
        });
    });
});