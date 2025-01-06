const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const sharp = require('sharp');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

// Add error logging collection
const errorLogs = {
  recovered: [], // Errors that were recovered through retries
  failed: [], // Errors that failed all retries
  downloadFailed: [], // Image download failures
  otherErrors: [], // Other processing errors
};

async function downloadImage(url) {
  try {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    return Buffer.from(response.data, 'binary');
  } catch (error) {
    errorLogs.downloadFailed.push({ url, error: error.message });
    throw error;
  }
}

async function removeBackground(inputPath, outputPath) {
  const maxRetries = 3;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `Starting background removal for ${path.basename(
          inputPath
        )} (attempt ${attempt}/${maxRetries})...`
      );
      const { stdout, stderr } = await Promise.race([
        execAsync(
          `python3 ${path.join(
            __dirname,
            'remove_bg.py'
          )} "${inputPath}" "${outputPath}"`
        ),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(
                new Error('Background removal timed out after 60 seconds')
              ),
            60000
          )
        ),
      ]);

      // Check if the process completed successfully by looking for success message
      if (stderr && stderr.includes('Process completed successfully')) {
        console.log(
          `Completed background removal for ${path.basename(inputPath)}`
        );
        if (attempt > 1) {
          errorLogs.recovered.push({
            file: path.basename(inputPath),
            attempts: attempt,
            error: lastError?.message,
          });
        }
        return; // Success! Exit the retry loop
      }

      // If we don't see a success message, treat it as an error
      throw new Error(
        stderr || 'Background removal failed without error message'
      );
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt < maxRetries) {
        // Wait a bit before retrying
        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    }
  }

  errorLogs.failed.push({
    file: path.basename(inputPath),
    attempts: maxRetries,
    error: lastError?.message,
  });
  throw new Error(
    `Failed all ${maxRetries} attempts to remove background: ${lastError.message}`
  );
}

async function processAvatar(user) {
  try {
    // Try different image sizes in order from largest to smallest
    const imageSizes = [
      'image_1024',
      'image_512',
      'image_192',
      'image_72',
      'image_48',
      'image_32',
      'image_24',
    ];
    let avatarUrl = null;

    for (const size of imageSizes) {
      if (user.profile[size]) {
        avatarUrl = user.profile[size];
        console.log(`[${user.name}] Using ${size} image: ${avatarUrl}`);
        break;
      }
    }

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

    // Remove any trailing underscores from the user's name and log the change
    const originalName = user.name.toLowerCase();
    const sanitizedName = originalName.replace(/_+$/, '');
    if (originalName !== sanitizedName) {
      console.log(
        `[${user.name}] Note: Sanitized username from "${originalName}" to "${sanitizedName}"`
      );
    }

    const tempInputPath = path.join(tempDir, `${sanitizedName}_input.png`);
    const tempOutputPath = path.join(tempDir, `${sanitizedName}_nobg.png`);
    await fs.writeFile(tempInputPath, imageBuffer);
    console.log(
      `[${user.name}] Image downloaded and saved to temp file: ${tempInputPath}`
    );

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
    const outputPath = path.join(outputDir, `${sanitizedName}.png`);
    await fs.writeFile(outputPath, processedImage);
    console.log(`[${user.name}] Final image saved as: ${outputPath}`);

    // Clean up temp files
    await fs.unlink(tempInputPath);
    await fs.unlink(tempOutputPath);
    console.log(`[${user.name}] Temp files cleaned up`);

    console.log(`Successfully processed avatar for ${user.name}`);
  } catch (error) {
    errorLogs.otherErrors.push({
      user: user.name,
      error: error.message,
    });
    console.error(`Error processing avatar for ${user.name}:`, error.message);
  }
}

async function printErrorSummary() {
  console.log('\n=== Error Summary ===\n');

  if (errorLogs.recovered.length > 0) {
    console.log('🟡 Recovered Errors (succeeded after retries):');
    errorLogs.recovered.forEach(({ file, attempts, error }) => {
      console.log(`  - ${file}: Succeeded after ${attempts} attempts`);
      console.log(`    Initial error: ${error}`);
    });
    console.log();
  }

  if (errorLogs.failed.length > 0) {
    console.log('❌ Failed Background Removals:');
    errorLogs.failed.forEach(({ file, attempts, error }) => {
      console.log(`  - ${file}: Failed after ${attempts} attempts`);
      console.log(`    Error: ${error}`);
    });
    console.log();
  }

  if (errorLogs.downloadFailed.length > 0) {
    console.log('❌ Failed Downloads:');
    errorLogs.downloadFailed.forEach(({ url, error }) => {
      console.log(`  - ${url}`);
      console.log(`    Error: ${error}`);
    });
    console.log();
  }

  if (errorLogs.otherErrors.length > 0) {
    console.log('❌ Other Processing Errors:');
    errorLogs.otherErrors.forEach(({ user, error }) => {
      console.log(`  - ${user}: ${error}`);
    });
    console.log();
  }

  const totalErrors =
    errorLogs.failed.length +
    errorLogs.downloadFailed.length +
    errorLogs.otherErrors.length;
  const recoveredCount = errorLogs.recovered.length;

  console.log('=== Summary Statistics ===');
  console.log(`Total Errors: ${totalErrors + recoveredCount}`);
  console.log(`Successfully Recovered: ${recoveredCount}`);
  console.log(`Failed: ${totalErrors}`);
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
    const batchSize = 2; // Reduced from 5 to 2
    for (let i = 0; i < usersWhoNeedEmojis.length; i += batchSize) {
      const batch = usersWhoNeedEmojis.slice(i, i + batchSize);
      await Promise.all(batch.map((user) => processAvatar(user)));
      console.log(
        `Completed batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(
          usersWhoNeedEmojis.length / batchSize
        )}`
      );
      // Add a small delay between batches to let the system cool down
      if (i + batchSize < usersWhoNeedEmojis.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log('\nAvatar processing complete!');
    await printErrorSummary();
  } catch (error) {
    console.error('Error in main process:', error.message);
    await printErrorSummary();
    process.exit(1);
  }
}

main();
