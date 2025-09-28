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
function formatLocalDate(dateObj) {
    const d = dateObj || new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}
async function initializeFirebaseData() {
    try {
        // Load data from Firebase
        await loadPlayersFromFirebase();
        await loadMatchesFromFirebase();
        await loadUsersFromFirebase();
        
        // Ensure admin exists
        await ensureAdminExists();
        
        console.log('Firebase data loaded successfully');
        // Notify pages that initial data is ready
        try {
            document.dispatchEvent(new CustomEvent('ttc:dataLoaded'));
        } catch (e) {
            console.warn('Could not dispatch data loaded event', e);
        }
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
            const data = doc.data();
            players.push({ id: doc.id, ...data });
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
    const key = String(id);
    return players.find(p => String(p.id) === key);
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
            last_seen: formatLocalDate(new Date()),
            win_rate: 0.0,
            createdAt: new Date().toISOString()
        };
        
        // Add player to Firebase
        const docRef = await addDoc(collection(window.FirebaseDB.db, 'players'), newPlayer);
        newPlayer.id = docRef.id;
        newPlayer.attendance_history = { [newPlayer.last_seen]: 'Present' };
        
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
        console.log('updatePlayer called with:', playerId, updateData);
        console.log('playerId type:', typeof playerId);
        console.log('playerId value:', playerId);
        
        if (!playerId) {
            console.error('playerId is null or undefined');
            return null;
        }
        
        const { updateDoc, doc } = window.FirebaseDB;
        const playerRef = doc(window.FirebaseDB.db, 'players', String(playerId));
        console.log('Created playerRef:', playerRef.path);
        
        // Use the win_rate from updateData if provided, otherwise calculate it
        if (typeof updateData.win_rate === 'undefined' && updateData.wins !== undefined && updateData.losses !== undefined) {
            const totalGames = updateData.wins + updateData.losses;
            updateData.win_rate = totalGames > 0 ? (updateData.wins / totalGames * 100) : 0;
        }
        
        console.log('Updating player in Firebase with data:', updateData);
        await updateDoc(playerRef, updateData);
        
        // Update local array
        const playerIndex = players.findIndex(p => String(p.id) === String(playerId));
        if (playerIndex !== -1) {
            players[playerIndex] = { ...players[playerIndex], ...updateData };
            console.log('Updated local player:', players[playerIndex]);
        }
        
        return players[playerIndex];
    } catch (error) {
        console.error('Error updating player:', error);
        return null;
    }
}

async function deletePlayer(playerId) {
    try {
        const { deleteDoc, doc, collection, query, where, getDocs } = window.FirebaseDB;
        
        // Delete player from Firebase
        await deleteDoc(doc(window.FirebaseDB.db, 'players', playerId));
        
        // Delete all matches involving this player from Firebase
        const matchesQuery = query(
            collection(window.FirebaseDB.db, 'matches'),
            where('player1_id', '==', playerId)
        );
        const matchesQuery2 = query(
            collection(window.FirebaseDB.db, 'matches'),
            where('player2_id', '==', playerId)
        );
        const matchesQuery3 = query(
            collection(window.FirebaseDB.db, 'matches'),
            where('winner_id', '==', playerId)
        );
        
        // Delete matches where player is player1
        const matchesSnapshot1 = await getDocs(matchesQuery);
        for (const matchDoc of matchesSnapshot1.docs) {
            await deleteDoc(matchDoc.ref);
        }
        
        // Delete matches where player is player2
        const matchesSnapshot2 = await getDocs(matchesQuery2);
        for (const matchDoc of matchesSnapshot2.docs) {
            await deleteDoc(matchDoc.ref);
        }
        
        // Delete matches where player is winner
        const matchesSnapshot3 = await getDocs(matchesQuery3);
        for (const matchDoc of matchesSnapshot3.docs) {
            await deleteDoc(matchDoc.ref);
        }
        
        // Remove from local array
        const playerIndex = players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            players.splice(playerIndex, 1);
        }
        
        // Remove all matches involving this player from local array
        matches = matches.filter(m => 
            m.player1_id !== playerId && 
            m.player2_id !== playerId && 
            m.winner_id !== playerId
        );
        
        // Update rankings
        updateRankings();
        
        console.log(`Player ${playerId} and all related matches deleted successfully`);
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
        console.log('Adding match with data:', matchData);
        const { addDoc, collection } = window.FirebaseDB;
        const newMatch = {
            player1_id: String(matchData.player1_id),
            player2_id: String(matchData.player2_id),
            player1_score: matchData.player1_score,
            player2_score: matchData.player2_score,
            winner_id: String(matchData.winner_id),
            match_date: matchData.match_date,
            created_at: new Date().toISOString()
        };
        
        console.log('Normalized match data:', newMatch);
        
        // Add match to Firebase
        const docRef = await addDoc(collection(window.FirebaseDB.db, 'matches'), newMatch);
        newMatch.id = docRef.id;
        console.log('Match added to Firebase with ID:', newMatch.id);
        
        // Add to local array
        matches.push(newMatch);
        
        // Update player statistics using the normalized IDs we just wrote
        console.log('Calling updatePlayerStats...');
        await updatePlayerStats(newMatch);
        console.log('Player stats updated successfully');
        
        return newMatch;
    } catch (error) {
        console.error('Error adding match:', error);
        return null;
    }
}

