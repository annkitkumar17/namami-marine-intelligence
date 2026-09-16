import React, { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";

interface MapViewProps {
  center: [number, number];
  zoom: number;
  pfzNodes?: Array<{ latitude: number; longitude: number; sector: string }>;
}

export const MapView: React.FC<MapViewProps> = ({ center, zoom, pfzNodes = [] }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    mapRef.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          "osm-tiles": {
            type: "raster",
            tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm-tiles",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: center,
      zoom: zoom,
    });

    mapRef.current.addControl(new maplibregl.NavigationControl(), "top-right");

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [center, zoom]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Add PFZ marker layer visualization
    pfzNodes.forEach((node) => {
      new maplibregl.Marker({ color: "#00f2fe" })
        .setLngLat([node.longitude, node.latitude])
        .setPopup(new maplibregl.Popup().setHTML(`<strong>PFZ Node: ${node.sector}</strong>`))
        .addTo(mapRef.current!);
    });
  }, [pfzNodes]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: 1,
      }}
    />
  );
};
