<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Hatebreed: Stream and listen to music online</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <script defer src="scripts/image-slider.js"></script>
</head>
<body>
    <section class="hero">
        <div class="hero-content">
            <div class="logo-container">
                <img src="assets/images/logo2.png" alt="Hatebreed: Stream and listen to music online" class="hero-logo">
            </div>
            <div class="auth-buttons">
                <button class="sign-in">Sign in</button>
                <button class="create-account">Create account</button>
                <a href="#" class="for-artists">For Artists</a>
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
                <input type="text" placeholder="Search for artists, bands, tracks, podcasts">
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
                <img src="assets/images/creator.jfif" alt="Hatebreed Creator">
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
                    <option selected>English (US)</option>
                </select>
            </div>
        </div>
    </footer>

    <div class="music-player">
        <div class="player-controls">
            <button class="control-btn"><i class="fas fa-step-backward"></i></button>
            <button class="control-btn play"><i class="fas fa-play"></i></button>
            <button class="control-btn"><i class="fas fa-step-forward"></i></button>
            <button class="control-btn"><i class="fas fa-random"></i></button>
            <button class="control-btn"><i class="fas fa-redo"></i></button>
            <span class="time">0:00</span>
            <div class="progress-bar">
                <div class="progress"></div>
            </div>
            <span class="time">3:30</span>
            <button class="control-btn"><i class="fas fa-volume-up"></i></button>
            <div class="track-info">
                <img src="assets/images/trackcover.jpg" alt="Track cover">
                <div class="track-details">
                    <span class="track-title">Nhu Nao Cung Duoc</span>
                    <span class="track-artist">Wrxdie</span>
                </div>
            </div>
            <div class="track-actions">
                <button class="track-action-btn"><i class="fas fa-heart"></i></button>
                <button class="track-action-btn"><i class="fas fa-list"></i></button>
            </div>
        </div>
    </div>
</body>
</html>