class Candidate {
    // Fields
    constructor(candidateId, candidateName, candidateParty, candidateDescription) {
        this.candidateId = candidateId;
        this.candidateName = candidateName;
        this.candidateParty = candidateParty;
        this.candidateDescription = candidateDescription;
        this.currentVotes = 0;
    }

    addVote() {
        this.currentVotes += 1;
        Database.updateCandidate(this);
    }

    // Getters
    getId() {
        return this.candidateId;
    }

    getName() {
        return this.candidateName;
    }

    getParty() {
        return this.candidateParty;
    }

    getDescription() {
        return this.candidateDescription;
    }

    getVotes() {
        return this.currentVotes;
    }

    // Setters
    setId(candidateId) {
        this.candidateId = candidateId;
    }

    setName(candidateName) {
        this.candidateName = candidateName;
    }

    setParty(candidateParty) {
        this.candidateParty = candidateParty;
    }

    setDescription(candidateDescription) {
        this.candidateDescription = candidateDescription;
    }

    setVotes(currentVotes) {
        this.currentVotes = currentVotes;
    }

    toString() {
        return `${this.candidateName} (${this.candidateParty}) - Votes: ${this.currentVotes}`;
    }
}