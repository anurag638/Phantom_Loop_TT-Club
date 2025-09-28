# Table Tennis Club Dashboard

A comprehensive web application for managing a table tennis club, built with pure HTML, CSS, and JavaScript.

## Features

### Admin Dashboard
- **Player Management**: Add, edit, and delete players
- **Match Recording**: Record match results and update player statistics
- **Attendance Tracking**: Mark player attendance for specific dates
- **Statistics Overview**: View total players, recent matches, and attendance stats
- **Real-time Updates**: All changes are immediately reflected across the dashboard

### Player Dashboard
- **Personal Statistics**: View wins, losses, win rate, and current streak
- **Global Leaderboard**: See top 5 players ranked by performance
- **Club Attendance**: View all players' attendance status and last seen dates
- **Attendance Calendar**: Interactive calendar showing personal attendance history
- **Performance Analytics**: Visual representation of win/loss ratios and streaks

## Technology Stack

- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Styling**: Bootstrap 5, Custom CSS with CSS Variables
- **Icons**: Font Awesome 6
- **Data Storage**: LocalStorage (client-side persistence)
- **Authentication**: Client-side session management

## Installation

1. **Clone or download the repository**
   ```bash
   git clone <repository-url>
   cd table-tennis-dashboard
   ```

2. **Open the application**
   - Simply open `index.html` in your web browser
   - No server setup required - it's a pure client-side application!

## Demo Accounts

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`

### Player Account
- **Username**: `alex_chen`
- **Password**: `player123`

## File Structure

```
table-tennis-dashboard/
├── index.html              # Main entry point (login page)
├── admin-dashboard.html    # Admin interface
├── player-dashboard.html   # Player interface
├── styles.css             # All styling and CSS
├── app.js                 # Main JavaScript application logic
└── README.md              # This file
```

## How It Works

### Data Storage
- All data is stored in the browser's localStorage
- No server or database required
- Data persists between browser sessions
- Sample data is automatically created on first run

### Authentication
- Simple client-side authentication system
- Session management using localStorage
- Role-based access control (admin vs player)

### Key Features

#### Player Management
- Add new players with username, email, and initial rank
- Edit player statistics (wins, losses, rank)
- Delete players (removes all associated matches)
- Automatic rank adjustment when players are added/removed

#### Match Recording
- Select two players and record match scores
- Automatic winner determination based on scores
- Real-time statistics updates (wins, losses, streaks, win rates)
- Automatic ranking recalculation based on performance

#### Attendance Tracking
- Mark players as present/absent for current day
- Historical attendance tracking for specific dates
- Visual attendance calendar for players
- Attendance rate calculations

#### Statistics and Analytics
- Real-time dashboard statistics
- Win rate calculations and visualizations
- Streak tracking (positive for wins, negative for losses)
- Leaderboard with top performers
- Performance charts and progress bars

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Any modern browser with JavaScript enabled

## Responsive Design

The application is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

## Customization

### Styling
- All styles are in `styles.css`
- Uses CSS custom properties (variables) for easy theming
- Bootstrap 5 for responsive grid and components
- Custom animations and hover effects

### Data
- Sample data is created automatically in `app.js`
- Modify the `createDefaultData()` function to change initial data
- All data is stored in localStorage with keys:
  - `ttc_players`: Player data
  - `ttc_matches`: Match history
  - `ttc_users`: User accounts
  - `ttc_current_user`: Current session

## Development

### Adding New Features

1. **New Pages**: Create new HTML files and link them in the navigation
2. **Styling**: Add CSS to `styles.css`
3. **Functionality**: Add JavaScript functions to `app.js`
4. **Data**: Modify data structures and localStorage handling

### Code Organization

- **HTML**: Clean, semantic markup with Bootstrap classes
- **CSS**: Organized with CSS custom properties and modern features
- **JavaScript**: Modular functions with clear separation of concerns
- **Data**: Centralized data management with localStorage persistence

## Security Notes

- This is a client-side application for demonstration purposes
- All data is stored locally in the browser
- No server-side validation or security measures
- Suitable for local use or internal networks
- For production use, consider adding server-side components

## Performance

- Fast loading with no server requests
- Efficient localStorage operations
- Smooth animations and transitions
- Optimized for modern browsers

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test in multiple browsers
5. Submit a pull request

## License

This project is open source and available under the MIT License.

## Support

For support or questions, please open an issue in the repository.