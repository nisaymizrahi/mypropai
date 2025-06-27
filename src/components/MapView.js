import React, { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_TOKEN;

const MapView = ({ latitude, longitude, zoom = 13, markers = [] }) => {
  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markerRefs = useRef([]);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [longitude, latitude],
        zoom
      });
      mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");
    }

    mapRef.current.flyTo({ center: [longitude, latitude], zoom });

    // Clear previous markers
    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = [];

    // Add new markers
    markers.forEach(({ id, lat, lng, color, address, price, beds, baths, sqft }) => {
      const el = document.createElement("div");
      el.className = "marker";
      el.style.backgroundColor = color || "#3FB1CE";
      el.style.width = "14px";
      el.style.height = "14px";
      el.style.borderRadius = "50%";
      el.style.border = "2px solid white";

      const marker = new mapboxgl.Marker(el).setLngLat([lng, lat]);

      const popup = new mapboxgl.Popup({ offset: 24 }).setHTML(`
        <div style="font-family: sans-serif; font-size: 13px;">
          <strong>${address || "Unknown Property"}</strong><br/>
          ${beds || "?"} bd / ${baths || "?"} ba<br/>
          ${sqft ? sqft.toLocaleString() + " sqft<br/>" : ""}
          ${price ? "<strong>$" + price.toLocaleString() + "</strong>" : ""}
        </div>
      `);

      marker.setPopup(popup).addTo(mapRef.current);
      markerRefs.current.push(marker);
    });
  }, [latitude, longitude, zoom, markers]);

  return (
    <div
      ref={mapContainer}
      style={{
        width: "100%",
        height: "400px",
        borderRadius: "8px",
        boxShadow: "0 0 8px rgba(0,0,0,0.2)"
      }}
    />
  );
};

export default MapView;
