// register.js

const API_BASE_URL = 'http://localhost:3000/api';

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const userId = document.getElementById('user_id').value.trim();
    const accountName = document.getElementById('account_name').value.trim();
    const password = document.getElementById('account_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;
    
    if (!userId || !accountName || !password || !confirmPassword) {
        showError('Please fill in all fields');
        return;
    }

    if (userId.length < 3) {
        showError('User ID must be at least 3 characters');
        return;
    }
    
    if (accountName.length < 3) {
        showError('Name must be at least 3 characters');
        return;
    }
    
    if (password.length < 6) {
        showError('Password must be at least 6 characters');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }
    
    const registerBtn = document.getElementById('registerBtn');
    registerBtn.disabled = true;
    registerBtn.textContent = 'Registering...';
    
    try {
        const response = await fetch(`${API_BASE_URL}/accounts/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId: userId,
                accountName: accountName,
                accountPassword: password,
                accountRole: 'voter'
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showSuccess('Registration successful! Redirecting to login...');
            
            document.getElementById('registerForm').reset();
            
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showError(data.message || 'Registration failed');
            registerBtn.disabled = false;
            registerBtn.textContent = 'Register';
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Error connecting to server. Please try again.');
        registerBtn.disabled = false;
        registerBtn.textContent = 'Register';
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