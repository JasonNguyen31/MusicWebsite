document.addEventListener('DOMContentLoaded', function() {
      const profileContainer = document.querySelector('.profile-container');
      const profileDropdown = document.querySelector('.profile-dropdown');
      
      profileContainer.addEventListener('click', function(e) {
          e.stopPropagation();
          profileDropdown.style.display = profileDropdown.style.display === 'block' ? 'none' : 'block';
      });
      
      // Close dropdown when clicking elsewhere
      document.addEventListener('click', function() {
          profileDropdown.style.display = 'none';
      });
});