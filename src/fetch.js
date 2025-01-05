require('dotenv').config();
const { WebClient } = require('@slack/web-api');
const fs = require('fs').promises;
const path = require('path');

// Initialize Slack client
const slack = new WebClient(process.env.SLACK_TOKEN);

async function createDataDirectoryIfNeeded() {
  const dataDir = path.join(__dirname, '..', 'data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir);
  }
  return dataDir;
}

async function fetchAndSaveUsers() {
  console.log('Fetching users...');
  const result = await slack.users.list();
  const activeUsers = result.members.filter((user) => {
    // Filter out deleted users
    if (user.deleted) return false;

    // Filter out bot users
    if (user.is_bot) return false;

    // Filter out users with 'bot' in their handle
    if (user.name.toLowerCase().includes('bot')) return false;

    // Clean up hyphenated names
    if (user.name.includes('-')) {
      user.name = user.name.split('-')[0];
    }

    return true;
  });

  const dataDir = await createDataDirectoryIfNeeded();
  await fs.writeFile(
    path.join(dataDir, 'users.json'),
    JSON.stringify(activeUsers, null, 2)
  );
  console.log('Users saved to data/users.json');
}

async function fetchAndSaveEmojis() {
  console.log('Fetching emojis...');
  const result = await slack.emoji.list();
  const dataDir = await createDataDirectoryIfNeeded();
  await fs.writeFile(
    path.join(dataDir, 'emojis.json'),
    JSON.stringify(result.emoji, null, 2)
  );
  console.log('Emojis saved to data/emojis.json');
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
