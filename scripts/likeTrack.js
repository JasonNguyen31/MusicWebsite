document.addEventListener('DOMContentLoaded', function() {
      // Màu cam cho nút like đã được thích
      const LIKED_COLOR = '#ff5500';
      
      // Lưu trữ trạng thái liked localmente
      let likedTracksCache = {};
      
      // Lấy tất cả track ID trên trang
      const trackIds = getAllTrackIds();
      
      // Kiểm tra trạng thái thích
      if (trackIds.length > 0) {
            checkLikeStatus(trackIds);
      }

      attachLikeEventListeners();

      updateLikedTracksList();
    
      // Theo dõi những thay đổi DOM và gắn lại sự kiện 
      setupMutationObserver();
    
      // Lấy tất cả track ID từ trang
      function getAllTrackIds() {
            const trackElements = document.querySelectorAll('[data-track-id]');
            return Array.from(trackElements)
                  .map(el => parseInt(el.dataset.trackId))
                  .filter(id => !isNaN(id));
      }
    
      // Gắn lại tất cả event listeners mà không gây ra loop
      function reattachAllLikeListeners() {
                  console.log("Reattaching all like listeners");
                  
                  // Gỡ bỏ tất cả sự kiện cũ để tránh trùng lặp
                  document.querySelectorAll('.love-button, .like-button').forEach(button => {
                        button.removeEventListener('click', handleLikeButtonClick);
                  });
            
            // Gắn lại sự kiện cho nút trong Recently Played
            document.querySelectorAll('.recently-played .track-card .love-button').forEach(button => {
                  button.addEventListener('click', handleLikeButtonClick);
                  button.setAttribute('data-has-event', 'true');
                  
                  // Đảm bảo UI phản ánh đúng trạng thái cached
                  const trackId = parseInt(button.closest('[data-track-id]')?.dataset.trackId);
                  if (trackId && likedTracksCache[trackId] !== undefined) {
                  updateSingleLikeButton(button, likedTracksCache[trackId]);
                  }
            });
            
            // Gắn event listeners cho các nút khác
            document.querySelectorAll('.recommendations .track-card .love-button, .track-item .like-button').forEach(button => {
                  button.addEventListener('click', handleLikeButtonClick);
            });
            
            // Nút trên player control
            const playerLikeButton = document.querySelector('.song-action-btn.like');
            if (playerLikeButton) {
                  playerLikeButton.addEventListener('click', function() {
                  const trackId = document.querySelector('.music-player')?.dataset.currentTrackId;
                  if (trackId) {
                        toggleLike(parseInt(trackId), this);
                  }
                  });
            }
      }
    
      // Kiểm tra trạng thái thích của các bài hát
      function checkLikeStatus(trackIds) {
            fetch(`../model/checkLikeStatus.php?track_ids=${trackIds.join(',')}`)
            .then(response => response.json())
            .then(data => {
                  if (data.success) {
                  // Cập nhật cache local
                  for (const trackId in data.likes) {
                        likedTracksCache[trackId] = data.likes[trackId];
                  }
                  
                  // Cập nhật giao diện với trạng thái thích
                  for (const trackId in data.likes) {
                        updateLikeUI(trackId, data.likes[trackId]);
                  }
                  }
            })
            .catch(error => console.error('Lỗi kiểm tra trạng thái thích:', error));
      }
    
      // Cập nhật giao diện nút like
      function updateLikeUI(trackId, isLiked) {
            console.log(`Updating UI for track ${trackId}, isLiked: ${isLiked}`);
            
            // Lưu trạng thái vào cache local
            likedTracksCache[trackId] = isLiked;
            
            // 1. Cập nhật trong recommendations
            document.querySelectorAll(`.recommendations .track-card[data-track-id="${trackId}"] .love-button`).forEach(button => {
                  updateSingleLikeButton(button, isLiked);
            });
            
            // 2. Cập nhật trong recently played - QUAN TRỌNG
            document.querySelectorAll(`.recently-played .track-card[data-track-id="${trackId}"] .love-button`).forEach(button => {
                  updateSingleLikeButton(button, isLiked);
                  console.log("Updated Recently Played button:", button);
            });
            
            // 3. Cập nhật trong profile
            document.querySelectorAll(`.track-item[data-track-id="${trackId}"] .like-button`).forEach(button => {
                  updateSingleLikeButton(button, isLiked);
            });
            
            // 4. Cập nhật trong player
            const currentTrackId = document.querySelector('.music-player')?.dataset.currentTrackId;
            if (currentTrackId === trackId.toString()) {
                  const likeButton = document.querySelector('.song-action-btn.like');
                  if (likeButton) {
                  updateSingleLikeButton(likeButton, isLiked);
                  }
            }
      }
    
      // Gắn sự kiện cho tất cả các nút like
      function attachLikeEventListeners() {
            reattachAllLikeListeners();
      }
    
      // Xử lý khi click vào nút like
      function handleLikeButtonClick(event) {
            event.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài
            console.log("Like button clicked", this);
            
            let trackElement = this.closest('[data-track-id]');
            if (!trackElement) {
                  console.error("Không tìm thấy phần tử cha có data-track-id");
                  return;
            }
            
            const trackId = parseInt(trackElement.dataset.trackId);
            console.log("Processing like for track ID:", trackId);
            toggleLike(trackId, this);
      }
    
      // Thực hiện like/unlike bài hát
      function toggleLike(trackId, buttonElement) {
            // Lưu trạng thái hiện tại
            const currentState = likedTracksCache[trackId] || false;
            
            // Update UI immediately (optimistic update)
            updateLikeUI(trackId, !currentState);
            
            // Create form data
            const formData = new FormData();
            formData.append('track_id', trackId);
            
            // Send request
            fetch('../model/toggleLike.php', {
            method: 'POST',
            body: formData
            })
            .then(response => response.json())
            .then(data => {
            if (data.success) {
                  // Update UI for all like buttons of this track
                  updateLikeUI(trackId, data.liked);
                  
                  // Update like count
                  updateLikeCount(trackId, data.likes_count);
                  
                  // Update the liked tracks list in real-time
                  updateLikedTracksList();
                  
                  // Dispatch custom event for other components to listen
                  const event = new CustomEvent('trackLikeStatusChanged', {
                        detail: {
                        trackId: trackId,
                        isLiked: data.liked
                        }
                  });
                  document.dispatchEvent(event);
                  
                  // Nếu đây là unlike, xóa track khỏi listening history
                  if (!data.liked) {
                        removeFromListeningHistory(trackId);
                  }
            } else {
                  // Revert the UI change on error
                  console.error('Lỗi toggle like:', data.message);
                  updateLikeUI(trackId, currentState);
            }
            })
            .catch(error => {
            console.error('Lỗi call API:', error);
            // Revert the UI change on error
            updateLikeUI(trackId, currentState);
            });
      }
  
      // Thêm hàm xóa track khỏi Listening History
      function removeFromListeningHistory(trackId) {
            // 1. Xóa từ sidebar listening history
            const historyItems = document.querySelectorAll(`.listening-history .song-list .song-item[data-track-id="${trackId}"]`);
            historyItems.forEach(item => {
            // Thêm hiệu ứng fade-out trước khi xóa
            item.style.opacity = '0';
            item.style.height = item.offsetHeight + 'px';
            item.style.overflow = 'hidden';
            item.style.transition = 'opacity 0.3s, height 0.3s 0.3s';
            
            setTimeout(() => {
                  item.style.height = '0';
                  setTimeout(() => {
                        item.remove();
                        
                        // Kiểm tra nếu không còn track nào trong Listening History
                        const remainingItems = document.querySelectorAll('.listening-history .song-list .song-item');
                        if (remainingItems.length === 0) {
                        const songList = document.querySelector('.listening-history .song-list');
                        if (songList) {
                              songList.innerHTML = `
                                    <div class="no-liked-tracks">
                                    <p>You have not liked any songs yet.</p>
                                    </div>
                              `;
                        }
                        }
                  }, 300);
            }, 300);
            });
      }
    
      // Cập nhật số lượt thích trên giao diện
      function updateLikeCount(trackId, count) {
            // Cập nhật số lượt thích trên track item trong profile
            document.querySelectorAll(`.track-item[data-track-id="${trackId}"] .track-stats .like-button`).forEach(button => {
                  const countElement = button.querySelector('i').nextSibling;
                  if (countElement) {
                  countElement.nodeValue = ' ' + count;
                  }
            });
      }

      function updateLikedTracksList() {
            // Fetch the latest liked tracks
            fetch('../model/getUserLikedTracks.php')
            .then(response => response.json())
            .then(data => {
                  if (data.success) {
                  // Get the song list container
                  const songListContainer = document.querySelector('.listening-history .song-list');
                  if (!songListContainer) return;
                  
                  // If no liked tracks, show the "no liked tracks" message
                  if (data.tracks.length === 0) {
                        songListContainer.innerHTML = `
                              <div class="no-liked-tracks">
                              <p>You have not liked any songs yet.</p>
                              </div>
                        `;
                        return;
                  }
                        
                  // Otherwise, build the new list of liked tracks
                  let newHtml = '';
                  data.tracks.forEach(track => {
                        const imageUrl = track.image_url ? `../${track.image_url}` : '../assets/images/defaults.jpg';
                        newHtml += `
                              <div class="song-item" data-track-id="${track.track_id}">
                              <div class="user-avatar">
                                    <img src="${imageUrl}" alt="${track.track_name}">
                              </div>
                              <div class="history-info">
                                    <p class="history-artist-name">${track.artist}</p>
                                    <p class="history-song-name">${track.track_name}</p>
                                    <div class="stats-and-button">
                                          <div class="history-stats">
                                          <span><i class="fas fa-play"></i> ${Number(track.play_count).toLocaleString()}</span>
                                          <span class="like-heart-btn" data-track-id="${track.track_id}">
                                                <i class="fas fa-heart liked" style="color: #ff5500; cursor: pointer;"></i> ${Number(track.like_count).toLocaleString()}
                                          </span>
                                          <span><i class="fas fa-retweet"></i> 0</span>
                                          </div>
                                    </div>
                              </div>
      
                              <div class="play-button-container">
                                    <button class="track-play-pause" data-file="/WebDev/finalproject/uploads/tracks/${track.file_url.split('/').pop()}">
                                          <i class="fas fa-play"></i>
                                    </button>
                              </div>
                              </div>
                        `;
                  });
                        
                  // Update the container with new content
                  songListContainer.innerHTML = newHtml;
                  
                  // Attach event listeners to the heart icons in liked tracks
                  document.querySelectorAll('.like-heart-btn').forEach(btn => {
                        btn.addEventListener('click', function(event) {
                              event.stopPropagation(); // Prevent event bubbling
                              const trackId = parseInt(this.dataset.trackId);
                              if (trackId) {
                              toggleLike(trackId, this);
                              }
                        });
                  });
                  
                  // Reattach event listeners to the play buttons
                  document.querySelectorAll('.track-play-pause').forEach(button => {
                        button.addEventListener('click', function() {
                              // Add your existing play button click handler code here
                        });
                  });
                  } else {
                  console.error('Failed to fetch liked tracks:', data.message);
                  }
            })
            .catch(error => console.error('Error fetching liked tracks:', error));
      }

      function updateSingleLikeButton(button, isLiked) {
            if (isLiked) {
                  button.classList.add('liked');
                  const icon = button.querySelector('i');
                  if (icon) icon.style.color = LIKED_COLOR;
            } else {
                  button.classList.remove('liked');
                  const icon = button.querySelector('i');
                  if (icon) icon.style.color = '';
            }
      }
    
      // Sửa MutationObserver để tránh loop vô hạn
      function setupMutationObserver() {
            let debounceTimer;
            
            const observer = new MutationObserver(function(mutations) {
                  // Kiểm tra xem có phải là thay đổi DOM thực sự
                  let hasRealDOMChanges = false;
                  
                  mutations.forEach(function(mutation) {
                  // Chỉ quan tâm đến thêm/xóa nodes, không quan tâm đến thay đổi thuộc tính
                  if (mutation.type === 'childList' && 
                        (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
                        hasRealDOMChanges = true;
                  }
                  });
                  
                  if (hasRealDOMChanges) {
                  // Sử dụng debounce để tránh gọi liên tục
                  clearTimeout(debounceTimer);
                  debounceTimer = setTimeout(() => {
                        console.log("DOM changed, reattaching listeners");
                        reattachAllLikeListeners();
                  }, 300); // Đợi 300ms trước khi thực hiện reattach
                  }
            });
            
            // Bắt đầu theo dõi container chứa Recently Played
            const recentlyPlayedContainer = document.querySelector('.recently-played .track-cards-wrapper');
            if (recentlyPlayedContainer) {
                  observer.observe(recentlyPlayedContainer, { 
                  childList: true, 
                  subtree: true,
                  attributeFilter: ['data-track-id'] // Chỉ quan tâm đến thay đổi cụ thể này
                  });
            }
      }
});

// Thêm code để xử lý khi một bài hát mới được phát
document.addEventListener('trackChanged', function(e) {
      const trackId = e.detail.trackId;
      if (!trackId) return;

      // Lưu track ID đang phát vào music player
      const musicPlayer = document.querySelector('.music-player');
      if (musicPlayer) {
            musicPlayer.dataset.currentTrackId = trackId;
      }

      // Kiểm tra trạng thái thích của bài hát hiện tại
      fetch(`../model/checkLikeStatus.php?track_ids=${trackId}`)
      .then(response => response.json())
      .then(data => {
            if (data.success) {
                  const likeButton = document.querySelector('.song-action-btn.like');
                  if (likeButton) {
                        if (data.likes[trackId]) {
                              likeButton.classList.add('liked');
                              const icon = likeButton.querySelector('i');
                              if (icon) icon.style.color = '#ff5500';
                        } else {
                              likeButton.classList.remove('liked');
                              const icon = likeButton.querySelector('i');
                              if (icon) icon.style.color = '';
                        }
                  }
            }
      })
      .catch(error => console.error('Lỗi kiểm tra trạng thái thích:', error));
});

//pop up view all like track
const style = document.createElement('style');
style.textContent = `
      /* Overlay nền */
      .popup-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s, visibility 0.3s;
      }

      .popup-overlay.active {
            opacity: 1;
            visibility: visible;
      }

      /* Container của popup */
      .liked-tracks-popup {
            background-color: #121212;
            border-radius: 8px;
            width: 80%;
            max-width: 800px;
            max-height: 80vh;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
            overflow: hidden;
            transform: translateY(20px);
            opacity: 0;
            transition: transform 0.3s, opacity 0.3s;
      }

      .popup-overlay.active .liked-tracks-popup {
            transform: translateY(0);
            opacity: 1;
      }

      /* Header của popup */
      .popup-header {
            padding: 16px 20px;
            background-color: #282828;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #333;
      }

      .popup-header h2 {
            color: white;
            margin: 0;
            font-size: 18px;
      }

      .popup-close {
            background: none;
            border: none;
            color: #aaa;
            font-size: 18px;
            cursor: pointer;
            padding: 5px;
            transition: color 0.2s;
      }

      .popup-close:hover {
            color: #ff5500;
      }

      /* Nội dung popup */
      .popup-content {
            padding: 0;
            overflow-y: auto;
            max-height: calc(80vh - 60px);
      }

      /* Danh sách bài hát */
      .popup-tracks-list {
            list-style: none;
            padding: 0;
            margin: 0;
      }

      .popup-track-item {
            display: flex;
            align-items: center;
            padding: 12px 20px;
            transition: background-color 0.2s, opacity 0.3s;
      }

      .popup-track-image {
            width: 50px;
            height: 50px;
            border-radius: 4px;
            margin-right: 15px;
            overflow: hidden;
      }

      .popup-track-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
      }

      .popup-track-info {
            flex-grow: 1;
      }

      .popup-track-name {
            color: white;
            margin: 0 0 5px 0;
            font-size: 14px;
      }

      .popup-track-artist {
            color: #b3b3b3;
            margin: 0;
            font-size: 12px;
      }

      .popup-track-actions {
            display: flex;
            align-items: center;
            gap: 15px;
      }

      .popup-track-button {
            background: none;
            border: none;
            color: #b3b3b3;
            cursor: pointer;
            transition: color 0.2s;
            padding: 5px;
      }

      .popup-track-button:hover {
            color: white;
      }

      .popup-track-button.play {
            background-color: white;
            color: black;
            width: 32px;
            height: 32px;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
      }

      .popup-track-button.like.liked i {
            color: #ff5500;
      }

      .popup-track-stats {
            display: flex;
            gap: 10px;
            color: #b3b3b3;
            font-size: 12px;
            margin-top: 5px;
      }

      .popup-track-stats span {
            display: flex;
            align-items: center;
            gap: 5px;
      }

      /* Empty state */
      .popup-empty-state {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 40px 20px;
            text-align: center;
            color: #b3b3b3;
      }

      .popup-empty-state i {
            font-size: 40px;
            margin-bottom: 15px;
            color: #555;
      }

      .popup-empty-state p {
            margin: 0;
            font-size: 16px;
      }
`;
document.head.appendChild(style);

// Thêm HTML cho popup
function createPopupHTML() {
      const popupDiv = document.createElement('div');
      popupDiv.className = 'popup-overlay';
      popupDiv.id = 'likedTracksPopup';
  
      popupDiv.innerHTML = `
            <div class="liked-tracks-popup">
                  <div class="popup-header">
                        <h2>Liked Tracks</h2>
                        <button class="popup-close" id="closePopup">
                              <i class="fas fa-times"></i>
                        </button>
                  </div>
                  <div class="popup-content">
                        <div id="popupLoader" style="text-align: center; padding: 20px; color: #b3b3b3;">
                              <i class="fas fa-spinner fa-spin" style="font-size: 24px;"></i>
                              <p>Loading your liked tracks...</p>
                        </div>
                        <ul class="popup-tracks-list" id="popupTracksList"></ul>
                  </div>
            </div>
      `;
  
      document.body.appendChild(popupDiv);
}

// Gọi một lần để tạo popup
createPopupHTML();

document.addEventListener('DOMContentLoaded', function() {
      const viewLikedButton = document.querySelector('.listening-history .sidebar-header .view-link');
      const popup = document.getElementById('likedTracksPopup');
      const closeButton = document.getElementById('closePopup');
      const tracksList = document.getElementById('popupTracksList');
      const loader = document.getElementById('popupLoader');
  
      // Âm thanh đang phát
      let currentlyPlayingTrackId = null;
      
      // Cache trạng thái like của các track
      let likedTracksCache = {};
  
      // Hàm để lấy và hiển thị bài hát đã thích trong popup
      function fetchAndDisplayLikedTracks() {
            // Hiện loader
            if (loader) loader.style.display = 'block';
            if (tracksList) tracksList.innerHTML = '';
      
            // Lấy dữ liệu từ API - Thêm tham số full=true để lấy tất cả bài hát
            fetch('../model/getUserLikedTracks.php?full=true')
            .then(response => response.json())
            .then(data => {
                  if (loader) loader.style.display = 'none';
                  
                  if (!data.success || data.tracks.length === 0) {
                        // Hiển thị trạng thái trống
                        tracksList.innerHTML = `
                        <div class="popup-empty-state">
                              <i class="far fa-heart"></i>
                              <p>You haven't liked any tracks yet</p>
                        </div>
                        `;
                        return;
                  }
                  
                  console.log('Total liked tracks:', data.tracks.length);
                  
                  // Cập nhật cache từ dữ liệu API
                  // Đặt tất cả các track thành false trước
                  const trackIds = getAllTrackIds();
                  trackIds.forEach(id => {
                        likedTracksCache[id] = false;
                  });
                  
                  // Sau đó đánh dấu các track đã thích là true
                  data.tracks.forEach(track => {
                        likedTracksCache[track.track_id] = true;
                  });
                  
                  console.log('Updated like cache:', likedTracksCache);
                  
                  // Đồng bộ UI để đảm bảo hiển thị đúng
                  syncAllLikeButtons();
            
                  // Hiển thị danh sách track
                  let html = '';
                  data.tracks.forEach(track => {
                        const imageUrl = track.image_url ? `../${track.image_url}` : '../assets/images/defaults.jpg';
                        const isPlaying = currentlyPlayingTrackId === track.track_id;
            
                        html += `
                              <li class="popup-track-item" data-track-id="${track.track_id}">
                                    <div class="popup-track-image">
                                          <img src="${imageUrl}" alt="${track.track_name}">
                                    </div>
                                    <div class="popup-track-info">
                                          <h4 class="popup-track-name">${track.track_name}</h4>
                                          <p class="popup-track-artist">${track.artist}</p>
                                          <div class="popup-track-stats">
                                                <span><i class="fas fa-play"></i> ${Number(track.play_count).toLocaleString()}</span>
                                                <span><i class="fas fa-heart"></i> ${Number(track.like_count).toLocaleString()}</span>
                                          </div>
                                    </div>
                                    <div class="popup-track-actions">
                                          <button class="popup-track-button like liked" data-track-id="${track.track_id}">
                                                <i class="fas fa-heart"></i>
                                          </button>
                                          <button class="popup-track-button play" data-track-id="${track.track_id}" data-file="/WebDev/finalproject/uploads/tracks/${track.file_url.split('/').pop()}">
                                                <i class="fas ${isPlaying ? 'fa-pause' : 'fa-play'}"></i>
                                          </button>
                                    </div>
                              </li>
                        `;
                  });
            
                  tracksList.innerHTML = html;
                  
                  // Thêm event listeners cho các nút
                  attachPopupEventListeners();
            })
            .catch(error => {
                  console.error('Error fetching liked tracks:', error);
                  if (loader) loader.style.display = 'none';
                  tracksList.innerHTML = `
                        <div class="popup-empty-state">
                              <i class="fas fa-exclamation-circle"></i>
                              <p>Something went wrong. Please try again.</p>
                        </div>
                  `;
            });
      }
      
      // Lấy tất cả track ID trên trang
      function getAllTrackIds() {
            const trackElements = document.querySelectorAll('[data-track-id]');
            return Array.from(trackElements)
                  .map(el => parseInt(el.dataset.trackId))
                  .filter(id => !isNaN(id));
      }
      
      // Đồng bộ hóa tất cả các nút like trên trang
      function syncAllLikeButtons() {
            // Cập nhật nút like trong Recently Played
            document.querySelectorAll('.recently-played .track-card').forEach(card => {
                  const trackId = parseInt(card.dataset.trackId);
                  if (!isNaN(trackId)) {
                        const likeButton = card.querySelector('.love-button');
                        if (likeButton) {
                              const isLiked = likedTracksCache[trackId] === true;
                              updateSingleLikeButton(likeButton, isLiked);
                              console.log(`Synced Recently Played button for track ${trackId}, isLiked: ${isLiked}`);
                        }
                  }
            });
            
            // Cập nhật nút like trong Recommendations
            document.querySelectorAll('.recommendations .track-card').forEach(card => {
                  const trackId = parseInt(card.dataset.trackId);
                  if (!isNaN(trackId)) {
                        const likeButton = card.querySelector('.love-button');
                        if (likeButton) {
                              const isLiked = likedTracksCache[trackId] === true;
                              updateSingleLikeButton(likeButton, isLiked);
                        }
                  }
            });
            
            // Cập nhật nút like trong Profile
            document.querySelectorAll('.track-item').forEach(item => {
                  const trackId = parseInt(item.dataset.trackId);
                  if (!isNaN(trackId)) {
                        const likeButton = item.querySelector('.like-button');
                        if (likeButton) {
                              const isLiked = likedTracksCache[trackId] === true;
                              updateSingleLikeButton(likeButton, isLiked);
                        }
                  }
            });
            
            // Cập nhật nút like trong Player
            const playerTrackId = document.querySelector('.music-player')?.dataset.currentTrackId;
            if (playerTrackId) {
                  const likeButton = document.querySelector('.song-action-btn.like');
                  if (likeButton) {
                        const isLiked = likedTracksCache[parseInt(playerTrackId)] === true;
                        updateSingleLikeButton(likeButton, isLiked);
                  }
            }
      }

      // Hàm để cập nhật listening history section với 3 bài hát mới nhất
      function updateListeningHistorySection() {
            // Lấy container của listening history
            const listenHistoryContainer = document.querySelector('.listening-history .song-list');
            if (!listenHistoryContainer) return;

            // Lấy dữ liệu từ API cho 3 bài hát đã thích gần nhất
            fetch('../model/getUserLikedTracks.php')
            .then(response => response.json())
            .then(data => {
                  if (!data.success) {
                        console.error('Failed to fetch liked tracks for history section:', data.message);
                        return;
                  }

                  if (data.tracks.length === 0) {
                        // Hiển thị thông báo không có bài hát nào được thích
                        listenHistoryContainer.innerHTML = `
                              <div class="no-liked-tracks">
                                    <p>You have not liked any songs yet.</p>
                              </div>
                        `;
                        return;
                  }

                  // Cập nhật cache từ dữ liệu API
                  data.tracks.forEach(track => {
                        likedTracksCache[track.track_id] = true;
                  });

                  // Tạo HTML cho 3 bài hát đã thích gần nhất
                  let html = '';
                  data.tracks.forEach(track => {
                        const imageUrl = track.image_url ? `../${track.image_url}` : '../assets/images/defaults.jpg';
                        html += `
                              <div class="song-item" data-track-id="${track.track_id}">
                                    <div class="user-avatar">
                                          <img src="${imageUrl}" alt="${track.track_name}">
                                    </div>
                                    <div class="history-info">
                                          <p class="history-artist-name">${track.artist}</p>
                                          <p class="history-song-name">${track.track_name}</p>
                                          <div class="stats-and-button">
                                                <div class="history-stats">
                                                      <span><i class="fas fa-play"></i> ${Number(track.play_count).toLocaleString()}</span>
                                                      <span><i class="fas fa-heart"></i> ${Number(track.like_count).toLocaleString()}</span>
                                                      <span><i class="fas fa-retweet"></i> 0</span>
                                                </div>
                                          </div>
                                    </div>
                                    <div class="play-button-container">
                                          <button class="track-play-pause" data-file="/WebDev/finalproject/uploads/tracks/${track.file_url.split('/').pop()}">
                                                <i class="fas fa-play"></i>
                                          </button>
                                    </div>
                              </div>
                        `;
                  });

                  // Cập nhật nội dung listening history
                  listenHistoryContainer.innerHTML = html;

                  // Gắn lại sự kiện cho các nút play
                  document.querySelectorAll('.track-play-pause').forEach(button => {
                        button.addEventListener('click', function() {
                              const trackId = this.closest('[data-track-id]').dataset.trackId;
                              const audioFile = this.dataset.file;
                              
                              if (window.audioPlayerActions && typeof window.audioPlayerActions.playTrack === 'function') {
                                    window.audioPlayerActions.playTrack(trackId, audioFile);
                              }
                        });
                  });
                  
                  // Sau khi cập nhật Listening History, cập nhật lại UI cho các nút khác
                  setTimeout(syncAllLikeButtons, 100);
            })
            .catch(error => {
                  console.error('Error updating listening history section:', error);
            });
      }
  
      // Update all like UI elements across the page
      function updateAllLikeUIElements(trackId, isLiked) {
            // Cập nhật cache
            likedTracksCache[trackId] = isLiked;
            console.log(`Setting cache for track ${trackId}, isLiked: ${isLiked}`);
      
            // 1. Cập nhật trong recommendations
            document.querySelectorAll(`.recommendations .track-card[data-track-id="${trackId}"] .love-button`).forEach(button => {
                  updateSingleLikeButton(button, isLiked);
            });
      
            // 2. Cập nhật trong recently played - QUAN TRỌNG
            document.querySelectorAll(`.recently-played .track-card[data-track-id="${trackId}"] .love-button`).forEach(button => {
                  updateSingleLikeButton(button, isLiked);
                  console.log(`Updated Recently Played button for track ${trackId}, isLiked: ${isLiked}`);
            });
      
            // 3. Cập nhật trong profile
            document.querySelectorAll(`.track-item[data-track-id="${trackId}"] .like-button`).forEach(button => {
                  updateSingleLikeButton(button, isLiked);
            });
            
            // 4. Cập nhật trong player
            const currentTrackId = document.querySelector('.music-player')?.dataset.currentTrackId;
            if (currentTrackId === trackId.toString()) {
                  const likeButton = document.querySelector('.song-action-btn.like');
                  if (likeButton) {
                        updateSingleLikeButton(likeButton, isLiked);
                  }
            }

            // 5. Trong trường hợp không thích, xóa khỏi Listening History và cập nhật lại
            if (!isLiked) {
                  removeFromListeningHistory(trackId);
                  // Sau 600ms (sau khi animation hoàn thành), cập nhật lại listening history
                  setTimeout(() => {
                        updateListeningHistorySection();
                  }, 600);
            }
      }

      // Helper function để cập nhật một nút like
      function updateSingleLikeButton(button, isLiked) {
            const LIKED_COLOR = '#ff5500';
            
            if (isLiked) {
                  button.classList.add('liked');
                  const icon = button.querySelector('i');
                  if (icon) icon.style.color = LIKED_COLOR;
            } else {
                  button.classList.remove('liked');
                  const icon = button.querySelector('i');
                  if (icon) icon.style.color = '';
            }
      }

      // Xóa bài hát khỏi Listening History section
      function removeFromListeningHistory(trackId) {
            // 1. Xóa từ sidebar listening history
            const historyItems = document.querySelectorAll(`.listening-history .song-list .song-item[data-track-id="${trackId}"]`);
            historyItems.forEach(item => {
                  // Thêm hiệu ứng fade-out trước khi xóa
                  item.style.opacity = '0';
                  item.style.height = item.offsetHeight + 'px';
                  item.style.overflow = 'hidden';
                  item.style.transition = 'opacity 0.3s, height 0.3s 0.3s';
                  setTimeout(() => {
                        item.style.height = '0';
                        setTimeout(() => {
                              item.remove();
                              
                              // Kiểm tra nếu không còn track nào trong Listening History
                              const remainingItems = document.querySelectorAll('.listening-history .song-list .song-item');
                              if (remainingItems.length === 0) {
                                    const songList = document.querySelector('.listening-history .song-list');
                                    if (songList) {
                                          songList.innerHTML = `
                                          <div class="no-liked-tracks">
                                                <p>You have not liked any songs yet.</p>
                                          </div>
                                          `;
                                    }
                              }
                        }, 300);
                  }, 300);
            });
      }
  
      // Gắn event listeners cho các nút trong popup
      function attachPopupEventListeners() {
            // Event listener cho nút play
            document.querySelectorAll('.popup-track-button.play').forEach(button => {
                  button.addEventListener('click', function() {
                        const trackId = this.dataset.trackId;
                        const audioFile = this.dataset.file;
            
                        // Kiểm tra xem có đang phát không
                        const isCurrentlyPlaying = currentlyPlayingTrackId === trackId;
            
                        if (isCurrentlyPlaying) {
                              // Nếu đang phát, dừng lại
                              if (window.audioPlayerActions && typeof window.audioPlayerActions.togglePlayPause === 'function') {
                                    window.audioPlayerActions.togglePlayPause();
                              }
                              this.querySelector('i').className = 'fas fa-play';
                              currentlyPlayingTrackId = null;
                        } else {
                              // Nếu chưa phát, bắt đầu phát
                              if (window.audioPlayerActions && typeof window.audioPlayerActions.playTrack === 'function') {
                                    window.audioPlayerActions.playTrack(trackId, audioFile);
                              }
            
                              // Reset tất cả các nút play khác
                              document.querySelectorAll('.popup-track-button.play i').forEach(icon => {
                                    icon.className = 'fas fa-play';
                              });
                        
                              // Thiết lập nút hiện tại thành pause
                              this.querySelector('i').className = 'fas fa-pause';
                              currentlyPlayingTrackId = trackId;
                        }
                  });
            });
            
            // Event listener cho nút like
            document.querySelectorAll('.popup-track-button.like').forEach(button => {
                  button.addEventListener('click', function() {
                        const trackId = parseInt(this.dataset.trackId);
                  
                        // Toggle trạng thái liked trên UI
                        const wasLiked = this.classList.contains('liked');
                        this.classList.toggle('liked');
                        const isNowLiked = this.classList.contains('liked');
                  
                        // Nếu là unlike, xóa khỏi danh sách popup với animation
                        if (!isNowLiked) {
                              const trackItem = this.closest('.popup-track-item');
                              if (trackItem) {
                                    trackItem.style.opacity = '0';
                                    setTimeout(() => {
                                          trackItem.remove();
                        
                                          // Kiểm tra nếu không còn track nào
                                          if (document.querySelectorAll('.popup-track-item').length === 0) {
                                                tracksList.innerHTML = `
                                                      <div class="popup-empty-state">
                                                            <i class="far fa-heart"></i>
                                                            <p>You haven't liked any tracks yet</p>
                                                      </div>
                                                `;
                                          }
                                    }, 300);
                              }
                        }
                  
                        // Cập nhật trạng thái trên toàn trang
                        updateAllLikeUIElements(trackId, isNowLiked);
                        
                        // Gọi hàm toggle like từ API
                        const formData = new FormData();
                        formData.append('track_id', trackId);
                        
                        fetch('../model/toggleLike.php', {
                              method: 'POST',
                              body: formData
                        })
                        .then(response => response.json())
                        .then(data => {
                              if (data.success) {
                                    // Cập nhật cache theo kết quả API
                                    likedTracksCache[trackId] = data.liked;
                                    console.log(`API response for track ${trackId}, isLiked: ${data.liked}`);
                                    
                                    // Force đồng bộ lại toàn bộ UI
                                    syncAllLikeButtons();
                              } else {
                                    // Revert UI nếu API thất bại
                                    likedTracksCache[trackId] = wasLiked;
                                    updateAllLikeUIElements(trackId, wasLiked);
                                    if (wasLiked !== isNowLiked) {
                                          button.classList.toggle('liked');
                                    }
                              }
                        })
                        .catch(error => {
                              console.error('Error toggling like:', error);
                              // Revert UI nếu có lỗi
                              likedTracksCache[trackId] = wasLiked;
                              updateAllLikeUIElements(trackId, wasLiked);
                              if (wasLiked !== isNowLiked) {
                                    button.classList.toggle('liked');
                              }
                        });
                  });
            });
      }
  
      // Mở popup khi click vào nút view
      if (viewLikedButton) {
            viewLikedButton.addEventListener('click', function(e) {
                  e.preventDefault();
                  
                  // Lấy trạng thái playing hiện tại
                  if (window.audioPlayerActions && typeof window.audioPlayerActions.getCurrentTrack === 'function') {
                        const currentTrack = window.audioPlayerActions.getCurrentTrack();
                        if (currentTrack && currentTrack.id) {
                              currentlyPlayingTrackId = currentTrack.id;
                        }
                  }
                  
                  // Hiển thị popup
                  popup.classList.add('active');
                  document.body.style.overflow = 'hidden'; // Ngăn scroll
                  
                  // Lấy và hiển thị bài hát đã thích
                  fetchAndDisplayLikedTracks();
            });
      }
  
      // Đóng popup khi click vào nút đóng
      if (closeButton) {
            closeButton.addEventListener('click', function() {
                  popup.classList.remove('active');
                  document.body.style.overflow = ''; // Cho phép scroll lại
            });
      }
  
      // Đóng popup khi click bên ngoài
      popup.addEventListener('click', function(e) {
            if (e.target === popup) {
                  popup.classList.remove('active');
                  document.body.style.overflow = ''; // Cho phép scroll lại
            }
      });
  
      // Lắng nghe sự kiện phát nhạc để cập nhật UI
      document.addEventListener('trackChanged', function(e) {
            if (e.detail && e.detail.trackId) {
                  currentlyPlayingTrackId = e.detail.trackId;
                  
                  // Cập nhật UI trong popup
                  document.querySelectorAll('.popup-track-button.play').forEach(button => {
                  const trackId = button.dataset.trackId;
                  const icon = button.querySelector('i');
                  
                        if (trackId === currentlyPlayingTrackId) {
                              icon.className = 'fas fa-pause';
                        } else {
                              icon.className = 'fas fa-play';
                        }
                  });
            }
      });
  
      // Lắng nghe sự kiện dừng nhạc
      document.addEventListener('playerStopped', function() {
            currentlyPlayingTrackId = null;

            // Cập nhật tất cả nút play về trạng thái play
            document.querySelectorAll('.popup-track-button.play i').forEach(icon => {
                  icon.className = 'fas fa-play';
            });
      });

      // Đảm bảo tương thích với mã "like" hiện có
      // Lắng nghe sự kiện tùy chỉnh khi một track được thích/bỏ thích ở bất kỳ đâu trên trang
      document.addEventListener('trackLikeStatusChanged', function(e) {
            if (e.detail && e.detail.trackId && e.detail.isLiked !== undefined) {
                  const trackId = e.detail.trackId;
                  const isLiked = e.detail.isLiked;
                  
                  // Cập nhật cache
                  likedTracksCache[trackId] = isLiked;
                  console.log(`Event trackLikeStatusChanged: track ${trackId}, isLiked: ${isLiked}`);
            
                  // Cập nhật UI trong popup
                  const popupLikeButton = document.querySelector(`.popup-track-button.like[data-track-id="${trackId}"]`);
                  if (popupLikeButton) {
                        if (isLiked) {
                              popupLikeButton.classList.add('liked');
                        } else {
                              // Xóa khỏi danh sách popup với animation
                              const trackItem = popupLikeButton.closest('.popup-track-item');
                              if (trackItem) {
                                    trackItem.style.opacity = '0';
                                    setTimeout(() => {
                                          trackItem.remove();
                                          
                                          // Kiểm tra nếu không còn track nào
                                          if (document.querySelectorAll('.popup-track-item').length === 0) {
                                                tracksList.innerHTML = `
                                                      <div class="popup-empty-state">
                                                      <i class="far fa-heart"></i>
                                                      <p>You haven't liked any tracks yet</p>
                                                      </div>
                                                `;
                                          }
                                    }, 300);
                              }
                        }
                  }

                  // Force đồng bộ tất cả các nút like
                  syncAllLikeButtons();

                  // Nếu unlike, cũng cập nhật lại listening history
                  if (!isLiked) {
                        // Đợi hiệu ứng animation hoàn thành
                        setTimeout(() => {
                              updateListeningHistorySection();
                        }, 600);
                  }
            }
      });

      // Thêm MutationObserver để phát hiện khi Recently Played được cập nhật
      const recentlyPlayedObserver = new MutationObserver(function(mutations) {
            // Kiểm tra xem có thay đổi trong Recently Played không
            let needSync = false;
            
            mutations.forEach(mutation => {
                  if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                        for (let i = 0; i < mutation.addedNodes.length; i++) {
                              const node = mutation.addedNodes[i];
                              if (node.nodeType === 1 && (
                                    node.classList.contains('track-card') || 
                                    node.querySelector('.track-card'))) {
                                    needSync = true;
                                    break;
                              }
                        }
                  }
            });
            
            if (needSync) {
                  console.log('Recently Played updated, syncing like buttons');
                  // Đợi một chút để DOM hoàn toàn cập nhật
                  setTimeout(syncAllLikeButtons, 100);
            }
      });

      // Bắt đầu theo dõi Recently Played container
      const recentlyPlayedContainer = document.querySelector('.recently-played');
      if (recentlyPlayedContainer) {
            recentlyPlayedObserver.observe(recentlyPlayedContainer, { 
                  childList: true, 
                  subtree: true 
            });
      }

      // Khởi tạo: kiểm tra trạng thái like ban đầu
      fetch('../model/getUserLikedTracks.php?full=true')
      .then(response => response.json())
      .then(data => {
            if (data.success && data.tracks) {
                  console.log('Initial liked tracks count:', data.tracks.length);
                  
                  // Khởi tạo tất cả tracks là false
                  const trackIds = getAllTrackIds();
                  trackIds.forEach(id => {
                        likedTracksCache[id] = false;
                  });
                  
                  // Đánh dấu tracks đã thích là true
                  data.tracks.forEach(track => {
                        likedTracksCache[track.track_id] = true;
                  });
                  
                  console.log('Initial like status cache:', likedTracksCache);
                  
                  // Đồng bộ UI
                  syncAllLikeButtons();
            }
      })
      .catch(error => console.error('Error initializing like state:', error));
});