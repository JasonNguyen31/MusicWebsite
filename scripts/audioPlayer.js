// Tạo namespace cho trình phát nhạc để có thể truy cập từ bất kỳ trang nào
window.audioPlayerActions = {};

document.addEventListener("DOMContentLoaded", () => {
    // Constants and variables
    const audio = new Audio();
    let currentTrackIndex = null;
    let currentTrackId = null;
    let previousVolume = 0.7;
    let isVolumeSliderVisible = false;
    let volumeHoverTimeout;
    let isDraggingVolume = false;
    
    // Biến để theo dõi trạng thái hiện tại của playlist
    let tracks = [];
    
    // DOM Elements
    const playerControls = document.querySelector(".player-controls");
    const playPauseBtn = document.querySelector(".play-pause");
    const playPauseIcon = playPauseBtn ? playPauseBtn.querySelector("i") : null;
    const skipNextBtn = document.querySelector(".skip-forward");
    const skipBackBtn = document.querySelector(".skip-back");
    const repeatBtn = document.querySelector(".repeat");

    const seekBar = document.querySelector(".seek-bar");
    const currentTimeDisplay = document.querySelector(".current-time");
    const totalTimeDisplay = document.querySelector(".total-time");

    const volumeBtn = document.querySelector(".volume");
    const volumeIcon = volumeBtn ? volumeBtn.querySelector("i") : null;
    const volumeSlider = document.querySelector(".volume-slider");
    const volumeBar = document.querySelector(".volume-bar");
    const volumeLevel = document.querySelector(".volume-level");
    const volumeContainer = document.querySelector(".volume-container");

    const songTitle = document.querySelector(".song-title");
    const songArtist = document.querySelector(".song-artist");
    const songCover = document.querySelector(".song-info img");
    
    // ======== Khởi tạo tracks từ DOM ========
    function initTracksFromDOM() {
        // Reset mảng tracks
        tracks = [];
        
        // Hỗ trợ cả hai cấu trúc HTML: track-item (profile.php) và track-card (home.php)
        // Tìm kiếm track items (từ profile.php)
        const trackItems = document.querySelectorAll(".track-item");
        
        trackItems.forEach((trackItem) => {
            const trackId = trackItem.getAttribute("data-track-id");
            const trackName = trackItem.querySelector(".track-title").textContent;
            const artistName = trackItem.querySelector(".track-artist").textContent;
            const fileUrl = trackItem.querySelector(".track-play-pause").getAttribute("data-file");
            const imageElement = trackItem.querySelector(".track-image img");
            const imageUrl = imageElement ? imageElement.getAttribute("src") : "../assets/images/defaults.jpg";
            
            tracks.push({
                id: trackId,
                title: trackName,
                artist: artistName,
                src: fileUrl,
                cover: imageUrl
            });
        });
        
        // Tìm kiếm track cards (từ home.php)
        const trackCards = document.querySelectorAll(".track-card");
        
        trackCards.forEach((trackCard) => {
            const trackId = trackCard.getAttribute("data-track-id");
            // Kiểm tra xem track này đã được thêm vào chưa
            if (tracks.some(track => track.id === trackId)) return;
            
            const trackName = trackCard.querySelector(".track-title").textContent;
            const artistName = trackCard.querySelector(".track-artist").textContent;
            const fileUrl = trackCard.querySelector(".track-play-pause").getAttribute("data-file");
            const imageElement = trackCard.querySelector("img");
            const imageUrl = imageElement ? imageElement.getAttribute("src") : "../assets/images/defaults.jpg";
            
            tracks.push({
                id: trackId,
                title: trackName,
                artist: artistName,
                src: fileUrl,
                cover: imageUrl
            });
        });
        
        console.log("Loaded tracks:", tracks);
        
        // Khởi tạo sự kiện cho các nút play/pause
        initTrackPlayButtons();
    }
    
    // Khởi tạo sự kiện cho các nút play/pause
    function initTrackPlayButtons() {
        // Hỗ trợ cả hai loại container
        const allTrackPlayBtns = document.querySelectorAll(".track-play-pause");
        
        allTrackPlayBtns.forEach((btn) => {
            btn.addEventListener("click", (event) => {
                event.preventDefault();
                event.stopPropagation();
                
                // Tìm container cha (có thể là track-item hoặc track-card)
                let trackContainer = btn.closest(".track-item");
                if (!trackContainer) {
                    trackContainer = btn.closest(".track-card");
                }
                
                if (trackContainer) {
                    const trackId = trackContainer.getAttribute("data-track-id");
                    playTrackById(trackId);
                } else {
                    console.error("Could not find track container");
                }
            });
        });
    }
    
    // ======== Save Current Track to LocalStorage ========
    function saveCurrentTrackToLocalStorage() {
        if (currentTrackId !== null) {
            const trackData = {
                id: currentTrackId,
                index: currentTrackIndex,
                currentTime: audio.currentTime,
                isPlaying: !audio.paused
            };
            localStorage.setItem('currentTrack', JSON.stringify(trackData));
        }
    }
    
    // ======== Load Track ========
    function loadTrack(index) {
        if (index < 0 || index >= tracks.length) return;
        
        const track = tracks[index];
        currentTrackIndex = index;
        currentTrackId = track.id;
        
        // Set audio source, ensuring it has the correct path format
        if (track.src.startsWith('/') || track.src.includes('://')) {
            // Absolute path or URL, use as is
            audio.src = track.src;
        } else {
            // Relative path, prepend with base path
            audio.src = "/WebDev/finalproject/uploads/tracks/" + track.src.split('/').pop();
        }
        
        if (songTitle) songTitle.textContent = track.title;
        if (songArtist) songArtist.textContent = track.artist;
        if (songCover) songCover.src = track.cover;
        
        if (seekBar) {
            seekBar.value = 0;
            updateSeekBarDisplay(0);
        }
        
        if (currentTimeDisplay) {
            currentTimeDisplay.textContent = "0:00";
        }
        
        // Save current track to localStorage whenever a new track is loaded
        saveCurrentTrackToLocalStorage();
        
        // Load metadata for the audio file
        audio.addEventListener("loadedmetadata", () => {
            if (totalTimeDisplay) totalTimeDisplay.textContent = formatTime(audio.duration);
            if (seekBar) seekBar.max = audio.duration;
        });
        
        // Display player if hidden
        if (playerControls) playerControls.style.display = "flex";
        
        // Thiết lập dữ liệu track ID vào music player nếu có
        const musicPlayer = document.querySelector('.music-player');
        if (musicPlayer) {
            musicPlayer.dataset.currentTrackId = track.id;
        }
        
        // Kích hoạt sự kiện trackChanged để các phần khác biết track đã thay đổi
        const trackChangedEvent = new CustomEvent('trackChanged', {
            detail: {
                trackId: track.id,
                trackInfo: track
            },
            bubbles: true
        });
        document.dispatchEvent(trackChangedEvent);
    }
    
    // ======== Update all track icons ========
    function updateAllTrackIcons() {
        // Cập nhật icons cho cả track-item và track-card
        const allTrackPlayBtns = document.querySelectorAll(".track-play-pause");
        
        allTrackPlayBtns.forEach((btn) => {
            const icon = btn.querySelector("i");
            if (!icon) return;
            
            // Tìm container cha (có thể là track-item hoặc track-card)
            let trackContainer = btn.closest(".track-item");
            if (!trackContainer) {
                trackContainer = btn.closest(".track-card");
            }
            
            if (!trackContainer) return;
            
            const trackId = trackContainer.getAttribute("data-track-id");
            
            if (trackId === currentTrackId && !audio.paused) {
                icon.classList.replace("fa-play", "fa-pause");
            } else {
                icon.classList.replace("fa-pause", "fa-play");
            }
        });
    }

    // ======== Play / Pause ========
    function togglePlayPause() {
        if (audio.paused) {
            audio.play()
                .then(() => {
                    if (playPauseIcon) playPauseIcon.classList.replace("fa-play", "fa-pause");
                    updateAllTrackIcons();
                    saveCurrentTrackToLocalStorage();
                })
                .catch(error => {
                    console.error("Error playing audio:", error);
                });
        } else {
            audio.pause();
            if (playPauseIcon) playPauseIcon.classList.replace("fa-pause", "fa-play");
            updateAllTrackIcons();
            saveCurrentTrackToLocalStorage();
        }
    }
    
    // ======== Play Track by ID ========
    function playTrackById(trackId) {
        const trackIndex = findTrackIndexById(trackId);
        
        // Check if track exists
        if (trackIndex === -1) {
            console.error("Track not found:", trackId);
            return;
        }
        
        // Ghi lại lịch sử phát nhạc - đặt ở đây sau khi đã kiểm tra track tồn tại
        fetch('../api/recordPlayHistory.php?track_id=' + trackId)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log("Play history recorded:", data);
        })
        .catch(error => {
            console.error("Error recording play history:", error);
        });

        // Check if clicking on currently playing track
        if (trackId === currentTrackId) {
            // Toggle play/pause for current track
            togglePlayPause();
            return;
        }
        
        // Dừng bài hát hiện tại trước khi tải bài mới
        audio.pause();
        
        // Thêm độ trễ nhỏ trước khi tải bài mới
        setTimeout(() => {
            // Load new track if different from current
            loadTrack(trackIndex);
            
            // Thêm độ trễ trước khi phát để tránh lỗi AbortError
            setTimeout(() => {
                // Play the track
                audio.play()
                    .then(() => {
                        if (playPauseIcon) playPauseIcon.classList.replace("fa-play", "fa-pause");
                        updateAllTrackIcons();
                    })
                    .catch(error => {
                        console.error("Error playing audio:", error);
                    });
            }, 100);
        }, 100);
    }
    
    // ======== Find track index by id ========
    function findTrackIndexById(trackId) {
        return tracks.findIndex(track => track.id === trackId);
    }
    
    // ======== Format time (seconds -> mm:ss) ========
    function formatTime(seconds) {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    }
    
    // ======== Update seek bar display ========
    function updateSeekBarDisplay(currentTime) {
        if (!seekBar) return;
        
        if (audio.duration) {
            const progressPercentage = (currentTime / audio.duration) * 100;
            seekBar.style.setProperty('--value', `${progressPercentage}%`);
        } else {
            seekBar.style.setProperty('--value', '0%');
        }
    }
    
    // ======== Restore previous track from localStorage ========
    function restorePreviousTrack() {
        const savedTrack = localStorage.getItem('currentTrack');
        if (savedTrack) {
            try {
                const trackData = JSON.parse(savedTrack);
                const trackIndex = findTrackIndexById(trackData.id);
                
                if (trackIndex !== -1) {
                    loadTrack(trackIndex);
                    
                    // Set the previous playback position
                    audio.currentTime = trackData.currentTime || 0;
                    
                    // If the track was playing, resume playback
                    if (trackData.isPlaying) {
                        audio.play()
                            .then(() => {
                                if (playPauseIcon) playPauseIcon.classList.replace("fa-play", "fa-pause");
                                updateAllTrackIcons();
                            })
                            .catch(error => {
                                console.error("Error playing audio:", error);
                            });
                    }
                }
            } catch (error) {
                console.error("Error restoring previous track:", error);
            }
        }
    }
    
    // ======== Event Listeners ========
    // Player play/pause button
    if (playPauseBtn) {
        playPauseBtn.addEventListener("click", togglePlayPause);
    }
    
    // Time update
    audio.addEventListener("timeupdate", () => {
        if (seekBar) seekBar.value = audio.currentTime;
        updateSeekBarDisplay(audio.currentTime);
        if (currentTimeDisplay) currentTimeDisplay.textContent = formatTime(audio.currentTime);
        
        // Save current position periodically (every 5 seconds)
        if (Math.floor(audio.currentTime) % 5 === 0) {
            saveCurrentTrackToLocalStorage();
        }
    });
    
    // Seek bar input
    if (seekBar) {
        seekBar.addEventListener("input", () => {
            audio.currentTime = seekBar.value;
            updateSeekBarDisplay(audio.currentTime);
        });
    }
    
    // Skip next button
    if (skipNextBtn) {
        skipNextBtn.addEventListener("click", () => {
            if (tracks.length === 0) return;
            
            const nextIndex = (currentTrackIndex + 1) % tracks.length;
            loadTrack(nextIndex);
            audio.play()
                .then(() => {
                    if (playPauseIcon) playPauseIcon.classList.replace("fa-play", "fa-pause");
                    updateAllTrackIcons();
                })
                .catch(error => {
                    console.error("Error playing audio:", error);
                });
        });
    }
    
    // Skip back button
    if (skipBackBtn) {
        skipBackBtn.addEventListener("click", () => {
            if (tracks.length === 0) return;
            
            const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
            loadTrack(prevIndex);
            audio.play()
                .then(() => {
                    if (playPauseIcon) playPauseIcon.classList.replace("fa-play", "fa-pause");
                    updateAllTrackIcons();
                })
                .catch(error => {
                    console.error("Error playing audio:", error);
                });
        });
    }
    
    // Repeat button
    if (repeatBtn) {
        repeatBtn.addEventListener("click", () => {
            audio.currentTime = 0;
            updateSeekBarDisplay(0);
            if (currentTimeDisplay) currentTimeDisplay.textContent = "0:00";
            
            if (!audio.paused) {
                audio.play().catch(error => {
                    console.error("Error playing audio:", error);
                });
            }
        });
    }
    
    // Track ended - play next track
    audio.addEventListener("ended", () => {
        if (tracks.length === 0) return;
        
        const nextIndex = (currentTrackIndex + 1) % tracks.length;
        loadTrack(nextIndex);
        audio.play()
            .then(() => {
                if (playPauseIcon) playPauseIcon.classList.replace("fa-play", "fa-pause");
                updateAllTrackIcons();
            })
            .catch(error => {
                console.error("Error playing audio:", error);
            });
    });
    
    // Fix for metadata loading
    audio.addEventListener("loadeddata", () => {
        if (totalTimeDisplay) totalTimeDisplay.textContent = formatTime(audio.duration);
        if (seekBar) seekBar.max = audio.duration;
    });
    
    // Handle window unload/reload to save state
    window.addEventListener("beforeunload", () => {
        saveCurrentTrackToLocalStorage();
    });
    
    // ======== Volume Control ========
    // Show volume slider on hover
    if (volumeContainer) {
        volumeContainer.addEventListener("mouseenter", () => {
            clearTimeout(volumeHoverTimeout);
            if (volumeSlider) volumeSlider.style.display = "flex";
            isVolumeSliderVisible = true;
        });
        
        // Hide volume slider on leave with delay
        volumeContainer.addEventListener("mouseleave", (e) => {
            // Check if mouse is moving up toward the volume slider
            const rect = volumeContainer.getBoundingClientRect();
            const movingUp = e.clientY < rect.top;
            const withinHorizontalBounds = e.clientX >= rect.left && e.clientX <= rect.right;
            
            if (movingUp && withinHorizontalBounds) {
                return;
            }
            
            volumeHoverTimeout = setTimeout(() => {
                if (!isVolumeSliderVisible && volumeSlider) {
                    volumeSlider.style.display = "none";
                }
            }, 300);
        });
    }
    
    // Handle volume slider mouseenter
    if (volumeSlider) {
        volumeSlider.addEventListener("mouseenter", () => {
            clearTimeout(volumeHoverTimeout);
            isVolumeSliderVisible = true;
        });
        
        // Handle volume slider mouseleave
        volumeSlider.addEventListener("mouseleave", () => {
            isVolumeSliderVisible = false;
            volumeHoverTimeout = setTimeout(() => {
                if (volumeSlider) volumeSlider.style.display = "none";
            }, 300);
        });
    }
    
    // Function to set volume based on position
    function setVolumeFromPosition(clientY) {
        if (!volumeBar || !volumeLevel) return;
        
        const rect = volumeBar.getBoundingClientRect();
        const height = rect.height;
        const offsetY = clientY - rect.top;
        
        // Inverted mapping: bottom = 0% volume, top = 100% volume
        const volume = Math.max(0, Math.min(1, 1 - (offsetY / height)));
        
        audio.volume = volume;
        previousVolume = volume;
        
        // Lưu âm lượng vào localStorage
        localStorage.setItem('audioPlayerVolume', volume.toString());
        
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
    if (volumeBar) {
        volumeBar.addEventListener("click", (e) => {
            setVolumeFromPosition(e.clientY);
        });
        
        // Volume bar mouse down for dragging
        volumeBar.addEventListener("mousedown", (e) => {
            isDraggingVolume = true;
            setVolumeFromPosition(e.clientY);
            e.preventDefault();
        });
    }
    
    // Mouse move for volume dragging
    document.addEventListener("mousemove", (e) => {
        if (isDraggingVolume) {
            setVolumeFromPosition(e.clientY);
        }
    });
    
    // Mouse up to stop volume dragging
    document.addEventListener("mouseup", () => {
        isDraggingVolume = false;
    });
    
    // Mute/unmute button
    if (volumeBtn) {
        volumeBtn.addEventListener("click", () => {
            if (audio.volume > 0) {
                previousVolume = audio.volume;
                audio.volume = 0;
                if (volumeLevel) volumeLevel.style.height = "0%";
                if (volumeIcon) volumeIcon.classList.replace("fa-volume-up", "fa-volume-mute");
            } else {
                audio.volume = previousVolume;
                if (volumeLevel) volumeLevel.style.height = `${previousVolume * 100}%`;
                if (volumeIcon) volumeIcon.classList.replace("fa-volume-mute", "fa-volume-up");
            }
        });
    }
    
    // Set initial volume from localStorage hoặc mặc định
    const savedVolume = localStorage.getItem('audioPlayerVolume');
    if (savedVolume !== null) {
        audio.volume = parseFloat(savedVolume);
        previousVolume = parseFloat(savedVolume);
        if (volumeLevel) {
            volumeLevel.style.height = `${parseFloat(savedVolume) * 100}%`;
            volumeLevel.style.bottom = "0";
            volumeLevel.style.top = "auto";
        }
    } else {
        audio.volume = 0.7;
        previousVolume = 0.7;
        if (volumeLevel) {
            volumeLevel.style.height = "70%";
            volumeLevel.style.bottom = "0";
            volumeLevel.style.top = "auto";
        }
        localStorage.setItem('audioPlayerVolume', '0.7');
    }
    
    // Function to update track tags/genres display
    function updateTrackGenreTags() {
        const genreContainers = document.querySelectorAll("#genre-container");
        
        genreContainers.forEach(container => {
            const tags = container.getAttribute("data-tags");
            if (tags) {
                const tagArray = tags.split(",");
                container.innerHTML = "";
                
                tagArray.forEach(tag => {
                    if (tag.trim()) {
                        const span = document.createElement("span");
                        span.className = "genre-tag";
                        span.textContent = tag.trim();
                        container.appendChild(span);
                    }
                });
            }
        });
    }
    
    // ======== SPA Support Functions ========
    // Khởi tạo lại trình phát nhạc khi trang được tải trong môi trường SPA
    function reinitializePlayer() {
        // Khởi tạo tracks từ các phần tử trong DOM hiện tại
        initTracksFromDOM();
        
        // Khôi phục trình phát từ localStorage
        restorePreviousTrack();
        
        // Cập nhật các tag thể loại
        updateTrackGenreTags();
    }
    
    // Expose API functions cho SPA
    window.audioPlayerActions = {
        playTrack: function(trackId) {
            playTrackById(trackId);
        },
        togglePlayPause: function() {
            togglePlayPause();
        },
        reinitialize: function() {
            reinitializePlayer();
        },
        getCurrentTrack: function() {
            return currentTrackId;
        },
        updateTracks: function() {
            initTracksFromDOM();
        }
    };
    
    // Khởi tạo ban đầu
    initTracksFromDOM();
    updateTrackGenreTags();
    restorePreviousTrack();
});

