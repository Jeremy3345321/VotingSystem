const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const Account = require('./Account');
const Candidate = require('./Candidate');

// Database configuration
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '', 
    database: 'voting_system',
    port: 3306
};

class Database {
    // Connection to database
    static pool = mysql.createPool(dbConfig);

    // ==================== ACCOUNT MANAGEMENT ====================

    /**
     * Add a new account to the database
     * @param {Object|Account} account - Account object or Account instance
     * @returns {Object|Account} Account object with generated accountId
     */
    static async addAccount(account) {
        try {
            // Convert Account instance to plain object if needed
            const accountData = account instanceof Account ? account.toDatabaseObject() : account;
            
            // Hash the password before storing
            const hashedPassword = await bcrypt.hash(accountData.accountPassword, 10);
            
            const sql = 'INSERT INTO accounts (account_name, account_password, account_role, has_voted) VALUES (?, ?, ?, ?)';
            const [result] = await this.pool.execute(sql, [
                accountData.accountName,
                hashedPassword,
                accountData.accountRole || 'voter',
                accountData.hasVoted || 0
            ]);
            
            // Update the account object with the new ID
            if (account instanceof Account) {
                account.accountId = result.insertId;
                console.log(`Account added: ${account.accountName} (ID: ${account.accountId})`);
                return account;
            } else {
                accountData.accountId = result.insertId;
                console.log(`Account added: ${accountData.accountName} (ID: ${accountData.accountId})`);
                return accountData;
            }
        } catch (error) {
            console.error('Error adding account:', error.message);
            throw error;
        }
    }

    /**
     * Update an existing account
     * @param {Object|Account} account - Account object or Account instance with all properties including accountId
     */
    static async updateAccount(account) {
        try {
            // Convert Account instance to plain object if needed
            const accountData = account instanceof Account ? account.toDatabaseObject() : account;
            
            // If password is being updated, hash it
            let passwordToStore = accountData.accountPassword;
            if (accountData.accountPassword && !accountData.accountPassword.startsWith('$2b$')) {
                passwordToStore = await bcrypt.hash(accountData.accountPassword, 10);
            }
            
            const sql = 'UPDATE accounts SET account_name = ?, account_password = ?, account_role = ?, has_voted = ? WHERE account_id = ?';
            await this.pool.execute(sql, [
                accountData.accountName,
                passwordToStore,
                accountData.accountRole,
                accountData.hasVoted,
                accountData.accountId
            ]);
            
            console.log(`Account updated: ${accountData.accountName}`);
        } catch (error) {
            console.error('Error updating account:', error.message);
            throw error;
        }
    }

    /**
     * Get an account by ID
     * @param {number} accountId - The account ID
     * @returns {Object|null} Account object or null if not found
     */
    static async getAccount(accountId) {
        try {
            const sql = 'SELECT * FROM accounts WHERE account_id = ?';
            const [rows] = await this.pool.execute(sql, [accountId]);
            
            if (rows.length > 0) {
                return rows[0];
            }
            return null;
        } catch (error) {
            console.error('Error getting account:', error.message);
            throw error;
        }
    }

    /**
     * Verify account credentials for login
     * @param {number} accountId - The account ID
     * @param {string} password - The plain text password
     * @returns {Object|null} Account object if credentials are valid, null otherwise
     */
    static async verifyAccount(accountId, password) {
        try {
            const account = await this.getAccount(accountId);
            
            if (!account) {
                return null;
            }

            // Compare the provided password with the hashed password
            const isValid = await bcrypt.compare(password, account.account_password);
            
            if (isValid) {
                // Don't return the password hash
                delete account.account_password;
                return account;
            }
            
            return null;
        } catch (error) {
            console.error('Error verifying account:', error.message);
            throw error;
        }
    }

    /**
     * Get all accounts (without passwords)
     * @returns {Array} Array of account objects
     */
    static async getAllAccounts() {
        try {
            const sql = 'SELECT account_id, account_name, account_role, has_voted FROM accounts';
            const [rows] = await this.pool.execute(sql);
            return rows;
        } catch (error) {
            console.error('Error getting all accounts:', error.message);
            throw error;
        }
    }

