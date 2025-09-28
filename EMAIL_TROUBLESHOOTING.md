# 🔧 Email Troubleshooting Guide

## Step 1: Check Browser Console

1. **Open your dashboard** (`index.html`)
2. **Press F12** to open Developer Tools
3. **Go to Console tab**
4. **Create a new player** and watch for error messages

## Step 2: Test Email Function

1. **In the browser console**, type:
   ```javascript
   TTC.testEmailFunction()
   ```
2. **Check the console output** for any errors

## Step 3: Common Issues & Solutions

### Issue 1: "EmailJS not loaded"
**Solution:**
- Check if EmailJS script is loading
- Make sure `emailjs-config.js` is included before `app.js`

### Issue 2: "Service not found" or "Template not found"
**Solutions:**
- Verify Service ID: `service_9ha40bp`
- Verify Template ID: `template_yhmcgje`
- Check EmailJS dashboard to ensure service and template are active

### Issue 3: Gmail Authentication Issues
**Solutions:**
1. **Reconnect Gmail Service:**
   - Go to EmailJS dashboard → Email Services
   - Edit your Gmail service
   - Disconnect and reconnect
   - Grant all permissions

2. **Use App Password:**
   - Enable 2FA on Gmail
   - Generate App Password
   - Use App Password instead of regular password

### Issue 4: Template Variables Not Working
**Check your email template has these variables:**
- `{{to_email}}` - Recipient email
- `{{player_name}}` - Player's name
- `{{username}}` - Username
- `{{password}}` - Password
- `{{club_name}}` - Club name
- `{{login_url}}` - Login URL

### Issue 5: Emails Going to Spam
**Solutions:**
- Check spam/junk folder
- Add sender email to contacts
- Use a professional email address

## Step 4: Manual EmailJS Test

1. **Go to EmailJS Dashboard**
2. **Click "Test" on your template**
3. **Fill in test data:**
   ```
   to_email: your-email@gmail.com
   player_name: Test Player
   username: test_user
   password: test123
   club_name: Phantom Loop TT Club
   login_url: http://localhost/index.html
   ```
4. **Send test email**
5. **Check if you receive it**

## Step 5: Alternative Solutions

### Option A: Use Formspree (Easier)
1. Go to [formspree.io](https://formspree.io)
2. Create free account
3. Create new form
4. Replace email function with Formspree

### Option B: Use Web3Forms
1. Go to [web3forms.com](https://web3forms.com)
2. Get access key
3. Use their API

## Step 6: Debug Information

**Check these in browser console:**
```javascript
// Check if EmailJS is loaded
console.log('EmailJS loaded:', typeof emailjs !== 'undefined');

// Check configuration
console.log('Config loaded:', !!window.EMAILJS_CONFIG);

// Check specific values
console.log('Public Key:', window.EMAILJS_CONFIG?.PUBLIC_KEY);
console.log('Service ID:', window.EMAILJS_CONFIG?.SERVICE_ID);
console.log('Template ID:', window.EMAILJS_CONFIG?.TEMPLATE_ID);
```

## Quick Fix Checklist

- [ ] EmailJS script is loading
- [ ] Configuration file is included
- [ ] All three IDs are correct
- [ ] Gmail service is connected
- [ ] Email template is published
- [ ] Template has correct variables
- [ ] Check spam folder
- [ ] Test with EmailJS dashboard

## Still Not Working?

1. **Try the manual test** in EmailJS dashboard first
2. **Check EmailJS usage limits** (200 emails/month free)
3. **Consider switching to Formspree** for easier setup
4. **Check Gmail API quotas** if using Gmail

Let me know what error messages you see in the console!
