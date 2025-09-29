// Table Tennis Club Management System with Firebase Database
// This version uses Firebase Firestore instead of localStorage

// Global variables
let currentUser = null;
let players = [];
let matches = [];
let announcements = [];

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
        await loadAnnouncementsFromFirebase();
        
        // Ensure admin exists
        await ensureAdminExists();
        
        // Migrate attendance history for existing players
        await migratePlayerAttendanceHistory();
        
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
        
        // Update rankings after loading players
        updateRankings();
    } catch (error) {
        console.error('Error loading players:', error);
        players = [];
    }
}

async function loadMatchesFromFirebase() {
    try {
        const { getDocs, collection, orderBy, query } = window.FirebaseDB;
        const matchesRef = collection(window.FirebaseDB.db, 'matches');
        
        // Load matches ordered by date (newest first)
        const matchesQuery = query(matchesRef, orderBy('match_date', 'desc'));
        const matchesSnapshot = await getDocs(matchesQuery);
        
        matches = [];
        matchesSnapshot.forEach((doc) => {
            const matchData = { id: doc.id, ...doc.data() };
            // Ensure all IDs are strings for consistency
            matchData.player1_id = String(matchData.player1_id);
            matchData.player2_id = String(matchData.player2_id);
            matchData.winner_id = String(matchData.winner_id);
            matches.push(matchData);
        });
        
        console.log('Matches loaded from Firebase:', matches.length);
        console.log('Sample match data:', matches.slice(0, 3));
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

// Announcements Management with Firebase
async function loadAnnouncementsFromFirebase() {
    try {
        const { getDocs, collection, orderBy, query } = window.FirebaseDB;
        const announcementsRef = collection(window.FirebaseDB.db, 'announcements');
        
        // Load announcements ordered by date (newest first)
        const announcementsQuery = query(announcementsRef, orderBy('created_at', 'desc'));
        const announcementsSnapshot = await getDocs(announcementsQuery);
        
        announcements = [];
        announcementsSnapshot.forEach((doc) => {
            announcements.push({ id: doc.id, ...doc.data() });
        });
        
        console.log('Announcements loaded from Firebase:', announcements.length);
    } catch (error) {
        console.error('Error loading announcements:', error);
        announcements = [];
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
    if (!id) {
        console.error('getPlayerById called with null/undefined id');
        return null;
    }
    const key = String(id);
    const player = players.find(p => String(p.id) === key);
    console.log(`getPlayerById(${id}) -> found:`, player);
    return player;
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
            attendance_history: { [formatLocalDate(new Date())]: 'Present' },
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
        console.log('🔄 updatePlayer called with:', playerId, updateData);
        
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
        
        // Validate match data
        if (!matchData.player1_id || !matchData.player2_id || !matchData.winner_id) {
            throw new Error('Missing required match data: player1_id, player2_id, or winner_id');
        }
        
        if (matchData.player1_id === matchData.player2_id) {
            throw new Error('Player 1 and Player 2 cannot be the same');
        }
        
        if (matchData.winner_id !== matchData.player1_id && matchData.winner_id !== matchData.player2_id) {
            throw new Error('Winner must be either Player 1 or Player 2');
        }
        
        // Validate that players exist
        const player1 = getPlayerById(String(matchData.player1_id));
        const player2 = getPlayerById(String(matchData.player2_id));
        
        if (!player1) {
            throw new Error(`Player 1 with ID ${matchData.player1_id} not found`);
        }
        if (!player2) {
            throw new Error(`Player 2 with ID ${matchData.player2_id} not found`);
        }
        
        const { addDoc, collection } = window.FirebaseDB;
        const newMatch = {
            player1_id: String(matchData.player1_id),
            player2_id: String(matchData.player2_id),
            player1_score: parseInt(matchData.player1_score) || 0,
            player2_score: parseInt(matchData.player2_score) || 0,
            winner_id: String(matchData.winner_id),
            match_date: matchData.match_date,
            created_at: new Date().toISOString(),
            // Add player names for easier querying
            player1_name: player1.name,
            player2_name: player2.name,
            winner_name: matchData.winner_id === matchData.player1_id ? player1.name : player2.name
        };
        
        console.log('Validated match data:', newMatch);
        
        // Add match to Firebase
        const docRef = await addDoc(collection(window.FirebaseDB.db, 'matches'), newMatch);
        newMatch.id = docRef.id;
        console.log('Match added to Firebase with ID:', newMatch.id);
        
        // Add to local array (insert at beginning since we want newest first)
        matches.unshift(newMatch);
        
        // Update player statistics
        console.log('Updating player stats...');
        await updatePlayerStats(newMatch);
        console.log('Player stats updated successfully');
        
        // Dispatch event to refresh UI
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('ttc:dataUpdated'));
        }
        
        return newMatch;
    } catch (error) {
        console.error('Error adding match:', error);
        throw error; // Re-throw so calling code can handle it
    }
}

