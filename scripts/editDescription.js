document.addEventListener('DOMContentLoaded', function() {
      const descriptionElement = document.getElementById('profile-description');
      let isEditing = false;
      let originalText = '';
      
      if (descriptionElement) {
          // Make description editable on click
          descriptionElement.addEventListener('click', function() {
              if (!isEditing) {
                  startEditing();
              }
          });
          
          // Handle keyboard events for saving
          descriptionElement.addEventListener('keydown', function(e) {
              if (isEditing) {
                  if (e.key === 'Enter') {
                      e.preventDefault();
                      saveDescription();
                  } else if (e.key === 'Escape') {
                      e.preventDefault();
                      cancelEditing();
                  }
              }
          });
          
          // Handle clicking outside to save
          document.addEventListener('click', function(e) {
              if (isEditing && e.target !== descriptionElement) {
                  saveDescription();
              }
          });
      }
      
      function startEditing() {
          isEditing = true;
          originalText = descriptionElement.textContent;
          
          // Make the element editable
          descriptionElement.setAttribute('contenteditable', 'true');
          descriptionElement.classList.add('editing');
          descriptionElement.focus();
          
          // Set cursor to end of text
          const range = document.createRange();
          const selection = window.getSelection();
          range.selectNodeContents(descriptionElement);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
          
          // Create a tooltip for instructions
          const tooltip = document.createElement('div');
          tooltip.className = 'edit-tooltip';
          tooltip.textContent = 'Press Enter to save, Esc to cancel';
          tooltip.style.position = 'absolute';
          
          // Position tooltip below the description
          const rect = descriptionElement.getBoundingClientRect();
          tooltip.style.top = (rect.bottom + 5) + 'px';
          tooltip.style.left = rect.left + 'px';
          
          document.body.appendChild(tooltip);
          descriptionElement.dataset.tooltipId = 'edit-tooltip';
      }
      
      function cancelEditing() {
          isEditing = false;
          descriptionElement.textContent = originalText;
          cleanupEditing();
      }
      
      function saveDescription() {
          if (!isEditing) return;
          
          const newDescription = descriptionElement.textContent.trim();
          
          // Don't save if empty
          if (newDescription === '') {
              descriptionElement.textContent = originalText;
              cleanupEditing();
              return;
          }
          
          // Save to database with AJAX
          const formData = new FormData();
          formData.append('description', newDescription);
          
          fetch('../model/updateDescription.php', {
              method: 'POST',
              body: formData
          })
          .then(response => response.json())
          .then(data => {
              if (data.success) {
                  // Update was successful
                  cleanupEditing();
              } else {
                  // Handle error
                  showNotification('Error: ' + (data.message || 'Failed to update description'), 'error');
                  descriptionElement.textContent = originalText;
                  cleanupEditing();
              }
          })
          .catch(error => {
              console.error('Error:', error);
              showNotification('Error updating description', 'error');
              descriptionElement.textContent = originalText;
              cleanupEditing();
          });
      }
      
      function cleanupEditing() {
          isEditing = false;
          descriptionElement.removeAttribute('contenteditable');
          descriptionElement.classList.remove('editing');
          
          // Remove tooltip if exists
          const tooltip = document.querySelector('.edit-tooltip');
          if (tooltip) {
              document.body.removeChild(tooltip);
          }
      }
      
      function showNotification(message, type = 'success') {
          // Create notification element
          const notification = document.createElement('div');
          notification.className = `notification ${type}`;
          notification.textContent = message;
          
          // Add to page
          document.body.appendChild(notification);
          
          // Fade in
          setTimeout(() => {
              notification.classList.add('show');
          }, 10);
          
          // Remove after 3 seconds
          setTimeout(() => {
              notification.classList.remove('show');
              setTimeout(() => {
                  document.body.removeChild(notification);
              }, 300);
          }, 3000);
      }
  });