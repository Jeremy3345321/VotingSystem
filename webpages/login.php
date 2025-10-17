<?php
session_start();

// Database configuration
$host = 'localhost';
$user = 'root';
$password = '';
$database = 'voting_system';
$port = 3306;

// Create connection
$conn = new mysqli($host, $user, $password, $database, $port);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}

$error = '';
$success = '';

// Handle login form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $accountId = $_POST['account_id'] ?? '';
    $accountPassword = $_POST['account_password'] ?? '';
    
    if (empty($accountId) || empty($accountPassword)) {
        $error = 'Please enter both Account ID and Password.';
    } else {
        // Query to get account
        $sql = "SELECT * FROM accounts WHERE account_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("i", $accountId);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            $account = $result->fetch_assoc();
            
            // Verify password (assuming plain text for now - should use password_hash in production)
            if ($account['account_password'] === $accountPassword) {
                // Set session variables
                $_SESSION['account_id'] = $account['account_id'];
                $_SESSION['account_name'] = $account['account_name'];
                $_SESSION['account_role'] = $account['account_role'];
                $_SESSION['has_voted'] = $account['has_voted'];
                
                // Redirect based on role
                if ($account['account_role'] === 'FACILITATOR') {
                    header('Location: facilitator_dashboard.php');
                } else {
                    header('Location: voter_dashboard.php');
                }
                exit();
            } else {
                $error = 'Invalid Account ID or Password.';
            }
        } else {
            $error = 'Invalid Account ID or Password.';
        }
        
        $stmt->close();
    }
}

$conn->close();
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Voting System - Login</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        
        .login-container {
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            padding: 40px;
            width: 100%;
            max-width: 400px;
        }
        
        .login-header {
            text-align: center;
            margin-bottom: 30px;
        }
        
        .login-header h1 {
            color: #333;
            font-size: 28px;
            margin-bottom: 10px;
        }
        
        .login-header p {
            color: #666;
            font-size: 14px;
        }
        
        .form-group {
            margin-bottom: 20px;
        }
        
        .form-group label {
            display: block;
            color: #333;
            font-weight: 600;
            margin-bottom: 8px;
            font-size: 14px;
        }
        
        .form-group input {
            width: 100%;
            padding: 12px 15px;
            border: 2px solid #e0e0e0;
            border-radius: 5px;
            font-size: 14px;
            transition: border-color 0.3s;
        }
        
        .form-group input:focus {
            outline: none;
            border-color: #667eea;
        }
        
        .error-message {
            background: #fee;
            color: #c33;
            padding: 12px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 14px;
            border-left: 4px solid #c33;
        }
        
        .success-message {
            background: #efe;
            color: #3c3;
            padding: 12px;
            border-radius: 5px;
            margin-bottom: 20px;
            font-size: 14px;
            border-left: 4px solid #3c3;
        }
        
        .btn-login {
            width: 100%;
            padding: 14px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .btn-login:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
        }
        
        .btn-login:active {
            transform: translateY(0);
        }
        
        .login-footer {
            text-align: center;
            margin-top: 20px;
            color: #666;
            font-size: 13px;
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="login-header">
            <h1>🗳️ Voting System</h1>
            <p>Please login to continue</p>
        </div>
        
        <?php if ($error): ?>
            <div class="error-message"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>
        
        <?php if ($success): ?>
            <div class="success-message"><?php echo htmlspecialchars($success); ?></div>
        <?php endif; ?>
        
        <form method="POST" action="">
            <div class="form-group">
                <label for="account_id">Account ID</label>
                <input 
                    type="number" 
                    id="account_id" 
                    name="account_id" 
                    placeholder="Enter your account ID"
                    required
                    autofocus
                >
            </div>
            
            <div class="form-group">
                <label for="account_password">Password</label>
                <input 
                    type="password" 
                    id="account_password" 
                    name="account_password" 
                    placeholder="Enter your password"
                    required
                >
            </div>
            
            <button type="submit" class="btn-login">Login</button>
        </form>
        
        <div class="login-footer">
            <p>Secure Voting System &copy; 2025</p>
        </div>
    </div>
</body>
</html>