/// Where the app finds the Bilim Merkezi server.
///
/// Set at build time: `flutter run --dart-define=API_URL=https://bilim-merkezi.tm`.
/// The default reaches a dev server on the computer from the Android emulator.
class AppConfig {
  static const apiUrl = String.fromEnvironment('API_URL', defaultValue: 'http://10.0.2.2:3000');

  /// The website, for things that live there (full settings, documents, payment pages).
  static String get siteUrl => apiUrl;

  /// A path the server returns ("/instructors/a.jpg") as a full address; full URLs pass through.
  static String? media(String? path) {
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) return path;
    return '$apiUrl${path.startsWith('/') ? '' : '/'}$path';
  }

  static const supportPhone = '+99312000000';
}
