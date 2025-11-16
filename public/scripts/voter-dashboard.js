// voter-dashboard.js

const API_BASE_URL = 'http://localhost:3000/api';

// Session data
let accountId = null;
let accountName = null;

// Voting state
const votedPositions = new Set();
const positions = ['President', 'Vice President', 'Secretary', 'Treasurer'];

// Initialize dashboard
async function init() {
    console.log('=== Initializing Voter Dashboard ===');
    
    // Check if user is logged in
    accountId = sessionStorage.getItem('accountId');
    accountName = sessionStorage.getItem('accountName');
    const accountRole = sessionStorage.getItem('accountRole');

    console.log('Session Data:', {
        accountId,
        accountName,
        accountRole,
        accountRoleLength: accountRole ? accountRole.length : 0,
        accountRoleTrimmed: accountRole ? accountRole.trim().toLowerCase() : null
    });

    // Normalize role check - trim and convert to lowercase
    const normalizedRole = accountRole ? accountRole.trim().toLowerCase() : null;
    
    if (!accountId || normalizedRole !== 'voter') {
        console.warn('Invalid session - redirecting to login');
        console.log('Reason:', !accountId ? 'No accountId' : `Role mismatch: "${accountRole}" (normalized: "${normalizedRole}") !== "voter"`);
        window.location.href = 'login.html';
        return;
    }

    console.log('✓ Session valid - User is a voter');

    // Update user name
    document.getElementById('userName').textContent = `Welcome, ${accountName}`;

    // Load voted positions
    console.log('Loading voted positions...');
    await loadVotedPositions();

    // Load candidates for all positions
    console.log('Loading all candidates...');
    await loadAllCandidates();

    // Setup logout
    document.getElementById('logoutBtn').addEventListener('click', logout);
    
    console.log('=== Dashboard Initialization Complete ===');
}

// Load positions the user has already voted for
async function loadVotedPositions() {
    try {
        const response = await fetch(`${API_BASE_URL}/votes/account/${accountId}`);
        const data = await response.json();

        if (data.success) {
            data.data.forEach(vote => {
                votedPositions.add(vote.candidate_party);
            });
            updateVotingStatus();
        }
    } catch (error) {
        console.error('Error loading voted positions:', error);
    }
}

// Update voting status display
function updateVotingStatus() {
    const statusMessage = document.getElementById('statusMessage');
    const progressContainer = document.getElementById('progressContainer');
    const progressBar = document.getElementById('progressBar');
    
    const votedCount = votedPositions.size;
    const totalCount = positions.length;
    const percentage = (votedCount / totalCount) * 100;

    if (votedCount === totalCount) {
        statusMessage.innerHTML = '✅ You have completed voting for all positions. Thank you for participating!';
        statusMessage.style.color = '#3c3';
    } else {
        statusMessage.innerHTML = `📝 You have voted for ${votedCount} out of ${totalCount} positions. Please complete your vote.`;
        statusMessage.style.color = '#666';
    }

    // Show progress bar
    progressContainer.style.display = 'block';
    progressBar.style.width = percentage + '%';
    progressBar.textContent = `${votedCount}/${totalCount}`;

    // Update position indicators
    positions.forEach(position => {
        const indicator = document.getElementById(`indicator-${position.replace(' ', '')}`);
        if (indicator) {
            if (votedPositions.has(position)) {
                indicator.textContent = '✅ Voted';
                indicator.className = 'vote-indicator voted';
            } else {
                indicator.textContent = '⚪ Not Voted';
                indicator.className = 'vote-indicator not-voted';
            }
        }
    });
}

// Load all candidates
async function loadAllCandidates() {
    try {
        const response = await fetch(`${API_BASE_URL}/candidates`);
        const data = await response.json();

        if (data.success) {
            displayCandidatesByPosition(data.data);
        } else {
            showAlert('Failed to load candidates', 'error');
        }
    } catch (error) {
        console.error('Error loading candidates:', error);
        showAlert('Error connecting to server', 'error');
    }
}

// Display candidates grouped by position
function displayCandidatesByPosition(candidates) {
    // Group candidates by position
    const candidatesByPosition = {
        'President': [],
        'Vice President': [],
        'Secretary': [],
        'Treasurer': []
    };

    candidates.forEach(candidate => {
        const position = candidate.candidate_party;
        if (candidatesByPosition[position]) {
            candidatesByPosition[position].push(candidate);
        }
    });

    // Render each position
    Object.keys(candidatesByPosition).forEach(position => {
        renderPosition(position, candidatesByPosition[position]);
    });
}

// Render candidates for a specific position
function renderPosition(position, candidates) {
    const containerMap = {
        'President': 'presidentCandidates',
        'Vice President': 'vicePresidentCandidates',
        'Secretary': 'secretaryCandidates',
        'Treasurer': 'treasurerCandidates'
    };

    const containerId = containerMap[position];
    const container = document.getElementById(containerId);

    if (!container) return;

    const hasVoted = votedPositions.has(position);

    if (candidates.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No candidates available for this position</p></div>';
        return;
    }

    container.innerHTML = '';
    candidates.forEach(candidate => {
        const card = createCandidateCard(candidate, position, hasVoted);
        container.appendChild(card);
    });
}

// Create candidate card element
function createCandidateCard(candidate, position, hasVoted) {
    const card = document.createElement('div');
    card.className = 'candidate-card';
    card.dataset.candidateId = candidate.candidate_id;
    card.dataset.position = position;

    if (hasVoted) {
        card.classList.add('disabled');
    }

    card.innerHTML = `
        <div class="candidate-name">${candidate.candidate_name}</div>
        <div class="candidate-party">${position}</div>
        <div class="candidate-description">${candidate.candidate_description || 'No description available'}</div>
        <div class="candidate-votes">Current Votes: ${candidate.current_votes}</div>
    `;

    // Add click handler if not voted for this position
    if (!hasVoted) {
        card.addEventListener('click', () => voteForCandidate(candidate, position));
    }

    return card;
}

// Vote for a candidate
async function voteForCandidate(candidate, position) {
    // Confirm vote
    if (!confirm(`Vote for ${candidate.candidate_name} as ${position}?\n\nThis action cannot be undone.`)) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/votes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                accountId: parseInt(accountId),
                candidateId: candidate.candidate_id
            })
        });

        const data = await response.json();

        if (data.success) {
            showAlert(`Successfully voted for ${candidate.candidate_name} as ${position}!`, 'success');
            
            // Add to voted positions
            votedPositions.add(position);
            
            // Update UI
            updateVotingStatus();
            
            // Reload candidates to show updated counts
            await loadAllCandidates();
            
            // Scroll to next position if not completed
            if (votedPositions.size < positions.length) {
                scrollToNextPosition(position);
            }
        } else {
            throw new Error(data.message);
        }

    } catch (error) {
        console.error('Error voting:', error);
        showAlert(error.message || 'Error submitting vote. Please try again.', 'error');
    }
}

// Scroll to next unvoted position
function scrollToNextPosition(currentPosition) {
    const currentIndex = positions.indexOf(currentPosition);
    
    for (let i = currentIndex + 1; i < positions.length; i++) {
        if (!votedPositions.has(positions[i])) {
            const sectionId = `section-${positions[i].replace(' ', '')}`;
            const section = document.getElementById(sectionId);
            if (section) {
                section.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            break;
        }
    }
}

// Show alert message
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertContainer.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        window.location.href = 'login.html';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);