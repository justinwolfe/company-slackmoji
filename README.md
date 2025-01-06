# Company Slackmoji

Automatically convert your Slack workspace's user avatars into custom emojis. This tool fetches user profile pictures, removes backgrounds, and creates Slack-compatible emoji formats - perfect for adding a personal touch to your workspace communications. This is all performed locally on your computer using the CPU.

Once you've generated your images, you can use a Chrome Extension (Options, though I can't vouch for these (compute with care!): [1](https://chromewebstore.google.com/detail/neutral-face-emoji-tools/anchoacphlfbdomdlomnbbfhcmcdmjej) [2](https://chromewebstore.google.com/detail/slack-custom-emoji-manage/cgipifjpcbhdppbjjphmgkmmgbeaggpc?hl=en)) to bulk-add them.

## 🚀 Features

- Automatic user avatar fetching from Slack workspace
- Smart background removal using AI-powered image processing
- Bulk emoji generation in Slack-compatible format
- Intelligent filtering of bot accounts and deleted users
- Preserves image quality while meeting Slack's emoji requirements

## 📋 Prerequisites

- Node.js (specified in `.nvmrc`)
- Python 3.x
- Slack Workspace Admin access
- Slack API Token with appropriate scopes (`users:read`, `users.profile:read`)

## 🛠️ Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/company-slackmoji.git
   cd company-slackmoji
   ```

2. Install Node.js dependencies:

   ```bash
   npm install
   ```

3. Set up Python environment:

   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   pip install -r requirements.txt
   ```

4. Configure environment:
   ```bash
   cp .env.example .env
   # Edit .env and add your SLACK_TOKEN
   ```

## 🎯 Usage

Run the following commands in sequence:

1. **Fetch** user data from Slack:

   ```bash
   npm run fetch
   ```

2. **Process** the user data:

   ```bash
   npm run process
   ```

3. **Generate** the emojis:
   ```bash
   npm run generate
   ```

The processed emojis will be available in the `data/output` directory.

## 📁 Project Structure

```
company-slackmoji/
├── src/
│   ├── fetch.js           # Slack API integration
│   ├── process.js         # Data processing logic
│   ├── processAvatars.js  # Image processing
│   └── remove_bg.py       # Background removal
├── data/
│   ├── json/             # User data storage
│   ├── avatars/          # Downloaded avatars
│   └── output/           # Processed emojis
└── config/               # Configuration files
```

## ⚙️ Configuration

### Environment Variables

| Variable      | Description                | Required |
| ------------- | -------------------------- | -------- |
| `SLACK_TOKEN` | Slack Bot User OAuth Token | Yes      |
| `OUTPUT_DIR`  | Custom output directory    | No       |

### Customization

You can adjust image processing parameters in `config/processing.json`:

- Maximum emoji size
- Background removal sensitivity
- Output format preferences

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [rembg](https://github.com/danielgatis/rembg) for background removal
- [sharp](https://sharp.pixelplumbing.com/) for image processing
- The Slack API team for their excellent documentation

## ⚠️ Troubleshooting

Common issues and solutions:

- **Permission Errors**: Ensure your Slack token has the required scopes
- **Image Processing Fails**: Check Python dependencies are correctly installed
- **Rate Limiting**: The tool includes automatic rate limiting, but you may need to adjust delays for large workspaces

For more help, please [open an issue](https://github.com/your-username/company-slackmoji/issues).
