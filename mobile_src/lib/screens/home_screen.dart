import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../repositories/journey_provider.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mi Viaje', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
      ),
      body: Consumer<JourneyProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.currentJourney == null) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.error != null && provider.currentJourney == null) {
            return Center(child: Text(provider.error!));
          }

          final journey = provider.currentJourney;
          if (journey == null) {
            return const Center(child: Text("No hay datos del Journey."));
          }

          final progress = journey.calculatedProgress;

          return RefreshIndicator(
            onRefresh: () => provider.fetchJourney(),
            child: ListView(
              padding: const EdgeInsets.all(16.0),
              children: [
                if (provider.isOfflineMode)
                  Container(
                    margin: const EdgeInsets.only(bottom: 16),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.orange.shade100,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.wifi_off, color: Colors.orange),
                        SizedBox(width: 8),
                        Expanded(child: Text("Modo Offline. Mostrando datos guardados.", style: TextStyle(color: Colors.deepOrange))),
                      ],
                    ),
                  ),
                Card(
                  elevation: 2,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                  child: Padding(
                    padding: const EdgeInsets.all(24.0),
                    child: Column(
                      children: [
                        const Text('Progreso de Onboarding', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                        const SizedBox(height: 24),
                        Stack(
                          alignment: Alignment.center,
                          children: [
                            SizedBox(
                              width: 120,
                              height: 120,
                              child: CircularProgressIndicator(
                                value: progress / 100,
                                strokeWidth: 10,
                                backgroundColor: Colors.grey.shade200,
                                color: Theme.of(context).colorScheme.primary,
                              ),
                            ),
                            Text('$progress%', style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
                const Text('Próxima Tarea', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 8),
                _buildNextTaskCard(journey),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildNextTaskCard(journey) {
    final pendingTasks = journey.tasks.where((t) => !t.completed).toList();
    if (pendingTasks.isEmpty) {
      return const Card(
        child: Padding(
          padding: EdgeInsets.all(16.0),
          child: Text("¡Felicidades! Has completado todas las tareas."),
        ),
      );
    }

    final nextTask = pendingTasks.first;
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.all(16),
        leading: CircleAvatar(
          backgroundColor: Colors.blue.shade100,
          child: const Icon(Icons.assignment, color: Colors.blue),
        ),
        title: Text(nextTask.title, style: const TextStyle(fontWeight: FontWeight.bold)),
        subtitle: Text(nextTask.stage),
        trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      ),
    );
  }

}
