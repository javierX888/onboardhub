import 'task_model.dart';

class JourneyModel {
  final int id;
  final int empleadoId;
  final int plantillaId;
  final String rol;
  final int progreso;
  final String? fechaInicio;
  final String? fechaTermino;
  final List<TaskModel> tasks;

  JourneyModel({
    required this.id,
    required this.empleadoId,
    required this.plantillaId,
    required this.rol,
    required this.progreso,
    this.fechaInicio,
    this.fechaTermino,
    required this.tasks,
  });

  factory JourneyModel.fromJson(Map<String, dynamic> json) {
    var list = json['tasks'] as List? ?? [];
    List<TaskModel> tasksList = list.map((i) => TaskModel.fromJson(i)).toList();

    return JourneyModel(
      id: json['id'],
      empleadoId: json['empleado_id'],
      plantillaId: json['plantilla_id'],
      rol: json['rol'] ?? 'EMPLEADO',
      progreso: json['progreso'] ?? 0,
      fechaInicio: json['fecha_inicio'],
      fechaTermino: json['fecha_termino'],
      tasks: tasksList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'empleado_id': empleadoId,
      'plantilla_id': plantillaId,
      'rol': rol,
      'progreso': progreso,
      'fecha_inicio': fechaInicio,
      'fecha_termino': fechaTermino,
      'tasks': tasks.map((t) => t.toJson()).toList(),
    };
  }

  // Calculate local progress based on completed tasks
  int get calculatedProgress {
    if (tasks.isEmpty) return 0;
    int completed = tasks.where((t) => t.completada).length;
    return ((completed / tasks.length) * 100).round();
  }
}
