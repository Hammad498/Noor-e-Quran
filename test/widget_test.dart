// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:quran/services/storage/hive_storage.dart';
import 'package:quran/main.dart';

class TestHiveStorage extends HiveStorage {
  final Map<String, dynamic> _map = {};

  @override
  Future<void> init() async {}

  @override
  Future<void> put(String key, dynamic value) async {
    _map[key] = value;
  }

  @override
  Future<dynamic> get(String key) async {
    return _map[key];
  }

  @override
  Future<void> delete(String key) async {
    _map.remove(key);
  }

  @override
  Future<void> clear() async {
    _map.clear();
  }
}

void main() {
  testWidgets('App smoke test', (WidgetTester tester) async {
    final hiveStorage = TestHiveStorage();
    await hiveStorage.init();

    // Build our app and trigger a frame.
    await tester.pumpWidget(
      ProviderScope(
        overrides: [hiveStorageProvider.overrideWithValue(hiveStorage)],
        child: const AppMain(),
      ),
    );

    // Verify that the app loads without errors
    await tester.pumpAndSettle();
    expect(find.byType(AppMain), findsOneWidget);
  });
}
