import 'dart:convert';

class ShopLocation {
  final double latitude;
  final double longitude;

  ShopLocation({required this.latitude, required this.longitude});

  factory ShopLocation.fromMap(Map<String, dynamic> map) {
    return ShopLocation(
      latitude: (map['latitude'] as num?)?.toDouble() ?? 25.0330,
      longitude: (map['longitude'] as num?)?.toDouble() ?? 121.5654,
    );
  }

  Map<String, dynamic> toMap() => {
        'latitude': latitude,
        'longitude': longitude,
      };
}

class Shop {
  final String id;
  final Map<String, String> name;
  final Map<String, String>? category;
  final Map<String, String>? address;
  final String? phone;
  final String? openingHours;
  final String? description;
  final ShopLocation? location;
  final List<String> tags;
  final bool isOfficialVerified;
  final bool isPartner;
  final bool isOpen;
  final double rating;
  final int ratingCount;
  final String? imageUrl;
  final String? imageBase64;
  final double? carbonSavingGrams;

  Shop({
    required this.id,
    required this.name,
    this.category,
    this.address,
    this.phone,
    this.openingHours,
    this.description,
    this.location,
    this.tags = const [],
    this.isOfficialVerified = false,
    this.isPartner = false,
    this.isOpen = true,
    this.rating = 5.0,
    this.ratingCount = 1,
    this.imageUrl,
    this.imageBase64,
    this.carbonSavingGrams = 150.0,
  });

  String getName([String lang = 'zh-TW']) {
    return name[lang] ?? name['zh-TW'] ?? name['en'] ?? '永續商店';
  }

  String getAddress([String lang = 'zh-TW']) {
    return address?[lang] ?? address?['zh-TW'] ?? address?['en'] ?? '';
  }

  factory Shop.fromMap(String id, Map<String, dynamic> map) {
    Map<String, String> parseMultilingual(dynamic val) {
      if (val is Map) {
        return val.map((k, v) => MapEntry(k.toString(), v.toString()));
      } else if (val is String) {
        return {'zh-TW': val, 'en': val};
      }
      return {'zh-TW': '未命名', 'en': 'Unnamed'};
    }

    return Shop(
      id: id,
      name: parseMultilingual(map['name']),
      category: map['category'] != null ? parseMultilingual(map['category']) : null,
      address: map['address'] != null ? parseMultilingual(map['address']) : null,
      phone: map['phone']?.toString(),
      openingHours: map['openingHours']?.toString(),
      description: map['description']?.toString(),
      location: map['location'] != null && map['location'] is Map
          ? ShopLocation.fromMap(Map<String, dynamic>.from(map['location']))
          : null,
      tags: map['tags'] != null ? List<String>.from(map['tags']) : [],
      isOfficialVerified: map['isOfficialVerified'] == true || map['verified'] == true,
      isPartner: map['isPartner'] == true,
      isOpen: map['isOpen'] ?? true,
      rating: (map['rating'] as num?)?.toDouble() ?? 5.0,
      ratingCount: (map['ratingCount'] as num?)?.toInt() ?? 1,
      imageUrl: map['imageUrl']?.toString(),
      imageBase64: map['imageBase64']?.toString(),
      carbonSavingGrams: (map['carbonSavingGrams'] as num?)?.toDouble() ?? 150.0,
    );
  }

  Map<String, dynamic> toMap() => {
        'name': name,
        'category': category,
        'address': address,
        'phone': phone,
        'openingHours': openingHours,
        'description': description,
        'location': location?.toMap(),
        'tags': tags,
        'isOfficialVerified': isOfficialVerified,
        'isPartner': isPartner,
        'isOpen': isOpen,
        'rating': rating,
        'ratingCount': ratingCount,
        'imageUrl': imageUrl,
        'imageBase64': imageBase64,
        'carbonSavingGrams': carbonSavingGrams,
      };
}
