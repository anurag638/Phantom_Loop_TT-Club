// Table Tennis Club Management System
// Pure HTML/CSS/JS implementation

// Global variables
let currentUser = null;
let players = [];
let matches = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeData();
    initializeEmailJS();
    
    // Always ensure admin account exists on every device
    ensureAdminExists();
    
    // Debug: Check if admin was created
    setTimeout(() => {
        const users = JSON.parse(localStorage.getItem('ttc_users') || '[]');
        console.log('Current users:', users);
        const admin = users.find(u => u.username === 'admin');
        if (admin) {
            console.log('Admin account found:', admin);
        } else {
            console.log('No admin account found');
        }
    }, 1000);
});

// Ensure admin account exists on every device
function ensureAdminExists() {
    const users = JSON.parse(localStorage.getItem('ttc_users') || '[]');
    const adminExists = users.some(user => user.username === 'admin');
    
    if (!adminExists) {
        const admin = {
            id: 1,
            username: 'admin',
            email: 'admin@phantomloop.com',
            password: 'admin123',
            role: 'admin'
        };
        users.push(admin);
        localStorage.setItem('ttc_users', JSON.stringify(users));
        console.log('Admin account created on this device');
    }
}

// EmailJS Configuration
function initializeEmailJS() {
    // Check if configuration is available
    if (window.EMAILJS_CONFIG && window.EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
        emailjs.init(window.EMAILJS_CONFIG.PUBLIC_KEY);
        console.log('EmailJS initialized successfully!');
    } else {
        console.log('EmailJS not configured. Please update emailjs-config.js with your credentials.');
    }
}

// Data Management Functions
function initializeData() {
    // Load data from localStorage or create default data
    const savedPlayers = localStorage.getItem('ttc_players');
    const savedMatches = localStorage.getItem('ttc_matches');
    const savedUsers = localStorage.getItem('ttc_users');
    
    if (savedPlayers) {
        players = JSON.parse(savedPlayers);
    } else {
        createDefaultData();
    }
    
    if (savedMatches) {
        matches = JSON.parse(savedMatches);
    }
    
    // Always ensure default admin exists
    ensureDefaultAdmin();
}

function createDefaultUsers() {
    // Create permanent default admin user
    const defaultUsers = [
        {
            id: 1,
            username: 'admin',
            email: 'admin@phantomloop.com',
            password: 'admin123',
            role: 'admin'
        }
    ];
    localStorage.setItem('ttc_users', JSON.stringify(defaultUsers));
}

function ensureDefaultAdmin() {
    const savedUsers = localStorage.getItem('ttc_users');
    let users = [];
    
    if (savedUsers) {
        users = JSON.parse(savedUsers);
    }
    
    // Check if admin user exists
    const adminExists = users.some(user => user.username === 'admin');
    
    if (!adminExists) {
        // Add default admin user
        const maxId = users.length > 0 ? Math.max(...users.map(u => u.id)) : 0;
        const defaultAdmin = {
            id: maxId + 1,
            username: 'admin',
            email: 'admin@phantomloop.com',
            password: 'admin123',
            role: 'admin'
        };
        users.push(defaultAdmin);
        localStorage.setItem('ttc_users', JSON.stringify(users));
        console.log('Default admin account created with ID:', defaultAdmin.id);
    } else {
        console.log('Admin account already exists');
    }
}

function createDefaultData() {
    // Start with empty players array - no default players
    players = [];
    
    // Start with empty matches array - no default matches
    matches = [];
    
    saveData();
}

function saveData() {
    localStorage.setItem('ttc_players', JSON.stringify(players));
    localStorage.setItem('ttc_matches', JSON.stringify(matches));
}

// Authentication Functions
function authenticateUser(username, password) {
    const users = JSON.parse(localStorage.getItem('ttc_users') || '[]');
    const user = users.find(u => u.username === username && u.password === password);
    
    if (user) {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            playerId: user.playerId
        };
    }
    return null;
}

function getCurrentUser() {
    const userData = localStorage.getItem('ttc_current_user');
    return userData ? JSON.parse(userData) : null;
}

