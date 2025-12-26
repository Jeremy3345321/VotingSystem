//admin-dashboard.js

const API_BASE_URL = 'http://localhost:3000/api';
let accountId = null;
let accountName = null;
let currentEditingCandidate = null;

// Initialize dashboard
async function init() {
    console.log('=== Initializing Admin Dashboard ===');
    
    accountId = sessionStorage.getItem('accountId');
    accountName = sessionStorage.getItem('accountName');
    const accountRole = sessionStorage.getItem('accountRole');

    const normalizedRole = accountRole ? accountRole.trim().toLowerCase() : null;
    
    if (!accountId || normalizedRole !== 'admin') {
        console.warn('Invalid session - redirecting to login');
        window.location.href = 'login.html';
        return;
    }

    console.log('✓ Session valid - User is an admin');

    document.getElementById('userName').textContent = `Welcome, ${accountName}`;

    // Load dashboard data
    await loadStatistics();
    await loadAllCandidates();

    // Setup event listeners for Add Modal
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('addCandidateBtn').addEventListener('click', openAddModal);
    document.getElementById('closeAddModalBtn').addEventListener('click', closeAddModal);
    document.getElementById('cancelAddBtn').addEventListener('click', closeAddModal);
    document.getElementById('addCandidateForm').addEventListener('submit', handleAddCandidate);

    // Setup event listeners for Edit Modal
    document.getElementById('closeEditModalBtn').addEventListener('click', closeEditModal);
    document.getElementById('cancelEditBtn').addEventListener('click', closeEditModal);
    document.getElementById('editCandidateForm').addEventListener('submit', handleEditCandidate);
    document.getElementById('deleteCandidateBtn').addEventListener('click', handleDeleteCandidate);

    // Close modals on outside click
    document.getElementById('addCandidateModal').addEventListener('click', (e) => {
        if (e.target.id === 'addCandidateModal') {
            closeAddModal();
        }
    });

    document.getElementById('editCandidateModal').addEventListener('click', (e) => {
        if (e.target.id === 'editCandidateModal') {
            closeEditModal();
        }
    });
    
    console.log('=== Dashboard Initialization Complete ===');
}

// Load statistics
async function loadStatistics() {
    try {
        const [candidates, accounts, votes] = await Promise.all([
            fetch(`${API_BASE_URL}/candidates`).then(r => r.json()),
            fetch(`${API_BASE_URL}/accounts`).then(r => r.json()),
            fetch(`${API_BASE_URL}/votes`).then(r => r.json())
        ]);

        const totalCandidates = candidates.data?.length || 0;
        
        const voters = accounts.data?.filter(a => 
            a.account_role.trim().toLowerCase() === 'voter'
        ) || [];
        
        const totalVoters = voters.length;
        const votedVoters = voters.filter(v => v.has_voted === 1).length;
        const totalVotes = votes.data?.length || 0;
        const participation = totalVoters > 0 ? Math.round((votedVoters / totalVoters) * 100) : 0;

        document.getElementById('totalCandidates').textContent = totalCandidates;
        document.getElementById('totalVoters').textContent = totalVoters;
        document.getElementById('totalVotes').textContent = totalVotes;
        document.getElementById('participation').textContent = participation + '%';
    } catch (error) {
        console.error('Error loading statistics:', error);
    }
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

    if (candidates.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>No candidates for this position yet</p></div>';
        return;
    }

    container.innerHTML = '';
    candidates.forEach(candidate => {
        const card = createCandidateCard(candidate);
        container.appendChild(card);
    });
}

// Create candidate card element (clickable)
function createCandidateCard(candidate) {
    const card = document.createElement('div');
    card.className = 'candidate-card';
    card.style.cursor = 'pointer';

    card.innerHTML = `
        <div class="candidate-name">${candidate.candidate_name}</div>
        <div class="candidate-party">${candidate.candidate_party}</div>
        <div class="candidate-description">${candidate.candidate_description || 'No description available'}</div>
        <div class="candidate-votes">Current Votes: ${candidate.current_votes}</div>
    `;

    // Add click event to open edit modal
    card.addEventListener('click', () => openEditModal(candidate));

    return card;
}

