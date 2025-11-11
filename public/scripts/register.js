const registerForm = document.getElementById('registerForm');
const errorMessage = document.getElementById('errorMessage');
const successMessage = document.getElementById('successMessage');
const registerBtn = document.getElementById('registerBtn');

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
registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideMessages();

    const accountName = document.getElementById('account_name').value.trim();
    const accountPassword = document.getElementById('account_password').value;
    const confirmPassword = document.getElementById('confirm_password').value;

    // Validation
    if (accountName.length < 3) {
        showError('Name must be at least 3 characters long');
        return;
    }

    if (accountPassword.length < 6) {
        showError('Password must be at least 6 characters long');
        return;
    }

    if (accountPassword !== confirmPassword) {
        showError('Passwords do not match');
        return;
    }

    // Disable button during request
    registerBtn.disabled = true;
    registerBtn.textContent = 'Creating account...';

    try {
        const response = await fetch('http://localhost:3000/api/accounts/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                accountName: accountName,
                accountPassword: accountPassword,
                accountRole: 'voter' // Default role
            })
        });

        const data = await response.json();

        if (data.success) {
            showSuccess(`Account created successfully! Redirecting to login...`);
            
            // Clear form
            registerForm.reset();
            
            // Redirect to login after 3 seconds
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 2000);
        } else {
            showError(data.message || 'Registration failed. Please try again.');
        }
    } catch (error) {
        console.error('Registration error:', error);
        showError('Unable to connect to server. Please try again later.');
    } finally {
        registerBtn.disabled = false;
        registerBtn.textContent = 'Register';
    }
});