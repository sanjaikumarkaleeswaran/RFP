# 🔑 **How to Add Hugging Face API Key**

## ⚡ **Quick Setup (2 minutes)**

### **Step 1: Get Your API Key**

1. **Go to**: https://huggingface.co/settings/tokens
2. **Click**: "New token"
3. **Fill in**:
   - Name: `RFP System`
   - Type: **Read**
4. **Click**: "Generate"
5. **Copy** the token (starts with `hf_`)

---

### **Step 2: Add to .env File**

**Open this file:**
```
d:\arfp\nova\backend\.env
```

**Add this line:**
```env
HUGGINGFACE_API_KEY=hf_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

**Replace `hf_XXX...` with your actual token!**

---

## 📝 **Example .env File:**

Your `.env` file should look like this:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/rfp-management

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Port
PORT=5000

# Gmail OAuth Configuration
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URI=http://localhost:5173/gmail-connected

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password
SMTP_FROM_EMAIL=your-email@gmail.com

# ⭐ ADD THIS LINE ⭐
HUGGINGFACE_API_KEY=hf_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX

# Frontend URL
FRONTEND_URL=http://localhost:5173
```

---

## ✅ **After Adding:**

1. **Save** the `.env` file
2. **Restart** your backend (it should auto-restart)
3. **Test** the connection:
   ```
   http://localhost:5000/api/vendor-proposals/test/gemini
   ```

---

## 🎯 **Expected Response:**

```json
{
  "success": true,
  "message": "Mistral 3 API is connected and working!",
  "apiKeyConfigured": true,
  "model": "mistralai/Mistral-7B-Instruct-v0.3",
  "provider": "Hugging Face"
}
```

---

## 💰 **Pricing:**

```
✅ FREE: 1,000 requests/day
✅ No credit card required
✅ No expiration
```

---

## 🔗 **Quick Links:**

- **Get API Key**: https://huggingface.co/settings/tokens
- **Test Endpoint**: http://localhost:5000/api/vendor-proposals/test/gemini

---

**That's it! Just add the key to your .env file!** ✨
