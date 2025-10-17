const express = require('express');
const cors = require('cors');
const path = require('path');

// Import your classes
const Account = require('./scripts/Account');
const Candidate = require('./scripts/Candidate');
const Database = require('./scripts/Database');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from webpages folder
app.use(express.static(path.join(__dirname, 'webpages')));

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { accountId, accountPassword } = req.body;
        
        // Validate input
        if (!accountId || !accountPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide both Account ID and Password.'
            });
        }
        
        // Get account from database
        const account = await Database.getAccount(parseInt(accountId));
        
        if (!account) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Account ID or Password.'
            });
        }
        
        // Verify password
        if (account.getPassword() !== accountPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid Account ID or Password.'
            });
        }
        
        // Return success with account data
        res.json({
            success: true,
            message: 'Login successful',
            account: {
                accountId: account.getId(),
                accountName: account.getName(),
                accountRole: account.getRole(),
                hasVoted: account.getHasVoted(),
                accountPassword: account.getPassword()
            }
        });
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again later.'
        });
    }
});

// Get account info (for session validation)
app.get('/api/account/:id', async (req, res) => {
    try {
        const accountId = parseInt(req.params.id);
        const account = await Database.getAccount(accountId);
        
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found.'
            });
        }
        
        res.json({
            success: true,
            account: {
                accountId: account.getId(),
                accountName: account.getName(),
                accountRole: account.getRole(),
                hasVoted: account.getHasVoted()
            }
        });
    } catch (error) {
        console.error('Get account error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

// Get all candidates
app.get('/api/candidates', async (req, res) => {
    try {
        const candidates = await Database.getAllCandidatesByVotes();
        res.json({
            success: true,
            candidates: candidates.map(c => ({
                candidateId: c.candidateId,
                candidateName: c.candidateName,
                candidateParty: c.candidateParty,
                candidateDescription: c.candidateDescription,
                currentVotes: c.currentVotes
            }))
        });
    } catch (error) {
        console.error('Get candidates error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

// Get single candidate
app.get('/api/candidate/:id', async (req, res) => {
    try {
        const candidateId = parseInt(req.params.id);
        const candidate = await Database.getCandidate(candidateId);
        
        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found.'
            });
        }
        
        res.json({
            success: true,
            candidate: {
                candidateId: candidate.candidateId,
                candidateName: candidate.candidateName,
                candidateParty: candidate.candidateParty,
                candidateDescription: candidate.candidateDescription,
                currentVotes: candidate.currentVotes
            }
        });
    } catch (error) {
        console.error('Get candidate error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

// Cast vote
app.post('/api/vote', async (req, res) => {
    try {
        const { accountId, candidateId } = req.body;
        
        // Get account
        const account = await Database.getAccount(parseInt(accountId));
        if (!account) {
            return res.status(404).json({
                success: false,
                message: 'Account not found.'
            });
        }
        
        // Get candidate
        const candidate = await Database.getCandidate(parseInt(candidateId));
        if (!candidate) {
            return res.status(404).json({
                success: false,
                message: 'Candidate not found.'
            });
        }
        
        // Cast vote using Account method
        const success = await account.castVote(candidate);
        
        if (success) {
            res.json({
                success: true,
                message: 'Vote cast successfully!'
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Unable to cast vote. You may have already voted or do not have permission.'
            });
        }
    } catch (error) {
        console.error('Vote error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

// Add candidate (Facilitator only)
app.post('/api/candidate', async (req, res) => {
    try {
        const { candidateName, candidateParty, candidateDescription } = req.body;
        
        const candidate = new Candidate(
            null,
            candidateName,
            candidateParty,
            candidateDescription
        );
        
        await Database.addCandidate(candidate);
        
        res.json({
            success: true,
            message: 'Candidate added successfully!',
            candidate: {
                candidateId: candidate.candidateId,
                candidateName: candidate.candidateName,
                candidateParty: candidate.candidateParty,
                candidateDescription: candidate.candidateDescription,
                currentVotes: candidate.currentVotes
            }
        });
    } catch (error) {
        console.error('Add candidate error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error.'
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`╔════════════════════════════════════════════╗`);
    console.log(`║   Voting System API Server Started        ║`);
    console.log(`╠════════════════════════════════════════════╣`);
    console.log(`║   Server: http://localhost:${PORT}         ║`);
    console.log(`║   API:    http://localhost:${PORT}/api     ║`);
    console.log(`╚════════════════════════════════════════════╝`);
    console.log(`\nMake sure MySQL is running and database is configured.`);
});

module.exports = app;