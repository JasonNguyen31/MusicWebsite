document.addEventListener('DOMContentLoaded', function() {
      console.log("Tệp JS thứ nhất đã tải");
      console.log("window.audioPlayerActions tồn tại:", typeof window.audioPlayerActions !== 'undefined');
      console.log("Các phương thức của audioPlayerActions:", window.audioPlayerActions ? Object.keys(window.audioPlayerActions) : 'không tồn tại');
      
      // Đợi một chút để đảm bảo tất cả các tệp JS khác đã tải
      setTimeout(function() {
          console.log("Kiểm tra sau 500ms:");
          console.log("window.audioPlayerActions tồn tại:", typeof window.audioPlayerActions !== 'undefined');
          console.log("Các phương thức của audioPlayerActions:", window.audioPlayerActions ? Object.keys(window.audioPlayerActions) : 'không tồn tại');
      }, 500);
});

// Hàm tìm đối tượng audio
function findAudioElement() {
      // Kiểm tra biến audio toàn cục
      if (typeof window.audio !== 'undefined' && window.audio instanceof HTMLAudioElement) {
          return window.audio;
      }
      
      // Tìm tất cả các thẻ audio trong trang
      const audioElements = document.getElementsByTagName('audio');
      if (audioElements.length > 0) {
          return audioElements[0];
      }
      
      // Tạo một thẻ audio mới nếu không tìm thấy
      const newAudio = document.createElement('audio');
      document.body.appendChild(newAudio);
      return newAudio;
}

// Lưu trữ ID của track mới nhất
let mostRecentTrackId = null;
// Lưu trạng thái hiện tại của các track
let currentTrackIds = [];
// Flag để kiểm tra nếu đây là lần tải đầu tiên
let isFirstLoad = true;

// Hàm tạo HTML cho một track card
function generateTrackCardHTML(track, isNewest = false, playPauseIcon = 'fa-play') {
      const highlightClass = isNewest ? 'highlight-track' : '';
      return `
            <div class="track-card ${highlightClass}" data-track-id="${track.track_id}">
                  <div class="track-artwork">
                        <img src="../${track.image_url || 'assets/images/defaults.jpg'}" alt="${track.track_name || 'Track'}">
                        
                        <!-- Nút play ở giữa với icon động -->
                        <button class="track-play-pause" data-file="${track.file_url || ''}">
                              <i class="fas ${playPauseIcon}"></i>
                        </button>
            
                        <!-- Phần còn lại giữ nguyên -->
                        <div class="track-controls">
                              <button class="love-button">
                                    <i class="fas fa-heart"></i>
                              </button>
                              <button class="more-options">
                                    <i class="fas fa-ellipsis-h"></i>
                              </button>
                        </div>
            
                        <div class="recomment-tag">RECENTLY TRACKS</div>
                  </div>
                  <div class="track-info">
                        <h3 class="track-title">${track.track_name || 'Unknown Track'}</h3>
                        <p class="track-artist">${track.artist || 'Unknown Artist'}</p>
                  </div>
            </div>
      `;
}

document.addEventListener('DOMContentLoaded', function() {
      // Đảm bảo chúng ta tải sau khi trình phát âm thanh đã sẵn sàng
      setTimeout(initRecentTracksLoader, 500);
});

function initRecentTracksLoader() {
      // Tìm đối tượng audio
      const audioElement = findAudioElement();

      // Đợi một chút để đảm bảo audio player đã được khởi tạo
      setTimeout(() => {
            updateRecentlyPlayed();
      }, 1000);

      // Cập nhật định kỳ
      setInterval(updateRecentlyPlayed, 10000);
      if (audioElement) {
            // Gắn sự kiện play/pause cho audio element
            audioElement.addEventListener('play', function() {
                  setTimeout(updateRecentlyPlayed, 100);
            });
            
            audioElement.addEventListener('pause', function() {
                  setTimeout(updateRecentlyPlayed, 100);
            });
      }
      
      // Theo dõi nút play để cập nhật tracks
      document.addEventListener('click', function(e) {
            const target = e.target.closest('.track-play-pause');
            if (target) {
                  // Cập nhật nhanh hơn
                  setTimeout(updateRecentlyPlayed, 1000);
            }
      });
}

