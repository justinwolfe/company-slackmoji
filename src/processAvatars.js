const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function downloadImage(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary');
}

async function removeBackground(inputPath, outputPath) {
  try {
    const { stderr } = await execAsync(
      `python3 ${path.join(
        __dirname,
        'remove_bg.py'
      )} "${inputPath}" "${outputPath}"`
    );
    if (stderr) {
      throw new Error(stderr);
    }
  } catch (error) {
    throw new Error(`Failed to remove background: ${error.message}`);
  }
}

async function processAvatar(user) {
  try {
    // Get the highest resolution avatar URL (512px)
    const avatarUrl = user.profile.image_512;
    if (!avatarUrl) {
      console.log(`No avatar found for user ${user.name}`);
      return;
    }

    console.log(`Processing avatar for ${user.name}...`);

    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../data/temp');
    await fs.mkdir(tempDir, { recursive: true });

    // Download the image
    const imageBuffer = await downloadImage(avatarUrl);
    const tempInputPath = path.join(
      tempDir,
      `${user.name.toLowerCase()}_input.png`
    );
    const tempOutputPath = path.join(
      tempDir,
      `${user.name.toLowerCase()}_nobg.png`
    );
    await fs.writeFile(tempInputPath, imageBuffer);

    // Remove background using Python script
    await removeBackground(tempInputPath, tempOutputPath);

    // Resize the output image
    const processedImage = await sharp(tempOutputPath)
      .resize(128, 128, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      })
      .png()
      .toBuffer();

    // Ensure the output directory exists
    const outputDir = path.join(__dirname, '../data/images');
    await fs.mkdir(outputDir, { recursive: true });

    // Save the final processed image
    const outputPath = path.join(outputDir, `${user.name.toLowerCase()}.png`);
    await fs.writeFile(outputPath, processedImage);

    // Clean up temp files
    await fs.unlink(tempInputPath);
    await fs.unlink(tempOutputPath);

    console.log(`Successfully processed avatar for ${user.name}`);
  } catch (error) {
    console.error(`Error processing avatar for ${user.name}:`, error.message);
  }
}

async function main() {
  try {
    // Read the processed data file
    const processedData = JSON.parse(
      await fs.readFile(
        path.join(__dirname, '../data/json/processed.json'),
        'utf8'
      )
    );

    const { usersWhoNeedEmojis } = processedData;

    if (!usersWhoNeedEmojis || !Array.isArray(usersWhoNeedEmojis)) {
      throw new Error('No users found to process');
    }

    console.log(`Found ${usersWhoNeedEmojis.length} users to process`);

    // Process each user's avatar
    for (const user of usersWhoNeedEmojis) {
      await processAvatar(user);
    }

    console.log('Avatar processing complete!');
  } catch (error) {
    console.error('Error in main process:', error.message);
    process.exit(1);
  }
}

main();
