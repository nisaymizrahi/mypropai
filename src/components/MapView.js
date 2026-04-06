// client/src/components/MapView.js
import React, { useCallback, useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { loadGoogleMaps } from "../utils/locationSearch";
import { QA_MAP_PROVIDER, isQaMode } from "../qa/browser/config";

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

const buildMarkerPoints = (latitude, longitude, markers = []) =>
  (markers.length ? markers : [{ lat: latitude, lng: longitude, color: "#0f766e" }]).filter(
    (marker) =>
      marker &&
      marker.lat !== null &&
      marker.lat !== undefined &&
      marker.lng !== null &&
      marker.lng !== undefined
  );

const buildCircleCoordinates = (latitude, longitude, radiusMiles, steps = 64) => {
  if (!radiusMiles) return [];
  const earthRadiusMiles = 3958.8;
  const latRadians = (latitude * Math.PI) / 180;
  const lngRadians = (longitude * Math.PI) / 180;
  const angularDistance = radiusMiles / earthRadiusMiles;
  const coordinates = [];

  for (let index = 0; index <= steps; index += 1) {
    const bearing = (2 * Math.PI * index) / steps;
    const lat2 = Math.asin(
      Math.sin(latRadians) * Math.cos(angularDistance) +
        Math.cos(latRadians) * Math.sin(angularDistance) * Math.cos(bearing)
    );
    const lng2 =
      lngRadians +
      Math.atan2(
        Math.sin(bearing) * Math.sin(angularDistance) * Math.cos(latRadians),
        Math.cos(angularDistance) - Math.sin(latRadians) * Math.sin(lat2)
      );

    coordinates.push([(lng2 * 180) / Math.PI, (lat2 * 180) / Math.PI]);
  }

  return coordinates;
};

const QaMapPreview = ({ latitude, longitude, markers = [] }) => {
  const markerPoints = buildMarkerPoints(latitude, longitude, markers);
  const bounds = markerPoints.reduce(
    (accumulator, marker) => ({
      minLat: Math.min(accumulator.minLat, marker.lat),
      maxLat: Math.max(accumulator.maxLat, marker.lat),
      minLng: Math.min(accumulator.minLng, marker.lng),
      maxLng: Math.max(accumulator.maxLng, marker.lng),
    }),
    {
      minLat: latitude,
      maxLat: latitude,
      minLng: longitude,
      maxLng: longitude,
    }
  );

  const latRange = Math.max(bounds.maxLat - bounds.minLat, 0.001);
  const lngRange = Math.max(bounds.maxLng - bounds.minLng, 0.001);

  const getPosition = (marker) => ({
    left: `${12 + ((marker.lng - bounds.minLng) / lngRange) * 76}%`,
    top: `${16 + (1 - (marker.lat - bounds.minLat) / latRange) * 68}%`,
  });

  return (
    <div
      data-testid="property-map"
      data-map-provider={QA_MAP_PROVIDER}
      data-marker-count={markerPoints.length}
      className="relative h-[380px] overflow-hidden rounded-md border border-ink-100 bg-[radial-gradient(circle_at_top,_rgba(15,118,110,0.14),_transparent_42%),linear-gradient(180deg,_rgba(255,255,255,0.95),_rgba(245,239,230,0.96))]"
    >
      <div className="absolute inset-0 bg-[linear-gradient(rgba(141,119,92,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(141,119,92,0.08)_1px,transparent_1px)] bg-[size:52px_52px]" />
      <div className="absolute inset-x-4 top-4 flex items-center justify-between rounded-full bg-white/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-ink-500 shadow-soft">
        <span>QA map preview</span>
        <span>{markerPoints.length} marker{markerPoints.length === 1 ? "" : "s"}</span>
      </div>
      {markerPoints.map((marker, index) => (
        <div
          key={`${marker.lat}-${marker.lng}-${index}`}
          data-testid="map-marker"
          data-marker-index={index}
          data-marker-color={marker.color || "#ef4444"}
          className="absolute -translate-x-1/2 -translate-y-1/2"
          style={getPosition(marker)}
        >
          <div
            className="h-4 w-4 rounded-full border-2 border-white shadow-[0_8px_18px_rgba(47,37,29,0.16)]"
            style={{ background: marker.color || "#ef4444" }}
          />
        </div>
      ))}
    </div>
  );
};

const MapView = ({ latitude, longitude, markers = [], zoom = 14, radiusMiles = null }) => {
  const qaModeEnabled = isQaMode;
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const providerRef = useRef(null);
  const markerRefs = useRef([]);
  const radiusOverlayRef = useRef(null);
  const googleMapsRef = useRef(null);
  const [mapError, setMapError] = useState("");
  const markerPoints = buildMarkerPoints(latitude, longitude, markers);

  const clearMarkers = useCallback(() => {
    if (providerRef.current === "google") {
      markerRefs.current.forEach((marker) => marker.setMap(null));
    } else {
      markerRefs.current.forEach((marker) => marker.remove());
    }
    markerRefs.current = [];
  }, []);

  const clearRadiusOverlay = useCallback(() => {
    if (providerRef.current === "google") {
      radiusOverlayRef.current?.setMap?.(null);
    } else if (providerRef.current === "mapbox" && mapRef.current) {
      if (mapRef.current.getLayer("deal-report-radius-fill")) {
        mapRef.current.removeLayer("deal-report-radius-fill");
      }
      if (mapRef.current.getLayer("deal-report-radius-outline")) {
        mapRef.current.removeLayer("deal-report-radius-outline");
      }
      if (mapRef.current.getSource("deal-report-radius")) {
        mapRef.current.removeSource("deal-report-radius");
      }
    }

    radiusOverlayRef.current = null;
  }, []);

  const destroyMap = useCallback(() => {
    clearMarkers();
    clearRadiusOverlay();

    if (providerRef.current === "mapbox" && mapRef.current?.remove) {
      mapRef.current.remove();
    }

    mapRef.current = null;
    providerRef.current = null;

    if (mapContainerRef.current) {
      mapContainerRef.current.innerHTML = "";
    }
  }, [clearMarkers, clearRadiusOverlay]);

  useEffect(() => {
    if (qaModeEnabled) {
      return undefined;
    }

    return () => destroyMap();
  }, [destroyMap, qaModeEnabled]);

  useEffect(() => {
    if (qaModeEnabled) {
      return undefined;
    }

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
        mapRef.current.once("load", () => {
          mapRef.current?.resize?.();
        });
        window.requestAnimationFrame(() => {
          mapRef.current?.resize?.();
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
  }, [destroyMap, latitude, longitude, qaModeEnabled, zoom]);

  useEffect(() => {
    if (qaModeEnabled) return undefined;
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
  }, [latitude, longitude, markers, qaModeEnabled, zoom]);

  useEffect(() => {
    if (qaModeEnabled) return undefined;
    if (!mapRef.current) return;

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
  }, [clearMarkers, latitude, longitude, markers, qaModeEnabled, markerPoints]);

  useEffect(() => {
    if (qaModeEnabled) return undefined;
    if (!mapRef.current) return;

    clearRadiusOverlay();

    if (!radiusMiles) return;

    if (providerRef.current === "google" && googleMapsRef.current) {
      radiusOverlayRef.current = new googleMapsRef.current.Circle({
        map: mapRef.current,
        center: { lat: latitude, lng: longitude },
        radius: radiusMiles * 1609.34,
        fillColor: "#d97706",
        fillOpacity: 0.08,
        strokeColor: "#d97706",
        strokeOpacity: 0.45,
        strokeWeight: 2,
      });
      return;
    }

    const circleCoordinates = buildCircleCoordinates(latitude, longitude, radiusMiles);
    if (!circleCoordinates.length) return;

    mapRef.current.addSource("deal-report-radius", {
      type: "geojson",
      data: {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [circleCoordinates],
        },
      },
    });

    mapRef.current.addLayer({
      id: "deal-report-radius-fill",
      type: "fill",
      source: "deal-report-radius",
      paint: {
        "fill-color": "#d97706",
        "fill-opacity": 0.08,
      },
    });

    mapRef.current.addLayer({
      id: "deal-report-radius-outline",
      type: "line",
      source: "deal-report-radius",
      paint: {
        "line-color": "#d97706",
        "line-width": 2,
        "line-opacity": 0.45,
      },
    });
  }, [clearRadiusOverlay, latitude, longitude, qaModeEnabled, radiusMiles]);

  if (qaModeEnabled) {
    return <QaMapPreview latitude={latitude} longitude={longitude} markers={markers} />;
  }

  if (mapError) {
    return (
      <div
        data-testid="property-map"
        data-map-provider="unavailable"
        data-map-error={mapError}
        data-marker-count={markerPoints.length}
        className="flex h-[380px] items-center justify-center rounded-md border border-dashed border-ink-200 bg-sand-50 px-6 text-center text-sm leading-6 text-ink-500"
      >
        {mapError}
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      data-testid="property-map"
      data-map-provider={providerRef.current || "loading"}
      data-marker-count={markerPoints.length}
      className="h-[380px] w-full rounded-md"
    />
  );
};

export default MapView;
