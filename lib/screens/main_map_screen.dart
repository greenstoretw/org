import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../widgets/shop_card.dart';
import '../widgets/shop_detail_drawer.dart';
import '../widgets/route_panel.dart';
import 'user_dashboard_screen.dart';

class MainMapScreen extends StatefulWidget {
  const MainMapScreen({Key? key}) : super(key: key);

  @override
  State<MainMapScreen> createState() => _MainMapScreenState();
}

class _MainMapScreenState extends State<MainMapScreen> {
  final TextEditingController _searchController = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final isDark = appState.isDarkMode;
    final shops = appState.filteredShops;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
        elevation: 1,
        titleSpacing: 16,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              color: const Color(0xFF16A34A),
              child: const Icon(Icons.park, color: Colors.white, size: 20),
            ),
            const SizedBox(width: 8),
            Text(
              '綠簷 Green Eaves',
              style: TextStyle(
                fontWeight: FontWeight.black,
                fontSize: 18,
                color: isDark ? Colors.white : const Color(0xFF0F172A),
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: Icon(isDark ? Icons.light_mode : Icons.dark_mode),
            onPressed: () => appState.toggleDarkMode(),
          ),
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(builder: (_) => const UserDashboardScreen()),
              );
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          Column(
            children: [
              // Search & Filter Header Bar
              Container(
                padding: const EdgeInsets.all(16),
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                child: Column(
                  children: [
                    TextField(
                      controller: _searchController,
                      onChanged: (val) => appState.setSearchQuery(val),
                      decoration: InputDecoration(
                        hintText: '搜尋永續商店名稱、地址或關鍵字...',
                        prefixIcon: const Icon(Icons.search),
                        filled: true,
                        fillColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                        border: const OutlineInputBorder(
                          borderRadius: BorderRadius.zero,
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        FilterChip(
                          label: Text('營業中', style: TextStyle(color: appState.openNowOnly ? Colors.white : null)),
                          selected: appState.openNowOnly,
                          selectedColor: const Color(0xFF16A34A),
                          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                          onSelected: (val) => appState.setOpenNowOnly(val),
                        ),
                        const SizedBox(width: 8),
                        FilterChip(
                          label: const Text('#無包裝商店'),
                          selected: appState.selectedTags.contains('無包裝商店'),
                          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                          onSelected: (_) => appState.toggleTag('無包裝商店'),
                        ),
                        const SizedBox(width: 8),
                        FilterChip(
                          label: const Text('#自備容器優惠'),
                          selected: appState.selectedTags.contains('自備容器優惠'),
                          shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                          onSelected: (_) => appState.toggleTag('自備容器優惠'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              // Shop Cards List View
              Expanded(
                child: shops.isEmpty
                    ? const Center(
                        child: Text(
                          '未找到符合條件的永續商店',
                          style: TextStyle(color: Colors.grey, fontSize: 14),
                        ),
                      )
                    : ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: shops.length,
                        itemBuilder: (context, index) {
                          final shop = shops[index];
                          return ShopCard(
                            shop: shop,
                            onTap: () => appState.selectShop(shop),
                          );
                        },
                      ),
              ),
            ],
          ),

          // Bottom Route Overlay Panel
          const Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: RoutePanel(),
          ),

          // Shop Detail Modal Drawer Overlay
          if (appState.selectedShop != null)
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: ShopDetailDrawer(
                shop: appState.selectedShop!,
                onClose: () => appState.selectShop(null),
              ),
            ),
        ],
      ),

      // FAB Action Menu
      floatingActionButton: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          FloatingActionButton.extended(
            heroTag: 'surprise',
            backgroundColor: const Color(0xFFD97706),
            foregroundColor: Colors.white,
            shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
            icon: const Icon(Icons.auto_awesome),
            label: const Text('隨機探索', style: TextStyle(fontWeight: FontWeight.bold)),
            onPressed: () {
              final shop = appState.surpriseMe();
              if (shop != null) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(content: Text('探索成功！已為您導航至：${shop.getName()}')),
                );
              }
            },
          ),
          const SizedBox(height: 10),
          FloatingActionButton.extended(
            heroTag: 'route',
            backgroundColor: const Color(0xFF2563EB),
            foregroundColor: Colors.white,
            shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
            icon: const Icon(Icons.map),
            label: const Text('規劃路線', style: TextStyle(fontWeight: FontWeight.bold)),
            onPressed: () => appState.setRoutingMode(true),
          ),
        ],
      ),
    );
  }
}
