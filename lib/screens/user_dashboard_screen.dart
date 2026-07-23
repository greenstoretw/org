import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class UserDashboardScreen extends StatelessWidget {
  const UserDashboardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final appState = Provider.of<AppState>(context);
    final isDark = appState.isDarkMode;
    final profile = appState.userProfile;

    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF0F172A) : const Color(0xFFF8FAFC),
      appBar: AppBar(
        backgroundColor: isDark ? const Color(0xFF1E293B) : Colors.white,
        elevation: 1,
        title: Text(
          '個人減碳儀表板',
          style: TextStyle(
            fontWeight: FontWeight.black,
            fontSize: 18,
            color: isDark ? Colors.white : const Color(0xFF0F172A),
          ),
        ),
        iconTheme: IconThemeData(color: isDark ? Colors.white : const Color(0xFF0F172A)),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // User Avatar Banner
            Container(
              padding: const EdgeInsets.all(20),
              color: isDark ? const Color(0xFF1E293B) : Colors.white,
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: const Color(0xFF16A34A),
                    child: Text(
                      profile.nickname.isNotEmpty ? profile.nickname[0] : 'U',
                      style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 24),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        profile.nickname,
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.black,
                          color: isDark ? Colors.white : const Color(0xFF0F172A),
                        ),
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'ECO MEMBER 綠色會員',
                        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: Colors.green),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Virtual Forest progress banner
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: isDark
                      ? [const Color(0xFF064E3B), const Color(0xFF022C22)]
                      : [const Color(0xFFDCFCE7), const Color(0xFFF0FDF4)],
                ),
                border: Border.all(color: const Color(0xFF86EFAC)),
              ),
              child: Row(
                children: [
                  const Text('🌱', style: TextStyle(fontSize: 40)),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          '我的個人虛擬綠地',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.black,
                            color: isDark ? Colors.white : const Color(0xFF14532D),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '您正為地球帶來美好的正向改變！',
                          style: TextStyle(fontSize: 12, color: isDark ? Colors.white70 : Colors.green[800]),
                        ),
                        const SizedBox(height: 8),
                        LinearProgressIndicator(
                          value: 0.35,
                          backgroundColor: Colors.black12,
                          color: const Color(0xFF16A34A),
                          minHeight: 8,
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Metrics Grid Cards
            Row(
              children: [
                Expanded(
                  child: _MetricCard(
                    title: 'TOTAL CARBON SAVED',
                    value: profile.carbonSavedKg.toStringAsFixed(1),
                    unit: 'KG',
                    valueColor: const Color(0xFF16A34A),
                    isDark: isDark,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _MetricCard(
                    title: 'TREES EQUIVALENT',
                    value: profile.treesEquivalent.toStringAsFixed(1),
                    unit: 'TREES',
                    valueColor: isDark ? Colors.white : const Color(0xFF0F172A),
                    isDark: isDark,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _MetricCard(
                    title: 'ECO ACTIONS',
                    value: '${profile.ecoActionsCount}',
                    unit: 'TIMES',
                    valueColor: isDark ? Colors.white : const Color(0xFF0F172A),
                    isDark: isDark,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),

            // Achievement Badges
            const Text(
              '永續成就勳章 (Eco Achievements)',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.black),
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                _BadgeChip(title: '🌱 首次打卡', unlocked: true, isDark: isDark),
                const SizedBox(width: 8),
                _BadgeChip(title: '🚶 永續步行者', unlocked: true, isDark: isDark),
                const SizedBox(width: 8),
                _BadgeChip(title: '🛍️ 無痕購物王', unlocked: false, isDark: isDark),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _MetricCard extends StatelessWidget {
  final String title;
  final String value;
  final String unit;
  final Color valueColor;
  final bool isDark;

  const _MetricCard({
    required this.title,
    required this.value,
    required this.unit,
    required this.valueColor,
    required this.isDark,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      color: isDark ? const Color(0xFF1E293B) : Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 9, fontWeight: FontWeight.black, color: Colors.grey)),
          const SizedBox(height: 6),
          Row(
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(value, style: TextStyle(fontSize: 22, fontWeight: FontWeight.black, color: valueColor)),
              const SizedBox(width: 4),
              Text(unit, style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.grey)),
            ],
          ),
        ],
      ),
    );
  }
}

class _BadgeChip extends StatelessWidget {
  final String title;
  final bool unlocked;
  final bool isDark;

  const _BadgeChip({required this.title, required this.unlocked, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      color: unlocked
          ? (isDark ? const Color(0xFF1E293B) : Colors.white)
          : (isDark ? Colors.black26 : Colors.grey[200]),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: unlocked ? (isDark ? Colors.white : Colors.black87) : Colors.grey,
        ),
      ),
    );
  }
}