function updateRecentlyPlayed() {
      // Thêm timestamp để tránh cache
      fetch('../api/getRecentTracks.php?t=' + new Date().getTime())
      .then(response => {
          if (!response.ok) {
              throw new Error('Network response was not ok: ' + response.status);
          }
          return response.json();
      })
      .then(tracks => {
          const trackWrapper = document.querySelector('.recently-played .track-cards-wrapper');
          
          if (!trackWrapper) {
              return;
          }
          
          // Nếu không có track hoặc có lỗi, hiển thị thông báo
          if (!tracks || tracks.length === 0 || tracks.error) {
              trackWrapper.innerHTML = `
                  <div class="no-recent-tracks">
                      <p>You haven't played any songs recently.</p>
                  </div>
              `;
              return;
          }
          
          // QUAN TRỌNG: Lấy thông tin về track hiện tại và trạng thái phát
          const currentTrackId = typeof window.audioPlayerActions !== 'undefined' ? 
                                window.audioPlayerActions.getCurrentTrack() : null;
          const audioElement = findAudioElement();
          const isPlaying = audioElement ? !audioElement.paused : false;
          
          console.log("Track hiện tại:", currentTrackId, "Đang phát:", isPlaying);
          
          // Cập nhật biến lưu trữ track mới nhất
          mostRecentTrackId = tracks[0].track_id;
          
          // Cập nhật danh sách track ID hiện tại
          currentTrackIds = tracks.map(track => track.track_id);
          
          // Tạo HTML cho tất cả các track
          let tracksHTML = '';
          
          tracks.forEach((track, index) => {
              // Kiểm tra xem track này có phải là track đang phát không
              const isCurrentTrack = track.track_id === currentTrackId;
              
              // QUAN TRỌNG: Nếu là track hiện tại và đang phát, hiển thị nút pause; ngược lại hiển thị nút play
              const playPauseIcon = (isCurrentTrack && isPlaying) ? 'fa-pause' : 'fa-play';
              
              tracksHTML += generateTrackCardHTML(track, false, playPauseIcon);
          });
          
          // Cập nhật phần tử với các track mới
          trackWrapper.innerHTML = tracksHTML;
          
          // Đính kèm event listeners
          attachTrackEventListeners();
      })
      .catch(error => {
          // Xử lý lỗi khi tải dữ liệu
          console.error("Lỗi khi tải danh sách bài hát gần đây:", error);
      });
  }

// Hàm đính kèm event listeners cho track cards
function attachTrackEventListeners() {

      const trackPlayButtons = document.querySelectorAll('.recently-played .track-play-pause');
      console.log("Số lượng nút play được tìm thấy:", trackPlayButtons.length);
      
      trackPlayButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                  e.stopPropagation();
                  const trackId = this.closest('.track-card').dataset.trackId;
                  console.log("Đã nhấp vào nút play cho track ID:", trackId);
    
                  // Gọi hàm phát nhạc
                  if (typeof window.audioPlayerActions !== 'undefined' && typeof window.audioPlayerActions.playTrack === 'function') {
                        console.log("Gọi window.audioPlayerActions.playTrack");
                        window.audioPlayerActions.playTrack(trackId);
                        
                        // Cập nhật icon - Thêm đoạn này
                        const icon = this.querySelector('i');
                        if (icon) {
                              // Đợi một chút để đảm bảo trạng thái audio đã được cập nhật
                              setTimeout(() => {
                              // Kiểm tra xem bài hát hiện tại có phải là bài vừa click không
                              if (window.audioPlayerActions.getCurrentTrack() === trackId) {
                                    icon.classList.replace('fa-play', 'fa-pause');
                              }
                              }, 200);
                        }
                  } else {
                        console.error('Không tìm thấy hàm playTrackById hoặc window.audioPlayerActions.playTrack');
                        // Kiểm tra xem có hàm nào khả dụng không
                        console.log("window.audioPlayerActions tồn tại:", typeof window.audioPlayerActions !== 'undefined');
                        console.log("playTrackById tồn tại:", typeof playTrackById !== 'undefined');
                        console.log("Các hàm có sẵn trên window:", Object.keys(window).filter(key => typeof window[key] === 'function').slice(0, 20));
                  }
            });
      });
      
      // Thêm event listeners khác nếu cần (cho nút tim, v.v.)
      const loveButtons = document.querySelectorAll('.recently-played .love-button');
      loveButtons.forEach(button => {
            button.addEventListener('click', function(e) {
                  e.stopPropagation();
                  // Thêm chức năng yêu thích track tại đây
                  this.querySelector('i').classList.toggle('active');
            });
      });
}

