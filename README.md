# YT Speed+ 🚀

A premium Chrome extension for controlling YouTube playback speed with a beautiful dark UI, keyboard shortcuts, and custom speed presets.

![Version](https://img.shields.io/badge/version-1.0-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

- **🎨 Premium Dark UI** - Modern, sleek interface with gradient accents and smooth animations
- **⚡ Quick Presets** - One-click speed presets: 0.5×, 0.75×, 1×, 1.25×, 1.5×, 2×
- **🎯 Custom Speed Control** - Fine-tune speed from 0.25× to 3× with precision slider
- **⌨️ Keyboard Shortcuts** - Fast controls without opening the popup
  - `Cmd/Ctrl + Shift + Period` - Increase speed by 0.25×
  - `Cmd/Ctrl + Shift + Comma` - Decrease speed by 0.25×
  - `Cmd/Ctrl + Shift + 0` - Reset to 1×
- **💾 Persistent Settings** - Your speed preferences sync across devices
- **🎬 Works on Ads** - Speed control applies to both videos and ads
- **🔄 Auto-Detection** - Automatically applies speed to dynamically loaded videos

## 🚀 Installation

### From Chrome Web Store
1. Visit the [Chrome Web Store page](#) (coming soon)
2. Click "Add to Chrome"
3. Enjoy!

### Manual Installation (Developer Mode)
1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top-right)
4. Click "Load unpacked"
5. Select the extension folder
6. The extension is now installed!

## 📖 Usage

### Using the Popup
1. Click the extension icon while on any YouTube page
2. Choose a preset speed or use the custom slider
3. Speed applies instantly to all videos on the page

### Using Keyboard Shortcuts
- Press `Cmd/Ctrl + Shift + Period` to increase speed
- Press `Cmd/Ctrl + Shift + Comma` to decrease speed
- Press `Cmd/Ctrl + Shift + 0` to reset to normal speed

### Speed Display
- The current playback speed is shown prominently at the top
- The extension badge shows the current speed at a glance

## 🛠️ Technical Details

- **Manifest Version**: 3
- **Permissions**: 
  - `storage` - Save your speed preferences
  - `tabs` - Detect YouTube tabs
- **Host Permissions**: `https://*.youtube.com/*`
- **Browser Support**: Chrome 88+, Edge 88+

## 🎨 Design Philosophy

YT Speed+ features a premium dark theme inspired by modern design systems:
- Clean, minimalist interface
- Smooth animations and transitions
- Gradient accents and glowing effects
- Intuitive controls with visual feedback

## 📝 Privacy

YT Speed+ respects your privacy:
- ✅ No data collection
- ✅ No analytics or tracking
- ✅ No external server communication
- ✅ All settings stored locally using Chrome sync storage
- ✅ Only active on YouTube domains

See [PRIVACY.md](PRIVACY.md) for full privacy policy.

## 🤝 Contributing

Contributions are welcome! Feel free to:
- Report bugs
- Suggest new features
- Submit pull requests

## 📄 License

MIT License - feel free to use and modify as needed.

## 👨‍💻 Author

Built with ♥ by [Ali Baig](https://iamalibaig.com)

## 🙏 Acknowledgments

- Icons from Material Design
- Font: Inter by Rasmus Andersson
- Inspired by modern extension design patterns

---

**Note**: This extension only works on YouTube.com and does not collect any user data.
