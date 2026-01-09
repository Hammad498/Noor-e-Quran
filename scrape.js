const axios = require("axios");

// --- Helpers for Quran.com API (QDC) ---
async function getEnglishTranslationId(preferredName = /Saheeh International/i) {
  const { data } = await axios.get(
    "https://api.quran.com/api/v4/resources/translations",
    { params: { language: "en" } }
  );
  const list = data?.translations || [];
  // Try preferred first, else first available English translation
  const preferred = list.find((t) => preferredName.test(t.name));
  return (preferred || list[0])?.id;
}

async function fetchChapterTranslations(chapter, translationId) {
  // Per page large enough for any surah
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
  // Build map: verse_number -> english text
  const map = new Map();
  for (const v of verses) {
    const num = v.verse_number; // 1-based within the chapter
    const eng = (v.translations && v.translations[0]?.text) || "";
    map.set(num, eng);
  }
  return map;
}

async function verses() {
  const batchSize = 20;
  for (let i = 1; i <= 114; i++) {
    try {
      const res = await axios.get(`https://equran.id/api/v2/surat/${i}`, {
        timeout: 15000
      });
      await Bun.write(
        `./assets/verses/surah-${i}.json`,
        JSON.stringify(res.data.data)
      );
      await new Promise((ress) => setTimeout(() => ress(), 800));
      console.log(`STATUS: surah ${i} scraped`);
      
      // Take longer break after each batch
      if (i % batchSize === 0) {
        console.log(`Batch complete at surah ${i}, waiting...`);
        await new Promise((ress) => setTimeout(() => ress(), 3000));
      }
    } catch (error) {
      console.log(`STATUS: surah ${i} failed to scrape`, error.message);
      // Retry once on failure
      try {
        await new Promise((ress) => setTimeout(() => ress(), 3000));
        const res = await axios.get(`https://equran.id/api/v2/surat/${i}`, {
          timeout: 15000
        });
        await Bun.write(
          `./assets/verses/surah-${i}.json`,
          JSON.stringify(res.data.data)
        );
        console.log(`STATUS: surah ${i} scraped (retry)`);
      } catch (retryError) {
        console.log(`STATUS: surah ${i} retry failed`, retryError.message);
      }
    }
  }
  console.log("All Surahs processed!");
}
// Simple CLI switch:
//  - default: scrape Indonesian (equran.id) base files
//  - with arg "en": enrich with English translations from Quran.com
const mode = (process.argv[2] || "").toLowerCase();
if (mode === "en") {
  enrichEnglishTranslations();
} else {
  verses();
}

// Enrich existing ./assets/verses/surah-<id>.json with EN translations
async function enrichEnglishTranslations() {
  const translationId = await getEnglishTranslationId();
  if (!translationId) {
    console.log("No English translation found from Quran.com API.");
    return;
  }
  console.log("Using translationId:", translationId);

  for (let i = 1; i <= 114; i++) {
    try {
      const map = await fetchChapterTranslations(i, translationId);
      const file = Bun.file(`./assets/verses/surah-${i}.json`);
      if (!(await file.exists())) {
        console.log(`Skip: assets/verses/surah-${i}.json does not exist`);
        continue;
      }

      const json = JSON.parse(await file.text());
      if (Array.isArray(json.ayat)) {
        for (const ay of json.ayat) {
          const en = map.get(ay.nomorAyat);
          if (en) ay.teksIndonesia = en; // keep existing key, insert English
        }
      }

      await Bun.write(`./assets/verses/surah-${i}.json`, JSON.stringify(json));
      console.log(`STATUS: surah ${i} enriched with EN translations`);
      await new Promise((r) => setTimeout(r, 200));
    } catch (error) {
      console.log(
        `STATUS: surah ${i} failed to enrich translations`,
        error.message
      );
    }
  }
}

// To chain both in one run, you can call: node scrape.js && node scrape.js en

// async function interpretation() {
//     for (let i = 47; i <= 114; i++) {
//       try {
//         const res = await axios.get(`https://equran.id/api/v2/tafsir/${i}`);
//         await Bun.write(
//           `./assets/data/interpretations/tafsir-${i}.json`,
//           JSON.stringify(res.data.data)
//         );
//         await new Promise((ress) => setTimeout(() => ress(), 500));
//         console.log(`STATUS: tafsir ${i} scraped`);
//       } catch (error) {
//         console.log(`STATUS: tafsir ${i} failed to scrape`, error.message);
//       }
//     }
// }
 
// interpretation();


//C:\Users\Hamad\.bun\bin\bun.exe scrape.js
