import 'package:bilim_merkezi/core/i18n/strings.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('every language fills its placeholders', () {
    for (final code in S.languages.keys) {
      final s = S.of(code);
      expect(s.notifNewScoresFor.f({'name': 'Aýgül'}), contains('Aýgül'));
      expect(s.remindTomorrow.f({'time': '15:00', 'course': 'X'}), allOf(contains('15:00'), contains('X')));
    }
  });
}