function setCurrentUser(user) {
    localStorage.setItem('ttc_current_user', JSON.stringify(user));
    currentUser = user;
}

function logout() {
    localStorage.removeItem('ttc_current_user');
    currentUser = null;
    window.location.href = 'index.html';
}

// Player Management Functions
function getPlayers() {
    return players.sort((a, b) => a.rank - b.rank);
}

function getPlayerById(id) {
    return players.find(p => p.id === id);
}

function addPlayer(playerData) {
    const newPlayer = {
        id: Math.max(...players.map(p => p.id), 0) + 1,
        name: playerData.name,
        rank: playerData.rank,
        wins: 0,
        losses: 0,
        current_streak: 0,
        attendance_status: 'Present',
        last_seen: new Date().toISOString().split('T')[0],
        win_rate: 0.0
    };
    
    // Update ranks of other players
    players.forEach(p => {
        if (p.rank >= newPlayer.rank) {
            p.rank++;
        }
    });
    
    players.push(newPlayer);
    
    // Create user account for authentication
    const users = JSON.parse(localStorage.getItem('ttc_users') || '[]');
    const newUser = {
        id: Math.max(...users.map(u => u.id), 0) + 1,
        username: playerData.username,
        email: playerData.email,
        password: playerData.password,
        role: 'player',
        playerId: newPlayer.id
    };
    users.push(newUser);
    localStorage.setItem('ttc_users', JSON.stringify(users));
    
    saveData();
    
    // Send welcome email to the new player
    sendWelcomeEmail(playerData.email, playerData.name, playerData.username, playerData.password);
    
    return newPlayer;
}

function updatePlayer(playerId, updateData) {
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
        players[playerIndex] = { ...players[playerIndex], ...updateData };
        
        // Recalculate win rate
        const totalGames = players[playerIndex].wins + players[playerIndex].losses;
        players[playerIndex].win_rate = totalGames > 0 ? 
            (players[playerIndex].wins / totalGames * 100) : 0;
        
        saveData();
        return players[playerIndex];
    }
    return null;
}

function deletePlayer(playerId) {
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
        const deletedPlayer = players[playerIndex];
        
        // Remove all matches involving this player
        matches = matches.filter(m => 
            m.player1_id !== playerId && 
            m.player2_id !== playerId && 
            m.winner_id !== playerId
        );
        
        // Remove the player
        players.splice(playerIndex, 1);
        
        // Update rankings
        updateRankings();
        saveData();
        return deletedPlayer;
    }
    return null;
}

function updateRankings() {
    // Sort players by wins and win rate
    players.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.win_rate - a.win_rate;
    });
    
    // Update ranks
    players.forEach((player, index) => {
        player.rank = index + 1;
    });
}

// Match Management Functions
function getMatches() {
    return matches.sort((a, b) => new Date(b.match_date) - new Date(a.match_date));
}

function addMatch(matchData) {
    const newMatch = {
        id: Math.max(...matches.map(m => m.id), 0) + 1,
        player1_id: matchData.player1_id,
        player2_id: matchData.player2_id,
        player1_score: matchData.player1_score,
        player2_score: matchData.player2_score,
        winner_id: matchData.winner_id,
        match_date: matchData.match_date,
        created_at: new Date().toISOString()
    };
    
    matches.push(newMatch);
    
    // Update player statistics
    const player1 = getPlayerById(matchData.player1_id);
    const player2 = getPlayerById(matchData.player2_id);
    
    if (player1 && player2) {
        if (matchData.winner_id === matchData.player1_id) {
            player1.wins++;
            player2.losses++;
            player1.current_streak = Math.max(0, player1.current_streak) + 1;
            player2.current_streak = Math.min(0, player2.current_streak) - 1;
        } else {
            player2.wins++;
            player1.losses++;
            player2.current_streak = Math.max(0, player2.current_streak) + 1;
            player1.current_streak = Math.min(0, player1.current_streak) - 1;
        }
        
        // Update win rates
        const totalGames1 = player1.wins + player1.losses;
        const totalGames2 = player2.wins + player2.losses;
        player1.win_rate = totalGames1 > 0 ? (player1.wins / totalGames1 * 100) : 0;
        player2.win_rate = totalGames2 > 0 ? (player2.wins / totalGames2 * 100) : 0;
    }
    
    // Update rankings
    updateRankings();
    saveData();
    return newMatch;
}

