const loginForm = document.getElementById('loginForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const loginBtn = document.getElementById('loginBtn');

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
    successMessage.classList.remove('show');
}

// Show success message
function showSuccess(message) {
    successMessage.textContent = message;
    successMessage.classList.add('show');
    errorMessage.classList.remove('show');
}

// Hide all messages
function hideMessages() {
    errorMessage.classList.remove('show');
    successMessage.classList.remove('show');
}

// Handle form submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();

    const accountId = document.getElementById('account_id').value;
    const accountPassword = document.getElementById('account_password').value;

    // Disable button during request
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';

    try {
        const response = await fetch('http://localhost:3000/api/accounts/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                accountId: parseInt(accountId),
                accountPassword: accountPassword
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess('Login successful! Redirecting...');
            
            // Store user session data
            sessionStorage.setItem('accountId', data.data.accountId);
            sessionStorage.setItem('accountName', data.data.accountName);
            sessionStorage.setItem('accountRole', data.data.accountRole);
            
            // Redirect based on role
            setTimeout(() => {
                if (data.data.accountRole === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'voter-dashboard.html';
                }
            }, 1500);
        } else {
            showError(data.message || 'Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Unable to connect to server. Please try again later.');
    } finally {
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
});