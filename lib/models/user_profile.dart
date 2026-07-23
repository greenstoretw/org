class UserReview {
  final String id;
  final String shopId;
  final String shopName;
  final double rating;
  final String comment;
  final DateTime timestamp;

  UserReview({
    required this.id,
    required this.shopId,
    required this.shopName,
    required this.rating,
    required this.comment,
    required this.timestamp,
  });
}

class EcoReceipt {
  final String id;
  final String shopId;
  final String shopName;
  final String imageBase64;
  final double carbonSavedKg;
  final DateTime date;

  EcoReceipt({
    required this.id,
    required this.shopId,
    required this.shopName,
    required this.imageBase64,
    required this.carbonSavedKg,
    required this.date,
  });
}

class UserProfile {
  final String uid;
  String nickname;
  double carbonSavedKg;
  int ecoActionsCount;
  List<String> favoriteShopIds;
  List<UserReview> reviews;
  List<EcoReceipt> receipts;
  List<String> unlockedAchievements;

  UserProfile({
    required this.uid,
    this.nickname = '綠色夥伴',
    this.carbonSavedKg = 12.5,
    this.ecoActionsCount = 8,
    this.favoriteShopIds = const [],
    this.reviews = const [],
    this.receipts = const [],
    this.unlockedAchievements = const ['FIRST_CHECKIN', 'ECO_WALKER'],
  });

  double get treesEquivalent => (carbonSavedKg / 12.0);
}