// ==================== ADD MODAL FUNCTIONS ====================

function openAddModal() {
    document.getElementById('addCandidateModal').classList.add('show');
    document.getElementById('candidateName').focus();
}

function closeAddModal() {
    document.getElementById('addCandidateModal').classList.remove('show');
    document.getElementById('addCandidateForm').reset();
}

// Handle add candidate form submission
async function handleAddCandidate(e) {
    e.preventDefault();

    const candidateName = document.getElementById('candidateName').value.trim();
    const candidateParty = document.getElementById('candidateParty').value;
    const candidatePosition = document.getElementById('candidatePosition').value.trim();
    const candidateDescription = document.getElementById('candidateDescription').value.trim();

    if (!candidateName || !candidateParty || !candidatePosition) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/candidates`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                candidateName,
                candidateParty,
                candidatePosition,
                candidateDescription
            })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Candidate added successfully!', 'success');
            closeAddModal();
            await loadStatistics();
            await loadAllCandidates();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error adding candidate:', error);
        showAlert(error.message || 'Error adding candidate. Please try again.', 'error');
    }
}

// ==================== EDIT MODAL FUNCTIONS ====================

function openEditModal(candidate) {
    currentEditingCandidate = candidate;
    
    document.getElementById('editCandidateId').value = candidate.candidate_id;
    document.getElementById('editCandidateName').value = candidate.candidate_name;
    document.getElementById('editCandidateParty').value = candidate.candidate_party;
    document.getElementById('editCandidatePosition').value = candidate.candidate_position || '';
    document.getElementById('editCandidateDescription').value = candidate.candidate_description || '';
    document.getElementById('editCandidateVotes').value = candidate.current_votes;
    
    document.getElementById('editCandidateModal').classList.add('show');
}

function closeEditModal() {
    document.getElementById('editCandidateModal').classList.remove('show');
    document.getElementById('editCandidateForm').reset();
    currentEditingCandidate = null;
}

// Handle edit candidate form submission
async function handleEditCandidate(e) {
    e.preventDefault();

    const candidateId = document.getElementById('editCandidateId').value;
    const candidateName = document.getElementById('editCandidateName').value.trim();
    const candidateParty = document.getElementById('editCandidateParty').value;
    const candidatePosition = document.getElementById('editCandidatePosition').value.trim();
    const candidateDescription = document.getElementById('editCandidateDescription').value.trim();

    if (!candidateName || !candidateParty || !candidatePosition) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/candidates/${candidateId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                candidateName,
                candidateParty,
                candidatePosition,
                candidateDescription,
                currentVotes: currentEditingCandidate.current_votes
            })
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Candidate updated successfully!', 'success');
            closeEditModal();
            await loadStatistics();
            await loadAllCandidates();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error updating candidate:', error);
        showAlert(error.message || 'Error updating candidate. Please try again.', 'error');
    }
}

// Handle delete candidate
async function handleDeleteCandidate() {
    if (!currentEditingCandidate) return;

    const confirmed = confirm(`Are you sure you want to delete ${currentEditingCandidate.candidate_name}?\n\nThis action cannot be undone.`);
    
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_BASE_URL}/candidates/${currentEditingCandidate.candidate_id}`, {
            method: 'DELETE'
        });

        const data = await response.json();

        if (data.success) {
            showAlert('Candidate deleted successfully!', 'success');
            closeEditModal();
            await loadStatistics();
            await loadAllCandidates();
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Error deleting candidate:', error);
        showAlert(error.message || 'Error deleting candidate. Please try again.', 'error');
    }
}

// ==================== UTILITY FUNCTIONS ====================

// Show alert message
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('alertContainer');
    
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    
    alertContainer.appendChild(alert);

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