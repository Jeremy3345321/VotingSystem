const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

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
     * @param {Object} account - Account object with accountName, accountPassword, accountRole
     * @returns {Object} Account object with generated accountId
     */
    static async addAccount(account) {
        try {
            // Hash the password before storing
            const hashedPassword = await bcrypt.hash(account.accountPassword, 10);
            
            const sql = 'INSERT INTO accounts (account_name, account_password, account_role, has_voted) VALUES (?, ?, ?, ?)';
            const [result] = await this.pool.execute(sql, [
                account.accountName,
                hashedPassword,
                account.accountRole || 'voter',
                account.hasVoted || 0
            ]);
            
            account.accountId = result.insertId;
            console.log(`Account added: ${account.accountName} (ID: ${account.accountId})`);
            return account;
        } catch (error) {
            console.error('Error adding account:', error.message);
            throw error;
        }
    }

    /**
     * Update an existing account
     * @param {Object} account - Account object with all properties including accountId
     */
    static async updateAccount(account) {
        try {
            // If password is being updated, hash it
            let passwordToStore = account.accountPassword;
            if (account.accountPassword && !account.accountPassword.startsWith('$2b$')) {
                passwordToStore = await bcrypt.hash(account.accountPassword, 10);
            }
            
            const sql = 'UPDATE accounts SET account_name = ?, account_password = ?, account_role = ?, has_voted = ? WHERE account_id = ?';
            await this.pool.execute(sql, [
                account.accountName,
                passwordToStore,
                account.accountRole,
                account.hasVoted,
                account.accountId
            ]);
            
            console.log(`Account updated: ${account.accountName}`);
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
            const sql = 'INSERT INTO candidates (candidate_name, candidate_party, candidate_description, current_votes) VALUES (?, ?, ?, ?)';
            const [result] = await this.pool.execute(sql, [
                candidate.candidateName,
                candidate.candidateParty,
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

    // ==================== VOTE MANAGEMENT ====================

    /**
     * Record a vote in the database
     * @param {number} accountId - The voter's account ID
     * @param {number} candidateId - The candidate's ID
     * @returns {boolean} True if successful, false otherwise
     */
    static async recordVote(accountId, candidateId) {
        const connection = await this.pool.getConnection();
        
        try {
            await connection.beginTransaction();

            // Check if account has already voted
            const [account] = await connection.execute(
                'SELECT has_voted FROM accounts WHERE account_id = ?',
                [accountId]
            );

            if (account.length === 0) {
                throw new Error('Account not found');
            }

            if (account[0].has_voted) {
                throw new Error('Account has already voted');
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

            // Mark account as voted
            await connection.execute(
                'UPDATE accounts SET has_voted = 1 WHERE account_id = ?',
                [accountId]
            );

            await connection.commit();
            console.log(`Vote recorded: Account ${accountId} voted for Candidate ${candidateId}`);
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
     * Get all votes
     * @returns {Array} Array of vote records
     */
    static async getAllVotes() {
        try {
            const sql = 'SELECT * FROM votes';
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