document.addEventListener('DOMContentLoaded', function() {
    // Khởi tạo tất cả carousel trên trang
    const carousels = document.querySelectorAll('.tracks-container');
    
    carousels.forEach(carousel => {
        initializeCarousel(carousel);
    });
    
    function initializeCarousel(carousel) {
        // Lấy các phần tử cần thiết
        const wrapper = carousel.querySelector('.track-cards-wrapper');
        const cards = carousel.querySelectorAll('.track-card');
        const prevBtn = carousel.querySelector('.nav-arrow.prev');
        const nextBtn = carousel.querySelector('.nav-arrow.next');
        
        // Cấu hình
        const visibleCards = 4; // Số card hiển thị đầy đủ
        const totalCards = cards.length;
        const cardWidth = 180; // Chiều rộng của mỗi card (px)
        const cardGap = 15; // Khoảng cách giữa các card (px)
        let currentIndex = 0; // Vị trí hiện tại (card đầu tiên)
        
        // Ẩn nút prev ban đầu vì đang ở vị trí đầu tiên
        prevBtn.classList.add('hidden');
        
        // Ẩn nút next nếu không đủ card để scroll
        if (totalCards <= visibleCards) {
            nextBtn.classList.add('hidden');
        }
        
        // Hàm cập nhật vị trí của carousel
        function updateCarouselPosition() {
            const translateX = -currentIndex * (cardWidth + cardGap);
            wrapper.style.transform = `translateX(${translateX}px)`;
            
            // Kiểm tra và cập nhật trạng thái nút điều hướng
            updateNavigationButtons();
        }
        
        // Hàm cập nhật trạng thái nút điều hướng
        function updateNavigationButtons() {
            // Ẩn/hiện nút prev
            if (currentIndex === 0) {
                prevBtn.classList.add('hidden');
            } else {
                prevBtn.classList.remove('hidden');
            }
            
            // Ẩn/hiện nút next
            // Chỉ ẩn nút next khi card cuối cùng đã hiển thị hoàn toàn
            if (currentIndex >= totalCards - visibleCards) {
                nextBtn.classList.add('hidden');
            } else {
                nextBtn.classList.remove('hidden');
            }
        }
        
        // Thêm sự kiện click cho nút prev
        prevBtn.addEventListener('click', function() {
            if (currentIndex >= visibleCards) {
                currentIndex -= visibleCards;
            } else {
                currentIndex = 0;
            }
            updateCarouselPosition();
        });
        
        // Thêm sự kiện click cho nút next
        nextBtn.addEventListener('click', function() {
            if (currentIndex + visibleCards < totalCards) {
                currentIndex += visibleCards;
            } else {
                currentIndex = totalCards - visibleCards;
            }
            updateCarouselPosition();
        });
        
        // Khởi tạo ban đầu
        updateNavigationButtons();
    }
});

