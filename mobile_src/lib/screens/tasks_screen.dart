import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../repositories/journey_provider.dart';

class TasksScreen extends StatelessWidget {
  const TasksScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Tareas', style: TextStyle(fontWeight: FontWeight.bold)),
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
      ),
      body: Consumer<JourneyProvider>(
        builder: (context, provider, child) {
          final journey = provider.currentJourney;
          
          if (journey == null) {
            return const Center(child: Text("No hay tareas disponibles."));
          }

          if (journey.tasks.isEmpty) {
            return const Center(child: Text("Este onboarding no tiene tareas asignadas."));
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16.0),
            itemCount: journey.tasks.length,
            itemBuilder: (context, index) {
              final task = journey.tasks[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                child: CheckboxListTile(
                  title: Text(
                    task.title,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      decoration: task.completed ? TextDecoration.lineThrough : null,
                      color: task.completed ? Colors.grey : Colors.black87,
                    ),
                  ),
                  subtitle: Text(task.stage),
                  value: task.completed,
                  activeColor: Theme.of(context).colorScheme.primary,
                  onChanged: (bool? newValue) {
                    if (newValue != null) {
                      provider.toggleTaskStatus(task.id, newValue);
                    }
                  },
                ),
              );

            },
          );
        },
      ),
    );
  }
}
