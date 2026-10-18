// Data the app receives from /api/mobile/v1. Field names follow the JSON exactly; the server
// sends data, not sentences, and the app writes the words in the parent's language.

DateTime _date(Object? value) => DateTime.parse(value as String).toLocal();
DateTime? _dateOrNull(Object? value) => value == null ? null : _date(value);
int? _intOrNull(Object? value) => value == null ? null : (value as num).toInt();
double? _doubleOrNull(Object? value) => value == null ? null : (value as num).toDouble();
List<String> _strings(Object? value) => (value as List? ?? const []).cast<String>();
List<T> _list<T>(Object? value, T Function(Map<String, dynamic>) parse) =>
    (value as List? ?? const []).map((item) => parse(item as Map<String, dynamic>)).toList();

class Me {
  Me({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.phoneFormatted,
    required this.hasPassword,
    required this.image,
    required this.createdAt,
  });

  factory Me.fromJson(Map<String, dynamic> json) => Me(
        id: json['id'] as String,
        name: json['name'] as String?,
        email: json['email'] as String?,
        phone: json['phone'] as String?,
        phoneFormatted: json['phoneFormatted'] as String?,
        hasPassword: json['hasPassword'] as bool? ?? false,
        image: json['image'] as String?,
        createdAt: _date(json['createdAt']),
      );

  final String id;
  final String? name;
  final String? email;
  final String? phone;
  final String? phoneFormatted;
  final bool hasPassword;
  final String? image;
  final DateTime createdAt;

  String get firstName => (name ?? '').trim().split(RegExp(r'\s+')).first;
}

class AuthResult {
  AuthResult(this.token, this.me);
  factory AuthResult.fromJson(Map<String, dynamic> json) =>
      AuthResult(json['token'] as String, Me.fromJson(json['me'] as Map<String, dynamic>));
  final String token;
  final Me me;
}

class OtpSent {
  OtpSent({required this.phone, required this.maskedPhone, required this.simulated, required this.isNew});
  factory OtpSent.fromJson(Map<String, dynamic> json) => OtpSent(
        phone: json['phone'] as String,
        maskedPhone: json['maskedPhone'] as String,
        simulated: json['simulated'] as bool? ?? false,
        isNew: json['isNew'] as bool? ?? false,
      );
  final String phone;
  final String maskedPhone;
  final bool simulated;
  final bool isNew;
}

class ExamPoint {
  ExamPoint({
    required this.id,
    required this.examName,
    required this.score,
    required this.maxScore,
    required this.percent,
    required this.examDate,
    required this.courseTitle,
  });

  factory ExamPoint.fromJson(Map<String, dynamic> json) => ExamPoint(
        id: json['id'] as String,
        examName: json['examName'] as String,
        score: (json['score'] as num).toInt(),
        maxScore: (json['maxScore'] as num).toInt(),
        percent: (json['percent'] as num).toInt(),
        examDate: _date(json['examDate']),
        courseTitle: json['courseTitle'] as String?,
      );

  final String id;
  final String examName;
  final int score;
  final int maxScore;
  final int percent;
  final DateTime examDate;
  final String? courseTitle;
}

class ChildSummary {
  ChildSummary({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.birthDate,
    required this.grade,
    required this.notes,
    required this.avatarHue,
    required this.activeCourses,
    required this.latestExam,
    required this.trend,
  });

  factory ChildSummary.fromJson(Map<String, dynamic> json) => ChildSummary(
        id: json['id'] as String,
        firstName: json['firstName'] as String,
        lastName: json['lastName'] as String,
        birthDate: _date(json['birthDate']),
        grade: _intOrNull(json['grade']),
        notes: json['notes'] as String?,
        avatarHue: (json['avatarHue'] as num? ?? 0).toInt(),
        activeCourses: (json['activeCourses'] as num? ?? 0).toInt(),
        latestExam: json['latestExam'] == null ? null : ExamPoint.fromJson(json['latestExam'] as Map<String, dynamic>),
        trend: _intOrNull(json['trend']),
      );

  final String id;
  final String firstName;
  final String lastName;
  final DateTime birthDate;
  final int? grade;
  final String? notes;
  final int avatarHue;
  final int activeCourses;
  final ExamPoint? latestExam;
  final int? trend;

