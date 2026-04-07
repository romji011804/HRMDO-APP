# Code Signing Guide for Windows

## Why Code Signing?

Without code signing, Windows will show "Unknown Publisher" warnings when users install your app. Code signing provides:
- Trust and authenticity
- No Windows SmartScreen warnings
- Professional appearance
- Required for some enterprise deployments

## Getting a Code Signing Certificate

### Option 1: Commercial Certificate Authorities (Recommended)
Purchase from trusted CAs:
- **Sectigo (formerly Comodo)** - ~$100-200/year
- **DigiCert** - ~$400-500/year
- **GlobalSign** - ~$200-300/year

### Option 2: Self-Signed Certificate (Testing Only)
For testing purposes only. Will still show warnings to users.

## Steps to Sign Your App

### 1. Purchase Certificate
1. Choose a CA from above
2. Complete identity verification (may take 1-7 days)
3. Download your certificate (.pfx or .p12 file)
4. Keep your certificate password secure

### 2. Configure electron-builder

Add to `package.json`:

```json
{
  "build": {
    "win": {
      "certificateFile": "path/to/certificate.pfx",
      "certificatePassword": "YOUR_PASSWORD",
      "signingHashAlgorithms": ["sha256"],
      "sign": "./customSign.js"
    }
  }
}
```

**IMPORTANT:** Never commit your certificate or password to git!

### 3. Use Environment Variables (Recommended)

Instead of hardcoding, use environment variables:

```json
{
  "build": {
    "win": {
      "certificateFile": "${env.WIN_CSC_LINK}",
      "certificatePassword": "${env.WIN_CSC_KEY_PASSWORD}",
      "signingHashAlgorithms": ["sha256"]
    }
  }
}
```

Set environment variables:
```bash
set WIN_CSC_LINK=C:\path\to\certificate.pfx
set WIN_CSC_KEY_PASSWORD=your_password
npm run electron:build
```

### 4. Verify Signing

After building, right-click the .exe file:
1. Properties → Digital Signatures tab
2. Should show your certificate details
3. Status should be "This digital signature is OK"

## Current Configuration

Your app is currently configured to:
- ✅ Skip code signature verification for updates
- ✅ Build without signing (will show warnings)
- ✅ Work on any Windows machine

When you get a certificate:
1. Add certificate file to project (don't commit it!)
2. Update package.json with certificate path
3. Set environment variables
4. Rebuild: `npm run electron:build`

## Cost-Benefit Analysis

### Without Signing
- ❌ Windows SmartScreen warnings
- ❌ "Unknown Publisher" shown
- ✅ Free
- ✅ Works for internal/personal use

### With Signing
- ✅ No warnings
- ✅ Professional appearance
- ✅ User trust
- ❌ $100-500/year cost
- ❌ Identity verification required

## Recommendation

**For Internal/Personal Use:** Skip code signing
**For Public Distribution:** Get a certificate

## Alternative: Build Trust Over Time

Windows SmartScreen learns over time. If enough users install your app and don't report issues, the warnings may decrease. This takes time and many installations.

## Resources

- [electron-builder Code Signing](https://www.electron.build/code-signing)
- [Microsoft Code Signing](https://docs.microsoft.com/en-us/windows/win32/seccrypto/cryptography-tools)
- [Sectigo Code Signing](https://sectigo.com/ssl-certificates-tls/code-signing)
