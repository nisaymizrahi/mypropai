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
  }, [latitude, longitude, zoom]);

  useEffect(() => {
    if (!mapRef.current) return;

    const points = [{ lat: latitude, lng: longitude }, ...markers].filter(
      (point) =>
        point &&
        point.lat !== null &&
        point.lat !== undefined &&
        point.lng !== null &&
        point.lng !== undefined
    );

    if (points.length > 1) {
      const bounds = points.slice(1).reduce(
        (accumulator, point) => accumulator.extend([point.lng, point.lat]),
        new mapboxgl.LngLatBounds(
          [points[0].lng, points[0].lat],
          [points[0].lng, points[0].lat]
        )
      );

      mapRef.current.fitBounds(bounds, {
        padding: 60,
        maxZoom: zoom,
      });
      return;
    }

    mapRef.current.setCenter([longitude, latitude]);
    mapRef.current.setZoom(zoom);
  }, [latitude, longitude, markers, zoom]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing markers (store them on the map instance)
    if (!mapRef.current._fliprop_markers) mapRef.current._fliprop_markers = [];
    mapRef.current._fliprop_markers.forEach((m) => m.remove());
    mapRef.current._fliprop_markers = [];

    // Create markers
    markers.forEach((m) => {
      const el = document.createElement("div");
      el.style.width = "12px";
      el.style.height = "12px";
      el.style.borderRadius = "9999px";
      el.style.background = m.color || "#EF4444";

      const marker = new mapboxgl.Marker(el).setLngLat([m.lng, m.lat]).addTo(mapRef.current);
      mapRef.current._fliprop_markers.push(marker);
    });
  }, [markers]);

  return <div ref={mapContainerRef} className="w-full h-[380px] rounded-md" />;
};

export default MapView;
