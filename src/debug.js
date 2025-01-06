require('dotenv').config();
const { WebClient } = require('@slack/web-api');

// Initialize Slack client
const slack = new WebClient(process.env.SLACK_TOKEN);

async function fetchUserById(userId) {
  try {
    console.log(`Fetching user info for ID: ${userId}`);
    const result = await slack.users.info({ user: userId });
    console.log('\nUser details:');
    console.log(JSON.stringify(result.user, null, 2));
  } catch (error) {
    console.error('Error fetching user:', error.message);
    process.exit(1);
  }
}

async function checkUsersList() {
  try {
    console.log('\nChecking users.list API...');
    const result = await slack.users.list({
      limit: 1000, // Get maximum number of users per request
    });
    console.log(`Total users returned: ${result.members.length}`);
    console.log(
      'Response metadata:',
      JSON.stringify(result.response_metadata, null, 2)
    );

    const felipeUser = result.members.find((user) => user.id === 'U0774TPBS3V');
    console.log('Is Felipe in the list?', felipeUser ? 'Yes' : 'No');
  } catch (error) {
    console.error('Error checking users list:', error.message);
  }
}

// Run both checks
async function main() {
  await fetchUserById('U0774TPBS3V');
  await checkUsersList();
}

main();