    // ==================== CANDIDATE MANAGEMENT ====================

    /**
     * Add a new candidate to the database
     * @param {Object} candidate - Candidate object
     * @returns {Object} Candidate object with generated candidateId
     */
    static async addCandidate(candidate) {
        try {
            const sql = 'INSERT INTO candidates (candidate_name, candidate_party, candidate_position, candidate_description, current_votes) VALUES (?, ?, ?, ?, ?)';
            const [result] = await this.pool.execute(sql, [
                candidate.candidateName,
                candidate.candidateParty,
                candidate.candidatePosition || '',
                candidate.candidateDescription,
                candidate.currentVotes || 0
            ]);
            
            candidate.candidateId = result.insertId;
            console.log(`Candidate added: ${candidate.candidateName}`);
            return candidate;
        } catch (error) {
            console.error('Error adding candidate:', error.message);
            throw error;
        }
    }

    /**
     * Update an existing candidate
     * @param {Object} candidate - Candidate object with all properties
     */
    static async updateCandidate(candidate) {
        try {
            const sql = 'UPDATE candidates SET candidate_name = ?, candidate_party = ?, candidate_description = ?, current_votes = ? WHERE candidate_id = ?';
            await this.pool.execute(sql, [
                candidate.candidateName,
                candidate.candidateParty,
                candidate.candidateDescription,
                candidate.currentVotes,
                candidate.candidateId
            ]);
            
            console.log(`Candidate updated: ${candidate.candidateName}`);
        } catch (error) {
            console.error('Error updating candidate:', error.message);
            throw error;
        }
    }

    /**
     * Get a candidate by ID
     * @param {number} candidateId - The candidate ID
     * @returns {Object|null} Candidate object or null if not found
     */
    static async getCandidate(candidateId) {
        try {
            const sql = 'SELECT * FROM candidates WHERE candidate_id = ?';
            const [rows] = await this.pool.execute(sql, [candidateId]);
            
            if (rows.length > 0) {
                return rows[0];
            }
            return null;
        } catch (error) {
            console.error('Error getting candidate:', error.message);
            throw error;
        }
    }

    /**
     * Get all candidates ordered by votes
     * @returns {Array} Array of candidate objects sorted by votes (descending)
     */
    static async getAllCandidatesByVotes() {
        try {
            const sql = 'SELECT * FROM candidates ORDER BY current_votes DESC';
            const [rows] = await this.pool.execute(sql);
            return rows;
        } catch (error) {
            console.error('Error getting all candidates:', error.message);
            throw error;
        }
    }

    /**
     * Get candidates by position
     * @param {string} position - The position (President, Vice President, Secretary, Treasurer)
     * @returns {Array} Array of candidate objects for that position
     */
    static async getCandidatesByPosition(position) {
        try {
            const sql = 'SELECT * FROM candidates WHERE candidate_party = ? ORDER BY current_votes DESC';
            const [rows] = await this.pool.execute(sql, [position]);
            return rows;
        } catch (error) {
            console.error('Error getting candidates by position:', error.message);
            throw error;
        }
    }

    // ==================== VOTE MANAGEMENT ====================

