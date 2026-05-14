class TaskModel {
  final int id;
  final int journeyId;
  final String title;
  final String stage;
  final String type;
  final bool completed;
  final String? deadline;
  final String? description;
  final String? buttonText;

  TaskModel({
    required this.id,
    required this.journeyId,
    required this.title,
    required this.stage,
    required this.type,
    required this.completed,
    this.deadline,
    this.description,
    this.buttonText,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    return TaskModel(
      id: json['id'],
      journeyId: json['journey_id'],
      title: json['title'],
      stage: json['stage'],
      type: json['type'],
      completed: json['completed'] ?? false,
      deadline: json['deadline'],
      description: json['description'],
      buttonText: json['button_text'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'journey_id': journeyId,
      'title': title,
      'stage': stage,
      'type': type,
      'completed': completed,
      'deadline': deadline,
      'description': description,
      'button_text': buttonText,
    };
  }

  // Create a copy with optional parameter changes
  TaskModel copyWith({
    int? id,
    int? journeyId,
    String? title,
    String? stage,
    String? type,
    bool? completed,
    String? deadline,
    String? description,
    String? buttonText,
  }) {
    return TaskModel(
      id: id ?? this.id,
      journeyId: journeyId ?? this.journeyId,
      title: title ?? this.title,
      stage: stage ?? this.stage,
      type: type ?? this.type,
      completed: completed ?? this.completed,
      deadline: deadline ?? this.deadline,
      description: description ?? this.description,
      buttonText: buttonText ?? this.buttonText,
    );
  }
}