// document.addEventListener("DOMContentLoaded", () => {
//     // Constants and variables
//     const audio = new Audio();
//     let currentTrackIndex = null;
//     let currentTrackId = null;
//     let previousVolume = 0.7;
//     let isVolumeSliderVisible = false;
//     let volumeHoverTimeout;
//     let isDraggingVolume = false;
    
//     // DOM Elements
//     const playerControls = document.querySelector(".player-controls");
//     const playPauseBtn = document.querySelector(".play-pause");
//     const playPauseIcon = playPauseBtn.querySelector("i");
//     const skipNextBtn = document.querySelector(".skip-forward");
//     const skipBackBtn = document.querySelector(".skip-back");
//     const repeatBtn = document.querySelector(".repeat");

//     const seekBar = document.querySelector(".seek-bar");
//     const currentTimeDisplay = document.querySelector(".current-time");
//     const totalTimeDisplay = document.querySelector(".total-time");

//     const volumeBtn = document.querySelector(".volume");
//     const volumeIcon = volumeBtn.querySelector("i");
//     const volumeSlider = document.querySelector(".volume-slider");
//     const volumeBar = document.querySelector(".volume-bar");
//     const volumeLevel = document.querySelector(".volume-level");
//     const volumeContainer = document.querySelector(".volume-container");

