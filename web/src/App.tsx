import React, { useState } from "react";
import { TopBar } from "./components/TopBar";
import { MapView } from "./components/MapView";
import { AskBar } from "./components/AskBar";
import { AdvisoryDrawer } from "./components/AdvisoryDrawer";

export const App: React.FC = () => {
  const [degradedTier] = useState("Tier 1 - Full Stack");
  const [isOnline] = useState(true);
  const [navicSimActive, setNavicSimActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [advisory, setAdvisory] = useState<any>(null);

  const defaultCenter: [number, number] = [79.35, 9.22]; // Rameswaram / Mandapam coast

  const handleAsk = async (queryText: string) => {
    setIsLoading(true);
    try {
      const res = await fetch("/v1/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query_text: queryText,
          current_location: { latitude: 9.22, longitude: 79.35 },
        }),
      });
      const data = await res.json();
      setAdvisory(data);
    } catch (err) {
      console.error("Ask query failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const pfzNodes = advisory?.nearest_pfz_distance_km
    ? [{ latitude: 9.22, longitude: 79.35, sector: "Rameswaram South" }]
    : [];

  return (
    <div className="app-container">
      <TopBar
        degradedTier={degradedTier}
        isOnline={isOnline}
        navicSimActive={navicSimActive}
        onToggleNavIC={() => setNavicSimActive(!navicSimActive)}
      />
      <MapView center={defaultCenter} zoom={9} pfzNodes={pfzNodes} />
      <AskBar onAsk={handleAsk} isLoading={isLoading} />
      <AdvisoryDrawer advisory={advisory} onClose={() => setAdvisory(null)} />
    </div>
  );
};

export default App;