// Attendance Management Functions
function updatePlayerAttendance(playerId, status, date = null) {
    const player = getPlayerById(playerId);
    if (player) {
        const attendanceDate = date || new Date().toISOString().split('T')[0];
        
        // Update current status
        player.attendance_status = status;
        player.last_seen = attendanceDate;
        
        // Store attendance history
        if (!player.attendance_history) {
            player.attendance_history = {};
        }
        player.attendance_history[attendanceDate] = status;
        
        saveData();
        return player;
    }
    return null;
}

function getPlayerAttendanceHistory(playerId) {
    const player = getPlayerById(playerId);
    if (!player) return [];
    
    const attendanceRecords = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30); // Show last 30 days
    
    // Generate attendance data for the last 30 days
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        let status = 'Future';
        
        if (currentDate > today) {
            status = 'Future';
        } else if (player.attendance_history && player.attendance_history[dateStr]) {
            status = player.attendance_history[dateStr];
        } else {
            // No recorded attendance for this date
            status = 'No Data';
        }
        
        attendanceRecords.push({
            date: dateStr,
            status: status
        });
        
        currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return attendanceRecords;
}

// Utility Functions
function showLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'flex';
    }
}

function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
        loading.style.display = 'none';
    }
}

function showAlert(message, type = 'success') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.container-fluid') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentNode) {
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }
    }, 5000);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatWinRate(winRate) {
    return winRate.toFixed(1);
}

// Navigation Functions
function checkAuth() {
    const user = getCurrentUser();
    if (!user) {
        window.location.href = 'index.html';
        return false;
    }
    currentUser = user;
    return true;
}

function getPlayerName(playerId) {
    const player = getPlayerById(playerId);
    return player ? player.name : 'Unknown Player';
}

// Email Functions
function sendWelcomeEmail(email, playerName, username, password) {
    console.log('Attempting to send welcome email...');
    console.log('EmailJS Config:', window.EMAILJS_CONFIG);
    
    // Check if EmailJS is configured
    if (!window.EMAILJS_CONFIG || window.EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        console.log('EmailJS not configured. Skipping email send.');
        showAlert('Player created successfully, but email service is not configured', 'warning');
        return;
    }

    // Check if EmailJS is initialized
    if (typeof emailjs === 'undefined') {
        console.log('EmailJS not loaded. Check if script is included.');
        showAlert('Player created successfully, but email service is not loaded', 'warning');
        return;
    }

    // EmailJS template parameters
    const templateParams = {
        email: email,  // This matches your template's {{email}} field
        to_name: playerName,
        player_name: playerName,
        username: username,
        password: password,
        club_name: window.EMAILJS_CONFIG.CLUB_NAME,
        login_url: 'https://anurag638.github.io/Phantom_Loop_TT-Club/'
    };

    console.log('Template parameters:', templateParams);
    console.log('Sending email with Service ID:', window.EMAILJS_CONFIG.SERVICE_ID);
    console.log('Sending email with Template ID:', window.EMAILJS_CONFIG.TEMPLATE_ID);

    // Send email using EmailJS
    emailjs.send(window.EMAILJS_CONFIG.SERVICE_ID, window.EMAILJS_CONFIG.TEMPLATE_ID, templateParams)
        .then(function(response) {
            console.log('Welcome email sent successfully!', response);
            console.log('Response status:', response.status);
            console.log('Response text:', response.text);
            showAlert('Welcome email sent to ' + email, 'success');
        }, function(error) {
            console.log('Failed to send welcome email:', error);
            console.log('Error details:', JSON.stringify(error, null, 2));
            showAlert('Player created successfully, but email could not be sent. Check console for details.', 'warning');
        });
}

