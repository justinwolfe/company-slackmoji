# Company Slackmoji

A tool to automatically fetch Slack user avatars and convert them into custom emoji format for your Slack workspace. This tool downloads user profile pictures, removes backgrounds, and processes them into a format suitable for Slack emoji.

## Features

- Fetches user data from your Slack workspace
- Downloads user profile pictures
- Removes image backgrounds using Python
- Processes images to meet Slack emoji requirements
- Filters out deleted users and bot accounts

## Prerequisites

- Node.js (check `.nvmrc` for version)
- Python 3.x with required packages
- Slack API Token

## Setup

1. Clone the repository
2. Install Node.js dependencies:
   ```bash
   npm install
   ```
3. Set up Python virtual environment:
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate
   pip install -r requirements.txt
   ```
4. Copy the example environment file and fill in your Slack token:
   ```bash
   cp .env.example .env
   ```
5. Edit `.env` and add your `SLACK_TOKEN`

## Usage

The project includes several commands:

1. Fetch user data:

   ```bash
   npm run fetch
   ```

   This command fetches user data from your Slack workspace and saves it to the `data/json` directory.

2. Process user data:

   ```bash
   npm run process
   ```

   This processes the fetched user data.

3. Generate emoji:
   ```bash
   npm run generate
   ```
   This downloads user avatars, removes backgrounds, and processes them into emoji format.

## Project Structure

- `src/`
  - `fetch.js` - Fetches user data from Slack API
  - `process.js` - Processes user data
  - `processAvatars.js` - Handles avatar download and processing
  - `remove_bg.py` - Python script for background removal
- `data/`
  - `json/` - Stores fetched user data
  - Generated images will be stored here

## Environment Variables

Create a `.env` file with the following variables:

- `SLACK_TOKEN` - Your Slack API token

## Dependencies

### Node.js

- @slack/web-api
- axios
- dotenv
- sharp

### Python

- (See requirements.txt for Python dependencies)

## License

[Add your license information here]
