import 'package:dio/dio.dart';

class ApiClient {
  static const String baseUrl = 'https://onboardhub-backend.onrender.com/api/v1';
  final Dio dio;

  ApiClient() : dio = Dio(BaseOptions(
    baseUrl: baseUrl,
    connectTimeout: const Duration(seconds: 10),
    receiveTimeout: const Duration(seconds: 10),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  )) {
    dio.interceptors.add(LogInterceptor(responseBody: true));
  }

  Future<Response> get(String path) async {
    return await dio.get(path);
  }

  Future<Response> put(String path, dynamic data) async {
    return await dio.put(path, data: data);
  }
}
