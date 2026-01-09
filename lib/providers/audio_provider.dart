import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:just_audio/just_audio.dart';
import 'package:quran/models/player_state_model.dart';
import 'package:quran/models/quran_audio_model.dart';
import 'package:quran/providers/surah_provider.dart';
import 'package:quran/services/audio/audio_service.dart';

class PlayerStateNotifier extends StateNotifier<PlayerStateModel> {
  final AudioPlayer _player;
  bool _isAutoPlayingNext = false; // Flag to prevent race conditions

  PlayerStateNotifier(this._player)
    : super(
        PlayerStateModel(
          isPlaying: false,
          isShowPlayer: false,
          sources: [],
          currentNumber: 0,
          totalNumber: 0,
          percentage: 0.0,
        ),
      ) {
    _player.durationStream.listen((event) {
      state = state.copyWith(duration: event);
    });

    _player.positionStream.listen((event) {
      if (state.duration == null) return;

      final current = event.inMilliseconds.toDouble();
      final total = state.duration!.inMilliseconds.toDouble();
      final percent = (total == 0) ? 0.0 : current / total;

      state = state.copyWith(
        position: event,
        percentage: percent.clamp(0.0, 1.0),
      );
    });

    // Handle playback errors (e.g., CORS/network on web)
    _player.playbackEventStream.listen(
      (event) {},
      onError: (e, s) {
        state = state.copyWith(isLoading: false, isPlaying: false);
      },
    );

    _player.playerStateStream.listen((event) async {
      switch (event.processingState) {
        case ProcessingState.ready:
          state = state.copyWith(isPlaying: event.playing, isLoading: false);
          break;

        case ProcessingState.completed:
          // Prevent race condition with manual clicks
          if (_isAutoPlayingNext) {
            break;
          }

          _isAutoPlayingNext = true;

          try {
            // Capture current state values before modifying
            final currentVerse = state.currentNumber;
            final nextVerse = currentVerse + 1;
            final totalVerses = state.totalNumber;
            final sources = state.sources;

            // Check if there's a next verse
            if (nextVerse <= totalVerses) {
              // Calculate 0-based index for next verse
              final nextIndex = nextVerse - 1;

              // Verify index is valid
              if (nextIndex >= 0 && nextIndex < sources.length) {
                // Update state to next verse
                state = state.copyWith(
                  currentNumber: nextVerse,
                  isLoading: true,
                  isPlaying: false,
                );

                // Load and play next verse
                await _player.stop();
                await _player.setUrl(sources[nextIndex]);
                await Future.delayed(
                  const Duration(milliseconds: 100),
                ); // Brief delay to ensure URL is set
                await _player.play();
              } else {
                // Index out of bounds - stop
                await _player.stop();
                state = state.copyWith(isPlaying: false, isLoading: false);
              }
            } else {
              // End of surah - stop playback
              await _player.stop();
              state = state.copyWith(isPlaying: false, isLoading: false);
            }
          } catch (e) {
            // Error occurred - stop and reset
            await _player.stop();
            state = state.copyWith(isLoading: false, isPlaying: false);
          } finally {
            _isAutoPlayingNext = false;
          }
          break;

        case ProcessingState.loading:
          state = state.copyWith(isLoading: true);
          break;

        default:
          break;
      }
    });
  }

  Future<void> loaded({
    required List<String> audios,
    required QuranAudioModel audio,
  }) async {
    if (audios.isEmpty) {
      state = state.copyWith(isLoading: false);
      return;
    }

    final index = audio.currentNumber - 1;
    if (index < 0 || index >= audios.length) {
      state = state.copyWith(isLoading: false);
      return;
    }

    // Reset the auto-play flag when loading new audio
    _isAutoPlayingNext = false;

    // Reset player and state
    await _player.stop();

    state = state.copyWith(
      isShowPlayer: true,
      data: audio,
      sources: audios,
      currentNumber: audio.currentNumber,
      totalNumber: audios.length,
      isLoading: true,
      isPlaying: false,
      position: Duration.zero,
      percentage: 0.0,
    );

    try {
      await _player.setUrl(audios[index]);
      state = state.copyWith(isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, isPlaying: false);
    }
  }

  /// ▶️ PLAY
  Future<void> play() async {
    if (_player.processingState == ProcessingState.idle) {
      await _player.seek(Duration.zero);
    }
    await _player.play();
  }

  /// ⏸ PAUSE
  Future<void> pause() async => _player.pause();

  /// ❌ DESTROY
  Future<void> destroy() async {
    await _player.stop();
    state = state.copyWith(
      isShowPlayer: false,
      sources: [],
      currentNumber: 0,
      totalNumber: 0,
      percentage: 0.0,
    );
  }
}

final playerStateProvider =
    StateNotifierProvider<PlayerStateNotifier, PlayerStateModel>((ref) {
      return PlayerStateNotifier(ref.read(audioServiceProvider));
    });

final playAudioProvider = FutureProvider.family
    .autoDispose<void, QuranAudioModel>((ref, audio) async {
      final verse = await ref.watch(versesProvider(audio.id).future);
      final audios = verse.map((e) => e.audio).toList();

      final notifier = ref.read(playerStateProvider.notifier);
      await notifier.loaded(audios: audios, audio: audio);
      await notifier.play();
    });
