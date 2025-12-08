# 🚀 **QUICK SETUP: Mistral 3 API**

## ⚡ **3-Minute Setup**

### **Step 1: Get API Key** (2 minutes)

1. **Go to**: https://huggingface.co/settings/tokens
2. **Click**: "New token"
3. **Name**: `RFP System`
4. **Type**: Read
5. **Click**: "Generate"
6. **Copy** the token (starts with `hf_`)

---

### **Step 2: Add to .env** (30 seconds)

Open `d:\arfp\nova\backend\.env` and add:

```env
HUGGINGFACE_API_KEY=hf_XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

Replace `hf_XXX...` with your actual token!

---

### **Step 3: Test** (30 seconds)

**Backend will auto-restart. Then test:**

```
http://localhost:5000/api/vendor-proposals/test/gemini
```

**You should see:**
```json
{
  "success": true,
  "message": "Mistral 3 API is connected and working!",
  "model": "mistralai/Mistral-7B-Instruct-v0.3"
}
```

---

## ✅ **That's It!**

**Your app now uses Mistral 3!** 🎉

---

## 💰 **Pricing:**

```
✅ FREE: 1,000 requests/day
✅ No credit card needed
✅ No expiration
```

---

## 📚 **More Info:**

- Full guide: `MISTRAL3_INTEGRATION.md`
- Get API key: https://huggingface.co/settings/tokens
- Model info: https://huggingface.co/mistralai/Mistral-7B-Instruct-v0.3

---

**Happy analyzing!** ✨
