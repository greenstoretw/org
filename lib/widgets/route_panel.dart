import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class RoutePanel extends StatelessWidget {
  const RoutePanel({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final isDark = appState.isDarkMode;
    final routingIds = appState.activeRoutingList;

    if (routingIds.isEmpty) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F172A) : Colors.white,
        border: Border.all(color: const Color(0xFF16A34A), width: 2),
        borderRadius: BorderRadius.zero,
        boxShadow: const [
          BoxShadow(color: Colors.black26, blurRadius: 10, offset: Offset(0, 4)),
        ],
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Row(
                children: [
                  Icon(Icons.route, color: Color(0xFF16A34A), size: 18),
                  SizedBox(width: 6),
                  Text(
                    '永續散步路線規劃',
                    style: TextStyle(fontWeight: FontWeight.black, fontSize: 14),
                  ),
                ],
              ),
              IconButton(
                icon: const Icon(Icons.close, size: 18),
                onPressed: () => appState.setRoutingMode(false),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(
            '已加入 ${routingIds.length} 間商店至路線中',
            style: const TextStyle(fontSize: 12, fontWeight: FontWeight.bold, color: Colors.grey),
          ),
          const SizedBox(height: 12),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                    side: const BorderSide(color: Colors.redAccent),
                  ),
                  onPressed: () => appState.clearRoutingList(),
                  child: const Text('清空路線', style: TextStyle(color: Colors.redAccent, fontSize: 12)),
                ),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF16A34A),
                    foregroundColor: Colors.white,
                    shape: const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
                  ),
                  onPressed: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('已在地圖繪製永續散步路線！')),
                    );
                  },
                  child: const Text('於地圖連線', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 12)),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
