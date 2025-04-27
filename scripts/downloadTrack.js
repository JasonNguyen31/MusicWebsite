document.addEventListener('DOMContentLoaded', function() {
      // Lấy tất cả các nút "more-options" (ba chấm)
      const moreOptionsButtons = document.querySelectorAll('.more-options');
      
      // Thêm sự kiện click cho mỗi nút
      moreOptionsButtons.forEach(button => {
            button.addEventListener('click', function(event) {
                  // Ngăn chặn sự kiện lan ra ngoài và ngăn hành vi mặc định
                  event.stopPropagation();
                  event.preventDefault();
                  
                  // Lấy track card chứa nút này
                  const trackCard = this.closest('.track-card');
                  if (!trackCard) return;
                  
                  // Lấy track ID từ data attribute
                  const trackId = trackCard.dataset.trackId;
                  if (!trackId) return;
                  
                  // Kiểm tra xem dropdown đã tồn tại chưa
                  let dropdown = document.querySelector(`.dropdown-menu[data-track-id="${trackId}"]`);
                  
                  // Nếu dropdown đã tồn tại, đóng nó và return
                  if (dropdown) {
                        dropdown.remove();
                        return;
                  }
              
                  // Xóa tất cả các dropdown khác trước khi tạo cái mới
                  document.querySelectorAll('.dropdown-menu').forEach(menu => menu.remove());
              
                  // Tạo dropdown menu
                  dropdown = document.createElement('div');
                  dropdown.className = 'dropdown-menu';
                  dropdown.dataset.trackId = trackId;
              
                  // Tính toán vị trí hiển thị dropdown (bên cạnh nút more-options)
                  const buttonRect = this.getBoundingClientRect();
                  dropdown.style.position = 'absolute';
                  dropdown.style.top = `${buttonRect.bottom}px`;
                  dropdown.style.left = `${buttonRect.left}px`;
                  dropdown.style.zIndex = '1000';
                  dropdown.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                  dropdown.style.borderRadius = '4px';
                  dropdown.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
                  dropdown.style.padding = '8px 0';
                  dropdown.style.minWidth = '150px';
              
                  // Thêm các tùy chọn vào dropdown
                  dropdown.innerHTML = `
                        <div class="dropdown-item download" data-track-id="${trackId}">
                              <i class="fas fa-download"></i> Download
                        </div>
                        <div class="dropdown-item add-to-playlist">
                              <i class="fas fa-list"></i> Add to playlist
                        </div>
                  `;
              
                  // Thêm CSS cho các item trong dropdown
                  const style = document.createElement('style');
                  style.textContent = `
                        .dropdown-item {
                              padding: 8px 16px;
                              color: #fff;
                              font-size: 14px;
                              cursor: pointer;
                              display: flex;
                              align-items: center;
                              transition: background-color 0.2s;
                        }
                        .dropdown-item:hover {
                              color: #ff5500 !important;
                        }
                        .dropdown-item i {
                              margin-right: 10px;
                              width: 16px;
                              text-align: center;
                        }
                  `;
                  document.head.appendChild(style);
              
                  // Thêm dropdown vào DOM
                  document.body.appendChild(dropdown);
                  
                  // Thêm sự kiện click cho tùy chọn download
                  dropdown.querySelector('.dropdown-item.download').addEventListener('click', function() {
                        downloadTrack(this.dataset.trackId);
                  });
              
                  // Xử lý click bên ngoài dropdown để đóng nó
                  document.addEventListener('click', function closeDropdown(e) {
                        if (!dropdown.contains(e.target) && e.target !== button) {
                        dropdown.remove();
                        document.removeEventListener('click', closeDropdown);
                        }
                  });
            });
      });
      
      // Hàm tải nhạc
      function downloadTrack(trackId) {
            // Hiển thị thông báo đang tải
            showDownloadingToast();
            
            // Gọi API để lấy URL của file nhạc
            fetch(`../model/getTrackInfo.php?track_id=${trackId}`)
            .then(response => response.json())
            .then(data => {
                  if (data.success) {
                        // Tạo liên kết tải xuống
                        const downloadLink = document.createElement('a');
                        downloadLink.href = `../${data.file_url}`;
                        downloadLink.download = data.track_name || `track-${trackId}.mp3`;
                        
                        // Thêm vào DOM, click, và xóa
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                        
                        // Hiển thị thông báo tải thành công
                        showSuccessToast('Track downloaded successfully!');
                  } else {
                        showErrorToast('Cannot download this track: ' + (data.message || 'Unknown error'));
                  }
            })
            .catch(error => {
                  console.error('Error fetching track info:', error);
                  showErrorToast('Error downloading track. Please try again.');
            });
      }
      
      // Hàm hiển thị thông báo toast
      function createToast(message, type) {
            // Xóa toast cũ nếu có
            const existingToast = document.querySelector('.toast-notification');
            if (existingToast) {
                  existingToast.remove();
            }
          
            // Tạo phần tử toast
            const toast = document.createElement('div');
            toast.className = `toast-notification ${type}`;
            
            // Chọn icon dựa trên loại thông báo
            let icon = 'info-circle';
            if (type === 'success') icon = 'check-circle';
            if (type === 'error') icon = 'exclamation-circle';
            if (type === 'downloading') icon = 'spinner fa-spin';
          
            toast.innerHTML = `
                  <i class="fas fa-${icon}"></i>
                  <span>${message}</span>
            `;
          
            // Thêm CSS cho toast
            const style = document.createElement('style');
            style.textContent = `
                  .toast-notification {
                        position: fixed;
                        bottom: 20px;
                        right: 20px;
                        padding: 12px 20px;
                        border-radius: 4px;
                        color: white;
                        display: flex;
                        align-items: center;
                        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                        z-index: 10000;
                        min-width: 250px;
                        animation: slideIn 0.3s, fadeOut 0.5s 2.5s forwards;
                        font-family: Arial, sans-serif;
                  }
                  .toast-notification.success {
                        background-color: #4CAF50;
                  }
                  .toast-notification.error {
                        background-color: #F44336;
                  }
                  .toast-notification.info {
                        background-color: #2196F3;
                  }
                  .toast-notification.downloading {
                        background-color: #FF9800;
                  }
                  .toast-notification i {
                        margin-right: 10px;
                        font-size: 18px;
                  }
                  @keyframes slideIn {
                        from { transform: translateX(100%); }
                        to { transform: translateX(0); }
                  }
                  @keyframes fadeOut {
                        from { opacity: 1; }
                        to { opacity: 0; visibility: hidden; }
                  }
            `;
            document.head.appendChild(style);
            
            // Thêm toast vào DOM
            document.body.appendChild(toast);
            
            // Xóa toast sau 3 giây
            setTimeout(() => {
                  if (toast.parentNode) {
                        toast.parentNode.removeChild(toast);
                  }
            }, 3000);
            
            return toast;
      }
      
      function showSuccessToast(message) {
            return createToast(message, 'success');
      }
      
      function showErrorToast(message) {
            return createToast(message, 'error');
      }
      
      function showDownloadingToast() {
            return createToast('Downloading track...', 'downloading');
      }
      
      // Lắng nghe các thay đổi DOM để gắn sự kiện cho các nút mới được thêm vào
      // (ví dụ: khi tải thêm bài hát)
      const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                  if (mutation.addedNodes.length) {
                        mutation.addedNodes.forEach(function(node) {
                              if (node.nodeType === 1) { // Chỉ xử lý các phần tử node
                                    const newButtons = node.querySelectorAll('.more-options');
                                    if (newButtons.length) {
                                          newButtons.forEach(button => {
                                                // Kiểm tra xem nút đã có sự kiện chưa
                                                if (!button.hasAttribute('data-event-attached')) {
                                                      button.setAttribute('data-event-attached', 'true');
                                                      button.addEventListener('click', function(event) {
                                                            event.stopPropagation();
                                                            event.preventDefault();
                                                            
                                                            const trackCard = this.closest('.track-card');
                                                            if (!trackCard) return;
                                                            
                                                            const trackId = trackCard.dataset.trackId;
                                                            if (!trackId) return;
                                                            
                                                            let dropdown = document.querySelector(`.dropdown-menu[data-track-id="${trackId}"]`);
                                                            
                                                            if (dropdown) {
                                                                  dropdown.remove();
                                                                  return;
                                                            }
                                                            
                                                            document.querySelectorAll('.dropdown-menu').forEach(menu => menu.remove());
                                                            
                                                            dropdown = document.createElement('div');
                                                            dropdown.className = 'dropdown-menu';
                                                            dropdown.dataset.trackId = trackId;
                                                            
                                                            const buttonRect = this.getBoundingClientRect();
                                                            dropdown.style.position = 'absolute';
                                                            dropdown.style.top = `${buttonRect.bottom}px`;
                                                            dropdown.style.left = `${buttonRect.left}px`;
                                                            dropdown.style.zIndex = '1000';
                                                            // Add missing styling properties
                                                            dropdown.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
                                                            dropdown.style.borderRadius = '4px';
                                                            dropdown.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.3)';
                                                            dropdown.style.padding = '8px 0';
                                                            dropdown.style.minWidth = '150px';
                                                            
                                                            dropdown.innerHTML = `
                                                                  <div class="dropdown-item download" data-track-id="${trackId}">
                                                                        <i class="fas fa-download"></i> Download
                                                                  </div>
                                                                  <div class="dropdown-item add-to-playlist">
                                                                        <i class="fas fa-list"></i> Add to playlist
                                                                  </div>
                                                            `;
                                                            
                                                            document.body.appendChild(dropdown);
                                                            
                                                            dropdown.querySelector('.dropdown-item.download').addEventListener('click', function() {
                                                                  downloadTrack(this.dataset.trackId);
                                                            });
                                                            
                                                            document.addEventListener('click', function closeDropdown(e) {
                                                                  if (!dropdown.contains(e.target) && e.target !== button) {
                                                                        dropdown.remove();
                                                                        document.removeEventListener('click', closeDropdown);
                                                                  }
                                                            });
                                                      });
                                                }
                                          });
                                    }
                              }
                        });
                  }
            });
      });
      
      // Theo dõi các thay đổi DOM trong container track
      const trackContainer = document.querySelector('.track-container');
      if (trackContainer) {
            observer.observe(trackContainer, {
                  childList: true,
                  subtree: true
            });
      }
  });