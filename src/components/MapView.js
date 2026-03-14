// client/src/components/MapView.js
import React, { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { loadGoogleMaps } from "../utils/locationSearch";

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY || "";
const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN || "";

const buildPoints = (latitude, longitude, markers = []) =>
  [{ lat: latitude, lng: longitude }, ...markers].filter(
    (point) =>
      point &&
      point.lat !== null &&
      point.lat !== undefined &&
      point.lng !== null &&
      point.lng !== undefined
  );

const MapView = ({ latitude, longitude, markers = [], zoom = 14 }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const providerRef = useRef(null);
  const markerRefs = useRef([]);
  const googleMapsRef = useRef(null);
  const [mapError, setMapError] = useState("");

  const clearMarkers = useCallback(() => {
    if (providerRef.current === "google") {
      markerRefs.current.forEach((marker) => marker.setMap(null));
    } else {
      markerRefs.current.forEach((marker) => marker.remove());
    }
    markerRefs.current = [];
  }, []);

  const destroyMap = useCallback(() => {
    clearMarkers();

    if (providerRef.current === "mapbox" && mapRef.current?.remove) {
      mapRef.current.remove();
    }

    mapRef.current = null;
    providerRef.current = null;

    if (mapContainerRef.current) {
      mapContainerRef.current.innerHTML = "";
    }
  }, [clearMarkers]);

  useEffect(() => () => destroyMap(), [destroyMap]);

  useEffect(() => {
    let cancelled = false;

    const initializeMapbox = () => {
      if (!MAPBOX_TOKEN || !mapContainerRef.current) {
        setMapError("Map is unavailable until a map provider key is configured.");
        return;
      }

      mapboxgl.accessToken = MAPBOX_TOKEN;

      if (providerRef.current !== "mapbox" || !mapRef.current) {
        destroyMap();
        mapRef.current = new mapboxgl.Map({
          container: mapContainerRef.current,
          style: "mapbox://styles/mapbox/streets-v11",
          center: [longitude, latitude],
          zoom,
        });
        providerRef.current = "mapbox";
      }

      setMapError("");
    };

    const initializeGoogleMap = async () => {
      try {
        const maps = await loadGoogleMaps();
        if (cancelled || !maps || !mapContainerRef.current) {
          return;
        }

        googleMapsRef.current = maps;

        if (providerRef.current !== "google" || !mapRef.current) {
          destroyMap();
          mapRef.current = new maps.Map(mapContainerRef.current, {
            center: { lat: latitude, lng: longitude },
            zoom,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false,
          });
          providerRef.current = "google";
        }

        setMapError("");
      } catch (error) {
        if (!cancelled) {
          if (MAPBOX_TOKEN) {
            initializeMapbox();
            return;
          }

          setMapError("Map failed to load.");
        }
      }
    };

    if (GOOGLE_MAPS_API_KEY) {
      initializeGoogleMap();
    } else if (MAPBOX_TOKEN) {
      initializeMapbox();
    } else {
      setMapError("Map is unavailable until a map provider key is configured.");
    }

    return () => {
      cancelled = true;
    };
  }, [destroyMap, latitude, longitude, zoom]);

  useEffect(() => {
    if (!mapRef.current) return;

    const points = buildPoints(latitude, longitude, markers);

    if (points.length > 1) {
      if (providerRef.current === "google" && googleMapsRef.current) {
        const bounds = new googleMapsRef.current.LatLngBounds();
        points.forEach((point) => bounds.extend({ lat: point.lat, lng: point.lng }));
        mapRef.current.fitBounds(bounds, 60);
      } else {
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
      }
      return;
    }

    if (providerRef.current === "google") {
      mapRef.current.setCenter({ lat: latitude, lng: longitude });
      mapRef.current.setZoom(zoom);
    } else {
      mapRef.current.setCenter([longitude, latitude]);
      mapRef.current.setZoom(zoom);
    }
  }, [latitude, longitude, markers, zoom]);

  useEffect(() => {
    if (!mapRef.current) return;

    const markerPoints = markers.length
      ? markers
      : [{ lat: latitude, lng: longitude, color: "#0f766e" }];

    clearMarkers();

    if (providerRef.current === "google" && googleMapsRef.current) {
      markerRefs.current = markerPoints
        .filter(
          (marker) =>
            marker &&
            marker.lat !== null &&
            marker.lat !== undefined &&
            marker.lng !== null &&
            marker.lng !== undefined
        )
        .map(
          (marker) =>
            new googleMapsRef.current.Marker({
              map: mapRef.current,
              position: { lat: marker.lat, lng: marker.lng },
              icon: {
                path: googleMapsRef.current.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: marker.color || "#EF4444",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 1,
              },
            })
        );
      return;
    }

    markerRefs.current = markerPoints
      .filter(
        (marker) =>
          marker &&
          marker.lat !== null &&
          marker.lat !== undefined &&
          marker.lng !== null &&
          marker.lng !== undefined
      )
      .map((marker) => {
        const el = document.createElement("div");
        el.style.width = "12px";
        el.style.height = "12px";
        el.style.borderRadius = "9999px";
        el.style.background = marker.color || "#EF4444";

        return new mapboxgl.Marker(el)
          .setLngLat([marker.lng, marker.lat])
          .addTo(mapRef.current);
      });
  }, [clearMarkers, latitude, longitude, markers]);

  if (mapError) {
    return (
      <div className="flex h-[380px] items-center justify-center rounded-md border border-dashed border-ink-200 bg-sand-50 px-6 text-center text-sm leading-6 text-ink-500">
        {mapError}
      </div>
    );
  }

  return <div ref={mapContainerRef} className="h-[380px] w-full rounded-md" />;
};

export default MapView;