  String get fullName => '$firstName $lastName';
  String get initials => '${firstName.isEmpty ? '' : firstName[0]}${lastName.isEmpty ? '' : lastName[0]}'.toUpperCase();

  int get age {
    final now = DateTime.now();
    var years = now.year - birthDate.year;
    if (now.month < birthDate.month || (now.month == birthDate.month && now.day < birthDate.day)) years--;
    return years;
  }
}

class ChildEnrollment {
  ChildEnrollment({
    required this.id,
    required this.status,
    required this.courseTitle,
    required this.courseSlug,
    required this.categoryName,
    required this.createdAt,
  });

  factory ChildEnrollment.fromJson(Map<String, dynamic> json) => ChildEnrollment(
        id: json['id'] as String,
        status: json['status'] as String,
        courseTitle: json['courseTitle'] as String,
        courseSlug: json['courseSlug'] as String,
        categoryName: json['categoryName'] as String,
        createdAt: _date(json['createdAt']),
      );

  final String id;
  final String status;
  final String courseTitle;
  final String courseSlug;
  final String categoryName;
  final DateTime createdAt;
}

/// A lesson as the website's child page shows it (one child's view).
class ChildLesson {
  ChildLesson({required this.id, required this.title, required this.courseTitle, required this.startsAt, this.endsAt, this.location});

  factory ChildLesson.fromJson(Map<String, dynamic> json) => ChildLesson(
        id: json['id'] as String,
        title: json['title'] as String,
        courseTitle: json['courseTitle'] as String,
        startsAt: _date(json['startsAt']),
        endsAt: _dateOrNull(json['endsAt']),
        location: json['location'] as String?,
      );

  final String id;
  final String title;
  final String courseTitle;
  final DateTime startsAt;
  final DateTime? endsAt;
  final String? location;
}

class ChildDetail extends ChildSummary {
  ChildDetail({
    required super.id,
    required super.firstName,
    required super.lastName,
    required super.birthDate,
    required super.grade,
    required super.notes,
    required super.avatarHue,
    required super.activeCourses,
    required super.latestExam,
    required super.trend,
    required this.exams,
    required this.averagePercent,
    required this.bestPercent,
    required this.enrollments,
    required this.upcoming,
  });

  factory ChildDetail.fromJson(Map<String, dynamic> json) {
    final base = ChildSummary.fromJson(json);
    return ChildDetail(
      id: base.id,
      firstName: base.firstName,
      lastName: base.lastName,
      birthDate: base.birthDate,
      grade: base.grade,
      notes: base.notes,
      avatarHue: base.avatarHue,
      activeCourses: base.activeCourses,
      latestExam: base.latestExam,
      trend: base.trend,
      exams: _list(json['exams'], ExamPoint.fromJson),
      averagePercent: _intOrNull(json['averagePercent']),
      bestPercent: _intOrNull(json['bestPercent']),
      enrollments: _list(json['enrollments'], ChildEnrollment.fromJson),
      upcoming: _list(json['upcoming'], ChildLesson.fromJson),
    );
  }

  final List<ExamPoint> exams;
  final int? averagePercent;
  final int? bestPercent;
  final List<ChildEnrollment> enrollments;
  final List<ChildLesson> upcoming;
}

class ChildTag {
  ChildTag({required this.id, required this.firstName, required this.avatarHue, this.lastName});
  factory ChildTag.fromJson(Map<String, dynamic> json) => ChildTag(
        id: json['id'] as String,
        firstName: json['firstName'] as String,
        lastName: json['lastName'] as String?,
        avatarHue: (json['avatarHue'] as num? ?? 0).toInt(),
      );
  final String id;
  final String firstName;
  final String? lastName;
  final int avatarHue;
}

class Lesson {
  Lesson({
    required this.id,
    required this.title,
    required this.startsAt,
    required this.endsAt,
    required this.location,
    required this.courseId,
    required this.courseSlug,
    required this.courseTitle,
    required this.categorySlug,
    required this.children,
  });

