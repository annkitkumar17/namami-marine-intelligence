const dataMode = String.fromEnvironment("NAMAMI_DATA_MODE", defaultValue: "FIXTURE");
const edgeUrl = String.fromEnvironment("NAMAMI_EDGE_URL", defaultValue: "http://10.0.2.2:4000");

bool get isFixtureMode => dataMode == "FIXTURE";

String demoBanner() =>
    "$dataMode DATA — simulated / mock sources. Not operational marine advice.";
