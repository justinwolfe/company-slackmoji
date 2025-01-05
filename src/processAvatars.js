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
    console.log(
      `Starting background removal for ${path.basename(inputPath)}...`
    );
    const { stderr } = await Promise.race([
      execAsync(
        `python3 ${path.join(
          __dirname,
          'remove_bg.py'
        )} "${inputPath}" "${outputPath}"`
      ),
      new Promise((_, reject) =>
        setTimeout(
          () =>
            reject(new Error('Background removal timed out after 60 seconds')),
          60000
        )
      ),
    ]);

    if (stderr) {
      throw new Error(stderr);
    }
    console.log(`Completed background removal for ${path.basename(inputPath)}`);
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

    console.log(`Starting processing for ${user.name}...`);
    console.log(`[${user.name}] Creating temp directory...`);

    // Create temp directory if it doesn't exist
    const tempDir = path.join(__dirname, '../data/temp');
    await fs.mkdir(tempDir, { recursive: true });

    // Download the image
    console.log(`[${user.name}] Downloading image...`);
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
    console.log(`[${user.name}] Image downloaded and saved to temp file`);

    // Remove background using Python script
    console.log(`[${user.name}] Removing background...`);
    await removeBackground(tempInputPath, tempOutputPath);
    console.log(`[${user.name}] Background removed successfully`);

    // Resize the output image
    console.log(`[${user.name}] Resizing image...`);
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
    console.log(`[${user.name}] Final image saved`);

    // Clean up temp files
    await fs.unlink(tempInputPath);
    await fs.unlink(tempOutputPath);
    console.log(`[${user.name}] Temp files cleaned up`);

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

    // Process avatars in parallel with a smaller concurrency limit since we're using CPU
    const batchSize = 3;
    for (let i = 0; i < usersWhoNeedEmojis.length; i += batchSize) {
      const batch = usersWhoNeedEmojis.slice(i, i + batchSize);
      await Promise.all(batch.map((user) => processAvatar(user)));
      console.log(
        `Completed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
          usersWhoNeedEmojis.length / batchSize
        )}`
      );
    }

    console.log('Avatar processing complete!');
  } catch (error) {
    console.error('Error in main process:', error.message);
    process.exit(1);
  }
}

main();
