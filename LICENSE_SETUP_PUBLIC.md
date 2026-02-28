# 🔒 License & Hardware Binding Setup Guide

## ⚠️ IMPORTANT: This adapter requires a license key

This adapter is **hardware-bound** and requires a valid license key to operate.

---

## 📋 Setup Instructions

### Step 1: Install the Adapter

```bash
iobroker install gokturk413/iobroker.webui
```

### Step 2: First Run (Get Your Hardware ID)

1. The adapter will fail on first start (this is normal!)

2. Check the logs:
   ```bash
   iobroker logs webui --lines 50
   ```

3. You will see something like this:
   ```
   ===========================================
   📌 YOUR HARDWARE ID:
   a7b3c9d2e5f8a1b4c7d0e3f6a9b2c5d8e1f4a7b0c3d6e9f2a5b8c1d4e7f0a3b6
   ===========================================
   ❌ LICENSE VALIDATION FAILED
   ```

4. **COPY the Hardware ID** (the long hexadecimal string)

---

### Step 3: Request License Key

📧 **Contact gokturk413** with:
- Your Hardware ID
- Your use case
- Contact information

You will receive a license key.

---

### Step 4: Configure in Admin Panel

1. Open ioBroker Admin → **Instances**
2. Find **webui** adapter
3. Click the **⚙️ Settings** icon
4. You will see a configuration panel with:
   - **License Key** field
   - Instructions
   - Warning messages

5. **Enter the license key** you received from gokturk413

6. Click **Save and Close**

---

### Step 5: Restart Adapter

```bash
iobroker restart webui
```

**What happens now:**
- ✅ License key will be validated
- ✅ Your Hardware ID will be **automatically registered**
- ✅ Adapter will restart once more
- ✅ Done! Adapter is now running

---

## 🎯 How It Works

### Automatic Hardware Registration

When you enter a valid license key:
1. Adapter reads your hardware ID
2. Checks if it's in the registered list
3. If not → **auto-registers it** and restarts
4. Next start → ✅ Everything works!

You can see registered Hardware IDs in:
- **Admin Panel → Instances → webui → Settings**
- Under "Registered Hardware IDs" field

---

## 🔧 Manual Hardware ID Management (Optional)

If automatic registration fails, you can manually add Hardware IDs:

1. Open **Admin → Instances → webui → Settings**
2. Find "Registered Hardware IDs" field
3. Click **+ Add**
4. Paste your Hardware ID (from logs)
5. Save

---

## 🔐 How the License Works

1. **Hardware Binding**: The adapter generates a unique ID based on:
   - Network MAC addresses
   - Hostname
   - CPU model
   - Platform

2. **License Key**: Provided by gokturk413 after verification

3. **Validation**: Both must be correct for the adapter to start

---

## 🚫 What This Prevents

- ✅ Others cannot install from GitHub and use it
- ✅ Even if they copy the code, it won't work on their hardware
- ✅ License check happens on every adapter start
- ✅ Code is obfuscated to prevent tampering

---

## ⚠️ Important Notes

- Keep your **License Key** private
- Don't share your **Hardware ID** with others
- If you move to a new server, you'll need to register the new Hardware ID
- Contact gokturk413 for multi-server licensing

---

## 🔧 Troubleshooting

### Error: "License validation failed"
- Check if you entered the license key correctly
- Verify you received a license key from gokturk413
- Contact gokturk413 if the issue persists

### Error: "Hardware ID: UNKNOWN_HARDWARE"
- Check network interfaces are available
- Restart the adapter
- Contact gokturk413 for support

### Adapter won't start after license configuration
- Check logs: `iobroker logs webui --lines 100`
- Ensure you copied the Hardware ID correctly
- Contact gokturk413 with the log output

---

## 📧 Contact

**For licensing inquiries:**
- GitHub: @gokturk413
- Email: [Contact via GitHub]

**Original Author:**
- GitHub: @jogibear9988
- Original Repository: https://github.com/iobroker-community-adapters/ioBroker.webui

---

## ⚖️ License Terms

This is a **custom edited version** with proprietary license protection.

- ✅ Original ioBroker.webui: MIT License (open source)
- ✅ Custom modifications by gokturk413: Hardware-bound proprietary license
- ⚠️ You must obtain a valid license key to use this version

For the original open-source version without license requirements, visit:
https://github.com/iobroker-community-adapters/ioBroker.webui

---

**Remember:** This adapter is provided with license protection to ensure proper use and support. Thank you for respecting the licensing terms! 🙏
