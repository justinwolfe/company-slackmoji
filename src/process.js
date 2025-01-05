require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');

async function loadData() {
  const usersData = await fs.readFile(
    path.join(__dirname, '..', 'data', 'users.json'),
    'utf8'
  );
  const emojisData = await fs.readFile(
    path.join(__dirname, '..', 'data', 'emojis.json'),
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

    users.forEach((user) => {
      // Check if user's handle exists as an emoji
      if (emojis[user.name]) {
        usersWithEmojisAlready.push(user);
      } else {
        usersWhoNeedEmojis.push(user);
      }
    });

    const processedData = {
      usersWithEmojisAlready,
      usersWhoNeedEmojis,
    };

    await fs.writeFile(
      path.join(__dirname, '..', 'data', 'processed.json'),
      JSON.stringify(processedData, null, 2)
    );

    console.log('Processing complete! Results saved to data/processed.json');
    console.log(`Users with emojis: ${usersWithEmojisAlready.length}`);
    console.log(`Users needing emojis: ${usersWhoNeedEmojis.length}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

processUsers();
