document.addEventListener("DOMContentLoaded", () => {
    // Dummy playlist (sau này bạn có thể load từ API hoặc server)
    const tracks = [
        {
            title: "NOLOVENOLIFE",
            artist: "HIEUTHUHAI",
            src: "../assets/music/nolovenolife.mp3",
            cover: "../assets/images/poster1.jfif"
        },
        // Thêm nhiều bài nếu muốn
    ];

    let currentTrackIndex = 0;
    let previousVolume = 0.7; // Store previous volume for mute/unmute
    let isVolumeSliderVisible = false;
    let volumeHoverTimeout;
    let isDraggingVolume = false;
    
    const audio = new Audio();
    const playPauseBtn = document.querySelector(".play-pause");
    const playPauseIcon = playPauseBtn.querySelector("i");
    const skipNextBtn = document.querySelector(".skip-forward");
    const skipBackBtn = document.querySelector(".skip-back");
    const repeatBtn = document.querySelector(".repeat");

    const seekBar = document.querySelector(".seek-bar");
    const currentTimeDisplay = document.querySelector(".current-time");
    const totalTimeDisplay = document.querySelector(".total-time");

    const volumeBtn = document.querySelector(".volume");
    const volumeIcon = volumeBtn.querySelector("i");
    const volumeSlider = document.querySelector(".volume-slider");
    const volumeBar = document.querySelector(".volume-bar");
    const volumeLevel = document.querySelector(".volume-level");
    const volumeContainer = document.querySelector(".volume-container");

    const songTitle = document.querySelector(".song-title");
    const songArtist = document.querySelector(".song-artist");
    const songCover = document.querySelector(".song-info img");

    const trackCards = document.querySelectorAll(".track-card");

    // ======== Load Track ========
    function loadTrack(index) {
        const track = tracks[index];
        audio.src = track.src;
        songTitle.textContent = track.title;
        songArtist.textContent = track.artist;
        songCover.src = track.cover;
        seekBar.value = 0;
        updateSeekBarDisplay(0); 
        currentTimeDisplay.textContent = "0:00";
        totalTimeDisplay.textContent = "0:00";
    }

    // ======== Utility function to update track card icons ========
    function updateAllTrackCardIcons() {
        // Cập nhật tất cả các track card icons dựa trên trạng thái hiện tại
        trackCards.forEach((card, index) => {
            const playBtn = card.querySelector(".track-play-pause");
            const playIcon = playBtn.querySelector("i");
            
            if (index === currentTrackIndex) {
                // Nếu là track hiện tại, đồng bộ với trạng thái của audio
                if (audio.paused) {
                    playIcon.classList.replace("fa-pause", "fa-play");
                } else {
                    playIcon.classList.replace("fa-play", "fa-pause");
                }
            } else {
                // Nếu không phải track hiện tại, chắc chắn là icon play
                if (playIcon.classList.contains("fa-pause")) {
                    playIcon.classList.replace("fa-pause", "fa-play");
                }
            }
        });
    }

    // ======== Play / Pause ========
    function togglePlayPause() {
        if (audio.paused) {
            audio.play();
            playPauseIcon.classList.replace("fa-play", "fa-pause");
        } else {
            audio.pause();
            playPauseIcon.classList.replace("fa-pause", "fa-play");
        }
        
        // Cập nhật icon cho track-card tương ứng
        updateAllTrackCardIcons();
    }

    playPauseBtn.addEventListener("click", togglePlayPause);

    // ======== Repeat Button ========
    if (repeatBtn) {
        repeatBtn.addEventListener("click", () => {
            audio.currentTime = 0;
            updateSeekBarDisplay(0);
            currentTimeDisplay.textContent = "0:00";
            
            // If the audio was playing, keep it playing
            if (!audio.paused) {
                audio.play();
            }
        });
    }

    // ======== Track Click =========
    trackCards.forEach((card, index) => {
        const playBtn = card.querySelector(".track-play-pause");
        const playIcon = playBtn.querySelector("i");
    
        playBtn.addEventListener("click", () => {
            // Nếu nhấn vào bài hiện tại
            if (currentTrackIndex === index) {
                if (audio.paused) {
                    audio.play();
                    playIcon.classList.replace("fa-play", "fa-pause");
                    playPauseIcon.classList.replace("fa-play", "fa-pause");
                } else {
                    audio.pause();
                    playIcon.classList.replace("fa-pause", "fa-play");
                    playPauseIcon.classList.replace("fa-pause", "fa-play");
                }
            } else {
                // Đổi icon play về lại cho tất cả các track khác
                trackCards.forEach((otherCard, otherIndex) => {
                    const otherPlayBtn = otherCard.querySelector(".track-play-pause");
                    const otherIcon = otherPlayBtn.querySelector("i");
                    if (otherIndex !== index && otherIcon.classList.contains("fa-pause")) {
                        otherIcon.classList.replace("fa-pause", "fa-play");
                    }
                });
    
                currentTrackIndex = index;
                loadTrack(index);
                audio.play();
    
                // Cập nhật icon cho track đang play
                playIcon.classList.replace("fa-play", "fa-pause");
                playPauseIcon.classList.replace("fa-play", "fa-pause");
            }
        });
    });

    // ======== Skip Buttons ========
    skipNextBtn.addEventListener("click", () => {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        loadTrack(currentTrackIndex);
        audio.play();
        playPauseIcon.classList.replace("fa-play", "fa-pause");
        updateAllTrackCardIcons();
    });

    skipBackBtn.addEventListener("click", () => {
        currentTrackIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
        loadTrack(currentTrackIndex);
        audio.play();
        playPauseIcon.classList.replace("fa-play", "fa-pause");
        updateAllTrackCardIcons();
    });

    // ======== Time Update ========
    audio.addEventListener("loadedmetadata", () => {
        seekBar.max = audio.duration;
        totalTimeDisplay.textContent = formatTime(audio.duration);
    });

    audio.addEventListener("timeupdate", () => {
        seekBar.value = audio.currentTime;
        updateSeekBarDisplay(audio.currentTime); // Update the progress bar display
        currentTimeDisplay.textContent = formatTime(audio.currentTime);
    });

    // Function to update the seek bar's visual appearance
    function updateSeekBarDisplay(currentTime) {
        if (audio.duration) {
            const progressPercentage = (currentTime / audio.duration) * 100;
            seekBar.style.setProperty('--value', `${progressPercentage}%`);
        } else {
            seekBar.style.setProperty('--value', '0%');
        }
    }

    seekBar.addEventListener("input", () => {
        audio.currentTime = seekBar.value;
        updateSeekBarDisplay(audio.currentTime);
    });

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }

    // ======== Volume Control with Drag Support ========
    // Show volume slider on hover
    volumeContainer.addEventListener("mouseenter", () => {
        clearTimeout(volumeHoverTimeout);
        volumeSlider.style.display = "flex";
        isVolumeSliderVisible = true;
    });
    
    // Special handling for mouseleave - we want a corridor effect
    volumeContainer.addEventListener("mouseleave", (e) => {
        // Check if mouse is moving up toward the volume slider
        const rect = volumeContainer.getBoundingClientRect();
        const movingUp = e.clientY < rect.top; // Moving upward
        const withinHorizontalBounds = e.clientX >= rect.left && e.clientX <= rect.right;
        
        if (movingUp && withinHorizontalBounds) {
            // User is moving directly upward toward the slider - don't hide
            return;
        }
        
        // Start the hide timer
        volumeHoverTimeout = setTimeout(() => {
            if (!isVolumeSliderVisible) {
                volumeSlider.style.display = "none";
            }
        }, 300); // Small delay for better UX
    });
    
    // Handle mouse enter on the volume slider itself
    volumeSlider.addEventListener("mouseenter", () => {
        clearTimeout(volumeHoverTimeout);
        isVolumeSliderVisible = true;
    });
    
    // Handle mouse leave on the volume slider
    volumeSlider.addEventListener("mouseleave", () => {
        isVolumeSliderVisible = false;
        volumeHoverTimeout = setTimeout(() => {
            volumeSlider.style.display = "none";
        }, 300); // Small delay for better UX
    });
    
    // Function to set volume based on position in volume bar
    function setVolumeFromPosition(clientY) {
        const rect = volumeBar.getBoundingClientRect();
        const height = rect.height;
        const offsetY = clientY - rect.top;
        
        // Inverted mapping: bottom = 0% volume, top = 100% volume
        const volume = Math.max(0, Math.min(1, 1 - (offsetY / height)));
        
        audio.volume = volume;
        previousVolume = volume;
        
        // Set the height of volume level (fill from bottom)
        volumeLevel.style.height = `${volume * 100}%`;
        volumeLevel.style.bottom = "0";
        volumeLevel.style.top = "auto";
        
        // Update icon
        if (volumeIcon) {
            if (volume > 0) {
                volumeIcon.classList.replace("fa-volume-mute", "fa-volume-up");
            } else {
                volumeIcon.classList.replace("fa-volume-up", "fa-volume-mute");
            }
        }
    }
    
    // Volume bar click handler
    volumeBar.addEventListener("click", (e) => {
        setVolumeFromPosition(e.clientY);
    });
    
    // Add mouse down event listener for drag start
    volumeBar.addEventListener("mousedown", (e) => {
        isDraggingVolume = true;
        setVolumeFromPosition(e.clientY);
        
        // Prevent text selection during drag
        e.preventDefault();
    });
    
    // Add mouse move event listener for dragging
    document.addEventListener("mousemove", (e) => {
        if (isDraggingVolume) {
            setVolumeFromPosition(e.clientY);
        }
    });
    
    // Add mouse up event listener to stop dragging
    document.addEventListener("mouseup", () => {
        isDraggingVolume = false;
    });
    
    // Mute/unmute button
    volumeBtn.addEventListener("click", () => {
        if (audio.volume > 0) {
            // Store current volume and mute
            previousVolume = audio.volume;
            audio.volume = 0;
            volumeLevel.style.height = "0%";
            if (volumeIcon) volumeIcon.classList.replace("fa-volume-up", "fa-volume-mute");
        } else {
            // Restore previous volume
            audio.volume = previousVolume;
            volumeLevel.style.height = `${previousVolume * 100}%`;
            if (volumeIcon) volumeIcon.classList.replace("fa-volume-mute", "fa-volume-up");
        }
    });

    // Auto-play next track
    audio.addEventListener("ended", () => {
        currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
        loadTrack(currentTrackIndex);
        audio.play();
        playPauseIcon.classList.replace("fa-play", "fa-pause");
        updateAllTrackCardIcons();
    });
    
    // Bắt sự kiện khi audio paused hoặc played
    audio.addEventListener("pause", () => {
        updateAllTrackCardIcons();
    });
    
    audio.addEventListener("play", () => {
        updateAllTrackCardIcons();
    });

    // Initial load
    loadTrack(currentTrackIndex);
    
    // Set initial volume and update volume display
    audio.volume = 1; // Default volume at 100%
    previousVolume = 1;
    volumeLevel.style.height = "100%";
    volumeLevel.style.bottom = "0";
    volumeLevel.style.top = "auto";
    
    // Ensure track card icons are in correct state initially
    updateAllTrackCardIcons();
});