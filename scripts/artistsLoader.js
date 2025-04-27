document.addEventListener('DOMContentLoaded', function() {
      // Add CSS for animations
      const style = document.createElement('style');
      style.textContent = `
            .artist-item {
                  transition: all 0.5s ease;
                  opacity: 1;
            }
            .artist-item.fade-out {
                  opacity: 0;
                  transform: translateY(20px);
            }
            .artist-item.fade-in {
                  animation: fadeIn 0.5s ease forwards;
            }
            @keyframes fadeIn {
                  from {
                        opacity: 0;
                        transform: translateY(-20px);
                  }
                  to {
                        opacity: 1;
                        transform: translateY(0);
                  }
            }
            .loading {
                  text-align: center;
                  padding: 20px;
                  font-style: italic;
                  color: #777;
            }
      `;
      document.head.appendChild(style);
  
      // Handle refresh button
      const refreshBtn = document.querySelector('.artists-follow .refresh-link');
      if (refreshBtn) {
          refreshBtn.addEventListener('click', function(e) {
              e.preventDefault();
              refreshArtistsList();
          });
      }
      
      function refreshArtistsList() {
          // Show loading effect
          const artistList = document.querySelector('.artist-list');
          
          // Fade out existing artists first
          const existingArtists = artistList.querySelectorAll('.artist-item');
          if (existingArtists.length > 0) {
              existingArtists.forEach(item => {
                  item.classList.add('fade-out');
              });
              
              // Wait for animation to complete before replacing content
              setTimeout(() => {
                  artistList.innerHTML = '<div class="loading">Đang tải...</div>';
                  loadNewArtists();
              }, 500);
          } else {
              artistList.innerHTML = '<div class="loading">Đang tải...</div>';
              loadNewArtists();
          }
      }
      
      function loadNewArtists() {
          // Add timestamp to prevent caching
          const timestamp = new Date().getTime();
          fetch(`../model/refreshArtists.php?t=${timestamp}`, {
              headers: {
                  'Cache-Control': 'no-cache',
                  'Pragma': 'no-cache'
              }
          })
          .then(response => {
              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }
              return response.json();
          })
          .then(data => {
              if (data.error) {
                  console.error('Error:', data.error);
                  const artistList = document.querySelector('.artist-list');
                  artistList.innerHTML = '<div class="error">Lỗi tải dữ liệu. Vui lòng thử lại.</div>';
                  return;
              }
              
              // Update artist list with more aggressive deduplication
              updateArtistsList(data);
              
              // Reinitialize follow buttons
              initFollowButtons();
          })
          .catch(error => {
              console.error('Error:', error);
              const artistList = document.querySelector('.artist-list');
              artistList.innerHTML = '<div class="error">Không thể tải dữ liệu. Vui lòng thử lại.</div>';
          });
      }
      
      // Enhanced function to filter duplicate artists by both ID and username
      function filterDuplicateArtists(artists) {
            // Use Set to track both IDs and usernames
            const seenIds = new Set();
            const seenUsernames = new Set();
            
            // Filter out duplicates based on both ID and username
            return artists.filter(artist => {
                  // Skip if either ID or username was already seen
                  if (seenIds.has(artist.id) || seenUsernames.has(artist.username)) {
                        console.log(`Filtered out duplicate: ${artist.username} (ID: ${artist.id})`);
                        return false;
                  }
                  
                  // Add both ID and username to sets
                  seenIds.add(artist.id);
                  seenUsernames.add(artist.username);
                  return true;
            });
      }
      
      function updateArtistsList(artists) {
            const artistList = document.querySelector('.artist-list');
            
            if (!artists || artists.length === 0) {
                  artistList.innerHTML = '<div class="no-artists">Không tìm thấy nghệ sĩ nào để theo dõi.</div>';
                  return;
            }
            
            // Apply enhanced deduplication before display
            const uniqueArtists = filterDuplicateArtists(artists);
            console.log(`Filtered ${artists.length - uniqueArtists.length} duplicate artists`);
            
            let html = '';
      
            uniqueArtists.forEach(artist => {
                  const followBtnClass = artist.is_following ? 'following' : '';
                  const followIcon = artist.is_following ? 'fa-user-check' : 'fa-user-plus';
                  const followText = artist.is_following ? 'Following' : 'Follow';
                  const profileImage = artist.profile_image ? `../${artist.profile_image}` : '../assets/images/defaults.jpg';
                  const displayName = artist.fullname || artist.username; // Use fullname if available, otherwise username
                  
                  html += `
                        <div class="artist-item" data-user-id="${artist.id}" data-username="${artist.username}">
                              <div class="artist-avatar">
                              <img src="${profileImage}" alt="${displayName}">
                              </div>
                              <div class="artist-info">
                              <p class="artist-name">${displayName}</p>
                              <div class="stats-and-button">
                                    <div class="artist-stats">
                                          <span class="follower-count"><i class="fas fa-user"></i> ${artist.follower || 0}</span>
                                          <span><i class="fas fa-music"></i> ${artist.track_count || 0}</span>
                                    </div>
                                    <button class="follow-btn ${followBtnClass}" data-user-id="${artist.id}">
                                          <i class="fas ${followIcon}"></i>
                                          ${followText}
                                    </button>
                              </div>
                              </div>
                        </div>
                  `;
            });
      
            artistList.innerHTML = html;
            
            // Add fade-in animation to new artists
            const newArtists = artistList.querySelectorAll('.artist-item');
            newArtists.forEach(item => {
                  item.classList.add('fade-in');
            });
      }
      
      // Thêm biến để tránh nhiều lần click
      let processingFollow = false;
      
      // Handle follow button clicks
      function handleFollowClick(e) {
          // Nếu đang xử lý, không cho click tiếp
          if (processingFollow) {
              return;
          }
          
          processingFollow = true;
          
          const button = e.currentTarget;
          const userId = button.getAttribute('data-user-id');
          const artistItem = button.closest('.artist-item');
          
          // Create FormData to send
          const formData = new FormData();
          formData.append('user_id', userId);
          
          // Temporarily change button state for immediate user feedback
          button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang xử lý...';
          button.disabled = true;
        
          // Generate a unique request ID to prevent duplicate requests
          const requestId = Date.now() + Math.random().toString(36).substring(2, 15);
          
          // Send request to server
          fetch('../model/toggleFollow.php', {
              method: 'POST',
              body: formData,
              // Prevent browser caching
              headers: {
                  'Cache-Control': 'no-cache, no-store, must-revalidate',
                  'Pragma': 'no-cache',
                  'Expires': '0',
                  'X-Request-ID': requestId
              }
          })
          .then(response => {
              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }
              return response.json();
          })
          .then(data => {
              if (data.error) {
                  console.error('Error:', data.error);
                  // Restore button state
                  restoreButtonState(button);
                  processingFollow = false;
                  return;
              }
              
              // Cập nhật số lượt following của user hiện tại nếu có
              // Chỉ hiển thị ở trang profile
              const profileFollowingEl = document.querySelector('.profile-stats .following-count');
              if (profileFollowingEl && data.newFollowingCount !== undefined) {
                  // Cập nhật số lượng following hiển thị trên profile
                  profileFollowingEl.textContent = data.newFollowingCount;
              }
              
              if (data.status === 'followed') {
                  if (data.newArtist) {
                      // Replace this artist with a new one with animation
                      replaceArtistWithNew(artistItem, data.newArtist);
                  } else {
                      // Just update the button state
                      button.classList.add('following');
                      button.innerHTML = '<i class="fas fa-user-check"></i> Following';
                      button.disabled = false;
                      
                      // Update follower count display with exact server value
                      if (data.newFollowerCount !== undefined) {
                          updateExactFollowerCount(userId, data.newFollowerCount);
                      }
                  }
              } else if (data.status === 'unfollowed') {
                  button.classList.remove('following');
                  button.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
                  button.disabled = false;
                  
                  // Update follower count display with exact server value
                  if (data.newFollowerCount !== undefined) {
                      updateExactFollowerCount(userId, data.newFollowerCount);
                  }
              }
              
              // Reset processing flag after a small delay
              setTimeout(() => {
                  processingFollow = false;
              }, 300);
          })
          .catch(error => {
              console.error('Error:', error);
              // Restore button state
              restoreButtonState(button);
              processingFollow = false;
          });
      }
      
      // Restore button state based on its class
      function restoreButtonState(button) {
          if (button.classList.contains('following')) {
              button.innerHTML = '<i class="fas fa-user-check"></i> Following';
          } else {
              button.innerHTML = '<i class="fas fa-user-plus"></i> Follow';
          }
          button.disabled = false;
      }
      
      // Replace followed artist with a new one
      function replaceArtistWithNew(artistItem, newArtist) {
          if (!newArtist) return;
          
          // Check if this artist already exists in the list
          const existingArtist = document.querySelector(`.artist-item[data-user-id="${newArtist.id}"]`);
          if (existingArtist) {
              console.log(`Artist ${newArtist.username} (ID: ${newArtist.id}) already exists, skipping`);
              
              // Instead of adding a duplicate, just remove the current one
              artistItem.classList.add('fade-out');
              setTimeout(() => {
                  artistItem.remove();
                  processingFollow = false;
              }, 500);
              return;
          }
          
          // Fade out the current artist
          artistItem.classList.add('fade-out');
          
          setTimeout(() => {
              const profileImage = newArtist.profile_image ? `../${newArtist.profile_image}` : '../assets/images/defaults.jpg';
              const displayName = newArtist.fullname || newArtist.username; // Use fullname if available, otherwise username
              
              const newArtistHTML = `
                  <div class="artist-item fade-in" data-user-id="${newArtist.id}" data-username="${newArtist.username}">
                      <div class="artist-avatar">
                          <img src="${profileImage}" alt="${displayName}">
                      </div>
                      <div class="artist-info">
                          <p class="artist-name">${displayName}</p>
                          <div class="stats-and-button">
                              <div class="artist-stats">
                                  <span class="follower-count"><i class="fas fa-user"></i> ${newArtist.follower || 0}</span>
                                  <span><i class="fas fa-music"></i> ${newArtist.track_count || 0}</span>
                              </div>
                              <button class="follow-btn" data-user-id="${newArtist.id}">
                                  <i class="fas fa-user-plus"></i>
                                  Follow
                              </button>
                          </div>
                      </div>
                  </div>
              `;
              
              // Insert new artist and remove the old one
              artistItem.insertAdjacentHTML('afterend', newArtistHTML);
              artistItem.remove();
              
              // Add event listener to the new button
              const newButton = document.querySelector(`.artist-item[data-user-id="${newArtist.id}"] .follow-btn`);
              if (newButton) {
                  newButton.addEventListener('click', handleFollowClick);
              }
              
              // Reset processing flag
              processingFollow = false;
          }, 500); // Wait for fade-out animation to complete
      }
      
      // Update follower count with exact value from server
      function updateExactFollowerCount(userId, count) {
          const artistItem = document.querySelector(`.artist-item[data-user-id="${userId}"]`);
          if (!artistItem) return;
          
          const followerEl = artistItem.querySelector('.follower-count');
          if (!followerEl) return;
          
          followerEl.innerHTML = `<i class="fas fa-user"></i> ${count}`;
      }
      
      // Initialize Follow buttons
      function initFollowButtons() {
          const followButtons = document.querySelectorAll('.follow-btn');
          followButtons.forEach(button => {
              button.removeEventListener('click', handleFollowClick); // To avoid registering multiple times
              button.addEventListener('click', handleFollowClick);
          });
      }
      
      // Call initialization function on first load
      initFollowButtons();

      // Refresh artists list on page load
      // refreshArtistsList();
});