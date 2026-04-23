// src/pages/TrackingPage.jsx
import React, { useState, useEffect, useRef  } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Package, CheckCircle, Loader } from 'lucide-react';
import LiveMap from "../components/LiveMap";
import { io } from "socket.io-client"; 

const TrackingPage = () => {
  const { trackingId: urlTrackingId } = useParams();
  const navigate = useNavigate();

  const [trackingId, setTrackingId] = useState(urlTrackingId || '');
  const [bookingDetails, setBookingDetails] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
const [eta, setEta] = useState(null);
const [distance, setDistance] = useState(null);

const isFetchingRef = useRef(false);   // ✅ ADD HERE
const socketRef = useRef(null);        // ✅ MOVE HERE
  // ================= FETCH =================
 const fetchBookingDetails = async (id) => {
  if (!id || isFetchingRef.current) return;

  isFetchingRef.current = true;
setIsLoading(true);   // ✅ ADD HERE
setError('');         // ✅ ADD HERE

  try {
    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/api/bookings/track/${id}`
    );

    if (!response.ok) throw new Error("Booking not found");

    const data = await response.json();
    setBookingDetails(data);

  } catch (err) {
    setError(err.message);
  } finally {
  isFetchingRef.current = false;  // ✅ allow next fetch
  setIsLoading(false);            // ✅ stop loader
}
};

  // ================= AUTO FETCH =================
  useEffect(() => {
    if (!urlTrackingId) return;

    setTrackingId(urlTrackingId);
fetchBookingDetails(urlTrackingId);

    const interval = setInterval(() => {
  fetchBookingDetails(urlTrackingId);
}, 15000); // every 15 sec

    return () => clearInterval(interval);
  }, [urlTrackingId]);

  // ================= LIVE STATUS NOTIFICATION =================
 
 useEffect(() => {
  socketRef.current = io(import.meta.env.VITE_API_URL, {
transports: ["polling"],
});

  socketRef.current.on("booking-status-update", (data) => {
  if (data.trackingId === urlTrackingId) {
    alert(`📦 Status Updated: ${data.status}`);
  }
});

  return () => {
    socketRef.current.disconnect();
  };
}, [urlTrackingId]);



  // ================= STATUS STEP =================
  const getStepStatus = (stepStatus) => {
    const statuses = ['Pending', 'In Transit', 'Delivered'];
    const currentIndex = statuses.indexOf(bookingDetails?.status);
    const stepIndex = statuses.indexOf(stepStatus);

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };
const handleSubmit = (e) => {
  e.preventDefault();
  if (trackingId) {
    navigate(`/track/${trackingId}`);
  }
};
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* HEADER */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h1 className="text-3xl font-bold text-center text-gray-800">
            Track Your Shipment
          </h1>
          <p className="text-center text-gray-500 mt-2">
            Enter your tracking ID to get live updates
          </p>

          <form onSubmit={handleSubmit} className="flex gap-3 mt-6">
            <input
              type="text"
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value.toUpperCase())}
              placeholder="TRK-XXXX"
              className="flex-1 px-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500"
            />
            <button
              type="submit"
              className="bg-purple-600 text-white px-6 py-3 rounded-lg"
            >
              Track
            </button>
          </form>
        </div>

        {/* ERROR */}
        {error && (
          <div className="bg-red-100 text-red-600 p-4 rounded-lg text-center">
            {error}
          </div>
        )}

        {/* LOADER */}
        {isLoading && (
          <Loader className="animate-spin mx-auto text-purple-600 mt-6" />
        )}

        {/* MAIN DATA */}
        {bookingDetails && (
          <div className="bg-white rounded-2xl shadow-xl p-6">

            {/* TOP INFO */}
            <div className="grid grid-cols-3 text-center border-b pb-4 mb-4">
              <div>
                <p className="text-gray-500 text-sm">Tracking ID</p>
                <p className="font-bold text-purple-600">
                  {bookingDetails.trackingId}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Status</p>
                <p className={`font-bold ${
                  bookingDetails.status === "Delivered"
                    ? "text-green-600"
                    : bookingDetails.status === "In Transit"
                    ? "text-blue-600"
                    : "text-yellow-600"
                }`}>
                  {bookingDetails.status}
                </p>
              </div>

              <div>
                <p className="text-gray-500 text-sm">Booked On</p>
                <p className="font-bold">
                  {bookingDetails.createdAt
                    ? new Date(bookingDetails.createdAt).toLocaleString()
                    : "N/A"}
                </p>
              </div>
            </div>

            {/* ROUTE */}
            <p className="text-center text-gray-600 mb-4">
              📍 {bookingDetails.pickupLocations?.[0]?.address} → {bookingDetails.dropLocations?.[0]?.address}
            </p>
              <p className="text-center text-lg font-semibold text-purple-700 mt-3">
⏱ ETA: {eta || "Calculating..."}
                </p>  
                <p className="text-center text-lg font-semibold text-blue-600 mt-2">
  📏 Distance: {distance || "Calculating..."}
</p>
            {/* MAP */}
            <div className="rounded-2xl overflow-hidden shadow-lg mb-6">
              <div className="h-[400px]">
                
                {bookingDetails.driver?._id ? (

  bookingDetails.pickupLocations?.[0]?.lat != null &&
bookingDetails.pickupLocations?.[0]?.lng != null &&
bookingDetails.dropLocations?.[0]?.lat != null &&
bookingDetails.dropLocations?.[0]?.lng != null ? (
   <LiveMap 
  bookingId={bookingDetails.trackingId} 
  setEtaExternal={setEta}
  setDistanceExternal={setDistance}
  pickupLocation={{
    ...bookingDetails.pickupLocations[0],
    lat: Number(bookingDetails.pickupLocations[0].lat),
    lng: Number(bookingDetails.pickupLocations[0].lng)
  }}
  dropLocation={{
    ...bookingDetails.dropLocations[0],
    lat: Number(bookingDetails.dropLocations[0].lat),
    lng: Number(bookingDetails.dropLocations[0].lng)
  }}
/>

  ) : (
    <div className="flex items-center justify-center h-full text-red-500 font-semibold">
  ❌ Location not available. Please try again later.
</div>
  )

) : (
  <div className="flex items-center justify-center h-full text-gray-500">
    Driver not assigned yet
  </div>
)}
              </div>
            </div>

            <div className="mt-8 bg-white rounded-2xl shadow-xl p-8">
  <h2 className="text-xl font-bold text-center mb-10">
    🚚 Delivery Progress
  </h2>
<div className="relative py-10 min-h-[180px]">

  {/* LINE */}
  <div className="absolute top-1/2 left-0 w-full h-2 bg-gray-200 rounded-full -translate-y-1/2"></div>

  {/* PROGRESS LINE */}
  <div
    className="absolute top-1/2 left-0 h-2 rounded-full bg-gradient-to-r from-purple-500 via-blue-500 to-purple-500 transition-all duration-1000 ease-in-out -translate-y-1/2"
    style={{
      width:
        bookingDetails.status === "Pending"
          ? "0%"
          : bookingDetails.status === "In Transit"
          ? "50%"
          : "100%",
    }}
  ></div>

  {/* STEPS */}
  {["Pending", "In Transit", "Delivered"].map((step, index) => {
    const statuses = ["Pending", "In Transit", "Delivered"];
    const currentIndex = statuses.indexOf(bookingDetails.status);

    const isCompleted = index < currentIndex;
    const isActive = index === currentIndex;

    // 🎯 FIXED POSITIONS
    const positionClass =
      index === 0
        ? "left-0"
        : index === 1
        ? "left-1/2 -translate-x-1/2"
        : "right-0";

    return (
      <div
        key={step}
className={`absolute top-1/2 flex flex-col items-center ${positionClass}`}      >

        {/* CIRCLE */}
        <div

  className={`w-16 h-16 flex items-center justify-center rounded-full text-2xl shadow-lg transition-all duration-500 -translate-y-1/2          ${
            isCompleted
              ? "bg-green-500 text-white shadow-green-300"
              : isActive
              ? "bg-purple-600 text-white ring-4 ring-purple-300 scale-110 animate-pulse shadow-purple-300"
              : "bg-gray-300 text-gray-600"
          }`}
        >
          {step === "Pending" ? "📦" : step === "In Transit" ? "🚚" : "✅"}
        </div>

        {/* TEXT */}
<p className="mt-0 text-sm font-semibold">{step}</p>
<div className="h-5 mt-1 -translate-y-2">
            {isActive && (
            <span className="text-xs text-purple-600 font-bold">
              Current Stage
            </span>
          )}
          {isCompleted && (
            <span className="text-xs text-green-600 font-bold">
              Completed
            </span>
          )}
        </div>

      </div>
    );
  })}
</div>
</div>


          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingPage;