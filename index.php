<?php
    session_start();
    ob_start();
    include "model/db_connect.php";
    connectdb();
    if (isset($_SESSION['logged_in']) && $_SESSION['logged_in'] === true) {
        header("Location: view/home.php");
        exit;
    }
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>J'RSC: Stream and listen to music online</title>
    <link rel="stylesheet" href="assets/css/index.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
    <meta http-equiv="Pragma" content="no-cache">
    <meta http-equiv="Expires" content="0">
    
    <!-- Script ngăn quay lại trang trước đó và kiểm tra session -->
    <script type="text/javascript">
        // Ngăn chặn việc sử dụng nút Back
        window.history.pushState(null, null, window.location.href);
        window.onpopstate = function() {
            window.history.pushState(null, null, window.location.href);
        };
        
        // Kiểm tra khi trang được tải từ cache (sử dụng nút Back)
        window.addEventListener('pageshow', function(event) {
            if (event.persisted) {
                // Nếu trang được tải từ cache (nút Back hoặc Forward)
                window.location.reload(true);
            }
        });
        
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
    </script>
</head>
<body>
    <section class="hero">
        <div class="hero-content">
            <div class="logo-container">
                <img src="assets/images/logo.png" alt="J'RSC: Stream and listen to music online" class="hero-logo">
            </div>
            <div class="auth-buttons">
                <button class="sign-in">Sign in</button>
                <button class="create-account">Create account</button>
            </div>
            
            <div class="hero-slider">
                <div class="hero-slide active">
                    <!-- Image slide 1 -->
                    <img src="assets/images/banner5.webp" alt="Featured content" class="slide-image">
                </div>
                <div class="hero-slide">
                    <!-- Image slide 2 -->
                    <img src="assets/images/banner6.webp" alt="Featured content" class="slide-image">
                </div>
                <div class="hero-slide">
                    <!-- Image slide 3 -->
                    <img src="assets/images/banner8.jpg" alt="Featured content" class="slide-image">
                </div>
            </div>
            
            <div class="hero-dots">
                <span class="dot active" data-slide="0"></span>
                <span class="dot" data-slide="1"></span>
                <span class="dot" data-slide="2"></span>
            </div>
        </div>
    </section>

    <section class="search-section">
        <div class="search-container">
            <div class="search-bar">
                <input type="text" placeholder="Search for artists, bands, tracks, podcasts,...">
                <button class="search-btn"><i class="fas fa-search"></i></button>
            </div>
            <span class="or">or</span>
            <button class="upload-own-btn">Upload your own</button>
        </div>
    </section>

    <section class="trending-section">
        <h2>Hear what's trending for free in the SoundCloud community</h2>
        <button class="explore-playlists-btn">Explore trending playlists</button>
    </section>

    <section class="creators-section">
        <div class="creators-content">
            <div class="creators-text">
                <h2>Calling all creators</h2>
                <p>Get on SoundCloud to connect with fans,<br>share your sounds, and grow your audience.<br>What are you waiting for?</p>
                <button class="find-out-btn">Find out more</button>
            </div>
            <div class="creators-image">
                <img src="assets/images/creator.png" alt="J'RSC Creator">
            </div>
        </div>
    </section>

    <section class="join-section">
        <h2>Thanks for listening. Now join in.</h2>
        <p>Save tracks, follow artists and build playlists. All for free.</p>
        <button class="create-account-btn">Create account</button>
        <div class="signin-prompt">
            <span>Already have an account?</span>
            <a href="#" class="signin-link">Sign in</a>
        </div>
    </section>

    <footer>
        <div class="footer-links">
            <div class="footer-row">
                <a href="#">Directory</a>
                <a href="#">About us</a>
                <a href="#">Artist Resources</a>
                <a href="#">Blog</a>
                <a href="#">Jobs</a>
                <a href="#">Developers</a>
                <a href="#">Help</a>
                <a href="#">Legal</a>
                <a href="#">Privacy</a>
                <a href="#">Cookie Policy</a>
                <a href="#">Cookie Manager</a>
                <a href="#">Imprint</a>
                <a href="#">Charts</a>
                <a href="#">Transparency Report</a>
            </div>
            <div class="language-selector">
                <span>Language:</span>
                <select>
                    <option selected>Vietnamese (VN)</option>
                    <option selected>English (US)</option>
                </select>
            </div>
        </div>
    </footer>

    <div id="signup-modal" class="modal-register">
        <div class="modal-register-content">
            <span class="close-modal">&times;</span>
            <h2>Create Account</h2>
            <form id="signup-form">
                <div class="form-group">
                    <label for="fullname">Full Name</label>
                    <input type="text" id="fullname" name="fullname" placeholder="Enter your fullname or artistname" required>
                </div>

                <div class="form-group">
                    <label for="username">Account Name</label>
                    <input type="text" id="username" name="username" placeholder="Enter your accountname" required>
                </div>

                <div class="form-group">
                    <label for="country">Countries</label>
                    <select id="country" name="country" required>
                        <option value="">Choose a country</option>
                        <option value="VN">Viet Nam</option>
                        <option value="US">USA</option>
                        <option value="UK">UK</option>
                        <option value="FR">France</option>
                        <option value="DE">Germany</option>
                        <option value="JP">Japan</option>
                        <option value="AU">Australia</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="phone">Phone Number</label>
                    <input type="tel" id="phone" name="phone" placeholder="Enter your phone number" required>
                </div>

                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" placeholder="Enter your password" required>
                </div>

                <div class="form-group">
                    <label for="confirm-password">Confirm Password</label>
                    <input type="password" id="confirm-password" name="confirm-password" placeholder="Please confirm password" required>
                </div>

                <div class="form-group">
                    <label>Date</label>
                    <div class="dob-container">
                        <select id="dob-day" name="dob-day" required>
                            <option value="">Day</option>
                        </select>
                        <select id="dob-month" name="dob-month" required>
                            <option value="">Month</option>
                            <option value="1">January</option>
                            <option value="2">February</option>
                            <option value="3">March</option>
                            <option value="4">April</option>
                            <option value="5">May</option>
                            <option value="6">June</option>
                            <option value="7">July</option>
                            <option value="8">August</option>
                            <option value="9">September</option>
                            <option value="10">November</option>
                            <option value="11">October</option>
                            <option value="12">December</option>
                        </select>
                        <select id="dob-year" name="dob-year" required>
                            <option value="">Year</option>
                        </select>
                    </div>
                </div>

                <div class="form-group">
                    <label>Account's Type</label>
                    <div class="account-type-container">
                        <label class="radio-label">
                            <input type="radio" name="account-type" value="user" checked> User
                        </label>
                        <label class="radio-label">
                            <input type="radio" name="account-type" value="artist"> Artist
                        </label>
                    </div>
                </div>
                <div class="form-group terms">
                    <input type="checkbox" id="terms" name="terms" required>
                    <label for="terms">I agree to the Terms of Use and Privacy Policy</label>
                </div>
                <button type="submit" class="submit-btn">Create</button>
            </form>
        </div>
    </div>

    <div id="signin-modal" class="modal-login">
        <div class="modal-login-content">
            <span class="close-modal">&times;</span>
            <h2>Sign In</h2>
            <form id="signin-form">
                <div class="form-group">
                    <label for="signin-username">Account Name</label>
                    <input type="text" id="signin-username" name="username" class="required-field" placeholder="Enter your accountname" >
                    <span class="error-message" id="signin-username-error"></span>
                </div>
                
                <div class="form-group">
                    <label for="signin-password">Password</label>
                    <div class="password-wrapper">
                        <input type="password" id="signin-password" name="password" class="required-field" placeholder="Enter your password" >
                        <span class="error-message" id="signin-password-error"></span>
                    </div>
                </div>
                
                <div class="form-group remember-me">
                    <input type="checkbox" id="remember-me" name="remember-me">
                    <label for="remember-me">Remember me</label>
                </div>
                
                <button type="submit" class="submit-btn">Sign In</button>
            </form>
            
            <div class="signup-prompt">
                <span>Don't have an account?</span>
                <a href="#" class="create-account-link">Create account</a>
            </div>
            
            <div class="forgot-password">
                <a href="#" class="forgot-password-link">Forgot your password?</a>
            </div>
        </div>
    </div>
    <script src="scripts/imageSlider.js"></script>
    <script src="scripts/signUp.js"></script>
    <script src="scripts/signIn.js"></script>
    <script src="scripts/spa.js"></script>
</body>
</html>