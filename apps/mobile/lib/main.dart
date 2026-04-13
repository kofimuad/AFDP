import 'package:flutter/material.dart';

void main() {
  runApp(const AfdpApp());
}

class AfdpApp extends StatelessWidget {
  const AfdpApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'AFDP',
      home: Scaffold(
        appBar: AppBar(title: const Text('AFDP Mobile Scaffold')),
        body: const Center(
          child: Text('BLoC + API-first architecture scaffold is ready.'),
        ),
      ),
    );
  }
}
