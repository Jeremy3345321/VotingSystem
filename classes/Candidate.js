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
}