async function updatePlayerStats(matchData) {
    console.log('Updating player stats for match:', matchData);
    
    try {
        // Ensure we have the freshest players from DB
        await loadPlayersFromFirebase();
        
        const player1 = getPlayerById(String(matchData.player1_id));
        const player2 = getPlayerById(String(matchData.player2_id));
        
        if (!player1 || !player2) {
            console.error('Players not found:', { player1: !!player1, player2: !!player2 });
            return;
        }
        
        console.log('Before update - Player1:', { wins: player1.wins, losses: player1.losses });
        console.log('Before update - Player2:', { wins: player2.wins, losses: player2.losses });
        
        // Update stats based on winner
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
        
        // Update the local players array
        const player1Index = players.findIndex(p => String(p.id) === String(player1.id));
        const player2Index = players.findIndex(p => String(p.id) === String(player2.id));
        
        if (player1Index !== -1) {
            players[player1Index] = { ...players[player1Index], ...player1 };
        }
        if (player2Index !== -1) {
            players[player2Index] = { ...players[player2Index], ...player2 };
        }
        
        console.log('After update - Player1:', { wins: player1.wins, losses: player1.losses });
        console.log('After update - Player2:', { wins: player2.wins, losses: player2.losses });
        
        // Calculate win rates
        const totalGames1 = player1.wins + player1.losses;
        const totalGames2 = player2.wins + player2.losses;
        player1.win_rate = totalGames1 > 0 ? (player1.wins / totalGames1 * 100) : 0;
        player2.win_rate = totalGames2 > 0 ? (player2.wins / totalGames2 * 100) : 0;
        
        // Update player1 in Firebase
        const player1UpdateData = { 
            wins: player1.wins,
            losses: player1.losses, 
            current_streak: player1.current_streak,
            win_rate: player1.win_rate
        };
        
        console.log('Updating player1:', player1.id, player1UpdateData);
        await updatePlayer(player1.id, player1UpdateData);
        
        // Update player2 in Firebase
        const player2UpdateData = { 
            wins: player2.wins, 
            losses: player2.losses, 
            current_streak: player2.current_streak,
            win_rate: player2.win_rate
        };
        
        console.log('Updating player2:', player2.id, player2UpdateData);
        await updatePlayer(player2.id, player2UpdateData);
        
        // Reload players and update rankings
        await loadPlayersFromFirebase();
        updateRankings();
        await updateRanksInFirebase();
        
        console.log('Player stats updated successfully');
    } catch (error) {
        console.error('Error updating player stats:', error);
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
        
        // Do NOT update player statistics when deleting a match
        // The stats should remain as they were before the match was played
        console.log('Match deleted - player stats remain unchanged');
        
        console.log(`Match ${matchId} deleted - player stats unchanged`);
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
        
        // Get current player data to preserve existing attendance history
        const player = getPlayerById(playerId);
        if (!player) {
            console.error('Player not found:', playerId);
            return false;
        }
        
        // Update attendance history
        const existingHistory = player.attendance_history || {};
        const updatedHistory = {
            ...existingHistory,
            [attendanceDate]: status
        };
        
        // Update in Firebase (including historical record)
        const { updateDoc, doc } = window.FirebaseDB;
        const playerRef = doc(window.FirebaseDB.db, 'players', playerId);
        await updateDoc(playerRef, {
            attendance_status: status,
            last_seen: attendanceDate,
            attendance_history: updatedHistory
        });
        
        // Update local cache
        const playerIndex = players.findIndex(p => p.id === playerId);
        if (playerIndex !== -1) {
            players[playerIndex] = {
                ...players[playerIndex],
                attendance_status: status,
                last_seen: attendanceDate,
                attendance_history: updatedHistory
            };
        }
        
        console.log(`Updated attendance for player ${playerId}: ${status} on ${attendanceDate}`);
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
        } else if (history[dateStr]) {
            status = history[dateStr];
        } else {
            // Check if this is today and player has current attendance status
            const isToday = current.toDateString() === today.toDateString();
            if (isToday && player.attendance_status) {
                status = player.attendance_status;
            }
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
    // Sort by win rate (descending), then by total games (descending), then by wins (descending)
    players.sort((a, b) => {
        // Primary: Win rate (higher is better)
        if (b.win_rate !== a.win_rate) return b.win_rate - a.win_rate;
        
        // Secondary: Total games played (more games = more reliable stats)
        const totalGamesA = a.wins + a.losses;
        const totalGamesB = b.wins + b.losses;
        if (totalGamesB !== totalGamesA) return totalGamesB - totalGamesA;
        
        // Tertiary: Total wins (more wins is better)
        if (b.wins !== a.wins) return b.wins - a.wins;
        
        // Quaternary: Fewer losses (fewer losses is better)
        return a.losses - b.losses;
    });
    
    // Assign ranks (1-based)
    players.forEach((player, index) => {
        player.rank = index + 1;
    });
    
    console.log('Updated rankings:', players.map(p => ({ name: p.name, rank: p.rank, win_rate: p.win_rate, wins: p.wins, losses: p.losses })));
    
    // Update ranks in Firebase
    updateRanksInFirebase();
    
    // Dispatch event to refresh UI
    if (typeof document !== 'undefined') {
        document.dispatchEvent(new CustomEvent('ttc:rankingsUpdated'));
    }
}

// Force fix all rankings immediately
async function forceFixRankings() {
    console.log('Force fixing all rankings...');
    await loadPlayersFromFirebase();
    updateRankings();
    console.log('Rankings fixed!');
}

// Mark specific player attendance for a specific date
async function markPlayerAttendance(playerName, status, date) {
    console.log(`Marking ${playerName} as ${status} for ${date}...`);
    
    // Find player by name
    const player = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (!player) {
        console.error(`Player "${playerName}" not found`);
        return false;
    }
    
    console.log(`Found player: ${player.name} (ID: ${player.id})`);
    
    // Update attendance
    const result = await updatePlayerAttendance(player.id, status, date);
    if (result) {
        console.log(`Successfully marked ${player.name} as ${status} for ${date}`);
        // Refresh data
        await loadPlayersFromFirebase();
        
        // Force UI refresh
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('ttc:dataUpdated'));
        }
        return true;
    } else {
        console.error(`Failed to mark ${player.name} as ${status} for ${date}`);
        return false;
    }
}

