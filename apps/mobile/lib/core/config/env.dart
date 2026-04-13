class Env {
  static const String apiBaseUrl = String.fromEnvironment(
    'AFDP_API_BASE_URL',
    defaultValue: 'http://localhost:8000',
  );
}
