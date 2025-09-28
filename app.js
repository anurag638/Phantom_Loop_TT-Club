// Table Tennis Club Management System with Firebase Database
// This version uses Firebase Firestore instead of localStorage

// Global variables
let currentUser = null;
let players = [];
let matches = [];

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('App initializing with Firebase...');
    initializeFirebaseData();
    initializeEmailJS();
});

// Firebase Data Management Functions
async function initializeFirebaseData() {
    try {
        // Load data from Firebase
        await loadPlayersFromFirebase();
        await loadMatchesFromFirebase();
        await loadUsersFromFirebase();
        
        // Ensure admin exists
        await ensureAdminExists();
        
        console.log('Firebase data loaded successfully');
    } catch (error) {
        console.error('Error loading Firebase data:', error);
        showAlert('Error loading data. Please check your internet connection.', 'danger');
    }
}

// Player Management with Firebase
async function loadPlayersFromFirebase() {
    try {
        const { getDocs, collection } = window.FirebaseDB;
        const playersSnapshot = await getDocs(collection(window.FirebaseDB.db, 'players'));
        players = [];
        playersSnapshot.forEach((doc) => {
            players.push({ id: doc.id, ...doc.data() });
        });
        console.log('Players loaded from Firebase:', players.length);
    } catch (error) {
        console.error('Error loading players:', error);
        players = [];
    }
}

async function loadMatchesFromFirebase() {
    try {
        const { getDocs, collection } = window.FirebaseDB;
        const matchesSnapshot = await getDocs(collection(window.FirebaseDB.db, 'matches'));
        matches = [];
        matchesSnapshot.forEach((doc) => {
            matches.push({ id: doc.id, ...doc.data() });
        });
        console.log('Matches loaded from Firebase:', matches.length);
    } catch (error) {
        console.error('Error loading matches:', error);
        matches = [];
    }
}

async function loadUsersFromFirebase() {
    try {
        const { getDocs, collection } = window.FirebaseDB;
        const usersSnapshot = await getDocs(collection(window.FirebaseDB.db, 'users'));
        const users = [];
        usersSnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        console.log('Users loaded from Firebase:', users.length);
        return users;
    } catch (error) {
        console.error('Error loading users:', error);
        return [];
    }
}

// Ensure admin account exists
async function ensureAdminExists() {
    try {
        const users = await loadUsersFromFirebase();
        const adminExists = users.some(user => user.username === 'admin');
        
        if (!adminExists) {
            console.log('Admin account not found. Creating admin account...');
            await createAdminAccount();
        } else {
            console.log('Admin account already exists');
        }
    } catch (error) {
        console.error('Error checking admin:', error);
    }
}

async function createAdminAccount() {
    try {
        const { setDoc, doc, collection } = window.FirebaseDB;
        const adminData = {
            username: 'admin',
            email: 'admin@phantomloop.com',
            password: 'admin123',
            role: 'admin',
            createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(collection(window.FirebaseDB.db, 'users'), 'admin'), adminData);
        console.log('Admin account created in Firebase');
    } catch (error) {
        console.error('Error creating admin:', error);
    }
}

// Player Management Functions
function getPlayers() {
    return players.sort((a, b) => a.rank - b.rank);
}

function getPlayerById(id) {
    return players.find(p => p.id === id);
}

async function addPlayer(playerData) {
    try {
        const { addDoc, collection } = window.FirebaseDB;
    const newPlayer = {
        name: playerData.name,
        rank: playerData.rank,
        wins: 0,
        losses: 0,
        current_streak: 0,
        attendance_status: 'Present',
        last_seen: new Date().toISOString().split('T')[0],
            win_rate: 0.0,
            createdAt: new Date().toISOString()
        };
        
        // Add player to Firebase
        const docRef = await addDoc(collection(window.FirebaseDB.db, 'players'), newPlayer);
        newPlayer.id = docRef.id;
        
        // Update local array
    players.push(newPlayer);
        
        // Create user account for authentication
        await createUserAccount(playerData, newPlayer.id);
    
        // Send welcome email
    sendWelcomeEmail(playerData.email, playerData.name, playerData.username, playerData.password);
    
    return newPlayer;
    } catch (error) {
        console.error('Error adding player:', error);
        showAlert('Error adding player. Please try again.', 'danger');
        return null;
    }
}

