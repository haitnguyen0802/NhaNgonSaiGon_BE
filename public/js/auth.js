/**
 * Xử lý xác thực người dùng ở frontend
 */

document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra trạng thái xác thực từ sessionStorage
    function checkAuthentication() {
        const isAuthenticated = sessionStorage.getItem('isAuthenticated');
        const user = JSON.parse(sessionStorage.getItem('user') || '{}');
        
        // Nếu không có thông tin xác thực và đang ở trang bảo vệ, chuyển hướng về đăng nhập
        if (!isAuthenticated && !window.location.pathname.startsWith('/auth/')) {
            window.location.href = '/auth/login';
            return;
        }
        
        // Nếu đã đăng nhập và đang ở trang đăng nhập, chuyển hướng đến dashboard
        if (isAuthenticated && window.location.pathname.startsWith('/auth/login')) {
            window.location.href = '/dashboard';
            return;
        }
        
        // Cập nhật UI nếu đã đăng nhập
        if (isAuthenticated) {
            updateUserUI(user);
        }
    }
    
    // Cập nhật giao diện người dùng dựa trên thông tin đăng nhập
    function updateUserUI(user) {
        // Cập nhật tên người dùng và avatar nếu có các phần tử tương ứng
        const userNameElement = document.querySelector('.user-name');
        const userAvatarElement = document.querySelector('.user-avatar');
        
        if (userNameElement && user.name) {
            userNameElement.textContent = user.name;
        }
        
        if (userAvatarElement && user.avatar) {
            userAvatarElement.src = user.avatar;
        }
    }
    
    // Kiểm tra xác thực khi trang được tải
    checkAuthentication();
});

// Hàm đăng xuất toàn cục có thể được gọi từ bất kỳ đâu trong ứng dụng
function logout() {
    // Xóa dữ liệu từ sessionStorage
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('isAuthenticated');
    sessionStorage.clear();
    
    // Chuyển hướng đến route đăng xuất để xóa session ở server
    window.location.href = '/auth/logout';
} 