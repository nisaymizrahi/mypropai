// client/src/components/MapView.js
import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const MapView = ({ latitude, longitude, markers = [], zoom = 14 }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN || "";
    if (!mapRef.current && mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/mapbox/streets-v11",
        center: [longitude, latitude],
        zoom,
      });
    }
    return () => {};
  }, []); // init once

  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setCenter([longitude, latitude]);
      mapRef.current.setZoom(zoom);
    }
  }, [latitude, longitude, zoom]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing markers (store them on the map instance)
    if (!mapRef.current._mypropai_markers) mapRef.current._mypropai_markers = [];
    mapRef.current._mypropai_markers.forEach((m) => m.remove());
    mapRef.current._mypropai_markers = [];

    // Create markers
    markers.forEach((m) => {
      const el = document.createElement("div");
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "9999px";
      el.style.background = m.color || "#EF4444";

      const marker = new mapboxgl.Marker(el).setLngLat([m.lng, m.lat]).addTo(mapRef.current);
      mapRef.current._mypropai_markers.push(marker);
    });
  }, [markers]);

  return <div ref={mapContainerRef} className="w-full h-[380px] rounded-md" />;
};

export default MapView;
