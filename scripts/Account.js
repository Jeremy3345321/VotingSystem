class Account {
    static Role = {
        VOTER: 'VOTER',
        FACILITATOR: 'FACILITATOR'
    };

    // Fields
    constructor(accountId, accountPassword, accountName, accountRole) {
        this.accountId = accountId;
        this.accountPassword = accountPassword;
        this.accountName = accountName;
        this.accountRole = accountRole;
        this.hasVoted = false;
    }

    async castVote(selectedCandidate) {
        if (this.accountRole !== Account.Role.VOTER) {
            console.log("Only voters can cast votes.");
            return false;
        }
        
        if (this.hasVoted) {
            console.log("You have already voted.");
            return false;
        }
        
        if (!selectedCandidate) {
            console.log("Invalid candidate selected.");
            return false;
        }
        
        try {
            // Add vote to candidate
            await selectedCandidate.addVote();
            
            // Mark account as voted
            this.hasVoted = true;
            await Database.updateAccount(this);
            
            // Record vote in votes table
            await Database.recordVote(this.accountId, selectedCandidate.candidateId);
            
            return true;
        } catch (error) {
            console.error('Error casting vote:', error.message);
            return false;
        }
    }

    // Getters
    getId() {
        return this.accountId;
    }

    getPassword() {
        return this.accountPassword;
    }

    getName() {
        return this.accountName;
    }

    getRole() {
        return this.accountRole;
    }

    getHasVoted() {
        return this.hasVoted;
    }

    // Setters
    setId(accountId) {
        this.accountId = accountId;
    }

    setPassword(accountPassword) {
        this.accountPassword = accountPassword;
    }

    setName(accountName) {
        this.accountName = accountName;
    }

    setRole(role) {
        this.accountRole = role;
    }

    setHasVoted(hasVoted) {
        this.hasVoted = hasVoted;
    }
}