  factory Lesson.fromJson(Map<String, dynamic> json) {
    final course = json['course'] as Map<String, dynamic>;
    return Lesson(
      id: json['id'] as String,
      title: json['title'] as String,
      startsAt: _date(json['startsAt']),
      endsAt: _dateOrNull(json['endsAt']),
      location: json['location'] as String?,
      courseId: course['id'] as String,
      courseSlug: course['slug'] as String,
      courseTitle: course['title'] as String,
      categorySlug: course['categorySlug'] as String,
      children: _list(json['children'], ChildTag.fromJson),
    );
  }

  final String id;
  final String title;
  final DateTime startsAt;
  final DateTime? endsAt;
  final String? location;
  final String courseId;
  final String courseSlug;
  final String courseTitle;
  final String categorySlug;
  final List<ChildTag> children;
}

class Category {
  Category({required this.slug, required this.name, this.count = 0});
  factory Category.fromJson(Map<String, dynamic> json) =>
      Category(slug: json['slug'] as String, name: json['name'] as String, count: (json['count'] as num? ?? 0).toInt());
  final String slug;
  final String name;
  final int count;
}

class Enrollment {
  Enrollment({
    required this.id,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
    required this.courseId,
    required this.courseSlug,
    required this.courseTitle,
    required this.category,
    required this.child,
    required this.paymentStatus,
    required this.amount,
  });

  factory Enrollment.fromJson(Map<String, dynamic> json) {
    final course = json['course'] as Map<String, dynamic>;
    final payment = json['payment'] as Map<String, dynamic>?;
    return Enrollment(
      id: json['id'] as String,
      status: json['status'] as String,
      createdAt: _date(json['createdAt']),
      updatedAt: _date(json['updatedAt']),
      courseId: course['id'] as String,
      courseSlug: course['slug'] as String,
      courseTitle: course['title'] as String,
      category: Category.fromJson(course['category'] as Map<String, dynamic>),
      child: json['child'] == null ? null : ChildTag.fromJson(json['child'] as Map<String, dynamic>),
      paymentStatus: payment?['status'] as String?,
      amount: _doubleOrNull(payment?['amount']),
    );
  }

  final String id;
  final String status;
  final DateTime createdAt;
  final DateTime updatedAt;
  final String courseId;
  final String courseSlug;
  final String courseTitle;
  final Category category;
  final ChildTag? child;
  final String? paymentStatus;
  final double? amount;
}

class FeedItem {
  FeedItem({
    required this.id,
    required this.type,
    required this.at,
    this.childName,
    this.courseTitle,
    this.examName,
    this.score,
    this.maxScore,
    this.lessonTitle,
    this.startsAt,
  });

  factory FeedItem.fromJson(Map<String, dynamic> json) => FeedItem(
        id: json['id'] as String,
        type: json['type'] as String,
        at: _date(json['at']),
        childName: json['childName'] as String?,
        courseTitle: json['courseTitle'] as String?,
        examName: json['examName'] as String?,
        score: _intOrNull(json['score']),
        maxScore: _intOrNull(json['maxScore']),
        lessonTitle: json['lessonTitle'] as String?,
        startsAt: _dateOrNull(json['startsAt']),
      );

  final String id;
  final String type;
  final DateTime at;
  final String? childName;
  final String? courseTitle;
  final String? examName;
  final int? score;
  final int? maxScore;
  final String? lessonTitle;
  final DateTime? startsAt;
}

class DashboardStats {
  DashboardStats({required this.children, required this.activeCourses, required this.awaitingPayment});
  factory DashboardStats.fromJson(Map<String, dynamic> json) => DashboardStats(
        children: (json['children'] as num).toInt(),
        activeCourses: (json['activeCourses'] as num).toInt(),
        awaitingPayment: (json['awaitingPayment'] as num).toInt(),
      );
  final int children;
  final int activeCourses;
  final int awaitingPayment;
}

class Dashboard {
  Dashboard({
    required this.me,
    required this.children,
    required this.upcoming,
    required this.enrollments,
    required this.feed,
    required this.stats,
  });

  factory Dashboard.fromJson(Map<String, dynamic> json) => Dashboard(
        me: Me.fromJson(json['me'] as Map<String, dynamic>),
        children: _list(json['children'], ChildSummary.fromJson),
        upcoming: _list(json['upcoming'], Lesson.fromJson),
        enrollments: _list(json['enrollments'], Enrollment.fromJson),
        feed: _list(json['feed'], FeedItem.fromJson),
        stats: DashboardStats.fromJson(json['stats'] as Map<String, dynamic>),
      );

