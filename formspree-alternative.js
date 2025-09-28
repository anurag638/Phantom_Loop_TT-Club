// Alternative email solution using Formspree
// This doesn't require Gmail API setup

function sendWelcomeEmailFormspree(email, playerName, username, password) {
    // Replace 'YOUR_FORMSPREE_ENDPOINT' with your actual Formspree endpoint
    const formspreeEndpoint = 'YOUR_FORMSPREE_ENDPOINT';
    
    const emailData = {
        email: email,
        player_name: playerName,
        username: username,
        password: password,
        club_name: 'Phantom Loop TT Club',
        login_url: window.location.origin + '/index.html',
        subject: 'Welcome to Phantom Loop TT Club!'
    };

    fetch(formspreeEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(emailData)
    })
    .then(response => response.json())
    .then(data => {
        console.log('Welcome email sent successfully!', data);
        showAlert('Welcome email sent to ' + email, 'success');
    })
    .catch(error => {
        console.log('Failed to send welcome email:', error);
        showAlert('Player created successfully, but email could not be sent', 'warning');
    });
}

// To use Formspree:
// 1. Go to https://formspree.io/
// 2. Create a free account
// 3. Create a new form
// 4. Copy the endpoint URL
// 5. Replace 'YOUR_FORMSPREE_ENDPOINT' with your actual endpoint
// 6. Replace the sendWelcomeEmail function in app.js with this one
