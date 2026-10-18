import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'notifications.dart';

/// The session token lives in the platform keystore; preferences (language, theme, what the
/// parent has already seen) in ordinary storage.
class AppStorage {
  AppStorage(this._prefs);

  static const _secure = FlutterSecureStorage();
  static const _tokenKey = 'session_token';

  final SharedPreferences _prefs;

  static Future<AppStorage> open() async => AppStorage(await SharedPreferences.getInstance());

  Future<String?> readToken() async {
    try {
      return await _secure.read(key: _tokenKey);
    } catch (_) {
      // A keystore wiped by a restore or OS update: start signed out rather than crash.
      return null;
    }
  }

  Future<void> writeToken(String token) => _secure.write(key: _tokenKey, value: token);
  Future<void> clearToken() => _secure.delete(key: _tokenKey);

  String? get locale => _prefs.getString('locale');
  Future<void> setLocale(String value) => _prefs.setString('locale', value);

  String get themeMode => _prefs.getString('theme') ?? 'system';
  Future<void> setThemeMode(String value) => _prefs.setString('theme', value);

  bool get onboarded => _prefs.getBool('onboarded') ?? false;
  Future<void> setOnboarded() => _prefs.setBool('onboarded', true);

  /// Feed items newer than this count as unread.
  DateTime get feedSeenAt =>
      DateTime.fromMillisecondsSinceEpoch(_prefs.getInt('feed_seen_at') ?? 0);
  Future<void> setFeedSeenAt(DateTime value) => _prefs.setInt('feed_seen_at', value.millisecondsSinceEpoch);

  bool notify(NotifyKind kind) => kind.enabledIn(_prefs);
  Future<void> setNotify(NotifyKind kind, bool value) => _prefs.setBool(kind.key, value);

  /// The home screen's "allow notifications" card was closed.
  bool get notifyPromptDismissed => _prefs.getBool('notify_prompt_dismissed') ?? false;
  Future<void> dismissNotifyPrompt() => _prefs.setBool('notify_prompt_dismissed', true);
}
