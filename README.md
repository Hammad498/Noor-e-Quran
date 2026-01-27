# Noor-e-Quran 📖✨

A beautiful, feature-rich Quran application built with Flutter. Read, listen, bookmark, and explore the Holy Quran with English translations and audio recitations.

## 📱 Features

- **Complete Quran**: All 114 Surahs with Arabic text
- **English Translations**: Sahih International translation for all verses
- **Audio Recitation**: High-quality audio playback with auto-play functionality
- **Bookmarks**: Save and manage your favorite verses
- **Last Read**: Quick access to your last read position
- **Search**: Search through all Surahs
- **Share**: Share verses with others
- **Responsive UI**: Works on mobile, tablet, and web
- **Offline Support**: Assets cached locally for offline reading

---////

## 🏗️ Architecture & Folder Structure

This project follows a **modular, feature-based architecture** with clean separation of concerns using **Riverpod** for state management.

```
lib/
├── main.dart                  # App entry point
├── screen.dart               # Main screen routing
│
├── models/                   # Data Models (Entities)
│   ├── bookmark_model.dart
│   ├── last_read_model.dart
│   ├── player_state_model.dart
│   ├── quran_audio_model.dart
│   ├── surah_detail_model.dart
│   ├── surah_model.dart
│   └── verse_model.dart
│
├── providers/                # State Management (Riverpod Providers)
│   ├── audio_provider.dart
│   ├── bookmark_provider.dart
│   ├── last_read_provider.dart
│   ├── search_provider.dart
│   ├── startup_provider.dart
│   └── surah_provider.dart
│
├── modules/                  # UI Features (Screens & Components)
│   ├── home/
│   ├── startup/
│   ├── surah-detail/
│   └── bookmark/
│
├── repositories/            # Data Access Layer
│   └── surah_repository.dart
│
├── services/               # Core Services
│   ├── audio/
│   └── storage/
│
├── shared/                # Shared/Reusable Components
│   ├── audio_player_box.dart
│   ├── shell_route_layout.dart
│   └── single_scrolling_layout.dart
│
├── utils/                # Utilities & Helpers
│
└── extension/           # Dart Extensions
    └── cache_for.dart
```

---

## 📐 Architecture Explained

### **1. Models (`/models`)**
**Purpose**: Define the data structure and business entities.

- **`surah_model.dart`**: Represents a Surah (chapter) with number, name, revelation type, etc.
- **`verse_model.dart`**: Represents a verse (ayah) with Arabic text, translation, audio URL
- **`bookmark_model.dart`**: Stores bookmarked verses with metadata
- **`last_read_model.dart`**: Tracks user's last read position
- **`player_state_model.dart`**: Audio player state (playing, paused, loading, progress)
- **`quran_audio_model.dart`**: Audio metadata for verse playback

**Connection**: Models are used by Providers to manage state and by Repositories to transform API/database data.

---

### **2. Providers (`/providers`)**
**Purpose**: Manage application state using Riverpod. Acts as the glue between UI and data layer.

#### **Provider Types:**

**State Notifiers** (manage mutable state):
- **`audio_provider.dart`**: Manages audio playback (play, pause, next, progress tracking)
- **`bookmark_provider.dart`**: Handles bookmark CRUD operations
- **`last_read_provider.dart`**: Tracks and updates last read position

**Async Providers** (fetch data):
- **`surah_provider.dart`**: Provides Surah list and verse data
- **`search_provider.dart`**: Handles search queries across Surahs
- **`startup_provider.dart`**: Initializes app (loads data, checks storage)

**Connection Flow**:
```
UI (Consumer Widget) 
  ↓ reads/watches
Provider (StateNotifier/FutureProvider)
  ↓ uses
Repository/Service
  ↓ returns
Model (Data)
  ↓ updates
Provider State
  ↓ rebuilds
UI
```

---

### **3. Modules (`/modules`)**
**Purpose**: Feature-based UI organization. Each module is a complete feature with its own screens and components.

#### **Module Structure:**
```
modules/
├── home/
│   ├── components/       # Reusable widgets for home
│   │   ├── last_read_box.dart
│   │   ├── search_box.dart
│   │   └── surah_tab.dart
│   └── home_page.dart    # Main home screen
│
├── surah-detail/
│   ├── components/
│   │   ├── tab_view_container.dart
│   │   ├── verse_lists.dart
│   │   └── surah_header.dart
│   └── surah_detail_page.dart
│
├── bookmark/
│   └── bookmark_page.dart
│
└── startup/
    └── startup_page.dart  # Splash/loading screen
```

