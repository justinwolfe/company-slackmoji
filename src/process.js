require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

// Add sanitization function to be consistent with processAvatars.js
function sanitizeUsername(username) {
  return username
    .toLowerCase()
    .replace(/[\(\)\/\\]/g, '') // Remove parentheses and slashes
    .replace(/_+$/, '') // Remove trailing underscores
    .trim();
}

async function loadData() {
  const usersData = await fs.readFile(
    path.join(__dirname, '..', 'data', 'json', 'users.json'),
    'utf8'
  );
  const emojisData = await fs.readFile(
    path.join(__dirname, '..', 'data', 'json', 'emojis.json'),
    'utf8'
  );

  return {
    users: JSON.parse(usersData),
    emojis: JSON.parse(emojisData),
  };
}

async function processUsers() {
  try {
    const { users, emojis } = await loadData();

    const usersWithEmojisAlready = [];
    const usersWhoNeedEmojis = [];
    const skippedUsers = []; // Track users we're skipping

    users.forEach((user) => {
      const sanitizedName = sanitizeUsername(user.name);

      // Log the original and sanitized names if they differ
      if (user.name !== sanitizedName) {
        console.log(
          `Note: Sanitized username "${user.name}" to "${sanitizedName}"`
        );
      }

      // Check if user's sanitized handle exists as an emoji
      if (emojis[sanitizedName]) {
        usersWithEmojisAlready.push(user);
      } else {
        usersWhoNeedEmojis.push(user);
      }
    });

    const processedData = {
      usersWithEmojisAlready,
      usersWhoNeedEmojis,
      skippedUsers,
    };

    await fs.writeFile(
      path.join(__dirname, '..', 'data', 'json', 'processed.json'),
      JSON.stringify(processedData, null, 2)
    );

    console.log(
      '\nProcessing complete! Results saved to data/json/processed.json'
    );
    console.log(`Users with emojis: ${usersWithEmojisAlready.length}`);
    console.log(`Users needing emojis: ${usersWhoNeedEmojis.length}`);
    if (skippedUsers.length > 0) {
      console.log(`Skipped users: ${skippedUsers.length}`);
    }
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

processUsers();
