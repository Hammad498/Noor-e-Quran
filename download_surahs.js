const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

async function downloadAllSurahs() {
  const versesDir = path.join(__dirname, "assets", "verses");
  
  // Ensure directory exists
  try {
    await fs.mkdir(versesDir, { recursive: true });
  } catch (err) {
    console.log("Directory already exists or error:", err.message);
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 1; i <= 114; i++) {
    try {
      console.log(`Downloading surah ${i}...`);
      const response = await axios.get(`https://equran.id/api/v2/surat/${i}`, {
        timeout: 20000,
      });

      const filePath = path.join(versesDir, `surah-${i}.json`);
      await fs.writeFile(filePath, JSON.stringify(response.data.data, null, 2));
      console.log(`✓ Surah ${i} downloaded successfully`);
      successCount++;

      // Delay between requests to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`✗ Surah ${i} failed:`, error.message);
      failCount++;
      // Longer wait on error
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log(`\n=== Download Complete ===`);
  console.log(`Successfully downloaded: ${successCount}/114`);
  console.log(`Failed: ${failCount}/114`);
}

downloadAllSurahs().catch(console.error);
