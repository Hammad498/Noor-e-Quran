const axios = require("axios");
const fs = require("fs").promises;
const path = require("path");

async function getEnglishTranslationId(preferredName = /Saheeh International/i) {
  const { data } = await axios.get(
    "https://api.quran.com/api/v4/resources/translations",
    { params: { language: "en" } }
  );
  const list = data?.translations || [];
  const preferred = list.find((t) => preferredName.test(t.name));
  return (preferred || list[0])?.id;
}

async function fetchChapterTranslations(chapter, translationId) {
  const { data } = await axios.get(
    `https://api.quran.com/api/v4/verses/by_chapter/${chapter}`,
    {
      params: {
        language: "en",
        translations: translationId,
        per_page: 300,
      },
    }
  );
  const verses = data?.verses || [];
  const map = new Map();
  for (const v of verses) {
    const num = v.verse_number;
    const eng = (v.translations && v.translations[0]?.text) || "";
    map.set(num, eng);
  }
  return map;
}

async function enrichEnglishTranslations() {
  const translationId = await getEnglishTranslationId();
  if (!translationId) {
    console.log("No English translation found from Quran.com API.");
    return;
  }
  console.log("Using translationId:", translationId);

  const versesDir = path.join(__dirname, "assets", "verses");
  let successCount = 0;
  let failCount = 0;

  for (let i = 1; i <= 114; i++) {
    try {
      console.log(`Enriching surah ${i}...`);
      const map = await fetchChapterTranslations(i, translationId);
      const filePath = path.join(versesDir, `surah-${i}.json`);
      const file = await fs.readFile(filePath, "utf-8");
      const json = JSON.parse(file);

      if (Array.isArray(json.ayat)) {
        for (const ay of json.ayat) {
          const en = map.get(ay.nomorAyat);
          if (en) ay.teksInggris = en;
        }
      }

      await fs.writeFile(filePath, JSON.stringify(json, null, 2));
      console.log(`✓ Surah ${i} enriched with English translations`);
      successCount++;
      await new Promise((r) => setTimeout(r, 500));
    } catch (error) {
      console.error(
        `✗ Surah ${i} failed to enrich`,
        error.message
      );
      failCount++;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  console.log(`\n=== Enrichment Complete ===`);
  console.log(`Successfully enriched: ${successCount}/114`);
  console.log(`Failed: ${failCount}/114`);
}

enrichEnglishTranslations().catch(console.error);
