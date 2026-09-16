import "package:flutter_test/flutter_test.dart";
import "package:namami_mobile/main.dart";

void main() {
  testWidgets("shows fixture demo banner", (tester) async {
    await tester.pumpWidget(const NamamiApp());
    expect(find.textContaining("FIXTURE DATA"), findsOneWidget);
    expect(find.textContaining("Phase 0 platform placeholder"), findsOneWidget);
  });
}
