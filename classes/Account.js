const Database = require('./Database');

class Account {
    static Role = {
        VOTER: 'voter',
        ADMIN: 'admin'
    };

    // Fields
    constructor(accountId, accountPassword, accountName, accountRole) {
        this.accountId = accountId;
        this.accountPassword = accountPassword;
        this.accountName = accountName;
        this.accountRole = accountRole;
        this.hasVoted = false; // True when voted for ALL positions
        this.votedPositions = new Set(); // Track which positions have been voted for
    }

    /**
     * Cast a vote for a candidate in a specific position
     * @param {Candidate} selectedCandidate - The candidate to vote for
     * @returns {Promise<boolean>} True if vote was cast successfully
     */
    async castVote(selectedCandidate) {
        if (this.accountRole !== Account.Role.VOTER) {
            console.log("Only voters can cast votes.");
            return false;
        }
        
        if (!selectedCandidate) {
            console.log("Invalid candidate selected.");
            return false;
        }

        const position = selectedCandidate.candidateParty;

        // Check if already voted for this position
        if (this.votedPositions.has(position)) {
            console.log(`You have already voted for ${position}.`);
            return false;
        }
        
        try {
            // Record vote using Database transaction (handles all updates)
            const success = await Database.recordVote(this.accountId, selectedCandidate.candidateId);
            
            if (success) {
                // Update local state
                this.votedPositions.add(position);
                
                // Check if voted for all positions
                const allPositions = ['President', 'Vice President', 'Secretary', 'Treasurer'];
                if (this.votedPositions.size >= allPositions.length) {
                    this.hasVoted = true;
                }
                
                console.log(`Vote cast for ${selectedCandidate.candidateName} as ${position}`);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error casting vote:', error.message);
            return false;
        }
    }

    /**
     * Check if this account has voted for a specific position
     * @param {string} position - The position to check
     * @returns {boolean} True if already voted for this position
     */
    hasVotedForPosition(position) {
        return this.votedPositions.has(position);
    }

    /**
     * Load the positions this account has voted for from the database
     * @returns {Promise<void>}
     */
    async loadVotedPositions() {
        try {
            const positions = await Database.getVotedPositions(this.accountId);
            this.votedPositions = new Set(positions);
            
            // Update hasVoted flag
            const allPositions = ['President', 'Vice President', 'Secretary', 'Treasurer'];
            this.hasVoted = this.votedPositions.size >= allPositions.length;
        } catch (error) {
            console.error('Error loading voted positions:', error.message);
        }
    }

    /**
     * Get voting progress
     * @returns {Object} Object with votedCount, totalCount, and percentage
     */
    getVotingProgress() {
        const allPositions = ['President', 'Vice President', 'Secretary', 'Treasurer'];
        const votedCount = this.votedPositions.size;
        const totalCount = allPositions.length;
        const percentage = (votedCount / totalCount) * 100;

        return {
            votedCount,
            totalCount,
            percentage,
            remainingPositions: allPositions.filter(pos => !this.votedPositions.has(pos))
        };
    }

    /**
     * Static method to create Account from database row
     * @param {Object} row - Database row object
     * @returns {Account} Account instance
     */
    static fromDatabaseRow(row) {
        const account = new Account(
            row.account_id,
            row.account_password,
            row.account_name,
            row.account_role
        );
        account.hasVoted = row.has_voted === 1;
        return account;
    }

    /**
     * Convert Account to database object format
     * @returns {Object} Object ready for database operations
     */
    toDatabaseObject() {
        return {
            accountId: this.accountId,
            accountName: this.accountName,
            accountPassword: this.accountPassword,
            accountRole: this.accountRole,
            hasVoted: this.hasVoted ? 1 : 0
        };
    }
}

module.exports = Account;