const Database = require('./Database');

class Candidate {
    // Valid positions for student council
    static Position = {
        PRESIDENT: 'President',
        VICE_PRESIDENT: 'Vice President',
        SECRETARY: 'Secretary',
        TREASURER: 'Treasurer'
    };

    // Fields
    constructor(candidateId, candidateName, candidateParty, candidateDescription) {
        this.candidateId = candidateId;
        this.candidateName = candidateName;
        this.candidateParty = candidateParty; // This represents the POSITION for now
        this.candidateDescription = candidateDescription;
        this.currentVotes = 0;
    }

    /**
     * Add a vote to this candidate
     * Note: This should only be called from within a transaction (via Database.recordVote)
     * @returns {Promise<void>}
     */
    async addVote() {
        this.currentVotes += 1;
        await Database.updateCandidate(this);
        console.log(`Vote added to ${this.candidateName}. Total votes: ${this.currentVotes}`);
    }

    /**
     * Get the position this candidate is running for
     * @returns {string} The position name
     */
    getPosition() {
        return this.candidateParty;
    }

    /**
     * Check if this candidate is running for a specific position
     * @param {string} position - The position to check
     * @returns {boolean} True if running for this position
     */
    isRunningFor(position) {
        return this.candidateParty === position;
    }

    /**
     * Get candidate information as a display object
     * @returns {Object} Object with formatted candidate information
     */
    getDisplayInfo() {
        return {
            id: this.candidateId,
            name: this.candidateName,
            position: this.candidateParty,
            description: this.candidateDescription || 'No description available',
            votes: this.currentVotes
        };
    }

    /**
     * Static method to validate position
     * @param {string} position - Position to validate
     * @returns {boolean} True if valid position
     */
    static isValidPosition(position) {
        return Object.values(Candidate.Position).includes(position);
    }

    /**
     * Static method to get all valid positions
     * @returns {Array<string>} Array of valid position names
     */
    static getAllPositions() {
        return Object.values(Candidate.Position);
    }

    /**
     * Static method to create Candidate from database row
     * @param {Object} row - Database row object
     * @returns {Candidate} Candidate instance
     */
    static fromDatabaseRow(row) {
        const candidate = new Candidate(
            row.candidate_id,
            row.candidate_name,
            row.candidate_party,
            row.candidate_description
        );
        candidate.currentVotes = row.current_votes || 0;
        return candidate;
    }

    /**
     * Convert Candidate to database object format
     * @returns {Object} Object ready for database operations
     */
    toDatabaseObject() {
        return {
            candidateId: this.candidateId,
            candidateName: this.candidateName,
            candidateParty: this.candidateParty,
            candidateDescription: this.candidateDescription,
            currentVotes: this.currentVotes
        };
    }

    /**
     * Compare candidates by vote count (for sorting)
     * @param {Candidate} a - First candidate
     * @param {Candidate} b - Second candidate
     * @returns {number} Comparison result
     */
    static compareByVotes(a, b) {
        return b.currentVotes - a.currentVotes;
    }

    /**
     * Get winner for a specific position
     * @param {Array<Candidate>} candidates - Array of candidates
     * @param {string} position - Position to check
     * @returns {Candidate|null} Winning candidate or null if no candidates
     */
    static getWinnerForPosition(candidates, position) {
        const positionCandidates = candidates
            .filter(c => c.candidateParty === position)
            .sort(Candidate.compareByVotes);
        
        return positionCandidates.length > 0 ? positionCandidates[0] : null;
    }
}

module.exports = Candidate;