**Connection**: Modules consume Providers using `ref.watch()` and `ref.read()` to get data and trigger actions.

---

### **4. Repositories (`/repositories`)**
**Purpose**: Abstract data access. Handles fetching data from assets, APIs, or local storage.

- **`surah_repository.dart`**: 
  - Loads Surah list from `assets/data/surah.json`
  - Loads verse data from `assets/verses/surah-{id}.json`
  - Parses JSON and returns Models

**Connection**: Providers call Repository methods to get data, Repository returns Models.

---

### **5. Services (`/services`)**
**Purpose**: Core functionality that doesn't fit in Providers or Repositories.

#### **Services:**

**Audio Service** (`/services/audio/`):
- Wraps `just_audio` package
- Provides AudioPlayer instance
- Handles audio initialization and disposal

**Storage Service** (`/services/storage/`):
- Manages local data persistence using Hive
- Stores bookmarks, last read, user preferences
- Provides database access

**Connection**: Services are injected into Providers as dependencies.

---

### **6. Shared (`/shared`)**
**Purpose**: Reusable UI components used across multiple modules.

- **`audio_player_box.dart`**: Bottom audio player widget (shown globally)
- **`shell_route_layout.dart`**: App shell/scaffold wrapper for routing
- **`single_scrolling_layout.dart`**: Custom scroll behavior wrapper

**Connection**: Used by multiple screens/modules for consistent UI.

---

### **7. Utils (`/utils`)**
**Purpose**: Helper functions, constants, and utilities.

- Theme constants
- Date formatters
- String helpers
- Constants (colors, sizes, API endpoints)

---

### **8. Extension (`/extension`)**
**Purpose**: Dart extensions to add functionality to existing classes.

- **`cache_for.dart`**: Extension methods for caching/memoization

---

## 🔄 Data Flow Example

### **Playing Audio:**

```
1. User taps play button on verse
   ↓
2. UI calls: ref.read(playAudioProvider(QuranAudioModel(...)))
   ↓
3. playAudioProvider (FutureProvider):
   - Fetches all verses from surah_provider
   - Extracts audio URLs
   - Calls playerStateProvider.notifier.loaded()
   ↓
4. PlayerStateNotifier (in audio_provider.dart):
   - Updates state.sources with audio list
   - Calls _player.setUrl() (AudioPlayer service)
   - Updates state.isLoading, state.currentNumber
   ↓
5. State changes trigger UI rebuild
   ↓
6. audio_player_box.dart (shared widget) shows player
   ↓
7. When verse completes:
   - ProcessingState.completed event fires
   - PlayerStateNotifier auto-plays next verse
   - UI updates to show new verse number
```

---

## 🎨 UI Components Breakdown

### **Home Screen** (`modules/home/`)

**Components:**
1. **Search Box** (`search_box.dart`):
   - Search input field
   - Triggers `search_provider` on input
   - Shows search results dynamically

2. **Last Read Box** (`last_read_box.dart`):
   - Displays last read Surah and verse
   - Quick navigation to continue reading
   - Uses `last_read_provider`

3. **Surah Tab** (`surah_tab.dart`):
   - List of all 114 Surahs
   - Shows Surah name (Arabic & English)
   - Revelation type, verse count
   - Navigate to detail on tap

**State Management:**
- Watches `surahListProvider` for Surah list
- Watches `lastReadProvider` for last position
- Watches `searchProvider` when searching

---

### **Surah Detail Screen** (`modules/surah-detail/`)

**Components:**
1. **Surah Header** (`surah_header.dart`):
   - Surah name, revelation type
   - Total verses, Bismillah
   - Back button

2. **Tab View Container** (`tab_view_container.dart`):
   - Tabs: Verses, Info
   - Switch between verse list and Surah info

3. **Verse Lists** (`verse_lists.dart`):
   - Displays all verses in Surah
   - Arabic text, English translation
   - Play, Bookmark, Share buttons
   - Verse number badge

**State Management:**
- Watches `versesProvider(surahId)` for verse list
- Reads `playAudioProvider` to play audio
- Reads `bookmarkProvider` to add/remove bookmarks
- Reads `lastReadProvider` to save last read

---

### **Audio Player** (`shared/audio_player_box.dart`)

**Features:**
- Shows currently playing verse
- Play/Pause button
- Progress bar with seek
- Next/Previous buttons
- Verse number indicator
- Dismiss button

**State Management:**
- Watches `playerStateProvider` for player state
- Calls `playerStateProvider.notifier.play/pause/destroy`