// Migrate existing players to have proper attendance history
async function migratePlayerAttendanceHistory() {
    console.log('Starting attendance history migration...');
    
    for (const player of players) {
        if (!player.attendance_history) {
            console.log(`Migrating player: ${player.name}`);
            
            // Initialize attendance history with current status
            const initialHistory = {
                [player.last_seen || formatLocalDate(new Date())]: player.attendance_status || 'Present'
            };
            
            // Update in Firebase
            const { updateDoc, doc } = window.FirebaseDB;
            const playerRef = doc(window.FirebaseDB.db, 'players', player.id);
            await updateDoc(playerRef, {
                attendance_history: initialHistory
            });
            
            // Update local cache
            player.attendance_history = initialHistory;
            
            console.log(`Migrated ${player.name} with history:`, initialHistory);
        }
    }
    
    console.log('Attendance history migration completed');
}

// Simple function to mark Anurag present for Sep 28
async function markAnuragPresent() {
    return await markPlayerAttendance('Anurag', 'Present', '2025-09-28');
}

// Check what's in the database for a specific player
async function checkPlayerAttendance(playerName) {
    const player = players.find(p => p.name.toLowerCase() === playerName.toLowerCase());
    if (!player) {
        console.error(`Player "${playerName}" not found`);
        return;
    }
    
    console.log(`=== ${player.name} Attendance Data ===`);
    console.log('Current Status:', player.attendance_status);
    console.log('Last Seen:', player.last_seen);
    console.log('Attendance History:', player.attendance_history);
    console.log('Total Present Days:', Object.values(player.attendance_history || {}).filter(status => status === 'Present').length);
    
    return player;
}