// Test email function
function testEmailFunction() {
    console.log('Testing email functionality...');
    console.log('EmailJS available:', typeof emailjs !== 'undefined');
    console.log('Configuration loaded:', !!window.EMAILJS_CONFIG);
    
    if (window.EMAILJS_CONFIG) {
        console.log('Public Key:', window.EMAILJS_CONFIG.PUBLIC_KEY);
        console.log('Service ID:', window.EMAILJS_CONFIG.SERVICE_ID);
        console.log('Template ID:', window.EMAILJS_CONFIG.TEMPLATE_ID);
    }
    
    // Test with a sample email
    sendWelcomeEmail('test@example.com', 'Test Player', 'test_user', 'test123');
}

// Data Export/Import Functions
function exportData() {
    const data = {
        players: JSON.parse(localStorage.getItem('ttc_players') || '[]'),
        matches: JSON.parse(localStorage.getItem('ttc_matches') || '[]'),
        users: JSON.parse(localStorage.getItem('ttc_users') || '[]'),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `phantom-loop-tt-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showAlert('Data exported successfully!', 'success');
}

// Export only player data (for sharing with players)
function exportPlayerData() {
    const data = {
        players: JSON.parse(localStorage.getItem('ttc_players') || '[]'),
        matches: JSON.parse(localStorage.getItem('ttc_matches') || '[]'),
        users: JSON.parse(localStorage.getItem('ttc_users') || '[]').filter(user => user.role === 'player'),
        exportDate: new Date().toISOString(),
        type: 'player-data'
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `phantom-loop-players-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    showAlert('Player data exported successfully! Share this file with players.', 'success');
}

function importData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.players) localStorage.setItem('ttc_players', JSON.stringify(data.players));
            if (data.matches) localStorage.setItem('ttc_matches', JSON.stringify(data.matches));
            if (data.users) localStorage.setItem('ttc_users', JSON.stringify(data.users));
            
            showAlert('Data imported successfully! Please refresh the page.', 'success');
            setTimeout(() => {
                window.location.reload();
            }, 2000);
        } catch (error) {
            showAlert('Invalid data file. Please check the file format.', 'danger');
        }
    };
    reader.readAsText(file);
}

// Import player data (for players to access their accounts)
function importPlayerData(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.type === 'player-data') {
                // Import player data without overwriting admin
                const existingUsers = JSON.parse(localStorage.getItem('ttc_users') || '[]');
                const adminUsers = existingUsers.filter(user => user.role === 'admin');
                const playerUsers = data.users || [];
                
                // Keep admin users and add player users
                const allUsers = [...adminUsers, ...playerUsers];
                localStorage.setItem('ttc_users', JSON.stringify(allUsers));
                
                if (data.players) localStorage.setItem('ttc_players', JSON.stringify(data.players));
                if (data.matches) localStorage.setItem('ttc_matches', JSON.stringify(data.matches));
                
                showAlert('Player data imported successfully! You can now login as a player.', 'success');
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                showAlert('This is not a player data file. Please use the correct file.', 'danger');
            }
        } catch (error) {
            showAlert('Invalid data file. Please check the file format.', 'danger');
        }
    };
    reader.readAsText(file);
}

// Export functions for use in other pages
window.TTC = {
    // Data functions
    getPlayers,
    getPlayerById,
    addPlayer,
    updatePlayer,
    deletePlayer,
    getMatches,
    addMatch,
    updatePlayerAttendance,
    getPlayerAttendanceHistory,
    
    // Auth functions
    getCurrentUser,
    setCurrentUser,
    logout,
    checkAuth,
    
    // Utility functions
    showLoading,
    hideLoading,
    showAlert,
    formatDate,
    formatWinRate,
    getPlayerName,
    
    // Email functions
    sendWelcomeEmail,
    testEmailFunction,
    
    // Export/Import functions
    exportData,
    importData,
    exportPlayerData,
    importPlayerData,
    
    // Data
    players: () => players,
    matches: () => matches
};