// Cập nhật ban đầu khi trang tải
document.addEventListener('DOMContentLoaded', function() {
      updateRecentlyPlayed();
      
      // Cập nhật mỗi 10 giây 
      setInterval(updateRecentlyPlayed, 10000);
      
      // Cập nhật khi một track mới được phát
      if (window.addEventListener) {
            window.addEventListener('trackPlayed', function() {
                  // Đợi một chút để cơ sở dữ liệu cập nhật
                  setTimeout(updateRecentlyPlayed, 1000);
            });
      }
});

// Tạo một sự kiện tùy chỉnh sẽ được kích hoạt khi một track được phát
const trackPlayedEvent = new CustomEvent('trackPlayed');

// Hàm để ghi đè hàm playTrackById hiện có
function extendPlayTrackById() {
      // Lưu tham chiếu đến hàm gốc
      if (typeof window.originalPlayTrackById !== 'function') {
      window.originalPlayTrackById = window.playTrackById;
      }
      
      // Ghi đè hàm
      window.playTrackById = function(trackId) {
      // Gọi hàm gốc
      window.originalPlayTrackById(trackId);
      
      // Phát sự kiện tùy chỉnh
      window.dispatchEvent(trackPlayedEvent);
      };
}

// Thực thi việc ghi đè khi script tải
// Điều này đảm bảo sự kiện tùy chỉnh của chúng ta được kích hoạt khi một track được phát
if (typeof window.playTrackById === 'function') {
      extendPlayTrackById();
} else {
      // Nếu playTrackById chưa được tải, đợi và thử lại
      window.addEventListener('load', function() {
      if (typeof window.playTrackById === 'function') {
            extendPlayTrackById();
      }
      });
}

// Lắng nghe sự kiện pause từ trình phát âm thanh
document.addEventListener('DOMContentLoaded', function() {
      // Tìm đối tượng audio
      const audioElement = findAudioElement();

      if (audioElement) {
            // Sự kiện pause
            audioElement.addEventListener('pause', function() {
                // Cập nhật tất cả icon play/pause trong phần Recently
                updateRecentTrackIcons();
                // Cập nhật lại danh sách bài hát gần đây sau một khoảng thời gian ngắn
                setTimeout(updateRecentlyPlayed, 100);
            });
            
            // Sự kiện play
            audioElement.addEventListener('play', function() {
                // Cập nhật tất cả icon play/pause trong phần Recently
                updateRecentTrackIcons();
                // Cập nhật lại danh sách bài hát gần đây sau một khoảng thời gian ngắn
                setTimeout(updateRecentlyPlayed, 100);
            });
      }
});
  
// Thêm hàm mới để cập nhật tất cả icon
function updateRecentTrackIcons() {
      // Đợi một chút để đảm bảo trạng thái audio đã được cập nhật
      setTimeout(() => {
            const currentTrackId = typeof window.audioPlayerActions !== 'undefined' ? 
                                    window.audioPlayerActions.getCurrentTrack() : null;
            const isPlaying = findAudioElement() ? !findAudioElement().paused : false;
            
            // Cập nhật tất cả các nút play trong phần Recently
            const trackPlayButtons = document.querySelectorAll('.recently-played .track-play-pause');
            
            trackPlayButtons.forEach(button => {
                  const icon = button.querySelector('i');
                  if (!icon) return;
                  
                  const trackCard = button.closest('.track-card');
                  if (!trackCard) return;
                  
                  const trackId = trackCard.dataset.trackId;
                  
                  // Nếu đây là track hiện tại và đang phát
                  if (trackId === currentTrackId && isPlaying) {
                        icon.classList.replace('fa-play', 'fa-pause');
                  } else {
                        icon.classList.replace('fa-pause', 'fa-play');
                  }
            });
      }, 100);
}

window.addEventListener('audioPlayStateChanged', function(e) {
      updateRecentTrackIcons();
});
  
// Lắng nghe sự kiện thay đổi track
window.addEventListener('audioTrackChanged', function(e) {
      updateRecentTrackIcons();
});