// login.js

const API_BASE_URL = 'http://localhost:3000/api';

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('user_id').value.trim();
    const password = document.getElementById('account_password').value;
    
    if (!userId || !password) {
        showError('Please fill in all fields');
        return;
    }
    
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/accounts/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                accountPassword: password
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            sessionStorage.setItem('accountId', data.data.accountId);
            sessionStorage.setItem('accountName', data.data.accountName);
            sessionStorage.setItem('accountRole', data.data.accountRole);
            sessionStorage.setItem('hasVoted', data.data.hasVoted);
            
            showSuccess('Login successful! Redirecting...');
            
            setTimeout(() => {
                if (data.data.accountRole.trim().toLowerCase() === 'admin') {
                    window.location.href = 'admin-dashboard.html';
                } else {
                    window.location.href = 'voter-dashboard.html';
                }
            }, 1000);
        } else {
            showError(data.message || 'Invalid student ID or password');
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Error connecting to server. Please try again.');
        loginBtn.disabled = false;
        loginBtn.textContent = 'Login';
    }
});

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.textContent = message;
    errorDiv.style.display = 'block';
    
    document.getElementById('successMessage').style.display = 'none';
    
    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    const successDiv = document.getElementById('successMessage');
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    
    document.getElementById('errorMessage').style.display = 'none';
}