async function createUserAccount(playerData, playerId) {
    try {
        const { setDoc, doc, collection } = window.FirebaseDB;
        const userData = {
            username: playerData.username,
            email: playerData.email,
            password: playerData.password,
            role: 'player',
            playerId: playerId,
            createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(collection(window.FirebaseDB.db, 'users'), playerData.username), userData);
    } catch (error) {
        console.error('Error creating user account:', error);
    }
}

async function updatePlayer(playerId, updateData) {
    try {
        const { updateDoc, doc } = window.FirebaseDB;
        const playerRef = doc(window.FirebaseDB.db, 'players', playerId);
        
        // Recalculate win rate
        const totalGames = updateData.wins + updateData.losses;
        updateData.win_rate = totalGames > 0 ? (updateData.wins / totalGames * 100) : 0;
        
        await updateDoc(playerRef, updateData);
        
        // Update local array
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
        players[playerIndex] = { ...players[playerIndex], ...updateData };
        }
        
        return players[playerIndex];
    } catch (error) {
        console.error('Error updating player:', error);
    return null;
}
}

async function deletePlayer(playerId) {
    try {
        const { deleteDoc, doc } = window.FirebaseDB;
        
        // Delete player from Firebase
        await deleteDoc(doc(window.FirebaseDB.db, 'players', playerId));
        
        // Remove from local array
    const playerIndex = players.findIndex(p => p.id === playerId);
    if (playerIndex !== -1) {
            players.splice(playerIndex, 1);
        }
        
        // Remove all matches involving this player
        matches = matches.filter(m => 
            m.player1_id !== playerId && 
            m.player2_id !== playerId && 
            m.winner_id !== playerId
        );
        
        // Update rankings
        updateRankings();
        
        return true;
    } catch (error) {
        console.error('Error deleting player:', error);
        return false;
    }
}

// Match Management Functions
function getMatches() {
    return matches.sort((a, b) => new Date(b.match_date) - new Date(a.match_date));
}

async function addMatch(matchData) {
    try {
        const { addDoc, collection } = window.FirebaseDB;
    const newMatch = {
        player1_id: matchData.player1_id,
        player2_id: matchData.player2_id,
        player1_score: matchData.player1_score,
        player2_score: matchData.player2_score,
        winner_id: matchData.winner_id,
        match_date: matchData.match_date,
        created_at: new Date().toISOString()
    };
    
        // Add match to Firebase
        const docRef = await addDoc(collection(window.FirebaseDB.db, 'matches'), newMatch);
        newMatch.id = docRef.id;
        
        // Add to local array
    matches.push(newMatch);
    
    // Update player statistics
        await updatePlayerStats(matchData);
        
        return newMatch;
    } catch (error) {
        console.error('Error adding match:', error);
        return null;
    }
}

async function updatePlayerStats(matchData) {
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
        
        // Update in Firebase
        await updatePlayer(player1.id, player1);
        await updatePlayer(player2.id, player2);
    
    // Update rankings
    updateRankings();
    }
}

// Attendance Management Functions
async function updatePlayerAttendance(playerId, status, date = null) {
    try {
        const attendanceDate = date || new Date().toISOString().split('T')[0];
        
        const updateData = {
            attendance_status: status,
            last_seen: attendanceDate
        };
        
        // Update in Firebase
        await updatePlayer(playerId, updateData);
        
        return true;
    } catch (error) {
        console.error('Error updating attendance:', error);
        return false;
    }
}