//     const songTitle = document.querySelector(".song-title");
//     const songArtist = document.querySelector(".song-artist");
//     const songCover = document.querySelector(".song-info img");
    
//     // Get all track play buttons on the page
//     const trackPlayBtns = document.querySelectorAll(".track-play-pause");
    
//     // Create a tracks array from the DOM elements
//     let tracks = [];
//     const trackItems = document.querySelectorAll(".track-item");
    
//     // Generate tracks array from DOM
//     trackItems.forEach((trackItem) => {
//         const trackId = trackItem.getAttribute("data-track-id");
//         const trackName = trackItem.querySelector(".track-title").textContent;
//         const artistName = trackItem.querySelector(".track-artist").textContent;
//         const fileUrl = trackItem.querySelector(".track-play-pause").getAttribute("data-file");
//         const imageElement = trackItem.querySelector(".track-image img");
//         const imageUrl = imageElement ? imageElement.getAttribute("src") : "../assets/images/defaults.jpg";
        
//         tracks.push({
//             id: trackId,
//             title: trackName,
//             artist: artistName,
//             src: fileUrl,
//             cover: imageUrl
//         });
//     });
    
//     // ======== Save Current Track to LocalStorage ========
//     function saveCurrentTrackToLocalStorage() {
//         if (currentTrackId !== null) {
//             const trackData = {
//                 id: currentTrackId,
//                 index: currentTrackIndex,
//                 currentTime: audio.currentTime,
//                 isPlaying: !audio.paused
//             };
//             localStorage.setItem('currentTrack', JSON.stringify(trackData));
//         }
//     }
    
