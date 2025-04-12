<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Discover the top streamed music and songs online on Hatebreed </title>
    <link rel="stylesheet" href="../assets/css/home.css">
    <script defer src="../scripts/audio-player.js"></script>
    <link rel="stylesheet" href="styles.css?v=1.1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
</head>
<body>
    <div class="navbar">
        <div class="logo">
            <img src="../assets/images/logo2.png" alt="Hatebreed: Stream and listen to music online" class="hero-logo">
        </div>
        <a href="#" class="nav-item">Home</a>
        <a href="#" class="nav-item">Library</a>
        <div class="search-container">
            <div class="search-wrapper">
                <input type="text" class="search-bar" placeholder="Search for artists, bands, tracks, podcasts">
                <i class="fas fa-search search-icon"></i>
            </div>
        </div>
        
        <div class="auth-buttons">
            <a href="#" class="sign-in">Sign in</a>
            <a href="#" class="create-account">Create account</a>
        </div>
        
        <a href="#" class="upload-button">Upload</a>
        
        <div class="more-menu">
            <i class="fas fa-ellipsis-h"></i>
        </div>
    </div>
    
    <div class="main-container">
        <div class="content-area">
            <!-- More of what you like section -->
            <section class="recommendations">
                <h3 class="section-title">More of what you like</h3>
                <div class="tracks-container">
                    <!-- <button class="nav-arrow prev"><i class="fas fa-chevron-left"></i></button> -->
                    <div class="track-cards-wrapper">
                        <!-- Track cards -->
                        <div class="track-card">
                            <div class="track-artwork">
                                <img src="../assets/images/poster1.jfif" alt="Ai Cũng Phải Bắt Đầu Từ Đâu Đó">
            
                                <!-- Play button in the center -->
                                <div class="track-play-pause">
                                    <i class="fas fa-play"></i>
                                </div>
            
                                <!-- Bottom controls: heart icon and three dots menu -->
                                <div class="track-controls">
                                    <div class="love-button">
                                        <i class="fas fa-heart"></i>
                                    </div>
                                    <div class="more-options">
                                        <i class="fas fa-ellipsis-h"></i>
                                    </div>
                                </div>
            
                                <!-- Related tag remains as is -->
                                <div class="related-tag">RELATED TRACKS</div>
                            </div>
                            <div class="track-info">
                                <h3 class="track-title">NOLOVENOLIFE</h3>
                                <p class="track-artist">HIEUTHUHAI</p>
                            </div>
                        </div>
                    </div>
                    <button class="nav-arrow next"><i class="fas fa-chevron-right"></i></button>
                </div>
            </section>
        </div>
    </div>

    <div class="music-player">
        <div class="player-controls">
            <button class="control-btn skip-back"><i class="fas fa-step-backward"></i></button>
            <button class="control-btn play-pause"><i class="fas fa-play"></i></button>
            <button class="control-btn skip-forward"><i class="fas fa-step-forward"></i></button>
            <button class="control-btn repeat"><i class="fas fa-redo"></i></button>

            <span class="current-time"></span>
            <div class="progress-bar">
                <input type="range" min="0" max="100" value="0" class="seek-bar">
            </div>
            <span class="total-time"></span>

            <div class="volume-container">
                <button class="control-btn volume"><i class="fas fa-volume-up"></i></button>
                <div class="volume-slider">
                    <div class="volume-bar">
                        <div class="volume-level" style="height: 100%;"></div>
                    </div>
                </div>
            </div>
            
            <div class="song-info">
                <img src="" alt="Track cover">
                <div class="song-details">
                    <span class="song-title"></span>
                    <span class="song-artist"></span>
                </div>
            </div>
            
            <div class="song-actions">
                <button class="song-action-btn like"><i class="fas fa-heart"></i></button>
                <button class="song-action-btn playlist"><i class="fas fa-user-plus"></i></button>
                <button class="song-action-btn more-options"><i class="fas fa-stream"></i></button>
            </div>
        </div>
    </div>
</body>
</html>