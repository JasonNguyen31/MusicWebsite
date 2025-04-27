document.addEventListener('DOMContentLoaded', function() {
    // Lấy các phần tử DOM
    const viewAllBtn = document.querySelector('.view-all');
    const followingPopup = document.getElementById('followingPopup');
    const closePopupBtn = document.querySelector('.close-popup');
    const followingCountElement = document.querySelector('.stat-counter:nth-child(2) .stat-number');
    const followingHeaderCount = document.querySelector('.sidebar-header h3');
    
    // Hiển thị popup khi nhấn "View all"
    if (viewAllBtn) {
        viewAllBtn.addEventListener('click', function(e) {
            e.preventDefault();
            followingPopup.classList.add('popup-show');
        });
    }
    
    // Đóng popup khi nhấn nút đóng
    if (closePopupBtn) {
        closePopupBtn.addEventListener('click', function() {
            followingPopup.classList.remove('popup-show');
        });
    }
    
    // Đóng popup khi nhấn bên ngoài
    window.addEventListener('click', function(e) {
        if (e.target === followingPopup) {
            followingPopup.classList.remove('popup-show');
        }
    });
    
    // Xử lý sự kiện unfollow
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('unfollow-btn') || e.target.closest('.unfollow-btn')) {
            const button = e.target.classList.contains('unfollow-btn') ? e.target : e.target.closest('.unfollow-btn');
            const userId = button.getAttribute('data-user-id');
            const artistItem = button.closest('.artist-item');
            
            if (userId && artistItem) {
                unfollowUser(userId, artistItem);
            }
        }
    });
    
    // Hàm xử lý unfollow user
    function unfollowUser(targetUserId, artistItem) {
        // Hiển thị trạng thái loading trên nút
        const button = artistItem.querySelector('.unfollow-btn');
        const originalText = button.textContent;
        button.textContent = 'Processing...';
        button.disabled = true;
        
        // Gửi request đến server để unfollow
        fetch('../model/unfollowUser.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'target_user_id=' + targetUserId
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Xóa artist-item khỏi danh sách hiện tại
                animateAndRemove(artistItem);
                
                // Đồng bộ hóa: Tìm và xóa cả phần tử trong popup và artist-list
                syncUnfollowAcrossLists(targetUserId, artistItem);
                
                // Cập nhật số lượng following
                updateFollowingCount();
            } else {
                // Nếu có lỗi, reset lại button
                button.textContent = originalText;
                button.disabled = false;
                alert('Failed to unfollow user: ' + (data.message || 'Unknown error'));
            }
        })
        .catch(error => {
            console.error('Error:', error);
            button.textContent = originalText;
            button.disabled = false;
            alert('An error occurred. Please try again.');
        });
    }
    
    // Hàm đồng bộ hóa unfollow giữa popup và artist-list
    function syncUnfollowAcrossLists(userId, originItem) {
        // Xác định xem hành động unfollow bắt đầu từ popup hay artist-list
        const isFromPopup = originItem.closest('.popup-body') !== null;
        
        if (isFromPopup) {
            // Nếu unfollow từ popup, tìm và xóa artist-item trong artist-list
            const mainListItem = document.querySelector(`.artist-list .artist-item[data-user-id="${userId}"]`);
            if (mainListItem) {
                animateAndRemove(mainListItem);
            }
        } else {
            // Nếu unfollow từ artist-list, tìm và xóa artist-item trong popup
            const popupItem = document.querySelector(`.all-following-list .artist-item[data-user-id="${userId}"]`);
            if (popupItem) {
                animateAndRemove(popupItem);
            }
        }
    }
    
    // Hàm hiệu ứng xóa phần tử
    function animateAndRemove(element) {
        element.style.transition = 'opacity 0.3s, transform 0.3s';
        element.style.opacity = '0';
        element.style.transform = 'translateX(20px)';
        
        setTimeout(() => {
            element.remove();
            
            // Kiểm tra nếu danh sách trống
            checkEmptyLists();
        }, 300);
    }
    
    // Hàm cập nhật số lượng following
    function updateFollowingCount() {
        const currentCount = parseInt(followingCountElement.textContent);
        const newCount = Math.max(0, currentCount - 1);
        
        // Cập nhật số lượng following ở cả hai nơi
        followingCountElement.textContent = newCount;
        followingHeaderCount.textContent = newCount + ' FOLLOWING';
    }
    
    // Hàm kiểm tra và hiển thị thông báo nếu danh sách trống
    function checkEmptyLists() {
        // Kiểm tra artist-list
        const mainArtistList = document.querySelector('.artist-list');
        if (mainArtistList && mainArtistList.querySelectorAll('.artist-item').length === 0) {
            mainArtistList.innerHTML = '<p>You are not following anyone yet.</p>';
        }
        
        // Kiểm tra popup list
        const popupList = document.querySelector('.all-following-list');
        if (popupList && popupList.querySelectorAll('.artist-item').length === 0) {
            popupList.innerHTML = '<p>You are not following anyone yet.</p>';
        }
    }
});