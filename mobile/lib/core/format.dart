import 'i18n/strings.dart';

/// "1 500 TMT": whole manat with a narrow space between thousands, as on the website.
String money(double amount, S s) {
  final whole = amount.round().toString();
  final grouped = whole.replaceAllMapped(RegExp(r'\B(?=(\d{3})+(?!\d))'), (_) => ' ');
  return '$grouped ${s.currency}';
}

String two(int value) => value.toString().padLeft(2, '0');

String time(DateTime date) => '${two(date.hour)}:${two(date.minute)}';

DateTime _day(DateTime date) => DateTime(date.year, date.month, date.day);

/// "16 октября", "16 oktýabr", "16 October".
String dayMonth(DateTime date, S s) => '${date.day} ${s.months[date.month - 1]}';

String fullDate(DateTime date, S s) => '${dayMonth(date, s)} ${date.year}';

/// "Сегодня", "Завтра", "Вчера" or "Пт, 18 октября".
String relativeDay(DateTime date, S s) {
  final diff = _day(date).difference(_day(DateTime.now())).inDays;
  if (diff == 0) return s.today;
  if (diff == 1) return s.tomorrow;
  if (diff == -1) return s.yesterday;
  return '${s.weekdaysShort[date.weekday - 1]}, ${dayMonth(date, s)}';
}

/// "Завтра, 15:00".
String dayAndTime(DateTime date, S s) => '${relativeDay(date, s)}, ${time(date)}';

/// For the feed: "15:04" today, "Вчера" or the date for older items.
String feedStamp(DateTime date, S s) {
  final diff = _day(DateTime.now()).difference(_day(date)).inDays;
  if (diff <= 0) return time(date);
  if (diff == 1) return s.yesterday;
  return dayMonth(date, s);
}

bool sameDay(DateTime a, DateTime b) => a.year == b.year && a.month == b.month && a.day == b.day;

/// The date the API expects for a child's birthday.
String isoDate(DateTime date) => '${date.year}-${two(date.month)}-${two(date.day)}';

/// Accepts what a parent types for a Turkmen number ("65 12 34 56", "+993 65…", "8 65…") and
/// returns +993XXXXXXXX, or null. The server checks again; this only gives instant feedback.
String? normalizePhone(String input) {
  var digits = input.replaceAll(RegExp(r'\D'), '');
  if (digits.length == 9 && digits.startsWith('8')) digits = digits.substring(1);
  if (digits.startsWith('993')) digits = digits.substring(3);
  const prefixes = ['61', '62', '63', '64', '65', '71', '72'];
  if (digits.length != 8 || !prefixes.contains(digits.substring(0, 2))) return null;
  return '+993$digits';
}

final emailPattern = RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$');