//     // ======== Load Track ========
//     function loadTrack(index) {
//         if (index < 0 || index >= tracks.length) return;
        
//         const track = tracks[index];
//         currentTrackIndex = index;
//         currentTrackId = track.id;
        
//         // Get file name from the full path
//         const fileName = track.src.split('/').pop();
//         audio.src = "/WebDev/finalproject/uploads/tracks/" + fileName;
        
//         songTitle.textContent = track.title;
//         songArtist.textContent = track.artist;
//         songCover.src = track.cover;
        
//         seekBar.value = 0;
//         updateSeekBarDisplay(0);
//         currentTimeDisplay.textContent = "0:00";
        
//         // Save current track to localStorage whenever a new track is loaded
//         saveCurrentTrackToLocalStorage();
        
//         // Load metadata for the audio file
//         audio.addEventListener("loadedmetadata", () => {
//             totalTimeDisplay.textContent = formatTime(audio.duration);
//             seekBar.max = audio.duration;
//         });
        
//         // Display player if hidden
//         playerControls.style.display = "flex";
//     }
    
//     // ======== Update all track icons ========
//     function updateAllTrackIcons() {
//         trackPlayBtns.forEach((btn) => {
//             const icon = btn.querySelector("i");
//             const trackItem = btn.closest(".track-item");
//             const trackId = trackItem.getAttribute("data-track-id");
            
