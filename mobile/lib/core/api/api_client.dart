import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../config.dart';
import 'models.dart';

/// A failure the parent can read: the server's message in their language, or a connection
/// problem the app describes itself.
class ApiException implements Exception {
  ApiException(this.message, {this.status, this.code, this.offline = false});

  final String message;
  final int? status;
  final String? code;
  final bool offline;

  bool get unauthorized => status == 401;

  @override
  String toString() => message;
}

typedef TokenReader = String? Function();
typedef LocaleReader = String Function();

/// Thin typed wrapper over the /api/mobile/v1 endpoints.
class ApiClient {
  ApiClient({required TokenReader token, required LocaleReader locale, required this.onUnauthorized, required this.offlineText})
      : _dio = Dio(BaseOptions(
          baseUrl: '${AppConfig.apiUrl}/api/mobile/v1',
          connectTimeout: const Duration(seconds: 15),
          receiveTimeout: const Duration(seconds: 30),
          sendTimeout: const Duration(seconds: 60),
          headers: {'X-Device': 'Bilim Merkezi app · ${Platform.operatingSystem}'},
        )) {
    _dio.interceptors.add(InterceptorsWrapper(onRequest: (options, handler) {
      final value = token();
      if (value != null) options.headers['Authorization'] = 'Bearer $value';
      options.headers['X-Locale'] = locale();
      handler.next(options);
    }));
  }

  final Dio _dio;

  /// Called when the server no longer accepts the session (signed out elsewhere, password reset).
  final void Function() onUnauthorized;

  /// "No connection" in the current language.
  final String Function() offlineText;

  Future<T> _send<T>(Future<Response<dynamic>> Function() request, T Function(dynamic data) parse) async {
    try {
      final response = await request();
      return parse(response.data);
    } on DioException catch (error) {
      final response = error.response;
      if (response == null) {
        // The real reason (refused, timeout, cleartext blocked…) for `adb logcat -s flutter`.
        debugPrint('[api] ${error.requestOptions.method} ${error.requestOptions.uri} failed: ${error.type} ${error.error ?? error.message}');
        throw ApiException(offlineText(), offline: true);
      }
      final data = response.data;
      final message = data is Map && data['error'] is String ? data['error'] as String : offlineText();
      final code = data is Map ? data['code'] as String? : null;
      if (response.statusCode == 401 && code == 'unauthorized') onUnauthorized();
      throw ApiException(message, status: response.statusCode, code: code);
    }
  }

  Map<String, dynamic> _map(dynamic data) => data as Map<String, dynamic>;
  List<T> _listOf<T>(dynamic data, T Function(Map<String, dynamic>) parse) =>
      (data as List).map((item) => parse(item as Map<String, dynamic>)).toList();

  // ── auth ────────────────────────────────────────────────────────────────────

  Future<AuthResult> login(String login, String password) =>
      _send(() => _dio.post('/auth/login', data: {'login': login, 'password': password}), (d) => AuthResult.fromJson(_map(d)));

  Future<AuthResult> register({required String name, required String email, required String password, required String confirm}) =>
      _send(
        () => _dio.post('/auth/register', data: {'name': name, 'email': email, 'password': password, 'confirmPassword': confirm}),
        (d) => AuthResult.fromJson(_map(d)),
      );

  Future<OtpSent> requestCode(String phone, {bool recovery = false}) => _send(
        () => _dio.post('/auth/otp/request', data: {'phone': phone, if (recovery) 'purpose': 'recovery'}),
        (d) => OtpSent.fromJson(_map(d)),
      );

  Future<AuthResult> verifyCode(String phone, String code, {String? name}) => _send(
        () => _dio.post('/auth/otp/verify', data: {'phone': phone, 'code': code, if (name != null) 'name': name}),
        (d) => AuthResult.fromJson(_map(d)),
      );

  Future<bool> requestResetEmail(String email) =>
      _send(() => _dio.post('/auth/password/email', data: {'email': email}), (d) => _map(d)['simulated'] as bool? ?? false);

  Future<AuthResult> resetBySms({required String phone, required String code, required String password, required String confirm}) =>
      _send(
        () => _dio.post('/auth/password/sms',
            data: {'phone': phone, 'code': code, 'password': password, 'confirmPassword': confirm}),
        (d) => AuthResult.fromJson(_map(d)),
      );

  Future<void> logout() => _send(() => _dio.post('/auth/logout'), (_) {});

  // ── account ─────────────────────────────────────────────────────────────────

  Future<CenterInfo> info() => _send(() => _dio.get('/info'), (d) => CenterInfo.fromJson(_map(d)));

  Future<Me> me() => _send(() => _dio.get('/me'), (d) => Me.fromJson(_map(d)));
  Future<Me> updateName(String name) => _send(() => _dio.patch('/me', data: {'name': name}), (d) => Me.fromJson(_map(d)));
  Future<Dashboard> dashboard() => _send(() => _dio.get('/dashboard'), (d) => Dashboard.fromJson(_map(d)));
  Future<List<FeedItem>> feed() => _send(() => _dio.get('/feed'), (d) => _listOf(d, FeedItem.fromJson));

  // ── children ────────────────────────────────────────────────────────────────

  Future<List<ChildSummary>> children() => _send(() => _dio.get('/children'), (d) => _listOf(d, ChildSummary.fromJson));
  Future<ChildDetail> child(String id) => _send(() => _dio.get('/children/$id'), (d) => ChildDetail.fromJson(_map(d)));
  Future<String> createChild(Map<String, dynamic> body) =>
      _send(() => _dio.post('/children', data: body), (d) => _map(d)['id'] as String);
  Future<void> updateChild(String id, Map<String, dynamic> body) => _send(() => _dio.patch('/children/$id', data: body), (_) {});
  Future<void> deleteChild(String id) => _send(() => _dio.delete('/children/$id'), (_) {});

  // ── courses & enrollment ────────────────────────────────────────────────────

  Future<Catalog> catalog() => _send(() => _dio.get('/courses'), (d) => Catalog.fromJson(_map(d)));
  Future<CourseDetail> course(String slug) => _send(() => _dio.get('/courses/$slug'), (d) => CourseDetail.fromJson(_map(d)));
  Future<List<Enrollment>> enrollments() => _send(() => _dio.get('/enrollments'), (d) => _listOf(d, Enrollment.fromJson));
  Future<List<Lesson>> schedule({int days = 30}) =>
      _send(() => _dio.get('/schedule', queryParameters: {'days': days}), (d) => _listOf(d, Lesson.fromJson));

  Future<PromoQuote> checkPromo(String courseId, String code) =>
      _send(() => _dio.post('/promo', data: {'courseId': courseId, 'code': code}), (d) => PromoQuote.fromJson(_map(d)));

  Future<String> uploadDocument(String path, String filename) => _send(
        () async => _dio.post('/uploads/document', data: FormData.fromMap({'file': await MultipartFile.fromFile(path, filename: filename)})),
        (d) => _map(d)['key'] as String,
      );

  Future<EnrollStart> enroll(Map<String, dynamic> body) =>
      _send(() => _dio.post('/enrollments', data: body), (d) => EnrollStart.fromJson(_map(d)));

  Future<String> confirmPayment(String enrollmentId) =>
      _send(() => _dio.post('/enrollments/$enrollmentId/confirm'), (d) => _map(d)['status'] as String);
}