// Test attendance functionality
async function testAttendanceFunctionality() {
    console.log('=== Testing Attendance Functionality ===');
    
    // Check if we have players
    if (players.length === 0) {
        console.log('No players found. Please add some players first.');
        return;
    }
    
    const testPlayer = players[0];
    const testDate = formatLocalDate(new Date());
    
    console.log(`Testing with player: ${testPlayer.name}`);
    console.log(`Test date: ${testDate}`);
    
    // Test 1: Mark player as present
    console.log('Test 1: Marking player as Present...');
    const result1 = await updatePlayerAttendance(testPlayer.id, 'Present', testDate);
    console.log('Result:', result1);
    
    // Test 2: Check attendance history
    console.log('Test 2: Checking attendance history...');
    const history = getPlayerAttendanceHistory(testPlayer.id, new Date().getFullYear(), new Date().getMonth());
    console.log('History for current month:', history);
    
    // Test 3: Mark player as absent for yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = formatLocalDate(yesterday);
    
    console.log('Test 3: Marking player as Absent for yesterday...');
    const result2 = await updatePlayerAttendance(testPlayer.id, 'Absent', yesterdayStr);
    console.log('Result:', result2);
    
    // Test 4: Final check
    console.log('Test 4: Final attendance check...');
    await checkPlayerAttendance(testPlayer.name);
    
    console.log('=== Attendance Test Complete ===');
}

// Debug function to check user-player relationships
async function debugUserPlayerRelationships() {
    console.log('=== Debugging User-Player Relationships ===');
    
    // Load users from Firebase
    const users = await loadUsersFromFirebase();
    console.log('All users:', users);
    
    // Check each user
    for (const user of users) {
        console.log(`\nUser: ${user.username} (${user.role})`);
        console.log('User data:', user);
        
        if (user.role === 'player' && user.playerId) {
            const player = getPlayerById(user.playerId);
            console.log(`Player found for ${user.username}:`, player);
            
            if (!player) {
                console.error(`❌ Player not found for user ${user.username} with playerId: ${user.playerId}`);
            } else {
                console.log(`✅ Player found: ${player.name}`);
            }
        }
    }
    
    console.log('\nAll players:', players);
    console.log('=== Debug Complete ===');
}

// Fix broken user-player relationships
async function fixUserPlayerRelationships() {
    console.log('=== Fixing User-Player Relationships ===');
    
    const users = await loadUsersFromFirebase();
    let fixedCount = 0;
    
    for (const user of users) {
        if (user.role === 'player') {
            // If user has no playerId, try to find a player by name
            if (!user.playerId) {
                const player = players.find(p => p.name.toLowerCase() === user.username.toLowerCase());
                if (player) {
                    console.log(`Fixing user ${user.username} - linking to player ${player.name} (ID: ${player.id})`);
                    
                    // Update user with correct playerId
                    const { updateDoc, doc } = window.FirebaseDB;
                    const userRef = doc(window.FirebaseDB.db, 'users', user.username);
                    await updateDoc(userRef, { playerId: player.id });
                    fixedCount++;
                } else {
                    console.warn(`No player found for user ${user.username}`);
                }
            } else {
                // Check if playerId exists
                const player = getPlayerById(user.playerId);
                if (!player) {
                    console.warn(`User ${user.username} has invalid playerId: ${user.playerId}`);
                    
                    // Try to find player by name
                    const playerByName = players.find(p => p.name.toLowerCase() === user.username.toLowerCase());
                    if (playerByName) {
                        console.log(`Fixing user ${user.username} - updating playerId from ${user.playerId} to ${playerByName.id}`);
                        
                        const { updateDoc, doc } = window.FirebaseDB;
                        const userRef = doc(window.FirebaseDB.db, 'users', user.username);
                        await updateDoc(userRef, { playerId: playerByName.id });
                        fixedCount++;
                    }
                }
            }
        }
    }
    
    console.log(`Fixed ${fixedCount} user-player relationships`);
    console.log('=== Fix Complete ===');
    
    return fixedCount;
}

