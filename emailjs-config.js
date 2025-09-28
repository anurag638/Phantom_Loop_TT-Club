// EmailJS Configuration
// Replace these values with your actual EmailJS credentials

const EMAILJS_CONFIG = {
    // Your EmailJS Public Key (from Account > General)
    PUBLIC_KEY: 'Pp8YehY9eG1dnExOb',
    
    // Your Email Service ID (from Email Services)
    SERVICE_ID: 'service_9ha40bp',
    
    // Your Email Template ID (from Email Templates)
    TEMPLATE_ID: 'template_yhmcgje',
    
    // Club information
    CLUB_NAME: 'Phantom Loop TT Club',
    FROM_NAME: 'Phantom Loop TT Club Team'
};

// Example configuration (replace with your actual values):
/*
const EMAILJS_CONFIG = {
    PUBLIC_KEY: 'user_abc123def456',
    SERVICE_ID: 'service_xyz789',
    TEMPLATE_ID: 'template_welcome123',
    CLUB_NAME: 'Phantom Loop TT Club',
    FROM_NAME: 'Phantom Loop TT Club Team'
};
*/

// Make configuration available globally
window.EMAILJS_CONFIG = EMAILJS_CONFIG;
