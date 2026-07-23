import 'dart:math';
import 'package:flutter/foundation.dart';
import '../models/shop.dart';
import '../models/user_profile.dart';

class AppState extends ChangeNotifier {
  bool _isDarkMode = false;
  String _searchQuery = '';
  String _currentLang = 'zh-TW';
  List<String> _selectedTags = [];
  bool _openNowOnly = false;
  Shop? _selectedShop;
  
  // Routing mode
  List<String> _activeRoutingList = [];
  bool _isRoutingMode = false;

  // Mock initial shop dataset
  List<Shop> _allShops = [
    Shop(
      id: 'shop_01',
      name: {'zh-TW': '綠洲裸買實驗室 Oasis Unpackaged', 'en': 'Oasis Unpackaged Lab'},
      category: {'zh-TW': '無包裝商店', 'en': 'Zero Waste Store'},
      address: {'zh-TW': '台北市大安區新生南路三段 86 號', 'en': 'No. 86, Sec. 3, Xinsheng S. Rd., Da’an Dist., Taipei City'},
      phone: '02-2368-1234',
      openingHours: '11:00 - 20:00 (週一公休)',
      description: '提供有機五穀雜糧、清潔用品與自備容器折扣，一起實現無痕生活。',
      location: ShopLocation(latitude: 25.0185, longitude: 121.5332),
      tags: ['無包裝商店', '自備容器優惠', '有機認證', '素食友善'],
      isOfficialVerified: true,
      isPartner: true,
      isOpen: true,
      rating: 4.9,
      ratingCount: 38,
      carbonSavingGrams: 220.0,
    ),
    Shop(
      id: 'shop_02',
      name: {'zh-TW': '植境 VEGE LAND 永續蔬食餐廳', 'en': 'VEGE LAND Sustainable Restaurant'},
      category: {'zh-TW': '永續餐飲', 'en': 'Eco Dining'},
      address: {'zh-TW': '台北市信義區松高路 11 號', 'en': 'No. 11, Songgao Rd., Xinyi Dist., Taipei City'},
      phone: '02-8789-5678',
      openingHours: '11:30 - 21:30',
      description: '全植物低碳蔬食，選用在地小農有機食材，減少碳足跡。',
      location: ShopLocation(latitude: 25.0392, longitude: 121.5668),
      tags: ['全植物餐飲', '在地食材', '公平貿易', '自備容器優惠'],
      isOfficialVerified: true,
      isPartner: false,
      isOpen: true,
      rating: 4.8,
      ratingCount: 52,
      carbonSavingGrams: 350.0,
    ),
    Shop(
      id: 'shop_03',
      name: {'zh-TW': '迴圈二手古著文創 Circle Vintage', 'en': 'Circle Vintage & Re-design'},
      category: {'zh-TW': '循環時尚', 'en': 'Circular Fashion'},
      address: {'zh-TW': '台北市中山區赤峰街 49 巷 15 號', 'en': 'No. 15, Ln. 49, Chifeng St., Zhongshan Dist., Taipei City'},
      phone: '02-2550-9988',
      openingHours: '13:00 - 21:00',
      description: '推廣舊衣重塑與二手時尚，減緩快時尚對地球環境的衝擊。',
      location: ShopLocation(latitude: 25.0560, longitude: 121.5204),
      tags: ['二手/二手修復', '減塑包裝', '公平貿易'],
      isOfficialVerified: false,
      isPartner: true,
      isOpen: true,
      rating: 4.7,
      ratingCount: 24,
      carbonSavingGrams: 180.0,
    ),
  ];

  // User Profile
  UserProfile _userProfile = UserProfile(
    uid: 'user_demo_123',
    nickname: '綠洲探索家',
    favoriteShopIds: ['shop_01'],
  );

  // Getters
  bool get isDarkMode => _isDarkMode;
  String get searchQuery => _searchQuery;
  String get currentLang => _currentLang;
  List<String> get selectedTags => _selectedTags;
  bool get openNowOnly => _openNowOnly;
  Shop? get selectedShop => _selectedShop;
  List<String> get activeRoutingList => _activeRoutingList;
  bool get isRoutingMode => _isRoutingMode;
  UserProfile get userProfile => _userProfile;

  List<Shop> get filteredShops {
    return _allShops.filter((shop) {
      if (_openNowOnly && !shop.isOpen) return false;
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        final nameStr = shop.getName(_currentLang).toLowerCase();
        final addrStr = shop.getAddress(_currentLang).toLowerCase();
        if (!nameStr.contains(query) && !addrStr.contains(query)) return false;
      }
      if (_selectedTags.isNotEmpty) {
        for (var tag in _selectedTags) {
          if (!shop.tags.contains(tag)) return false;
        }
      }
      return true;
    }).toList();
  }

  // State actions
  void toggleDarkMode() {
    _isDarkMode = !_isDarkMode;
    notifyListeners();
  }

  void setSearchQuery(String query) {
    _searchQuery = query;
    notifyListeners();
  }

  void toggleTag(String tag) {
    if (_selectedTags.contains(tag)) {
      _selectedTags.remove(tag);
    } else {
      _selectedTags.add(tag);
    }
    notifyListeners();
  }

  void clearTags() {
    _selectedTags.clear();
    notifyListeners();
  }

  void setOpenNowOnly(bool val) {
    _openNowOnly = val;
    notifyListeners();
  }

  void selectShop(Shop? shop) {
    _selectedShop = shop;
    notifyListeners();
  }

  void toggleFavorite(String shopId) {
    if (_userProfile.favoriteShopIds.contains(shopId)) {
      _userProfile.favoriteShopIds.remove(shopId);
    } else {
      _userProfile.favoriteShopIds.add(shopId);
    }
    notifyListeners();
  }

  void toggleRoutingShop(String shopId) {
    if (_activeRoutingList.contains(shopId)) {
      _activeRoutingList.remove(shopId);
    } else {
      if (_activeRoutingList.length < 8) {
        _activeRoutingList.add(shopId);
      }
    }
    notifyListeners();
  }

  void clearRoutingList() {
    _activeRoutingList.clear();
    notifyListeners();
  }

  void setRoutingMode(bool val) {
    _isRoutingMode = val;
    notifyListeners();
  }

  Shop? surpriseMe() {
    final validShops = _allShops.where((s) => s.location != null).toList();
    if (validShops.isEmpty) return null;
    final randomShop = validShops[Random().nextInt(validShops.length)];
    selectShop(randomShop);
    return randomShop;
  }
}