async function updatePlayerStats(matchData) {
    console.log('Updating player stats for match:', matchData);
    // Ensure we have the freshest players from DB
    try { await loadPlayersFromFirebase(); } catch (_) {}
    
    console.log('All players in array:', players.map(p => ({ id: p.id, name: p.name })));
    console.log('Looking for player1_id:', String(matchData.player1_id));
    console.log('Looking for player2_id:', String(matchData.player2_id));
    
    const player1 = getPlayerById(String(matchData.player1_id));
    const player2 = getPlayerById(String(matchData.player2_id));
    
    console.log('Found players:', { player1: player1?.name, player2: player2?.name });
    console.log('Player1 details:', player1);
    console.log('Player2 details:', player2);
    
    if (player1 && player2) {
        console.log('Before update - Player1:', { wins: player1.wins, losses: player1.losses });
        console.log('Before update - Player2:', { wins: player2.wins, losses: player2.losses });
        
        if (String(matchData.winner_id) === String(matchData.player1_id)) {
            player1.wins++;
            player2.losses++;
            player1.current_streak = Math.max(0, player1.current_streak) + 1;
            player2.current_streak = Math.min(0, player2.current_streak) - 1;
            console.log('Player1 won the match');
        } else {
            player2.wins++;
            player1.losses++;
            player2.current_streak = Math.max(0, player2.current_streak) + 1;
            player1.current_streak = Math.min(0, player1.current_streak) - 1;
            console.log('Player2 won the match');
        }
        
        console.log('After update - Player1:', { wins: player1.wins, losses: player1.losses });
        console.log('After update - Player2:', { wins: player2.wins, losses: player2.losses });
        
        // Update win rates
        const totalGames1 = player1.wins + player1.losses;
        const totalGames2 = player2.wins + player2.losses;
        player1.win_rate = totalGames1 > 0 ? (player1.wins / totalGames1 * 100) : 0;
        player2.win_rate = totalGames2 > 0 ? (player2.wins / totalGames2 * 100) : 0;
        
        // Persist both players' updated stats
        const player1UpdateData = { 
            wins: player1.wins, 
            losses: player1.losses, 
            current_streak: player1.current_streak,
            win_rate: player1.win_rate
        };
        console.log('Updating player1 in Firebase:', player1.id, player1UpdateData);
        console.log('player1.id type:', typeof player1.id);
        console.log('player1.id value:', player1.id);
        console.log('player1 full object:', player1);
        
        if (!player1.id) {
            console.error('player1.id is missing, cannot update player');
        } else {
            await updatePlayer(player1.id, player1UpdateData);
        }
        
        const player2UpdateData = { 
            wins: player2.wins, 
            losses: player2.losses, 
            current_streak: player2.current_streak,
            win_rate: player2.win_rate
        };
        console.log('Updating player2 in Firebase:', player2.id, player2UpdateData);
        console.log('player2.id type:', typeof player2.id);
        console.log('player2.id value:', player2.id);
        console.log('player2 full object:', player2);
        
        if (!player2.id) {
            console.error('player2.id is missing, cannot update player');
        } else {
            await updatePlayer(player2.id, player2UpdateData);
        }
        
        // Reload players to ensure UI shows fresh data from DB
        await loadPlayersFromFirebase();
        
        // Update rankings
        updateRankings();
    }
}

async function deleteAllMatches() {
    try {
        const { deleteDoc, doc, collection, getDocs } = window.FirebaseDB;
        
        // Get all matches from Firebase
        const matchesSnapshot = await getDocs(collection(window.FirebaseDB.db, 'matches'));
        
        // Delete all matches from Firebase
        for (const matchDoc of matchesSnapshot.docs) {
            await deleteDoc(matchDoc.ref);
        }
        
        // Reset all player statistics
        for (const player of players) {
            player.wins = 0;
            player.losses = 0;
            player.win_rate = 0;
            player.current_streak = 0;
            
            // Update player in Firebase
            await updatePlayer(player.id, {
                wins: 0,
                losses: 0,
                win_rate: 0,
                current_streak: 0
            });
        }
        
        // Clear local matches array
        matches = [];
        
        // Update rankings
        updateRankings();
        
        console.log('All matches deleted and player stats reset');
        return true;
    } catch (error) {
        console.error('Error deleting all matches:', error);
        return false;
    }
}

