# Company Slackmoji

A simple script to fetch and store Slack users and custom emojis.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file:

```bash
cp .env.example .env
```

3. Get a Slack token:
   - Go to https://api.slack.com/apps
   - Create a new app (or use an existing one)
   - Add the following OAuth scopes:
     - `emoji:read`
     - `users:read`
   - Install the app to your workspace
   - Copy the "Bot User OAuth Token" and paste it in your `.env` file

## Usage

Run the script:

```bash
npm start
```

The script will create a `data` directory and save two files:

- `data/users.json`: List of all users in your Slack workspace
- `data/emojis.json`: List of all custom emojis in your workspace