//             if (trackId === currentTrackId && !audio.paused) {
//                 icon.classList.replace("fa-play", "fa-pause");
//             } else {
//                 icon.classList.replace("fa-pause", "fa-play");
//             }
//         });
//     }

//     // ======== Play / Pause ========
//     function togglePlayPause() {
//         if (audio.paused) {
//             audio.play()
//                 .then(() => {
//                     playPauseIcon.classList.replace("fa-play", "fa-pause");
//                     updateAllTrackIcons();
//                     saveCurrentTrackToLocalStorage();
//                 })
//                 .catch(error => {
//                     console.error("Error playing audio:", error);
//                 });
//         } else {
//             audio.pause();
//             playPauseIcon.classList.replace("fa-pause", "fa-play");
//             updateAllTrackIcons();
//             saveCurrentTrackToLocalStorage();
//         }
//     }
    
//     // ======== Find track index by id ========
//     function findTrackIndexById(trackId) {
//         return tracks.findIndex(track => track.id === trackId);
//     }
    
//     // ======== Format time (seconds -> mm:ss) ========
//     function formatTime(seconds) {
//         if (isNaN(seconds)) return "0:00";
//         const mins = Math.floor(seconds / 60);
//         const secs = Math.floor(seconds % 60).toString().padStart(2, '0');
//         return `${mins}:${secs}`;
//     }
    
//     // ======== Update seek bar display ========
//     function updateSeekBarDisplay(currentTime) {
//         if (audio.duration) {
//             const progressPercentage = (currentTime / audio.duration) * 100;
//             seekBar.style.setProperty('--value', `${progressPercentage}%`);
//         } else {
//             seekBar.style.setProperty('--value', '0%');
//         }
//     }
    