// Recalculate all player stats from match history
async function recalculateAllPlayerStats() {
    console.log('=== Recalculating All Player Stats ===');
    
    try {
        // Reset all player stats to zero
        for (const player of players) {
            player.wins = 0;
            player.losses = 0;
            player.current_streak = 0;
            player.win_rate = 0;
        }
        
        // Process all matches to recalculate stats
        let processedMatches = 0;
        for (const match of matches) {
            const player1 = getPlayerById(String(match.player1_id));
            const player2 = getPlayerById(String(match.player2_id));
            
            if (player1 && player2) {
                if (String(match.winner_id) === String(match.player1_id)) {
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
                processedMatches++;
            } else {
                console.warn(`Skipping match ${match.id} - players not found:`, {
                    player1: !!player1,
                    player2: !!player2,
                    match: match
                });
            }
        }
        
        // Calculate win rates for all players
        for (const player of players) {
            const totalGames = player.wins + player.losses;
            player.win_rate = totalGames > 0 ? (player.wins / totalGames * 100) : 0;
        }
        
        // Update all players in Firebase
        const { updateDoc, doc } = window.FirebaseDB;
        for (const player of players) {
            const playerRef = doc(window.FirebaseDB.db, 'players', String(player.id));
            await updateDoc(playerRef, {
                wins: player.wins,
                losses: player.losses,
                current_streak: player.current_streak,
                win_rate: player.win_rate
            });
        }
        
        // Update rankings
        updateRankings();
        
        console.log(`Recalculated stats for ${players.length} players from ${processedMatches} matches`);
        console.log('=== Stats Recalculation Complete ===');
        
        return { playersUpdated: players.length, matchesProcessed: processedMatches };
    } catch (error) {
        console.error('Error recalculating player stats:', error);
        return null;
    }
}

// Validate and fix match data
async function validateAndFixMatchData() {
    console.log('=== Validating and Fixing Match Data ===');
    
    let fixedMatches = 0;
    let invalidMatches = 0;
    
    for (const match of matches) {
        const issues = [];
        
        // Check if players exist
        const player1 = getPlayerById(String(match.player1_id));
        const player2 = getPlayerById(String(match.player2_id));
        
        if (!player1) issues.push(`Player1 (${match.player1_id}) not found`);
        if (!player2) issues.push(`Player2 (${match.player2_id}) not found`);
        
        // Check if winner is one of the players
        if (String(match.winner_id) !== String(match.player1_id) && 
            String(match.winner_id) !== String(match.player2_id)) {
            issues.push(`Winner (${match.winner_id}) is not one of the players`);
        }
        
        // Check if scores are valid
        if (match.player1_score < 0 || match.player2_score < 0) {
            issues.push('Invalid scores (negative values)');
        }
        
        if (issues.length > 0) {
            console.warn(`Match ${match.id} has issues:`, issues);
            invalidMatches++;
        } else {
            fixedMatches++;
        }
    }
    
    console.log(`Match validation complete: ${fixedMatches} valid, ${invalidMatches} invalid`);
    console.log('=== Match Validation Complete ===');
    
    return { validMatches: fixedMatches, invalidMatches: invalidMatches };
}

// Comprehensive match system test
async function testMatchSystem() {
    console.log('=== Testing Match System ===');
    
    try {
        // Test 1: Validate match data
        console.log('Test 1: Validating match data...');
        const validationResult = await validateAndFixMatchData();
        console.log('Validation result:', validationResult);
        
        // Test 2: Check if we have players
        if (players.length < 2) {
            console.log('❌ Need at least 2 players to test match system');
            return;
        }
        
        // Test 3: Create a test match
        console.log('Test 3: Creating test match...');
        const player1 = players[0];
        const player2 = players[1];
        
        const testMatchData = {
            player1_id: player1.id,
            player2_id: player2.id,
            player1_score: 3,
            player2_score: 1,
            winner_id: player1.id,
            match_date: formatLocalDate(new Date())
        };
        
        console.log('Test match data:', testMatchData);
        
        // Test 4: Add the match
        console.log('Test 4: Adding test match...');
        const newMatch = await addMatch(testMatchData);
        if (newMatch) {
            console.log('✅ Test match added successfully:', newMatch);
        } else {
            console.log('❌ Failed to add test match');
            return;
        }
        
        // Test 5: Verify stats were updated
        console.log('Test 5: Verifying player stats...');
        const updatedPlayer1 = getPlayerById(player1.id);
        const updatedPlayer2 = getPlayerById(player2.id);
        
        console.log('Player 1 stats:', {
            wins: updatedPlayer1.wins,
            losses: updatedPlayer1.losses,
            win_rate: updatedPlayer1.win_rate
        });
        
        console.log('Player 2 stats:', {
            wins: updatedPlayer2.wins,
            losses: updatedPlayer2.losses,
            win_rate: updatedPlayer2.win_rate
        });
        
        // Test 6: Recalculate all stats
        console.log('Test 6: Recalculating all player stats...');
        const recalculationResult = await recalculateAllPlayerStats();
        console.log('Recalculation result:', recalculationResult);
        
        console.log('=== Match System Test Complete ===');
        return {
            validationResult,
            testMatch: newMatch,
            recalculationResult
        };
        
    } catch (error) {
        console.error('Error testing match system:', error);
        return null;
    }
}

// Announcements CRUD Functions
function getAnnouncements() {
    return announcements;
}

function getAnnouncementById(id) {
    return announcements.find(a => a.id === id);
}

async function addAnnouncement(announcementData) {
    try {
        const { addDoc, collection } = window.FirebaseDB;
        
        const newAnnouncement = {
            title: announcementData.title,
            content: announcementData.content,
            type: announcementData.type || 'general', // 'tournament', 'announcement', 'update', 'event'
            priority: announcementData.priority || 'normal', // 'high', 'normal', 'low'
            created_at: new Date().toISOString(),
            created_by: announcementData.created_by || 'admin',
            is_active: true,
            expires_at: announcementData.expires_at || null
        };
        
        // Add announcement to Firebase
        const docRef = await addDoc(collection(window.FirebaseDB.db, 'announcements'), newAnnouncement);
        newAnnouncement.id = docRef.id;
        
        // Add to local array (insert at beginning)
        announcements.unshift(newAnnouncement);
        
        // Dispatch event to refresh UI
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('ttc:dataUpdated'));
        }
        
        return newAnnouncement;
    } catch (error) {
        console.error('Error adding announcement:', error);
        throw error;
    }
}

