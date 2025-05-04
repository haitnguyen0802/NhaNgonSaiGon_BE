/**
 * Utility function to convert Vietnamese text to a URL-friendly slug
 * 
 * This function:
 * 1. Converts the text to lowercase
 * 2. Replaces Vietnamese characters with their non-accented equivalents
 * 3. Removes special characters
 * 4. Replaces spaces with hyphens
 * 5. Removes duplicate hyphens
 * 6. Trims hyphens from start and end
 * 
 * @param {string} text - The text to convert to a slug
 * @return {string} A URL-friendly slug
 */
function slugify(text) {
  if (!text) return '';
  
  // Vietnamese character mapping
  const vietnameseMap = {
    'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
    'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
    'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
    'đ': 'd',
    'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
    'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
    'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
    'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
    'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
    'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
    'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
    'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
    'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y'
  };
  
  // Convert to lowercase
  let slug = text.toLowerCase();
  
  // Replace Vietnamese characters
  slug = slug.replace(/[áàảãạăắằẳẵặâấầẩẫậđéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵ]/g, 
    function(match) {
      return vietnameseMap[match] || match;
    }
  );
  
  // Remove special characters, keep letters, numbers and spaces
  slug = slug.replace(/[^\w\s-]/g, '');
  
  // Replace spaces with hyphens
  slug = slug.replace(/\s+/g, '-');
  
  // Remove consecutive hyphens
  slug = slug.replace(/-+/g, '-');
  
  // Trim hyphens from start and end
  slug = slug.replace(/^-+|-+$/g, '');
  
  return slug;
}

/**
 * Set up automatic slug generation for a name input field
 * 
 * @param {string} nameInputId - The ID of the name input field
 * @param {string} slugInputId - The ID of the slug input field
 */
function setupSlugGeneration(nameInputId, slugInputId) {
  document.addEventListener('DOMContentLoaded', function() {
    const nameInput = document.getElementById(nameInputId);
    const slugInput = document.getElementById(slugInputId);
    
    if (nameInput && slugInput) {
      nameInput.addEventListener('blur', function() {
        if (slugInput.value === '') {
          slugInput.value = slugify(this.value);
        }
      });
    }
  });
}

/**
 * Initialize Bootstrap form validation
 */
function setupFormValidation() {
  document.addEventListener('DOMContentLoaded', function() {
    const forms = document.querySelectorAll('.needs-validation');
    
    Array.prototype.slice.call(forms).forEach(function(form) {
      form.addEventListener('submit', function(event) {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }
        form.classList.add('was-validated');
      }, false);
    });
  });
}

/**
 * Set up auto-closing alerts
 * 
 * @param {string} alertSelector - The CSS selector for alerts
 * @param {number} timeout - The time in milliseconds before auto-closing
 */
function setupAutoCloseAlerts(alertSelector = '.alert.auto-close', timeout = 5000) {
  document.addEventListener('DOMContentLoaded', function() {
    const alerts = document.querySelectorAll(alertSelector);
    
    alerts.forEach(alert => {
      // Set up close button
      const closeBtn = alert.querySelector('.btn-close');
      if (closeBtn) {
        closeBtn.removeAttribute('data-bs-dismiss');
        closeBtn.addEventListener('click', function() {
          alert.classList.remove('show');
          setTimeout(() => {
            if (alert.parentNode) {
              alert.parentNode.removeChild(alert);
            }
          }, 150);
        });
      }
      
      // Auto-close after timeout
      setTimeout(() => {
        if (alert && document.body.contains(alert)) {
          alert.classList.remove('show');
          setTimeout(() => {
            if (alert.parentNode) {
              alert.parentNode.removeChild(alert);
            }
          }, 150);
        }
      }, timeout);
    });
  });
} 