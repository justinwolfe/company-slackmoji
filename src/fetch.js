require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const fs = require('fs').promises;
const path = require('path');

// Initialize Slack client
const slack = new WebClient(process.env.SLACK_TOKEN);

async function createDataDirectoryIfNeeded() {
  const dataDir = path.join(__dirname, '..', 'data');
  const jsonDir = path.join(dataDir, 'json');
  try {
    await fs.access(dataDir);
    await fs.access(jsonDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
    await fs.mkdir(jsonDir, { recursive: true });
  }
  return jsonDir;
}

async function fetchAndSaveUsers() {
  console.log('Fetching users...');
  const result = await slack.users.list();
  const activeUsers = result.members.filter((user) => {
    // Filter out deleted users
    if (user.deleted) return false;

    // Filter out bot users
    if (user.is_bot) return false;

    // Filter out ultra restricted users
    if (user.is_ultra_restricted) return false;

    // Use display_name instead of name
    const displayName = user.profile.display_name.toLowerCase();

    // Filter out users with 'bot' in their handle
    if (displayName.includes('bot')) return false;

    // Clean up hyphenated names and underscore names
    let processedName = displayName;

    // Remove any text that includes "back" followed by date info
    processedName = processedName.split(/[\s_]back[\s_].+/)[0];

    // Then handle remaining hyphens and underscores
    if (processedName.includes('-')) {
      processedName = processedName.split('-')[0];
    }
    if (processedName.includes('_')) {
      processedName = processedName.split('_')[0];
    }
    // Replace spaces with underscores
    user.name = processedName.replace(/\s+/g, '_');

    return true;
  });

  const jsonDir = await createDataDirectoryIfNeeded();
  await fs.writeFile(
    path.join(jsonDir, 'users.json'),
    JSON.stringify(activeUsers, null, 2)
  );
  console.log('Users saved to data/json/users.json');
}

async function fetchAndSaveEmojis() {
  console.log('Fetching emojis...');
  const result = await slack.emoji.list();
  const jsonDir = await createDataDirectoryIfNeeded();
  await fs.writeFile(
    path.join(jsonDir, 'emojis.json'),
    JSON.stringify(result.emoji, null, 2)
  );
  console.log('Emojis saved to data/json/emojis.json');
}

async function main() {
  try {
    await fetchAndSaveUsers();
    await fetchAndSaveEmojis();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