//     // ======== Restore previous track from localStorage ========
//     function restorePreviousTrack() {
//         const savedTrack = localStorage.getItem('currentTrack');
//         if (savedTrack) {
//             try {
//                 const trackData = JSON.parse(savedTrack);
//                 const trackIndex = findTrackIndexById(trackData.id);
                
//                 if (trackIndex !== -1) {
//                     loadTrack(trackIndex);
                    
//                     // Set the previous playback position
//                     audio.currentTime = trackData.currentTime || 0;
                    
//                     // If the track was playing, resume playback
//                     if (trackData.isPlaying) {
//                         audio.play()
//                             .then(() => {
//                                 playPauseIcon.classList.replace("fa-play", "fa-pause");
//                                 updateAllTrackIcons();
//                             })
//                             .catch(error => {
//                                 console.error("Error playing audio:", error);
//                             });
//                     }
//                 }
//             } catch (error) {
//                 console.error("Error restoring previous track:", error);
//             }
//         }
//     }
    
//     // ======== Event Listeners ========
//     // Track play buttons
//     trackPlayBtns.forEach((btn) => {
//         btn.addEventListener("click", () => {
//             const trackItem = btn.closest(".track-item");
//             const trackId = trackItem.getAttribute("data-track-id");
//             const trackIndex = findTrackIndexById(trackId);
            
//             // Check if clicking on currently playing track
//             if (trackId === currentTrackId) {
//                 // Toggle play/pause for current track
//                 togglePlayPause();
//                 return;
//             }
            
//             // Load new track if different from current
//             loadTrack(trackIndex);
            
//             // Play the track
//             audio.play()
//                 .then(() => {
//                     playPauseIcon.classList.replace("fa-play", "fa-pause");
//                     updateAllTrackIcons();
//                 })
//                 .catch(error => {
//                     console.error("Error playing audio:", error);
//                 });
//         });
//     });
    
//     // Player play/pause button
//     playPauseBtn.addEventListener("click", togglePlayPause);
    
//     // Time update
//     audio.addEventListener("timeupdate", () => {
//         seekBar.value = audio.currentTime;
//         updateSeekBarDisplay(audio.currentTime);
//         currentTimeDisplay.textContent = formatTime(audio.currentTime);
        
//         // Save current position periodically (every 5 seconds)
//         if (Math.floor(audio.currentTime) % 5 === 0) {
//             saveCurrentTrackToLocalStorage();
//         }
//     });
    
//     // Seek bar input
//     seekBar.addEventListener("input", () => {
//         audio.currentTime = seekBar.value;
//         updateSeekBarDisplay(audio.currentTime);
//     });
    
//     // Skip next button
//     skipNextBtn.addEventListener("click", () => {
//         if (tracks.length === 0) return;
        
//         const nextIndex = (currentTrackIndex + 1) % tracks.length;
//         loadTrack(nextIndex);
//         audio.play()
//             .then(() => {
//                 playPauseIcon.classList.replace("fa-play", "fa-pause");
//                 updateAllTrackIcons();
//             })
//             .catch(error => {
//                 console.error("Error playing audio:", error);
//             });
//     });
    
//     // Skip back button
//     skipBackBtn.addEventListener("click", () => {
//         if (tracks.length === 0) return;
        
//         const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
//         loadTrack(prevIndex);
//         audio.play()
//             .then(() => {
//                 playPauseIcon.classList.replace("fa-play", "fa-pause");
//                 updateAllTrackIcons();
//             })
//             .catch(error => {
//                 console.error("Error playing audio:", error);
//             });
//     });
    
//     // Repeat button
//     if (repeatBtn) {
//         repeatBtn.addEventListener("click", () => {
//             audio.currentTime = 0;
//             updateSeekBarDisplay(0);
//             currentTimeDisplay.textContent = "0:00";
            
//             if (!audio.paused) {
//                 audio.play().catch(error => {
//                     console.error("Error playing audio:", error);
//                 });
//             }
//         });
//     }
    
//     // Track ended - play next track
//     audio.addEventListener("ended", () => {
//         if (tracks.length === 0) return;
        
//         const nextIndex = (currentTrackIndex + 1) % tracks.length;
//         loadTrack(nextIndex);
//         audio.play()
//             .then(() => {
//                 playPauseIcon.classList.replace("fa-play", "fa-pause");
//                 updateAllTrackIcons();
//             })
//             .catch(error => {
//                 console.error("Error playing audio:", error);
//             });
//     });
    
//     // Fix for metadata loading
//     audio.addEventListener("loadeddata", () => {
//         totalTimeDisplay.textContent = formatTime(audio.duration);
//         seekBar.max = audio.duration;
//     });
    
