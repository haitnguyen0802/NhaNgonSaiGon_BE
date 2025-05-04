/**
 * Hàm hỗ trợ upload ảnh lên server
 * @param {File} file - File ảnh cần upload
 * @param {string} folder - Thư mục đích trên Cloudinary
 * @returns {Promise} - Promise chứa kết quả upload
 */
async function uploadImageToCloudinary(file, folder = 'uploads') {
  if (!file) return { success: false, message: 'Không có file được chọn' };
  
  // Kiểm tra loại file
  if (!file.type.startsWith('image/')) {
    return { success: false, message: 'Chỉ hỗ trợ file hình ảnh' };
  }
  
  // Tạo FormData
  const formData = new FormData();
  formData.append('image', file);
  
  try {
    // Hiển thị loading nếu cần
    
    // Gửi request lên server
    const response = await fetch(`/products/upload-image?folder=${folder}`, {
      method: 'POST',
      body: formData
    });
    
    const result = await response.json();
    
    // Ẩn loading nếu đang hiển thị
    
    return result;
  } catch (error) {
    console.error('Lỗi khi upload ảnh:', error);
    return {
      success: false,
      message: 'Không thể kết nối đến server'
    };
  }
}

/**
 * Tạo phần tử xem trước ảnh
 * @param {string} imageUrl - URL ảnh
 * @param {boolean} isMain - Có phải ảnh chính hay không
 * @param {string} publicId - Public ID của ảnh trên Cloudinary (nếu có)
 * @returns {HTMLElement} - Phần tử DOM chứa ảnh xem trước
 */
function createImagePreviewElement(imageUrl, isMain = false, publicId = null) {
  const previewItem = document.createElement('div');
  previewItem.className = 'image-preview-item';
  
  // Tạo ảnh
  const img = document.createElement('img');
  img.src = imageUrl;
  img.className = 'preview-image';
  previewItem.appendChild(img);
  
  // Thêm public_id dưới dạng data attribute nếu có
  if (publicId) {
    previewItem.dataset.publicId = publicId;
  }
  
  // Thêm chỉ báo ảnh chính nếu cần
  if (isMain) {
    const mainIndicator = document.createElement('div');
    mainIndicator.className = 'main-image-indicator';
    mainIndicator.textContent = 'Ảnh chính';
    previewItem.appendChild(mainIndicator);
  }
  
  // Thêm nút xóa
  const removeBtn = document.createElement('div');
  removeBtn.className = 'remove-image';
  removeBtn.innerHTML = '<i class="fas fa-times"></i>';
  removeBtn.addEventListener('click', function() {
    // Xóa phần tử khỏi DOM
    previewItem.remove();
  });
  previewItem.appendChild(removeBtn);
  
  return previewItem;
}

/**
 * Lấy danh sách ảnh từ container xem trước
 * @param {string} containerId - ID của container chứa ảnh xem trước
 * @returns {Array} - Mảng chứa thông tin các ảnh
 */
function getPreviewImagesData(containerId) {
  const container = document.getElementById(containerId);
  const previewItems = container.querySelectorAll('.image-preview-item');
  
  return Array.from(previewItems).map((item, index) => {
    const img = item.querySelector('img');
    return {
      url: img.src,
      isMain: index === 0,
      publicId: item.dataset.publicId || null
    };
  });
} 