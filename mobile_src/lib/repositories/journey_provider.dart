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

  // En un entorno real, esto vendría del Login. Para MVP, hardcodeado.
  final int empleadoId = 1;

  Future<void> fetchJourney() async {
    isLoading = true;
    error = null;
    notifyListeners();

    try {
      // Intentar obtener de la API
      final response = await _api.get('/journeys/empleado/$empleadoId');
      
      // La API devuelve un array, asumimos el primero
      if (response.data is List && response.data.isNotEmpty) {
        final Map<String, dynamic> journeyData = response.data[0];
        currentJourney = JourneyModel.fromJson(journeyData);
        
        // Guardar en caché local
        await LocalStorage.saveJourneyData(journeyData);
        isOfflineMode = false;
      } else {
        error = "No tienes onboarding asignado.";
      }
    } catch (e) {
      // Falló la red (Offline), intentar cargar de caché
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

    // Actualización optimista UI
    final taskIndex = currentJourney!.tasks.indexWhere((t) => t.id == taskId);
    if (taskIndex == -1) return;

    currentJourney!.tasks[taskIndex] = currentJourney!.tasks[taskIndex].copyWith(completada: newStatus);
    notifyListeners();

    if (isOfflineMode) {
      // Guardar el estado offline para luego sincronizar
      await LocalStorage.saveJourneyData(currentJourney!.toJson());
      return;
    }

    try {
      // Enviar al backend real
      await _api.put('/journeys/task/$taskId', {"completada": newStatus});
      // Actualizar la caché con el nuevo JSON exacto
      await LocalStorage.saveJourneyData(currentJourney!.toJson());
    } catch (e) {
      print("Error actualizando tarea en backend: $e");
      // Revertir estado si falla
      currentJourney!.tasks[taskIndex] = currentJourney!.tasks[taskIndex].copyWith(completada: !newStatus);
      notifyListeners();
    }
  }
}