  final Me me;
  final List<ChildSummary> children;
  final List<Lesson> upcoming;
  final List<Enrollment> enrollments;
  final List<FeedItem> feed;
  final DashboardStats stats;
}

class Rating {
  Rating(this.average, this.count);
  factory Rating.fromJson(Map<String, dynamic>? json) =>
      Rating((json?['average'] as num? ?? 0).toDouble(), (json?['count'] as num? ?? 0).toInt());
  final double average;
  final int count;
}

class CourseCard {
  CourseCard({
    required this.id,
    required this.slug,
    required this.title,
    required this.summary,
    required this.level,
    required this.levelCode,
    required this.price,
    required this.discountPrice,
    required this.durationHours,
    required this.lessonsPerWeek,
    required this.startDate,
    required this.ageMin,
    required this.ageMax,
    required this.groupSize,
    required this.coverImage,
    required this.instructorName,
    required this.instructorAvatar,
    required this.featured,
    required this.category,
    required this.rating,
  });

  factory CourseCard.fromJson(Map<String, dynamic> json) => CourseCard(
        id: json['id'] as String,
        slug: json['slug'] as String,
        title: json['title'] as String,
        summary: json['summary'] as String,
        level: json['level'] as String,
        levelCode: json['levelCode'] as String?,
        price: (json['price'] as num).toDouble(),
        discountPrice: _doubleOrNull(json['discountPrice']),
        durationHours: (json['durationHours'] as num).toInt(),
        lessonsPerWeek: (json['lessonsPerWeek'] as num? ?? 0).toInt(),
        startDate: _dateOrNull(json['startDate']),
        ageMin: _intOrNull(json['ageMin']),
        ageMax: _intOrNull(json['ageMax']),
        groupSize: _intOrNull(json['groupSize']),
        coverImage: json['coverImage'] as String?,
        instructorName: json['instructorName'] as String,
        instructorAvatar: json['instructorAvatar'] as String?,
        featured: json['featured'] as bool? ?? false,
        category: Category.fromJson(json['category'] as Map<String, dynamic>),
        rating: Rating.fromJson(json['rating'] as Map<String, dynamic>?),
      );

  final String id;
  final String slug;
  final String title;
  final String summary;
  final String level;
  final String? levelCode;
  final double price;
  final double? discountPrice;
  final int durationHours;
  final int lessonsPerWeek;
  final DateTime? startDate;
  final int? ageMin;
  final int? ageMax;
  final int? groupSize;
  final String? coverImage;
  final String instructorName;
  final String? instructorAvatar;
  final bool featured;
  final Category category;
  final Rating rating;

  double get finalPrice => discountPrice ?? price;
  bool get hasDiscount => discountPrice != null && discountPrice! < price;
}

class CourseLessonItem {
  CourseLessonItem({required this.id, required this.title, required this.durationMin});
  factory CourseLessonItem.fromJson(Map<String, dynamic> json) => CourseLessonItem(
        id: json['id'] as String,
        title: json['title'] as String,
        durationMin: (json['durationMin'] as num).toInt(),
      );
  final String id;
  final String title;
  final int durationMin;
}

class CourseModule {
  CourseModule({required this.id, required this.title, required this.goal, required this.lessons});
  factory CourseModule.fromJson(Map<String, dynamic> json) => CourseModule(
        id: json['id'] as String,
        title: json['title'] as String,
        goal: json['goal'] as String?,
        lessons: _list(json['lessons'], CourseLessonItem.fromJson),
      );
  final String id;
  final String title;
  final String? goal;
  final List<CourseLessonItem> lessons;
}

class CourseEvent {
  CourseEvent({required this.id, required this.title, required this.startsAt, this.endsAt, this.location});
  factory CourseEvent.fromJson(Map<String, dynamic> json) => CourseEvent(
        id: json['id'] as String,
        title: json['title'] as String,
        startsAt: _date(json['startsAt']),
        endsAt: _dateOrNull(json['endsAt']),
        location: json['location'] as String?,
      );
  final String id;
  final String title;
  final DateTime startsAt;
  final DateTime? endsAt;
  final String? location;
}

