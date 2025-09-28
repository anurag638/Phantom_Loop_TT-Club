# Email Setup Guide for Table Tennis Dashboard

This guide will help you set up email functionality to send welcome emails when new players are created.

## Option 1: EmailJS Integration (Recommended)

EmailJS allows you to send emails directly from the browser without a backend server.

### Step 1: Create EmailJS Account

1. Go to [EmailJS.com](https://www.emailjs.com/)
2. Sign up for a free account
3. Verify your email address

### Step 2: Set Up Email Service

1. **Add Email Service:**
   - Go to "Email Services" in your EmailJS dashboard
   - Click "Add New Service"
   - Choose your email provider (Gmail, Outlook, etc.)
   - Follow the setup instructions for your provider

2. **Get Service ID:**
   - Copy the Service ID (e.g., `service_abc123`)

### Step 3: Create Email Template

1. **Go to Email Templates:**
   - Click "Email Templates" in your dashboard
   - Click "Create New Template"

2. **Template Content:**
   ```html
   Subject: Welcome to {{club_name}}!

   Dear {{player_name}},

   Welcome to {{club_name}}! Your account has been created successfully.

   Your login credentials:
   Username: {{username}}
   Password: {{password}}

   You can access your dashboard at: {{login_url}}

   Best regards,
   {{club_name}} Team
   ```

3. **Template Variables:**
   - `{{player_name}}` - Player's full name
   - `{{username}}` - Player's username
   - `{{password}}` - Player's password
   - `{{club_name}}` - Club name
   - `{{login_url}}` - Login page URL

4. **Get Template ID:**
   - Copy the Template ID (e.g., `template_xyz789`)

### Step 4: Get Public Key

1. Go to "Account" → "General"
2. Copy your Public Key (e.g., `user_abc123def456`)

### Step 5: Update Your Code

1. **Update `app.js`:**
   ```javascript
   // Replace these placeholders with your actual values:
   emailjs.init('YOUR_PUBLIC_KEY'); // Your EmailJS public key
   emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
   ```

2. **Example with real values:**
   ```javascript
   emailjs.init('user_abc123def456');
   emailjs.send('service_abc123', 'template_xyz789', templateParams)
   ```

## Option 2: Alternative Email Services

### Formspree
- Go to [Formspree.io](https://formspree.io/)
- Create a form endpoint
- Use fetch() to send data to the endpoint

### Netlify Forms
- If hosting on Netlify, use their form handling
- Add `netlify` attribute to forms

### Web3Forms
- Go to [Web3Forms.com](https://web3forms.com/)
- Get your access key
- Use their API to send emails

## Option 3: Backend Integration

If you want to add a simple backend:

### Node.js + Nodemailer
```javascript
// server.js
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

app.post('/send-welcome-email', async (req, res) => {
    const { email, playerName, username, password } = req.body;
    
    // Configure your email service
    const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: 'your-email@gmail.com',
            pass: 'your-app-password'
        }
    });
    
    const mailOptions = {
        from: 'noreply@tabletennisclub.com',
        to: email,
        subject: 'Welcome to Phantom Loop TT Club!',
        html: `
            <h2>Welcome ${playerName}!</h2>
            <p>Your account has been created successfully.</p>
            <p><strong>Username:</strong> ${username}</p>
            <p><strong>Password:</strong> ${password}</p>
            <p>You can access your dashboard at: <a href="${req.headers.origin}">${req.headers.origin}</a></p>
        `
    };
    
    try {
        await transporter.sendMail(mailOptions);
        res.json({ success: true });
    } catch (error) {
        res.json({ success: false, error: error.message });
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));
```

## Testing the Email Functionality

1. **Set up EmailJS** following the steps above
2. **Update the configuration** in `app.js`
3. **Test by creating a new player** in the admin dashboard
4. **Check the console** for success/error messages
5. **Verify the email** is received

## Security Considerations

- **Never expose sensitive credentials** in client-side code
- **Use environment variables** for production
- **Consider rate limiting** to prevent spam
- **Validate email addresses** before sending

## Troubleshooting

### Common Issues:

1. **"EmailJS not defined" error:**
   - Make sure EmailJS script is loaded before app.js
   - Check that the EmailJS script URL is correct

2. **"Service not found" error:**
   - Verify your Service ID is correct
   - Make sure the service is active in EmailJS dashboard

3. **"Template not found" error:**
   - Verify your Template ID is correct
   - Make sure the template is published

4. **Emails not being sent:**
   - Check your email service configuration
   - Verify your email provider settings
   - Check spam folder

### Debug Mode:
Add this to see detailed logs:
```javascript
emailjs.send('YOUR_SERVICE_ID', 'YOUR_TEMPLATE_ID', templateParams)
    .then(function(response) {
        console.log('SUCCESS!', response.status, response.text);
    }, function(error) {
        console.log('FAILED...', error);
    });
```

## Free Tier Limits

- **EmailJS Free:** 200 emails/month
- **Formspree Free:** 50 submissions/month
- **Web3Forms Free:** 250 submissions/month

Choose the service that best fits your needs!
