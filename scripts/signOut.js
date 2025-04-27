function logoutUser() {
      // Thêm tham số ngẫu nhiên để tránh cache
      window.location.href = '../model/signOut.php?t=' + new Date().getTime();
}

// Bắt sự kiện khi người dùng cố gắng rời khỏi trang
window.addEventListener('beforeunload', function() {
      // Xóa cache khi rời trang
      if (navigator.sendBeacon) {
            navigator.sendBeacon('../model/clearPageCache.php');
      }
});