async function deleteMatch(matchId, player1Id, player2Id, winnerId) {
    try {
        const { deleteDoc, doc } = window.FirebaseDB;
        
        // Delete match from Firebase
        await deleteDoc(doc(window.FirebaseDB.db, 'matches', matchId));
        
        // Remove from local array
        const matchIndex = matches.findIndex(m => m.id === matchId);
        if (matchIndex !== -1) {
            matches.splice(matchIndex, 1);
        }
        
        // Update player statistics (reverse the match result)
        const player1 = getPlayerById(String(player1Id));
        const player2 = getPlayerById(String(player2Id));
        
        if (player1 && player2) {
            if (String(winnerId) === String(player1Id)) {
                // Player 1 won, so reverse: decrease player1 wins, increase player2 losses
                player1.wins = Math.max(0, player1.wins - 1);
                player2.losses = Math.max(0, player2.losses - 1);
                player1.current_streak = Math.min(0, player1.current_streak - 1);
                player2.current_streak = Math.max(0, player2.current_streak + 1);
            } else {
                // Player 2 won, so reverse: decrease player2 wins, increase player1 losses
                player2.wins = Math.max(0, player2.wins - 1);
                player1.losses = Math.max(0, player1.losses - 1);
                player2.current_streak = Math.min(0, player2.current_streak - 1);
                player1.current_streak = Math.max(0, player1.current_streak + 1);
            }
            
            // Update win rates
            const totalGames1 = player1.wins + player1.losses;
            const totalGames2 = player2.wins + player2.losses;
            player1.win_rate = totalGames1 > 0 ? (player1.wins / totalGames1 * 100) : 0;
            player2.win_rate = totalGames2 > 0 ? (player2.wins / totalGames2 * 100) : 0;
            
            // Update players in Firebase
            await updatePlayer(player1.id, {
                wins: player1.wins,
                losses: player1.losses,
                current_streak: player1.current_streak,
                win_rate: player1.win_rate
            });
            await updatePlayer(player2.id, {
                wins: player2.wins,
                losses: player2.losses,
                current_streak: player2.current_streak,
                win_rate: player2.win_rate
            });
        }
        
        // Update rankings
        updateRankings();
        
        console.log(`Match ${matchId} deleted and player stats updated`);
        return true;
    } catch (error) {
        console.error('Error deleting match:', error);
        return false;
    }
}

// Attendance Management Functions
async function updatePlayerAttendance(playerId, status, date = null) {
    try {
        const attendanceDate = date || formatLocalDate(new Date());
        
        // Update in Firebase (including historical record)
        const { updateDoc, doc } = window.FirebaseDB;
        const playerRef = doc(window.FirebaseDB.db, 'players', playerId);
        await updateDoc(playerRef, {
            attendance_status: status,
            last_seen: attendanceDate,
            [`attendance_history.${attendanceDate}`]: status
        });
        
        // Update local cache
        const playerIndex = players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            const existingHistory = players[playerIndex].attendance_history || {};
            players[playerIndex] = {
                ...players[playerIndex],
                attendance_status: status,
                last_seen: attendanceDate,
                attendance_history: {
                    ...existingHistory,
                    [attendanceDate]: status
                }
            };
        }
        
        return true;
    } catch (error) {
        console.error('Error updating attendance:', error);
        return false;
    }
}

function getPlayerAttendanceHistory(playerId, year, monthIndex) {
    const player = getPlayerById(playerId);
    if (!player) return [];
    
    const history = player.attendance_history || {};
    const records = [];
    const start = new Date(year, monthIndex, 1);
    const end = new Date(year, monthIndex + 1, 0);
    const today = new Date();
    
    for (let d = 1; d <= end.getDate(); d++) {
        const dateStr = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        let status = 'No Data';
        const current = new Date(year, monthIndex, d);
        if (current > today) {
            status = 'Future';
        }
        if (history[dateStr]) {
            status = history[dateStr];
        }
        records.push({ date: dateStr, status });
    }
    return records;
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
        login_url: 'https://anurag638.github.io/Phantom_Loop_TT-Club/'
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
    deleteMatch,
    deleteAllMatches,
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
