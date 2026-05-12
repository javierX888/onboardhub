import 'task_model.dart';

class JourneyModel {
  final int id;
  final int employeeId;
  final int templateId;
  final String role;
  final int progress;
  final String? startDate;
  final String? endDate;
  final List<TaskModel> tasks;

  JourneyModel({
    required this.id,
    required this.employeeId,
    required this.templateId,
    required this.role,
    required this.progress,
    this.startDate,
    this.endDate,
    required this.tasks,
  });

  factory JourneyModel.fromJson(Map<String, dynamic> json) {
    var list = json['tasks'] as List? ?? [];
    List<TaskModel> tasksList = list.map((i) => TaskModel.fromJson(i)).toList();

    return JourneyModel(
      id: json['id'],
      employeeId: json['employee_id'],
      templateId: json['template_id'],
      role: json['role'] ?? 'EMPLOYEE',
      progress: json['progress'] ?? 0,
      startDate: json['start_date'],
      endDate: json['end_date'],
      tasks: tasksList,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'employee_id': employeeId,
      'template_id': templateId,
      'role': role,
      'progress': progress,
      'start_date': startDate,
      'end_date': endDate,
      'tasks': tasks.map((t) => t.toJson()).toList(),
    };
  }

  // Calculate local progress based on completed tasks
  int get calculatedProgress {
    if (tasks.isEmpty) return 0;
    int completedCount = tasks.where((t) => t.completed).length;
    return ((completedCount / tasks.length) * 100).round();
  }
}

