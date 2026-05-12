import 'package:flutter/material.dart';
import '../models/journey_model.dart';
import '../models/task_model.dart';
import '../core/api_client.dart';
import '../core/local_storage.dart';

class JourneyProvider with ChangeNotifier {
  final ApiClient _api = ApiClient();
  JourneyModel? currentJourney;
  bool isLoading = false;
  String? error;
  bool isOfflineMode = false;

  // In a real environment, these would come from the Login. For MVP, hardcoded.
  final int employeeId = 1;
  final int clientId = 1;

  Future<void> fetchJourney() async {
    isLoading = true;
    error = null;
    notifyListeners();

    try {
      // Try to fetch from the API
      // Backend endpoint: GET /api/v1/journeys/employee/{id}?client_id={id}
      final response = await _api.get('/journeys/employee/$employeeId?client_id=$clientId');
      
      // API returns an array, assume the first one
      if (response.data is List && response.data.isNotEmpty) {
        final Map<String, dynamic> journeyData = response.data[0];
        currentJourney = JourneyModel.fromJson(journeyData);
        
        // Save to local cache
        await LocalStorage.saveJourneyData(journeyData);
        isOfflineMode = false;
      } else {
        error = "No tienes onboarding asignado.";
      }
    } catch (e) {
      // Network failed (Offline), try to load from cache
      print("Error de red: $e. Intentando cargar caché local...");
      final cachedData = LocalStorage.getCachedJourney();
      
      if (cachedData != null) {
        currentJourney = JourneyModel.fromJson(cachedData);
        isOfflineMode = true;
      } else {
        error = "Sin conexión a internet y sin datos guardados.";
      }
    }

    isLoading = false;
    notifyListeners();
  }

  Future<void> toggleTaskStatus(int taskId, bool newStatus) async {
    if (currentJourney == null) return;

    // Optimistic UI update
    final taskIndex = currentJourney!.tasks.indexWhere((t) => t.id == taskId);
    if (taskIndex == -1) return;

    currentJourney!.tasks[taskIndex] = currentJourney!.tasks[taskIndex].copyWith(completed: newStatus);
    notifyListeners();

    if (isOfflineMode) {
      // Save offline state to sync later
      await LocalStorage.saveJourneyData(currentJourney!.toJson());
      return;
    }

    try {
      // Send to real backend
      // Backend endpoint: PUT /api/v1/journeys/task/{id}?client_id={id}
      await _api.put('/journeys/task/$taskId?client_id=$clientId', {"completed": newStatus});
      
      // Update cache with the exact new JSON
      await LocalStorage.saveJourneyData(currentJourney!.toJson());
    } catch (e) {
      print("Error actualizando tarea en backend: $e");
      // Revert state if failed
      currentJourney!.tasks[taskIndex] = currentJourney!.tasks[taskIndex].copyWith(completed: !newStatus);
      notifyListeners();
    }
  }
}