    /**
     * Record a vote in the database (UPDATED for position-based voting)
     * @param {number} accountId - The voter's account ID
     * @param {number} candidateId - The candidate's ID
     * @returns {boolean} True if successful, false otherwise
     */
    static async recordVote(accountId, candidateId) {
        const connection = await this.pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Get candidate information to determine position
            const [candidate] = await connection.execute(
                'SELECT candidate_party FROM candidates WHERE candidate_id = ?',
                [candidateId]
            );

            if (candidate.length === 0) {
                throw new Error('Candidate not found');
            }

            const position = candidate[0].candidate_party;

            // Check if account has already voted for this position
            const [existingVote] = await connection.execute(
                'SELECT v.vote_id FROM votes v JOIN candidates c ON v.candidate_id = c.candidate_id WHERE v.account_id = ? AND c.candidate_party = ?',
                [accountId, position]
            );

            if (existingVote.length > 0) {
                throw new Error(`You have already voted for ${position}`);
            }

            // Record the vote
            await connection.execute(
                'INSERT INTO votes (account_id, candidate_id) VALUES (?, ?)',
                [accountId, candidateId]
            );

            // Update candidate vote count
            await connection.execute(
                'UPDATE candidates SET current_votes = current_votes + 1 WHERE candidate_id = ?',
                [candidateId]
            );

            // Check if user has voted for all positions
            const [voteCount] = await connection.execute(
                'SELECT COUNT(DISTINCT c.candidate_party) as voted_positions FROM votes v JOIN candidates c ON v.candidate_id = c.candidate_id WHERE v.account_id = ?',
                [accountId]
            );

            const [totalPositions] = await connection.execute(
                'SELECT COUNT(DISTINCT candidate_party) as total_positions FROM candidates'
            );

            // If voted for all positions, mark account as fully voted
            if (voteCount[0].voted_positions >= totalPositions[0].total_positions) {
                await connection.execute(
                    'UPDATE accounts SET has_voted = 1 WHERE account_id = ?',
                    [accountId]
                );
            }

            await connection.commit();
            console.log(`Vote recorded: Account ${accountId} voted for Candidate ${candidateId} (${position})`);
            return true;
        } catch (error) {
            await connection.rollback();
            console.error('Error recording vote:', error.message);
            throw error;
        } finally {
            connection.release();
        }
    }

    /**
     * Get all votes for a specific account
     * @param {number} accountId - The account ID
     * @returns {Array} Array of vote records with candidate info
     */
    static async getVotesByAccount(accountId) {
        try {
            const sql = `
                SELECT v.vote_id, v.account_id, v.candidate_id, v.vote_timestamp,
                       c.candidate_name, c.candidate_party, c.candidate_description
                FROM votes v
                JOIN candidates c ON v.candidate_id = c.candidate_id
                WHERE v.account_id = ?
                ORDER BY v.vote_timestamp DESC
            `;
            const [rows] = await this.pool.execute(sql, [accountId]);
            return rows;
        } catch (error) {
            console.error('Error getting votes by account:', error.message);
            throw error;
        }
    }

    /**
     * Check which positions an account has voted for
     * @param {number} accountId - The account ID
     * @returns {Array} Array of positions the account has voted for
     */
    static async getVotedPositions(accountId) {
        try {
            const sql = `
                SELECT DISTINCT c.candidate_party as position
                FROM votes v
                JOIN candidates c ON v.candidate_id = c.candidate_id
                WHERE v.account_id = ?
            `;
            const [rows] = await this.pool.execute(sql, [accountId]);
            return rows.map(row => row.position);
        } catch (error) {
            console.error('Error getting voted positions:', error.message);
            throw error;
        }
    }

    /**
     * Get all votes
     * @returns {Array} Array of vote records
     */
    static async getAllVotes() {
        try {
            const sql = `
                SELECT v.vote_id, v.account_id, v.candidate_id, v.vote_timestamp,
                       a.account_name, c.candidate_name, c.candidate_party
                FROM votes v
                JOIN accounts a ON v.account_id = a.account_id
                JOIN candidates c ON v.candidate_id = c.candidate_id
                ORDER BY v.vote_timestamp DESC
            `;
            const [rows] = await this.pool.execute(sql);
            return rows;
        } catch (error) {
            console.error('Error getting all votes:', error.message);
            throw error;
        }
    }

    // ==================== UTILITY METHODS ====================

    /**
     * Test database connection
     * @returns {boolean} True if connection successful
     */
    static async testConnection() {
        try {
            const connection = await this.pool.getConnection();
            console.log('Database connected successfully');
            connection.release();
            return true;
        } catch (error) {
            console.error('Database connection failed:', error.message);
            return false;
        }
    }

    /**
     * Close all database connections
     */
    static async closePool() {
        try {
            await this.pool.end();
            console.log('Database pool closed');
        } catch (error) {
            console.error('Error closing database pool:', error.message);
        }
    }
}

module.exports = Database;