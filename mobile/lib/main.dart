import "package:flutter/material.dart";
import "package:namami_mobile/config.dart";

void main() {
  runApp(const NamamiApp());
}

class NamamiApp extends StatelessWidget {
  const NamamiApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "NAMAMI",
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF3DD6C6),
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const PhaseZeroHome(),
    );
  }
}

class PhaseZeroHome extends StatelessWidget {
  const PhaseZeroHome({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text("NAMAMI")),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Chip(
              label: Text(demoBanner()),
              backgroundColor: const Color(0xFF3A2E10),
            ),
            const SizedBox(height: 24),
            const Text(
              "Phase 0 platform placeholder",
              style: TextStyle(fontSize: 28, fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 12),
            const Text(
              "Android field client for the NAMAMI marine intelligence platform. "
              "This build only proves the app shell, fixture labeling, and configuration. "
              "Safety verdicts are never decided on-device by an LLM.",
            ),
            const SizedBox(height: 16),
            Text("Edge URL: $edgeUrl"),
            Text("Data mode: $dataMode"),
          ],
        ),
      ),
    );
  }
}
