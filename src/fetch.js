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
  let allUsers = [];
  let cursor;

  do {
    const result = await slack.users.list({
      limit: 1000,
      cursor: cursor,
    });

    allUsers = allUsers.concat(result.members);
    cursor = result.response_metadata?.next_cursor;

    console.log(`Fetched ${result.members.length} users...`);
  } while (cursor);

  console.log(`\nTotal users fetched: ${allUsers.length}`);
  const jsonDir = await createDataDirectoryIfNeeded();

  // Debug information
  const felipeUser = allUsers.find((user) => user.id === 'U0774TPBS3V');
  console.log('Is Felipe in the complete list?', felipeUser ? 'Yes' : 'No');
  if (felipeUser) {
    console.log("Felipe's data:", JSON.stringify(felipeUser, null, 2));
  }

  // Save raw unfiltered users
  await fs.writeFile(
    path.join(jsonDir, 'users_raw.json'),
    JSON.stringify(allUsers, null, 2)
  );
  console.log('Raw users saved to data/json/users_raw.json');

  // Log all users before filtering
  console.log('\nAll users before filtering:');
  allUsers.forEach((user) => {
    console.log(
      `Name: ${user.name}, Display Name: ${user.profile.display_name}, Is Deleted: ${user.deleted}, Is Bot: ${user.is_bot}, Is Ultra Restricted: ${user.is_ultra_restricted}`
    );
  });

  const activeUsers = allUsers.filter((user) => {
    // Filter out deleted users
    if (user.deleted) return false;

    // Filter out bot users
    if (user.is_bot) return false;

    // Filter out ultra restricted users
    if (user.is_ultra_restricted) return false;

    // Use display_name if available, otherwise fall back to name
    const displayName = user.profile.display_name || user.name;
    const nameToUse = displayName.toLowerCase();

    // Filter out users with 'bot' in their handle
    if (nameToUse.includes('bot')) return false;

    // Clean up hyphenated names and underscore names
    let processedName = nameToUse;

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
