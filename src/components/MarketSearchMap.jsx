import React, { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { formatCurrency } from "../utils/compsReport";
import { MAPBOX_TOKEN } from "../utils/env";

const DEFAULT_CENTER = [-98.5795, 39.8283];
const DEFAULT_ZOOM = 3.5;
const SOURCE_ID = "market-search-listings";
const CLUSTER_LAYER_ID = "market-search-clusters";
const CLUSTER_COUNT_LAYER_ID = "market-search-cluster-count";
const POINT_LAYER_ID = "market-search-points";

const buildEmptyFeatureCollection = () => ({
  type: "FeatureCollection",
  features: [],
});

const hasCoordinates = (listing) =>
  Number.isFinite(Number(listing?.longitude)) && Number.isFinite(Number(listing?.latitude));

const buildFeatureCollection = (listings = []) => ({
  type: "FeatureCollection",
  features: listings
    .filter((listing) => listing?.id && hasCoordinates(listing))
    .map((listing) => ({
      id: listing.id,
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [Number(listing.longitude), Number(listing.latitude)],
      },
      properties: {
        listingId: listing.listingId || "",
        address: listing.address || "",
        price: listing.price ?? null,
        status: listing.status || "",
        photoUrl: listing.photoUrl || "",
        propertyType: listing.propertyType || "",
        existingLeadId: listing.existingLeadId || "",
      },
    })),
});

const buildPopupContent = (listing) => {
  const root = document.createElement("div");
  root.className = "market-search-popup-card";

  const priceNode = document.createElement("p");
  priceNode.className = "market-search-popup-price";
  priceNode.textContent = formatCurrency(listing.price);
  root.appendChild(priceNode);

  const addressNode = document.createElement("p");
  addressNode.className = "market-search-popup-address";
  addressNode.textContent = listing.address || "Untitled property";
  root.appendChild(addressNode);

  const metaNode = document.createElement("p");
  metaNode.className = "market-search-popup-meta";
  metaNode.textContent = [
    listing.bedrooms ? `${listing.bedrooms} bd` : null,
    listing.bathrooms ? `${listing.bathrooms} ba` : null,
    listing.squareFootage ? `${Number(listing.squareFootage).toLocaleString()} sqft` : null,
  ]
    .filter(Boolean)
    .join(" • ");
  root.appendChild(metaNode);

  return root;
};

const buildBoundsFromListings = (listings = []) => {
  const listingsWithCoordinates = listings.filter(hasCoordinates);
  if (!listingsWithCoordinates.length) {
    return null;
  }

  return listingsWithCoordinates.slice(1).reduce(
    (bounds, listing) =>
      bounds.extend([Number(listing.longitude), Number(listing.latitude)]),
    new mapboxgl.LngLatBounds(
      [Number(listingsWithCoordinates[0].longitude), Number(listingsWithCoordinates[0].latitude)],
      [Number(listingsWithCoordinates[0].longitude), Number(listingsWithCoordinates[0].latitude)]
    )
  );
};

