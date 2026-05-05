class TaskModel {
  final int id;
  final int journeyId;
  final String titulo;
  final String etapa;
  final String tipo;
  final bool completada;
  final String? fechaLimite;
  final String? descripcion;
  final String? textoBoton;

  TaskModel({
    required this.id,
    required this.journeyId,
    required this.titulo,
    required this.etapa,
    required this.tipo,
    required this.completada,
    this.fechaLimite,
    this.descripcion,
    this.textoBoton,
  });

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    return TaskModel(
      id: json['id'],
      journeyId: json['journey_id'],
      titulo: json['titulo'],
      etapa: json['etapa'],
      tipo: json['tipo'],
      completada: json['completada'] ?? false,
      fechaLimite: json['fecha_limite'],
      descripcion: json['descripcion'],
      textoBoton: json['texto_boton'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'journey_id': journeyId,
      'titulo': titulo,
      'etapa': etapa,
      'tipo': tipo,
      'completada': completada,
      'fecha_limite': fechaLimite,
      'descripcion': descripcion,
      'texto_boton': textoBoton,
    };
  }

  // Permite crear una copia de la tarea marcándola como completada
  TaskModel copyWith({bool? completada}) {
    return TaskModel(
      id: id,
      journeyId: journeyId,
      titulo: titulo,
      etapa: etapa,
      tipo: tipo,
      completada: completada ?? this.completada,
      fechaLimite: fechaLimite,
      descripcion: descripcion,
      textoBoton: textoBoton,
    );
  }
}
