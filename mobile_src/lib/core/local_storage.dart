import 'package:hive_flutter/hive_flutter.dart';
import 'dart:convert';

class LocalStorage {
  static const String boxName = 'onboardhub_box';
  static const String journeyKey = 'cached_journey';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox(boxName);
  }

  static Future<void> saveJourneyData(Map<String, dynamic> jsonData) async {
    final box = Hive.box(boxName);
    await box.put(journeyKey, jsonEncode(jsonData));
  }

  static Map<String, dynamic>? getCachedJourney() {
    final box = Hive.box(boxName);
    final String? data = box.get(journeyKey);
    if (data != null) {
      return jsonDecode(data);
    }
    return null;
  }
}