const MarketSearchMap = ({
  listings = [],
  selectedListingId = "",
  searchCenter = null,
  fitBoundsToken = 0,
  focusSelectedToken = 0,
  onSelectListing,
  onViewportChange,
  className = "",
}) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const mapReadyRef = useRef(false);
  const selectedFeatureIdRef = useRef("");
  const suppressViewportChangeRef = useRef(false);
  const latestSelectHandlerRef = useRef(onSelectListing);
  const latestViewportHandlerRef = useRef(onViewportChange);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    latestSelectHandlerRef.current = onSelectListing;
  }, [onSelectListing]);

  useEffect(() => {
    latestViewportHandlerRef.current = onViewportChange;
  }, [onViewportChange]);

  useEffect(() => {
    if (!mapContainerRef.current) {
      return undefined;
    }

    if (!MAPBOX_TOKEN) {
      setMapError("Map search is unavailable until a Mapbox token is configured.");
      return undefined;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    });

    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: false }), "top-right");

    const handleMoveEnd = () => {
      if (suppressViewportChangeRef.current) {
        suppressViewportChangeRef.current = false;
        return;
      }

      const bounds = map.getBounds();
      latestViewportHandlerRef.current?.({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    };

    const setInteractiveCursor = () => {
      map.getCanvas().style.cursor = "pointer";
    };

    const resetCursor = () => {
      map.getCanvas().style.cursor = "";
    };

    const handleClusterClick = (event) => {
      const feature = event.features?.[0];
      const clusterId = feature?.properties?.cluster_id;
      if (clusterId === undefined || clusterId === null) {
        return;
      }

      const source = map.getSource(SOURCE_ID);
      if (!source?.getClusterExpansionZoom) {
        return;
      }

      source.getClusterExpansionZoom(clusterId, (error, zoom) => {
        if (error) {
          return;
        }

        suppressViewportChangeRef.current = true;
        map.easeTo({
          center: feature.geometry.coordinates,
          zoom,
          duration: 450,
        });
      });
    };

    const handlePointClick = (event) => {
      const feature = event.features?.[0];
      if (!feature?.id) {
        return;
      }

      latestSelectHandlerRef.current?.(String(feature.id), { source: "map" });
    };

    map.on("load", () => {
      mapReadyRef.current = true;
      setMapError("");

      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: buildEmptyFeatureCollection(),
        cluster: true,
        clusterMaxZoom: 13,
        clusterRadius: 52,
      });

      map.addLayer({
        id: CLUSTER_LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#1c1713",
            12,
            "#435f59",
            36,
            "#a8735b",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            12,
            24,
            36,
            30,
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
          "circle-opacity": 0.92,
        },
      });

      map.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: "symbol",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-size": 12,
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      map.addLayer({
        id: POINT_LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-radius": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            10,
            7,
          ],
          "circle-color": [
            "case",
            ["has", "existingLeadId"],
            "#435f59",
            ["<=", ["coalesce", ["to-number", ["get", "price"]], 0], 0],
            "#1c1713",
            ["<", ["coalesce", ["to-number", ["get", "price"]], 0], 350000],
            "#435f59",
            ["<", ["coalesce", ["to-number", ["get", "price"]], 0], 750000],
            "#6d7f5d",
            "#a8735b",
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": [
            "case",
            ["boolean", ["feature-state", "selected"], false],
            3,
            1.6,
          ],
          "circle-opacity": 0.94,
        },
      });

      map.on("click", CLUSTER_LAYER_ID, handleClusterClick);
      map.on("click", POINT_LAYER_ID, handlePointClick);
      map.on("mouseenter", CLUSTER_LAYER_ID, setInteractiveCursor);
      map.on("mouseleave", CLUSTER_LAYER_ID, resetCursor);
      map.on("mouseenter", POINT_LAYER_ID, setInteractiveCursor);
      map.on("mouseleave", POINT_LAYER_ID, resetCursor);
      map.on("moveend", handleMoveEnd);
    });

    const resizeMap = () => {
      map.resize();
    };

    window.addEventListener("resize", resizeMap);

    const resizeObserver =
      typeof ResizeObserver === "function"
        ? new ResizeObserver(() => {
            map.resize();
          })
        : null;

    if (resizeObserver && mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    return () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", resizeMap);
      popupRef.current?.remove();
      popupRef.current = null;
      selectedFeatureIdRef.current = "";
      mapReadyRef.current = false;
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapReadyRef.current || !mapRef.current) {
      return;
    }

    const source = mapRef.current.getSource(SOURCE_ID);
    if (!source?.setData) {
      return;
    }

    source.setData(buildFeatureCollection(listings));
  }, [listings]);

  useEffect(() => {
    if (!mapReadyRef.current || !mapRef.current) {
      return;
    }

    if (selectedFeatureIdRef.current) {
      mapRef.current.setFeatureState(
        { source: SOURCE_ID, id: selectedFeatureIdRef.current },
        { selected: false }
      );
    }

    selectedFeatureIdRef.current = "";

    if (!selectedListingId) {
      popupRef.current?.remove();
      popupRef.current = null;
      return;
    }

    const selectedListing = listings.find((listing) => listing.id === selectedListingId);
    if (!selectedListing) {
      popupRef.current?.remove();
      popupRef.current = null;
      return;
    }

    mapRef.current.setFeatureState(
      { source: SOURCE_ID, id: selectedListingId },
      { selected: true }
    );
    selectedFeatureIdRef.current = selectedListingId;

    popupRef.current?.remove();
    popupRef.current = null;

    if (!hasCoordinates(selectedListing)) {
      return;
    }

    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 18,
      className: "market-search-popup",
    })
      .setLngLat([Number(selectedListing.longitude), Number(selectedListing.latitude)])
      .setDOMContent(buildPopupContent(selectedListing))
      .addTo(mapRef.current);
  }, [listings, selectedListingId]);

  useEffect(() => {
    if (!fitBoundsToken || !mapReadyRef.current || !mapRef.current) {
      return;
    }

    const bounds = buildBoundsFromListings(listings);
    if (bounds) {
      suppressViewportChangeRef.current = true;
      mapRef.current.fitBounds(bounds, {
        padding: 68,
        duration: 650,
        maxZoom: 13.75,
      });
      return;
    }

    if (
      Number.isFinite(Number(searchCenter?.longitude)) &&
      Number.isFinite(Number(searchCenter?.latitude))
    ) {
      suppressViewportChangeRef.current = true;
      mapRef.current.easeTo({
        center: [Number(searchCenter.longitude), Number(searchCenter.latitude)],
        zoom: Number.isFinite(Number(searchCenter.zoom)) ? Number(searchCenter.zoom) : 10,
        duration: 650,
      });
    }
  }, [fitBoundsToken, listings, searchCenter]);

  useEffect(() => {
    if (!focusSelectedToken || !mapReadyRef.current || !mapRef.current || !selectedListingId) {
      return;
    }

    const selectedListing = listings.find((listing) => listing.id === selectedListingId);
    if (!selectedListing || !hasCoordinates(selectedListing)) {
      return;
    }

    suppressViewportChangeRef.current = true;
    mapRef.current.easeTo({
      center: [Number(selectedListing.longitude), Number(selectedListing.latitude)],
      zoom: Math.max(mapRef.current.getZoom(), 13.25),
      duration: 500,
    });
  }, [focusSelectedToken, listings, selectedListingId]);

  if (mapError) {
    return (
      <div
        className={`flex h-full min-h-[420px] items-center justify-center bg-sand-50 px-6 text-center text-sm leading-6 text-ink-500 ${className}`}
      >
        {mapError}
      </div>
    );
  }

  return (
    <div
      ref={mapContainerRef}
      className={`h-full min-h-[420px] w-full bg-[linear-gradient(180deg,_rgba(255,255,255,0.94),_rgba(246,241,234,0.94))] ${className}`}
    />
  );
};

export default MarketSearchMap;
