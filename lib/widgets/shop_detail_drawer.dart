import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/shop.dart';
import '../providers/app_state.dart';

class ShopDetailDrawer extends StatelessWidget {
  final Shop shop;
  final VoidCallback onClose;

  const ShopDetailDrawer({
    Key? key,
    required this.shop,
    required this.onClose,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final isDark = appState.isDarkMode;
    final inRoute = appState.activeRoutingList.contains(shop.id);

    return Container(
      width: double.infinity,
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        borderRadius: BorderRadius.zero,
        boxShadow: const [
          BoxShadow(color: Colors.black26, blurRadius: 15, offset: Offset(0, -5)),
        ],
      ),
      child: Column(
        children: [
          // Header Bar with close button
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                ),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      color: shop.isOpen ? const Color(0xFF16A34A) : const Color(0xFFDC2626),
                      child: Text(
                        shop.isOpen ? '營業中' : '休息中',
                        style: const TextStyle(fontSize: 11, fontWeight: FontWeight.black, color: Colors.white),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      shop.category?['zh-TW'] ?? '永續店家',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.bold,
                        color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                      ),
                    ),
                  ],
                ),
                IconButton(
                  icon: const Icon(Icons.close, size: 24),
                  onPressed: onClose,
                ),
              ],
            ),
          ),
          // Body content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Title & Action Buttons
                  Text(
                    shop.getName(),
                    style: TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.black,
                      color: isDark ? Colors.white : const Color(0xFF0F172A),
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    shop.getAddress(),
                    style: TextStyle(
                      fontSize: 13,
                      color: isDark ? const Color(0xFF94A3B8) : const Color(0xFF64748B),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // Route & Action Bar
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: inRoute ? const Color(0xFF2563EB) : const Color(0xFF16A34A),
                            foregroundColor: Colors.white,
                            shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          icon: Icon(inRoute ? Icons.check : Icons.route),
                          label: Text(
                            inRoute ? '已在散步路線中' : '+ 加入散步路線',
                            style: const TextStyle(fontWeight: FontWeight.black, fontSize: 13),
                          ),
                          onPressed: () => appState.toggleRoutingShop(shop.id),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Details Info List
                  if (shop.phone != null) ...[
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.phone, color: Color(0xFF16A34A)),
                      title: const Text('電話號碼', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      subtitle: Text(shop.phone!, style: const TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                  if (shop.openingHours != null) ...[
                    ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.access_time, color: Color(0xFF16A34A)),
                      title: const Text('營業時間', style: TextStyle(fontSize: 12, color: Colors.grey)),
                      subtitle: Text(shop.openingHours!, style: const TextStyle(fontWeight: FontWeight.bold)),
                    ),
                  ],
                  if (shop.description != null) ...[
                    const SizedBox(height: 12),
                    const Text('店家介紹', style: TextStyle(fontSize: 14, fontWeight: FontWeight.black)),
                    const SizedBox(height: 6),
                    Text(
                      shop.description!,
                      style: TextStyle(
                        fontSize: 13,
                        height: 1.5,
                        color: isDark ? const Color(0xFFCBD5E1) : const Color(0xFF334155),
                      ),
                    ),
                  ],
                  const SizedBox(height: 20),

                  // Eco Tags
                  const Text('永續特點標籤', style: TextStyle(fontSize: 14, fontWeight: FontWeight.black)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: shop.tags.map((tag) {
                      return Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        color: isDark ? const Color(0xFF1E293B) : const Color(0xFFF1F5F9),
                        child: Text(
                          '🌿 $tag',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: isDark ? const Color(0xFF4ADE80) : const Color(0xFF15803D),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
