// Hàm để xử lý việc hiển thị tags
function renderTags(trackElement, allTags) {
      const genreContainer = trackElement.querySelector('.track-genre');
      genreContainer.innerHTML = ''; // Xóa nội dung cũ
  
      // Hiển thị 2 tags đầu tiên
      for (let i = 0; i < Math.min(2, allTags.length); i++) {
          const tagSpan = document.createElement('span');
          tagSpan.className = 'genre-tag';
          tagSpan.textContent = allTags[i];
          genreContainer.appendChild(tagSpan);
      }
  
      // Nếu có nhiều hơn 2 tags, hiển thị "+X"
      if (allTags.length > 2) {
          const moreSpan = document.createElement('span');
          moreSpan.className = 'genre-tag more-tags';
          moreSpan.textContent = `+${allTags.length - 2}`;
          moreSpan.onclick = function(e) {
              e.stopPropagation(); // Ngăn chặn sự kiện click lan ra ngoài
          
              // Tạo popup để hiển thị những tags còn lại
              let popup = document.querySelector('.tags-popup');
              if (!popup) {
                  popup = document.createElement('div');
                  popup.className = 'tags-popup';
                  document.body.appendChild(popup);
                  
                  // Thêm CSS cho popup
                  popup.style.position = 'absolute';
                  popup.style.zIndex = '1000';
                  popup.style.backgroundColor = 'rgba(0, 0, 0, 0.68)';
                  popup.style.padding = '4px';
                  popup.style.borderRadius = '10px';
                  popup.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                  popup.style.display = 'none';
                  popup.style.transition = 'opacity 0.2s ease-in-out';
                  popup.style.opacity = '0';
              }
          
              popup.innerHTML = '';
          
              // Chỉ thêm các tags còn lại vào popup (không hiển thị 2 tag đầu)
              for (let i = 2; i < allTags.length; i++) {
                  const tagSpan = document.createElement('span');
                  tagSpan.className = 'genre-tag';
                  tagSpan.textContent = allTags[i];
                  tagSpan.style.marginRight = '5px';
                  tagSpan.style.marginBottom = '5px';
                  tagSpan.style.display = 'inline-block';
                  popup.appendChild(tagSpan);
              }
          
              // Vị trí của popup - điều chỉnh chính xác theo nút "+X"
              const moreRect = moreSpan.getBoundingClientRect();
              
              // Hiển thị popup ngay dưới nút "+X", căn theo nút
              popup.style.top = (moreRect.bottom + window.scrollY + 5) + 'px';
              popup.style.left = (moreRect.left + window.scrollX) + 'px';
              
              // Kiểm tra xem popup có vượt ra ngoài màn hình không
              setTimeout(() => {
                  const popupRect = popup.getBoundingClientRect();
                  if (popupRect.right > window.innerWidth) {
                      // Nếu vượt ra khỏi cạnh phải màn hình, dịch sang trái
                      popup.style.left = (window.innerWidth - popupRect.width - 20 + window.scrollX) + 'px';
                  }
              }, 0);
              
              // Hiển thị popup với hiệu ứng fade in
              popup.style.display = 'block';
              setTimeout(() => {
                  popup.style.opacity = '1';
              }, 10);
              
              // Đóng popup khi click bên ngoài
              const closePopup = function(event) {
                  if (!popup.contains(event.target) && event.target !== moreSpan) {
                      popup.style.opacity = '0';
                      setTimeout(() => {
                          popup.style.display = 'none';
                      }, 200);
                      document.removeEventListener('click', closePopup);
                  }
              };
          
              setTimeout(() => {
                  document.addEventListener('click', closePopup);
              }, 100);
          };
      
          genreContainer.appendChild(moreSpan);
      }
  }
  
  document.addEventListener('DOMContentLoaded', function() {
      console.log('Script hiển thị tags đã được tải');
      // Tìm tất cả các phần tử track-item
      const trackItems = document.querySelectorAll('.track-item');
      console.log('Số lượng track-item tìm thấy:', trackItems.length);
      
      // Thêm CSS cho popup vào document
      const style = document.createElement('style');
      style.textContent = `
            .tags-popup {
                  position: absolute;
                  z-index: 1000;
                  background-color: rgba(131, 131, 131, 0.23);
                  padding: 8px;
                  border-radius: 4px;
                  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.49);
                  transition: opacity 0.2s ease-in-out;
            }
          
            .genre-tag {
                  display: inline-block;
                  padding: 3px 8px;
                  margin-right: 5px;
                  margin-bottom: 5px;
                  background-color: rgba(131, 131, 131, 0.23);
                  color: white;
                  border-radius: 50px;
                  font-size: 12px;
            }
            
            .more-tags {
                  cursor: pointer;
                  background-color: rgba(131, 131, 131, 0.23);
            }
            
            .more-tags:hover {
                  background-color: rgba(131, 131, 131, 0.59);
            }
      `;
      document.head.appendChild(style);
      
      trackItems.forEach(trackElement => {
          const genreContainer = trackElement.querySelector('.track-genre');
          if (genreContainer) {
              // Lấy tags từ thuộc tính data-tags
              const tagsString = genreContainer.getAttribute('data-tags');
              console.log('Tags string cho track:', tagsString);
              
              // Phân tích tags 
              let allTags = [];
              if (tagsString && tagsString.trim() !== '') {
                  // Phân tách tags bằng dấu cách, dấu phẩy hoặc dấu chấm phẩy
                  allTags = tagsString.split(/[\s,;]+/)
                      .map(tag => tag.trim())
                      .filter(tag => tag !== '');
              }
              
              console.log('Đã phân tích tags:', allTags);
              
              // Render tags
              renderTags(trackElement, allTags);
          } else {
              console.log('Không tìm thấy .track-genre trong track-item');
          }
      });
  
      // Xử lý hiệu ứng khi trang được load từ uploadDetails.php
      if (window.location.search.includes('upload_success=1')) {
          // Tự động scroll đến track mới nhất
          const firstTrack = document.querySelector('.track-item');
          if (firstTrack) {
              firstTrack.scrollIntoView({ behavior: 'smooth', block: 'center' });
              firstTrack.classList.add('highlight-track');
              
              // Xóa highlight sau 3 giây
              setTimeout(function() {
                  firstTrack.classList.remove('highlight-track');
              }, 3000);
          }
      }
  
      // Hàm cập nhật số lượt nghe
      function updatePlayCount(trackId) {
          fetch('../model/updatePlayCount.php', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: 'track_id=' + trackId
          })
          .then(response => response.json())
          .then(data => {
              if (data.success) {
                  // Cập nhật số lượt nghe trên giao diện
                  const trackItem = document.querySelector(`.track-item[data-track-id="${trackId}"]`);
                  const playsElement = trackItem.querySelector('.track-plays');
                  playsElement.innerHTML = `<i class="fas fa-play"></i> ${data.play_count}`;
              }
          })
          .catch(error => console.error('Error:', error));
      }
  });