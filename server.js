//server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const Database = require('./classes/Database');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(cors());
app.use(express.static('public')); // Serve static files

// Test database connection on startup
Database.testConnection();

// ==================== HTML ROUTES ====================

// Serve login page as default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Serve register page
app.get('/register', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'register.html'));
});

// Serve admin dashboard
app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin-dashboard.html'));
});

// Serve voter dashboard
app.get('/voter-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'voter-dashboard.html'));
});

// ==================== ACCOUNT API ROUTES ====================

/**
 * Register new account
 * POST /api/accounts/register
 * Body: { accountName, accountPassword, accountRole? }
 */
app.post('/api/accounts/register', async (req, res) => {
    try {
        const { accountName, accountPassword, accountRole } = req.body;

        // Validation
        if (!accountName || !accountPassword) {
            return res.status(400).json({ 
                success: false, 
                message: 'Account name and password are required' 
            });
        }

        if (accountName.length < 3) {
            return res.status(400).json({ 
                success: false, 
                message: 'Account name must be at least 3 characters' 
            });
        }

        if (accountPassword.length < 6) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be at least 6 characters' 
            });
        }

        // Create account object
        const account = {
            accountName: accountName,
            accountPassword: accountPassword,
            accountRole: accountRole || 'voter',
            hasVoted: 0
        };

        // Add account using Database class
        const newAccount = await Database.addAccount(account);

        res.status(201).json({
            success: true,
            message: 'Account registered successfully',
            data: {
                accountId: newAccount.accountId,
                accountName: newAccount.accountName,
                accountRole: newAccount.accountRole
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

/**
 * Login account
 * POST /api/accounts/login
 * Body: { accountId, accountPassword }
 */
app.post('/api/accounts/login', async (req, res) => {
    console.log('=== Login Request ===');
    console.log('Request body:', { accountId: req.body.accountId, hasPassword: !!req.body.accountPassword });
    
    try {
        const { accountId, accountPassword } = req.body;

        if (!accountId || !accountPassword) {
            console.log('✗ Missing credentials');
            return res.status(400).json({ 
                success: false, 
                message: 'Account ID and password are required' 
            });
        }

        // Verify account using Database class
        console.log('Verifying account:', accountId);
        const account = await Database.verifyAccount(accountId, accountPassword);

        if (!account) {
            console.log('✗ Invalid credentials for account:', accountId);
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid account ID or password' 
            });
        }

        console.log('✓ Login successful for:', account.account_name, '(Role:', account.account_role, ')');
        
        res.json({
            success: true,
            message: 'Login successful',
            data: {
                accountId: account.account_id,
                accountName: account.account_name,
                accountRole: account.account_role.trim().toLowerCase(), // Normalize role
                hasVoted: account.has_voted
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

/**
 * Get account by ID
 * GET /api/accounts/:id
 */
app.get('/api/accounts/:id', async (req, res) => {
    try {
        const accountId = parseInt(req.params.id);

        const account = await Database.getAccount(accountId);

        if (!account) {
            return res.status(404).json({ 
                success: false, 
                message: 'Account not found' 
            });
        }

        // Don't send password
        delete account.account_password;

        res.json({
            success: true,
            data: account
        });

    } catch (error) {
        console.error('Get account error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

/**
 * Get all accounts (admin only)
 * GET /api/accounts
 */
app.get('/api/accounts', async (req, res) => {
    try {
        const accounts = await Database.getAllAccounts();

        res.json({
            success: true,
            data: accounts
        });

    } catch (error) {
        console.error('Get accounts error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// ==================== CANDIDATE API ROUTES ====================

/**
 * Get all candidates
 * GET /api/candidates
 */
app.get('/api/candidates', async (req, res) => {
    try {
        const candidates = await Database.getAllCandidatesByVotes();

        res.json({
            success: true,
            data: candidates
        });

    } catch (error) {
        console.error('Get candidates error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

/**
 * Get candidates by position
 * GET /api/candidates/position/:position
 */
app.get('/api/candidates/position/:position', async (req, res) => {
    try {
        const position = req.params.position;
        const candidates = await Database.getCandidatesByPosition(position);

        res.json({
            success: true,
            data: candidates
        });

    } catch (error) {
        console.error('Get candidates by position error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

/**
 * Get candidate by ID
 * GET /api/candidates/:id
 */
app.get('/api/candidates/:id', async (req, res) => {
    try {
        const candidateId = parseInt(req.params.id);

        const candidate = await Database.getCandidate(candidateId);

        if (!candidate) {
            return res.status(404).json({ 
                success: false, 
                message: 'Candidate not found' 
            });
        }

        res.json({
            success: true,
            data: candidate
        });

    } catch (error) {
        console.error('Get candidate error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

/**
 * Add new candidate (admin only)
 * POST /api/candidates
 * Body: { candidateName, candidateParty, candidateDescription }
 */
app.post('/api/candidates', async (req, res) => {
    try {
        const { candidateName, candidateParty, candidateDescription } = req.body;

        if (!candidateName || !candidateParty) {
            return res.status(400).json({ 
                success: false, 
                message: 'Candidate name and party are required' 
            });
        }

        const candidate = {
            candidateName: candidateName,
            candidateParty: candidateParty,
            candidateDescription: candidateDescription || '',
            currentVotes: 0
        };

        const newCandidate = await Database.addCandidate(candidate);

        res.status(201).json({
            success: true,
            message: 'Candidate added successfully',
            data: newCandidate
        });

    } catch (error) {
        console.error('Add candidate error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// ==================== VOTE API ROUTES ====================

/**
 * Submit a vote
 * POST /api/votes
 * Body: { accountId, candidateId }
 */
app.post('/api/votes', async (req, res) => {
    try {
        const { accountId, candidateId } = req.body;

        if (!accountId || !candidateId) {
            return res.status(400).json({ 
                success: false, 
                message: 'Account ID and Candidate ID are required' 
            });
        }

        // Record vote using Database class
        await Database.recordVote(accountId, candidateId);

        res.json({
            success: true,
            message: 'Vote recorded successfully'
        });

    } catch (error) {
        console.error('Vote error:', error);
        
        if (error.message.includes('already voted')) {
            return res.status(400).json({ 
                success: false, 
                message: error.message
            });
        }

        res.status(500).json({ 
            success: false, 
            message: error.message || 'Internal server error' 
        });
    }
});

/**
 * Get all votes (admin only)
 * GET /api/votes
 */
app.get('/api/votes', async (req, res) => {
    try {
        const votes = await Database.getAllVotes();

        res.json({
            success: true,
            data: votes
        });

    } catch (error) {
        console.error('Get votes error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

/**
 * Get votes by account (for checking which positions voted)
 * GET /api/votes/account/:accountId
 */
app.get('/api/votes/account/:accountId', async (req, res) => {
    try {
        const accountId = parseInt(req.params.accountId);
        const votes = await Database.getVotesByAccount(accountId);

        res.json({
            success: true,
            data: votes
        });

    } catch (error) {
        console.error('Get votes by account error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

/**
 * Get positions voted by account
 * GET /api/votes/account/:accountId/positions
 */
app.get('/api/votes/account/:accountId/positions', async (req, res) => {
    try {
        const accountId = parseInt(req.params.accountId);
        const positions = await Database.getVotedPositions(accountId);

        res.json({
            success: true,
            data: positions
        });

    } catch (error) {
        console.error('Get voted positions error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

// ==================== START SERVER ====================

app.listen(PORT, () => {
    console.log(`Voting System Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...');
    await Database.closePool();
    process.exit();
});