function getPlayerAttendanceHistory(playerId) {
    const player = getPlayerById(playerId);
    if (!player) return [];
    
    const attendanceRecords = [];
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 30); // Show last 30 days
    
    const currentDate = new Date(startDate);
    while (currentDate <= today) {
        const dateStr = currentDate.toISOString().split('T')[0];
        let status = 'Future';
        
        if (currentDate > today) {
            status = 'Future';
        } else if (dateStr === player.last_seen) {
            status = player.attendance_status;
        } else {
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

// Authentication Functions
async function authenticateUser(username, password) {
    try {
        console.log('Authenticating user:', username);
        
        // Check if Firebase is available
        if (!window.FirebaseDB) {
            console.error('Firebase not loaded');
            throw new Error('Firebase not loaded. Please refresh the page.');
        }
        
        const { getDocs, collection, query, where } = window.FirebaseDB;
        const usersRef = collection(window.FirebaseDB.db, 'users');
        const q = query(usersRef, where('username', '==', username));
        
        console.log('Querying Firebase for user...');
        const querySnapshot = await getDocs(q);
        console.log('Query result:', querySnapshot.empty ? 'No users found' : 'Users found');
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();
            console.log('User data found:', userData);
            
            if (userData.password === password) {
                console.log('Password match! User authenticated');
                return {
                    id: userDoc.id,
                    username: userData.username,
                    email: userData.email,
                    role: userData.role,
                    playerId: userData.playerId
                };
            } else {
                console.log('Password mismatch');
            }
        } else {
            console.log('No user found with username:', username);
        }
        return null;
    } catch (error) {
        console.error('Error authenticating user:', error);
        throw error;
    }
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

function updateRankings() {
    players.sort((a, b) => {
        if (b.wins !== a.wins) return b.wins - a.wins;
        return b.win_rate - a.win_rate;
    });
    
    players.forEach((player, index) => {
        player.rank = index + 1;
    });
}

function getPlayerName(playerId) {
    const player = getPlayerById(playerId);
    return player ? player.name : 'Unknown Player';
}

// Email Functions (same as before)
function initializeEmailJS() {
    if (window.EMAILJS_CONFIG && window.EMAILJS_CONFIG.PUBLIC_KEY !== 'YOUR_PUBLIC_KEY') {
        emailjs.init(window.EMAILJS_CONFIG.PUBLIC_KEY);
        console.log('EmailJS initialized successfully!');
    } else {
        console.log('EmailJS not configured. Please update emailjs-config.js with your credentials.');
    }
}

function sendWelcomeEmail(email, playerName, username, password) {
    console.log('Attempting to send welcome email...');
    
    if (!window.EMAILJS_CONFIG || window.EMAILJS_CONFIG.PUBLIC_KEY === 'YOUR_PUBLIC_KEY') {
        console.log('EmailJS not configured. Skipping email send.');
        showAlert('Player created successfully, but email service is not configured', 'warning');
        return;
    }

    if (typeof emailjs === 'undefined') {
        console.log('EmailJS not loaded. Check if script is included.');
        showAlert('Player created successfully, but email service is not loaded', 'warning');
        return;
    }

    const templateParams = {
        email: email,
        to_name: playerName,
        player_name: playerName,
        username: username,
        password: password,
        club_name: window.EMAILJS_CONFIG.CLUB_NAME,
        login_url: window.location.origin + '/index.html'
    };

    emailjs.send(window.EMAILJS_CONFIG.SERVICE_ID, window.EMAILJS_CONFIG.TEMPLATE_ID, templateParams)
        .then(function(response) {
            console.log('Welcome email sent successfully!', response);
            showAlert('Welcome email sent to ' + email, 'success');
        }, function(error) {
            console.log('Failed to send welcome email:', error);
            showAlert('Player created successfully, but email could not be sent. Check console for details.', 'warning');
        });
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
    authenticateUser,
    getCurrentUser,
    setCurrentUser,
    logout,
    checkAuth: function() {
        const user = getCurrentUser();
        if (!user) {
            window.location.href = 'index.html';
            return false;
        }
        currentUser = user;
        return true;
    },
    
    // Utility functions
    showLoading,
    hideLoading,
    showAlert,
    formatDate,
    formatWinRate,
    getPlayerName,
    
    // Email functions
    sendWelcomeEmail,
    
    // Data
    players: () => players,
    matches: () => matches
};