---

### **Bookmark Screen** (`modules/bookmark/`)

**Features:**
- Lists all bookmarked verses
- Shows Surah name, verse number, snippet
- Remove bookmark
- Navigate to verse on tap

**State Management:**
- Watches `bookmarkProvider` for bookmark list
- Calls `bookmarkProvider.notifier.removeBookmark()`

---

## 🗄️ Data Storage

### **Hive Database**
Used for local persistence:

**Boxes:**
1. **Bookmarks Box**: Stores `BookmarkModel` objects
2. **Last Read Box**: Stores `LastReadModel` object
3. **Settings Box**: User preferences (future)

**Location**: 
- Mobile: App documents directory
- Web: IndexedDB

---

## 📦 Assets Structure

```
assets/
├── data/
│   ├── surah.json              # List of all 114 Surahs
│   ├── interpretations/        # Tafsir (commentary)
│   └── surah-details/          # Additional Surah info
│
├── verses/
│   ├── surah-1.json           # Al-Fatihah verses
│   ├── surah-2.json           # Al-Baqarah verses
│   ├── ...
│   └── surah-114.json         # An-Nas verses
│
├── fonts/                     # Custom fonts
├── icons/                     # App icons
└── images/                    # Images/illustrations
```

### **Verse JSON Structure:**
```json
{
  "nomor": 1,
  "nama": "Al-Fatihah",
  "ayat": [
    {
      "nomorAyat": 1,
      "teksArab": "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
      "teksLatin": "Bismillāhir-raḥmānir-raḥīm",
      "teksInggris": "In the name of Allah, the Entirely Merciful...",
      "audio": {
        "05": "https://cdn.equran.id/audio-partial/..."
      }
    }
  ]
}
```

---

## 🚀 Getting Started

### **Prerequisites**
- Flutter SDK >= 3.9.2
- Dart SDK >= 3.9.2
- Node.js (for scraping scripts)
- Bun or npm (for running scripts)

### **Installation**

1. **Clone the repository**
```bash
git clone <repository-url>
cd noor_e_quran
```

2. **Install dependencies**
```bash
flutter pub get
```

3. **Generate missing Surah files** (if needed)
```bash
node download_surahs.js
```

4. **Add English translations**
```bash
node enrich_english.js
```

5. **Run the app**
```bash
flutter run -d chrome  # For web
flutter run            # For mobile (connected device)
```

---

## 🛠️ Build & Deploy

### **Development**
```bash
flutter run -d chrome --web-port=8080
```

### **Production Build**

**Web:**
```bash
flutter build web --release
```

**Android:**
```bash
flutter build apk --release
flutter build appbundle --release
```

**iOS:**
```bash
flutter build ios --release
```

**Windows:**
```bash
flutter build windows --release
```

---

## 📜 Scripts

### **download_surahs.js**
Downloads all 114 Surah JSON files from equran.id API.

```bash
node download_surahs.js
```

### **enrich_english.js**
Adds English translations from Quran.com API to existing Surah files.

```bash
node enrich_english.js
```

### **scrape.js**
Legacy script with both download and enrich functionality.

```bash
bun scrape.js       # Download verses
bun scrape.js en    # Add English translations
```

---

## 🔧 Configuration

### **pubspec.yaml**
Key dependencies:
- `flutter_riverpod`: State management
- `go_router`: Navigation/routing
- `just_audio`: Audio playback
- `hive`: Local database
- `google_fonts`: Typography
- `flutter_svg`: SVG rendering
- `share_plus`: Share functionality

### **Theme**
Theme colors defined in `utils/` (to be created):
```dart
class ThemeColor {
  static const primary = Color(0xFF...);
  static const background = Color(0xFF...);
  // ...
}
```

---

## 🧪 Testing

```bash
flutter test
```

---

## 📝 Key Packages Used

| Package | Purpose |
|---------|---------|
| `flutter_riverpod` | State management, dependency injection |
| `go_router` | Declarative routing |
| `just_audio` | Audio playback with streaming support |
| `hive` | Fast, lightweight local database |
| `google_fonts` | Beautiful typography |
| `share_plus` | Share content across platforms |
| `visibility_detector` | Detect widget visibility |
| `flutter_native_splash` | Custom splash screen |

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License.

---

## 🙏 Acknowledgments

- Quran data from [equran.id](https://equran.id)
- English translations from [Quran.com](https://quran.com)
- Audio recitations from various Qaris

---

## 📧 Contact

For questions or support, please open an issue on GitHub.

---

**Made with ❤️ using Flutter**
