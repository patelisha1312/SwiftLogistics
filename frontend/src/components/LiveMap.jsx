import React, { useEffect, useState, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import { io } from "socket.io-client";

// Fix marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png",
  iconUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png",
  shadowUrl:
    "https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png",
});

// Truck icon
const truckIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/743/743922.png",
  iconSize: [40, 40],
});

// Auto center
const RecenterMap = ({ position, route }) => {
  const map = useMap();

  useEffect(() => {
    if (route.length > 0) {
      const bounds = L.latLngBounds(route);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (position) {
      map.flyTo(position, map.getZoom(), { duration: 1.5 });
    }
  }, [position, route]);

  return null;
};

const LiveMap = ({
  bookingId,
  setEtaExternal,
  setDistanceExternal,
  dropLocation,
  pickupLocation,
}) => {
  const [position, setPosition] = useState(null);
  const [route, setRoute] = useState([]);
  const socketRef = useRef(null);
  const lastFetchRef = useRef(0);
  const lastPositionRef = useRef(null);
  const lastTimeRef = useRef(null);

  // ================= INITIAL POSITION =================
  useEffect(() => {
    if (
      !position &&
      pickupLocation?.lat != null &&
      pickupLocation?.lng != null
    ) {
      setPosition([Number(pickupLocation.lat), Number(pickupLocation.lng)]);
    }
  }, [pickupLocation]);

  // ================= SOCKET =================
  useEffect(() => {
    if (!bookingId) return;

    socketRef.current = io(import.meta.env.VITE_API_URL, {
      transports: ["polling"],
    });

    socketRef.current.on("driver-location-update", (data) => {
      if (data?.bookingId === bookingId && data?.lat && data?.lng) {
        setPosition((prev) => {
          const now = Date.now();

          if (prev && lastPositionRef.current && lastTimeRef.current) {
            const distance =
              Math.sqrt(
                Math.pow(data.lat - lastPositionRef.current[0], 2) +
                Math.pow(data.lng - lastPositionRef.current[1], 2)
              ) * 111;

            const timeDiff = (now - lastTimeRef.current) / 3600000;

            if (timeDiff > 0) {
              window.driverSpeed = distance / timeDiff;
            }
          }

          lastPositionRef.current = [data.lat, data.lng];
          lastTimeRef.current = now;

          if (!prev) return [data.lat, data.lng];

          return [
            prev[0] + (data.lat - prev[0]) * 0.2,
            prev[1] + (data.lng - prev[1]) * 0.2,
          ];
        });
      }
    });

    return () => socketRef.current?.disconnect();
  }, [bookingId]);

  // ================= BACKUP API =================
  useEffect(() => {
    if (!bookingId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/bookings/track/${bookingId}`
        );

        const data = await res.json();
        const driver = data?.driver;

        if (driver?.lat && driver?.lng) {
          setPosition([Number(driver.lat), Number(driver.lng)]);
        }
      } catch (err) {
        console.log("Tracking error:", err);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [bookingId]);

  // ================= ROUTE + ETA =================
  useEffect(() => {
    if (!position || !dropLocation) return;

    const now = Date.now();
    if (now - lastFetchRef.current < 20000) return;

    lastFetchRef.current = now;

    const getRoute = async () => {
      try {
        const pLat = Number(position[0]);
        const pLng = Number(position[1]);
        const dLat = Number(dropLocation.lat);
        const dLng = Number(dropLocation.lng);

        if (
          isNaN(pLat) ||
          isNaN(pLng) ||
          isNaN(dLat) ||
          isNaN(dLng)
        ) return;

        const res = await fetch(
          `${import.meta.env.VITE_API_URL}/api/route?origin=${pLat},${pLng}&destination=${dLat},${dLng}`
        );

        const data = await res.json();

        if (!data || !data.geometry || data.geometry.length === 0) return;

        const latLngRoute = data.geometry.map((coord) => [
          coord[1],
          coord[0],
        ]);

        setRoute(latLngRoute);

        // ✅ SAFE ETA + DISTANCE
        if (data.distance) setDistanceExternal?.(data.distance);
        if (data.duration) setEtaExternal?.(data.duration);

      } catch (err) {
        console.log("Route error:", err);
      }
    };

    getRoute();
  }, [
  position,
  dropLocation?.lat,
  dropLocation?.lng
]);

  // ================= RENDER =================
  return (
    <MapContainer
      center={position || [22.6916, 72.8634]}
      zoom={14}
      style={{ height: "400px", width: "100%", borderRadius: "16px", zIndex: 0 }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png"
      />

      <RecenterMap position={position} route={route} />

      {position && <Marker position={position} icon={truckIcon} />}

      {pickupLocation?.lat != null && pickupLocation?.lng != null && (
        <Marker position={[pickupLocation.lat, pickupLocation.lng]} />
      )}

      {dropLocation?.lat != null && dropLocation?.lng != null && (
        <Marker position={[dropLocation.lat, dropLocation.lng]} />
      )}

      <Polyline positions={route} color="blue" />
    </MapContainer>
  );
};

export default LiveMap;