//     // Handle window unload/reload to save state
//     window.addEventListener("beforeunload", () => {
//         saveCurrentTrackToLocalStorage();
//     });
    
//     // ======== Volume Control ========
//     // Show volume slider on hover
//     volumeContainer.addEventListener("mouseenter", () => {
//         clearTimeout(volumeHoverTimeout);
//         volumeSlider.style.display = "flex";
//         isVolumeSliderVisible = true;
//     });
    
//     // Hide volume slider on leave with delay
//     volumeContainer.addEventListener("mouseleave", (e) => {
//         // Check if mouse is moving up toward the volume slider
//         const rect = volumeContainer.getBoundingClientRect();
//         const movingUp = e.clientY < rect.top;
//         const withinHorizontalBounds = e.clientX >= rect.left && e.clientX <= rect.right;
        
//         if (movingUp && withinHorizontalBounds) {
//             return;
//         }
        
//         volumeHoverTimeout = setTimeout(() => {
//             if (!isVolumeSliderVisible) {
//                 volumeSlider.style.display = "none";
//             }
//         }, 300);
//     });
    
//     // Handle volume slider mouseenter
//     volumeSlider.addEventListener("mouseenter", () => {
//         clearTimeout(volumeHoverTimeout);
//         isVolumeSliderVisible = true;
//     });
    
//     // Handle volume slider mouseleave
//     volumeSlider.addEventListener("mouseleave", () => {
//         isVolumeSliderVisible = false;
//         volumeHoverTimeout = setTimeout(() => {
//             volumeSlider.style.display = "none";
//         }, 300);
//     });
    
//     // Function to set volume based on position
//     function setVolumeFromPosition(clientY) {
//         const rect = volumeBar.getBoundingClientRect();
//         const height = rect.height;
//         const offsetY = clientY - rect.top;
        
//         // Inverted mapping: bottom = 0% volume, top = 100% volume
//         const volume = Math.max(0, Math.min(1, 1 - (offsetY / height)));
        
//         audio.volume = volume;
//         previousVolume = volume;
        
//         // Set the height of volume level (fill from bottom)
//         volumeLevel.style.height = `${volume * 100}%`;
//         volumeLevel.style.bottom = "0";
//         volumeLevel.style.top = "auto";
        
//         // Update icon
//         if (volumeIcon) {
//             if (volume > 0) {
//                 volumeIcon.classList.replace("fa-volume-mute", "fa-volume-up");
//             } else {
//                 volumeIcon.classList.replace("fa-volume-up", "fa-volume-mute");
//             }
//         }
//     }
    
//     // Volume bar click handler
//     volumeBar.addEventListener("click", (e) => {
//         setVolumeFromPosition(e.clientY);
//     });
    
//     // Volume bar mouse down for dragging
//     volumeBar.addEventListener("mousedown", (e) => {
//         isDraggingVolume = true;
//         setVolumeFromPosition(e.clientY);
//         e.preventDefault();
//     });
    
//     // Mouse move for volume dragging
//     document.addEventListener("mousemove", (e) => {
//         if (isDraggingVolume) {
//             setVolumeFromPosition(e.clientY);
//         }
//     });
    
//     // Mouse up to stop volume dragging
//     document.addEventListener("mouseup", () => {
//         isDraggingVolume = false;
//     });
    
//     // Mute/unmute button
//     volumeBtn.addEventListener("click", () => {
//         if (audio.volume > 0) {
//             previousVolume = audio.volume;
//             audio.volume = 0;
//             volumeLevel.style.height = "0%";
//             if (volumeIcon) volumeIcon.classList.replace("fa-volume-up", "fa-volume-mute");
//         } else {
//             audio.volume = previousVolume;
//             volumeLevel.style.height = `${previousVolume * 100}%`;
//             if (volumeIcon) volumeIcon.classList.replace("fa-volume-mute", "fa-volume-up");
//         }
//     });
    
//     // Set initial volume
//     audio.volume = 0.7;
//     previousVolume = 0.7;
//     volumeLevel.style.height = "70%";
//     volumeLevel.style.bottom = "0";
//     volumeLevel.style.top = "auto";
    
//     // Function to update track tags/genres display
//     function updateTrackGenreTags() {
//         const genreContainers = document.querySelectorAll("#genre-container");
        
//         genreContainers.forEach(container => {
//             const tags = container.getAttribute("data-tags");
//             if (tags) {
//                 const tagArray = tags.split(",");
//                 container.innerHTML = "";
                
//                 tagArray.forEach(tag => {
//                     if (tag.trim()) {
//                         const span = document.createElement("span");
//                         span.className = "genre-tag";
//                         span.textContent = tag.trim();
//                         container.appendChild(span);
//                     }
//                 });
//             }
//         });
//     }
    
//     // Initialize genre tags
//     updateTrackGenreTags();
    
//     // Restore previous track after page load
//     restorePreviousTrack();
// });