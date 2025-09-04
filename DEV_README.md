# Development Auto-Refresh System

This project includes an automatic refresh system that detects file changes and refreshes your browser automatically during development.

## Quick Start

### Option 1: Using the Batch File (Windows)
```cmd
start_dev_server.bat
```

### Option 2: Using PowerShell
```powershell
.\start_dev_server.ps1
```

### Option 3: Manual Start
```cmd
python dev_server.py
```

Then open your browser to: http://localhost:8000

## Features

### 🔄 Auto-Refresh
- Automatically refreshes the browser when files change
- Works with JS, HTML, CSS, Python, and GLB files
- Smart file watching with configurable intervals
- Visual indicator in the top-right corner of the page

### 🎯 Visual Indicator
The auto-refresh system shows a small indicator in the top-right corner:
- 🔄 **Green**: Connected and watching for changes
- ⟳ **Yellow**: Checking for changes
- ⚠ **Red**: Connection error
- ↻ **Blue**: Refreshing page

### ⌨️ Keyboard Shortcuts
- **Ctrl+Shift+R**: Force refresh the page
- **Click indicator**: Manual refresh

### 🛠️ Development Only
- Auto-refresh only works on localhost (development environment)
- Safe for production deployment (automatically disabled)

## Configuration

Edit `dev-config.json` to customize the behavior:

```json
{
  "autoRefresh": {
    "enabled": true,
    "pollInterval": 1000,
    "watchedExtensions": [".js", ".html", ".css", ".py", ".glb"]
  }
}
```

## File Structure

```
├── dev_server.py          # Enhanced development server with file watching
├── js/dev-auto-refresh.js # Client-side auto-refresh script
├── dev-config.json        # Configuration file
├── start_dev_server.bat   # Windows batch file to start server
├── start_dev_server.ps1   # PowerShell script to start server
└── server.py              # Original simple server (backup)
```

## How It Works

1. **Server-Side**: `dev_server.py` watches for file changes using a background thread
2. **Client-Side**: `dev-auto-refresh.js` polls the server every second for changes
3. **Communication**: Uses a `/dev/poll` endpoint to check modification times
4. **Refresh**: When changes are detected, the page automatically refreshes

## Troubleshooting

### Auto-refresh not working?
1. Make sure you're accessing via `localhost` (not `127.0.0.1` or file://)
2. Check the browser console for error messages
3. Verify the green indicator appears in the top-right corner
4. Try a manual refresh with Ctrl+Shift+R

### Server won't start?
1. Make sure Python is installed and in your PATH
2. Check if port 8000 is already in use
3. Try running `python --version` to verify Python installation

### Files not being detected?
1. Check that your file extension is in the watched list
2. Hidden files and directories are ignored by default
3. Very rapid file changes might be batched together

## Advanced Usage

### Disable Auto-Refresh
Add this to your HTML head to disable auto-refresh for specific pages:
```html
<script>
window.DEV_AUTO_REFRESH_DISABLED = true;
</script>
```

### Custom Configuration
You can initialize the auto-refresh system with custom options:
```javascript
autoRefresh = new DevAutoRefresh({
    pollInterval: 2000,  // Check every 2 seconds
    enabled: true
});
```

## Production Deployment

The auto-refresh system automatically disables itself when not running on localhost, so it's safe to deploy your code as-is. For production, you can:

1. Use the original `server.py` 
2. Remove the auto-refresh script reference from HTML
3. Use a proper web server like nginx or Apache

---

Happy coding! 🚀