class Review {
  Review({required this.id, required this.rating, required this.comment, required this.createdAt, required this.author});
  factory Review.fromJson(Map<String, dynamic> json) => Review(
        id: json['id'] as String,
        rating: (json['rating'] as num).toInt(),
        comment: json['comment'] as String?,
        createdAt: _date(json['createdAt']),
        author: json['author'] as String?,
      );
  final String id;
  final int rating;
  final String? comment;
  final DateTime createdAt;
  final String? author;
}

class CourseDetail {
  CourseDetail({
    required this.card,
    required this.description,
    required this.outcomes,
    required this.skills,
    required this.requirements,
    required this.audience,
    required this.teachingLanguage,
    required this.certificate,
    required this.weeklyHoursMin,
    required this.weeklyHoursMax,
    required this.instructorTitle,
    required this.instructorBio,
    required this.modules,
    required this.upcoming,
    required this.reviews,
    this.paymentsEnabled = true,
  });

  factory CourseDetail.fromJson(Map<String, dynamic> json) => CourseDetail(
        card: CourseCard.fromJson(json),
        description: json['description'] as String? ?? '',
        outcomes: _strings(json['outcomes']),
        skills: _strings(json['skills']),
        requirements: _strings(json['requirements']),
        audience: _strings(json['audience']),
        teachingLanguage: json['teachingLanguage'] as String?,
        certificate: json['certificate'] as bool? ?? false,
        weeklyHoursMin: (json['weeklyHoursMin'] as num? ?? 0).toInt(),
        weeklyHoursMax: (json['weeklyHoursMax'] as num? ?? 0).toInt(),
        instructorTitle: json['instructorTitle'] as String?,
        instructorBio: json['instructorBio'] as String?,
        modules: _list(json['modules'], CourseModule.fromJson),
        upcoming: _list(json['upcoming'], CourseEvent.fromJson),
        reviews: _list(json['reviews'], Review.fromJson),
        paymentsEnabled: json['paymentsEnabled'] as bool? ?? true,
      );

  final CourseCard card;
  final String description;
  final List<String> outcomes;
  final List<String> skills;
  final List<String> requirements;
  final List<String> audience;
  final String? teachingLanguage;
  final bool certificate;
  final int weeklyHoursMin;
  final int weeklyHoursMax;
  final String? instructorTitle;
  final String? instructorBio;
  final List<CourseModule> modules;
  final List<CourseEvent> upcoming;
  final List<Review> reviews;

  /// Off while the centre tests the app: enrolling confirms the seat with no payment page.
  final bool paymentsEnabled;

  int get lessonCount => modules.fold(0, (sum, module) => sum + module.lessons.length);
}

class Catalog {
  Catalog(this.categories, this.courses);
  factory Catalog.fromJson(Map<String, dynamic> json) =>
      Catalog(_list(json['categories'], Category.fromJson), _list(json['courses'], CourseCard.fromJson));
  final List<Category> categories;
  final List<CourseCard> courses;
}

class EnrollStart {
  EnrollStart({required this.status, required this.enrollmentId, this.url});
  factory EnrollStart.fromJson(Map<String, dynamic> json) => EnrollStart(
        status: json['status'] as String,
        enrollmentId: json['enrollmentId'] as String,
        url: json['url'] as String?,
      );
  final String status;
  final String enrollmentId;
  final String? url;
}

class PromoQuote {
  PromoQuote({required this.code, required this.price, required this.fullPrice});
  factory PromoQuote.fromJson(Map<String, dynamic> json) => PromoQuote(
        code: json['code'] as String,
        price: (json['price'] as num).toDouble(),
        fullPrice: (json['fullPrice'] as num).toDouble(),
      );
  final String code;
  final double price;
  final double fullPrice;
}

/// The centre's contacts, edited in the website's admin panel.
class CenterInfo {
  CenterInfo({required this.phone, required this.email, required this.address, required this.hours});
  factory CenterInfo.fromJson(Map<String, dynamic> json) {
    final contacts = json['contacts'] as Map<String, dynamic>;
    return CenterInfo(
      phone: contacts['phone'] as String,
      email: contacts['email'] as String,
      address: contacts['address'] as String,
      hours: contacts['hours'] as String? ?? '',
    );
  }
  final String phone;
  final String email;
  final String address;
  final String hours;
}