async function updateAnnouncement(announcementId, updateData) {
    try {
        const { updateDoc, doc } = window.FirebaseDB;
        const announcementRef = doc(window.FirebaseDB.db, 'announcements', announcementId);
        
        await updateDoc(announcementRef, {
            ...updateData,
            updated_at: new Date().toISOString()
        });
        
        // Update local array
        const announcementIndex = announcements.findIndex(a => a.id === announcementId);
        if (announcementIndex !== -1) {
            announcements[announcementIndex] = { 
                ...announcements[announcementIndex], 
                ...updateData,
                updated_at: new Date().toISOString()
            };
        }
        
        // Dispatch event to refresh UI
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('ttc:dataUpdated'));
        }
        
        return announcements;
    } catch (error) {
        console.error('Error updating announcement:', error);
        return null;
    }
}

async function deleteAnnouncement(announcementId) {
    try {
        const { deleteDoc, doc } = window.FirebaseDB;
        
        // Delete announcement from Firebase
        await deleteDoc(doc(window.FirebaseDB.db, 'announcements', announcementId));
        
        // Remove from local array
        const announcementIndex = announcements.findIndex(a => a.id === announcementId);
        if (announcementIndex !== -1) {
            announcements.splice(announcementIndex, 1);
        }
        
        // Dispatch event to refresh UI
        if (typeof document !== 'undefined') {
            document.dispatchEvent(new CustomEvent('ttc:dataUpdated'));
        }
        
        console.log(`Announcement ${announcementId} deleted successfully`);
        return true;
    } catch (error) {
        console.error('Error deleting announcement:', error);
        return false;
    }
}

async function updateRanksInFirebase() {
    try {
        const { updateDoc, doc } = window.FirebaseDB;
        
        for (const player of players) {
            const playerRef = doc(window.FirebaseDB.db, 'players', String(player.id));
            await updateDoc(playerRef, { rank: player.rank });
        }
        
        console.log('Ranks updated in Firebase');
    } catch (error) {
        console.error('Error updating ranks in Firebase:', error);
    }
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
    forceFixRankings,
    markPlayerAttendance,
    markAnuragPresent,
    checkPlayerAttendance,
    migratePlayerAttendanceHistory,
    testAttendanceFunctionality,
    debugUserPlayerRelationships,
    fixUserPlayerRelationships,
    recalculateAllPlayerStats,
    validateAndFixMatchData,
    testMatchSystem,
    
    // Announcements functions
    getAnnouncements,
    getAnnouncementById,
    addAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    
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
    matches: () => matches,
    announcements: () => announcements
};
