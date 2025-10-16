# Family Images Encryption System

This system allows you to encrypt family images with a password for secure storage and decryption in the browser.

## Usage

### Encrypting Images

1. Place your images in a directory (e.g., `./my-images/`)
2. Run the encryption script:

```bash
node scripts/encrypt-family-images.js ./my-images "your-secret-password"
```

The script will:
- Find all image files (jpg, jpeg, png, gif, bmp, webp)
- Encrypt each image using AES-256-GCM
- Save encrypted files to `data/familyImages/`
- Preserve the original filenames

### File Naming Convention

The game expects family images to be named:
```
{city-name}-{difficulty}{index}.jpg
```

Examples:
- `barcelona-easy0.jpg`
- `london-medium1.jpg`
- `paris-hard0.jpg`

### Password Management

- The password is stored in browser localStorage as `familyImagePassword`
- Users are prompted for the password on first visit
- The password is used to decrypt images in real-time

### Security Features

- **AES-256-GCM encryption** with authenticated encryption
- **PBKDF2 key derivation** with 100,000 iterations
- **Random salt and IV** for each encrypted file
- **Authentication tags** to prevent tampering

### Example Workflow

1. Collect family images for cities
2. Name them according to the convention
3. Encrypt with your chosen password:
   ```bash
   node scripts/encrypt-family-images.js ./family-photos "my-secret-password"
   ```
4. Deploy the encrypted files to `data/familyImages/`
5. Share the password with users who should see the images

### Browser Decryption

The game automatically:
- Prompts for password on first visit
- Stores password in localStorage
- Decrypts images in real-time when needed
- Shows appropriate error messages for wrong passwords
