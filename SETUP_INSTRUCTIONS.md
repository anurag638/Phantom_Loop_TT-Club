# 🚀 EmailJS Setup Instructions

Follow these steps to set up email functionality for your Table Tennis Dashboard.

## Step 1: Create EmailJS Account

1. **Go to EmailJS:**
   - Open [https://www.emailjs.com/](https://www.emailjs.com/)
   - Click "Sign Up" (top right corner)
   - Create account with your email
   - Verify your email address

## Step 2: Add Email Service

1. **In EmailJS Dashboard:**
   - Click "Email Services" (left sidebar)
   - Click "Add New Service"
   - Choose "Gmail" (recommended)
   - Click "Connect Account"
   - Sign in with your Gmail account
   - Grant permissions
   - **Copy the Service ID** (e.g., `service_abc123`)

## Step 3: Create Email Template

1. **Go to Email Templates:**
   - Click "Email Templates" (left sidebar)
   - Click "Create New Template"

2. **Template Settings:**
   - **Template Name:** `Welcome Email`
   - **Subject:** `Welcome to {{club_name}}!`

3. **Template Content:**
   ```html
   <h2>Welcome {{player_name}}!</h2>
   
   <p>Your account has been created successfully at {{club_name}}.</p>
   
   <p><strong>Your login credentials:</strong></p>
   <ul>
       <li><strong>Username:</strong> {{username}}</li>
       <li><strong>Password:</strong> {{password}}</li>
   </ul>
   
   <p>You can access your player dashboard at: <a href="{{login_url}}">{{login_url}}</a></p>
   
   <p>Best regards,<br>
   {{club_name}} Team</p>
   ```

4. **Save and copy the Template ID** (e.g., `template_xyz789`)

## Step 4: Get Public Key

1. **Go to Account Settings:**
   - Click "Account" (left sidebar)
   - Go to "General" tab
   - **Copy your Public Key** (e.g., `user_abc123def456`)

## Step 5: Update Configuration

1. **Open `emailjs-config.js` in your project folder**

2. **Replace the placeholder values:**
   ```javascript
   const EMAILJS_CONFIG = {
       PUBLIC_KEY: 'user_abc123def456',        // Your actual public key
       SERVICE_ID: 'service_abc123',           // Your actual service ID
       TEMPLATE_ID: 'template_xyz789',         // Your actual template ID
       CLUB_NAME: 'Phantom Loop TT Club',
       FROM_NAME: 'Phantom Loop TT Club Team'
   };
   ```

## Step 6: Test the Setup

1. **Open your dashboard:**
   - Open `index.html` in your browser
   - Login as admin (`admin` / `admin123`)

2. **Create a test player:**
   - Click "Add New Player"
   - Fill in the form with a real email address
   - Click "Add Player"

3. **Check for success:**
   - You should see "Welcome email sent to [email]" message
   - Check the email inbox for the welcome email
   - Check browser console for any error messages

## Troubleshooting

### Common Issues:

**❌ "EmailJS not configured" message:**
- Make sure you updated `emailjs-config.js` with your actual credentials
- Check that all three IDs are correct

**❌ "Service not found" error:**
- Verify your Service ID is correct
- Make sure the service is active in EmailJS dashboard

**❌ "Template not found" error:**
- Verify your Template ID is correct
- Make sure the template is published

**❌ Emails not being sent:**
- Check your email service configuration
- Verify Gmail permissions
- Check spam folder

### Debug Steps:

1. **Open browser console** (F12)
2. **Look for error messages**
3. **Check EmailJS dashboard** for usage statistics
4. **Verify all IDs** are correct

## Free Tier Limits

- **EmailJS Free:** 200 emails/month
- **Gmail:** No additional limits

## Security Notes

- Your public key is safe to use in client-side code
- Never share your private keys
- The free tier is perfect for testing and small clubs

## Next Steps

Once setup is complete:
- ✅ New players will automatically receive welcome emails
- ✅ Emails include login credentials
- ✅ Professional-looking email templates
- ✅ Success/error notifications in the dashboard

**You're all set!** 🎉
