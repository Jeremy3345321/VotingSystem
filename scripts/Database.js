const mysql = require('mysql2/promise');

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
    
    // In-memory data storage. Used for debugging code process of system without database communication.
    // Will be replaced by MySQL database later.
    static accounts = new Map(); // HashMap[int, Account]
    static candidates = new Map(); // HashMap[int, Candidate]
    static votes = new Array(); // ArrayList[VoteEntry] 


    // METHODS

    // In-memory methods for account management:
    // static updateAccount(account) {
    //     this.accounts.set(account.accountId, account);
    //     console.log(`Account updated: ${account.accountName}`);
    // }
    // static addAccount(account) {
    //     this.accounts.set(account.accountId, account);
    // }
    // static getAccount(accountId) {
    //     return this.accounts.get(accountId);
    // }

    static async updateAccount(account) {
        try {
            const sql = 'UPDATE accounts SET account_name = ?, account_password = ?, account_role = ?, has_voted = ? WHERE account_id = ?';
            await this.pool.execute(sql, [
                account.accountName,
                account.accountPassword,
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

    static async addAccount(account) {
        try {
            const sql = 'INSERT INTO accounts (account_name, account_password, account_role, has_voted) VALUES (?, ?, ?, ?)';
            const [result] = await this.pool.execute(sql, [
                account.accountName,
                account.accountPassword,
                account.accountRole,
                account.hasVoted
            ]);
            
            account.accountId = result.insertId;
            console.log(`Account added: ${account.accountName}`);
            return account;
        } catch (error) {
            console.error('Error adding account:', error.message);
            throw error;
        }
    }

    static async getAccount(accountId) {
        try {
            const sql = 'SELECT * FROM accounts WHERE account_id = ?';
            const [rows] = await this.pool.execute(sql, [accountId]);
            
            if (rows.length > 0) {
                const row = rows[0];
                const account = new Account(
                    row.account_id,
                    row.account_password,
                    row.account_name,
                    row.account_role
                );
                account.hasVoted = row.has_voted;
                return account;
            }
            return null;
        } catch (error) {
            console.error('Error getting account:', error.message);
            throw error;
        }
    }

    // In-memory methods for candidate management
    // static updateCandidate(candidate) {
    //     this.candidates.set(candidate.candidateId, candidate);
    //     console.log(`Candidate votes updated: ${candidate.toString()}`);
    // }
    // static getCandidate(candidateId) {
    //     return this.candidates.get(candidateId);
    // }
    // static addCandidate(candidate) {
    //     this.candidates.set(candidate.candidateId, candidate);
    // }
    // static getAllCandidates() {
    //     return new Map(this.candidates);
    // }


    static async addCandidate(candidate) {
        try {
            const sql = 'INSERT INTO candidates (candidate_name, candidate_party, candidate_description, current_votes) VALUES (?, ?, ?, ?)';
            const [result] = await this.pool.execute(sql, [
                candidate.candidateName,
                candidate.candidateParty,
                candidate.candidateDescription,
                candidate.currentVotes
            ]);
            
            candidate.candidateId = result.insertId;
            console.log(`Candidate added: ${candidate.candidateName}`);
            return candidate;
        } catch (error) {
            console.error('Error adding candidate:', error.message);
            throw error;
        }
    }

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
            
            console.log(`Candidate updated: ${candidate.toString()}`);
        } catch (error) {
            console.error('Error updating candidate:', error.message);
            throw error;
        }
    }

    static async getCandidate(candidateId) {
        try {
            const sql = 'SELECT * FROM candidates WHERE candidate_id = ?';
            const [rows] = await this.pool.execute(sql, [candidateId]);
            
            if (rows.length > 0) {
                const row = rows[0];
                const candidate = new Candidate(
                    row.candidate_id,
                    row.candidate_name,
                    row.candidate_party,
                    row.candidate_description
                );
                candidate.currentVotes = row.current_votes;
                return candidate;
            }
            return null;
        } catch (error) {
            console.error('Error getting candidate:', error.message);
            throw error;
        }
    }

    static async getAllCandidatesByVotes() {
        try {
            const sql = 'SELECT * FROM candidates ORDER BY current_votes DESC';
            const [rows] = await this.pool.execute(sql);
            
            return rows.map(row => {
                const candidate = new Candidate(
                    row.candidate_id,
                    row.candidate_name,
                    row.candidate_party,
                    row.candidate_description
                );
                candidate.currentVotes = row.current_votes;
                return candidate;
            });
        } catch (error) {
            console.error('Error getting all candidates:', error.message);
            throw error;
        }
    }

    // static recordVote(accountId, candidateId) {
    //     this.votes.push(new VoteEntry(accountId, candidateId));
    // }

    static async recordVote(accountId, candidateId) {
        try {
            const sql = 'INSERT INTO votes (account_id, candidate_id) VALUES (?, ?)';
            await this.pool.execute(sql, [accountId, candidateId]);
            console.log('Vote recorded');
            return true;
        } catch (error) {
            console.error('Error recording vote:', error.message);
            return false;
        }
    }
}