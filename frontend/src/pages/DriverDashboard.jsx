import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import DriverProfileForm from '../components/auth/DriverProfileForm';
import { 
    Truck, MapPin, Package, User, Phone, ToggleLeft, ToggleRight, 
    CheckCircle, ArrowRight, Wallet, Star, Navigation, AlertCircle, 
    Loader, Edit, BarChart3, Route as RouteIcon, DollarSign, Trash2 
} from 'lucide-react';
import { io } from "socket.io-client";
const apiRequest = async (url, method = 'GET', body = null) => {
  const token = localStorage.getItem('token');
  if (!token) throw new Error("No token found. Please log in.");

  const headers = {
    'Authorization': `Bearer ${token}`
  };

  if (body) headers['Content-Type'] = 'application/json';

  const options = { method, headers };
  if (body) options.body = JSON.stringify(body);

  const fullUrl = import.meta.env.VITE_API_URL + url;

  const response = await fetch(fullUrl, options);

  const text = await response.text(); // ✅ ALWAYS read text first

  let data;
  try {
    data = JSON.parse(text); // ✅ safe parse
  } catch {
    console.error("❌ Server returned HTML:", text);
    throw new Error("Server error (not JSON)");
  }

  if (!response.ok) {
    throw new Error(data.msg || "API Error");
  }

  return data;
};
const DriverDashboard = () => {
    const { user, login } = useAuth();
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [tasks, setTasks] = useState([]);
    const [stats, setStats] = useState(null);
    const [history, setHistory] = useState([]);
const [isAvailable, setIsAvailable] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
    const [isUpdatingTask, setIsUpdatingTask] = useState(null);
    const [profileImage, setProfileImage] = useState("");
    const [trackingBookingId, setTrackingBookingId] = useState(null);
    const [liveStats, setLiveStats] = useState({});
    const socketRef = useRef(null);
useEffect(() => {
  if (!trackingBookingId || !socketRef.current?.connected) return;

  if (!navigator.geolocation) {
    console.log("Geolocation not supported");
    return;
  }

  const watchId = navigator.geolocation.watchPosition(
    (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      socketRef.current.emit("driver-location", {
        bookingId: trackingBookingId,
        lat,
        lng,
      });
    },
    (err) => console.log("GPS error:", err),
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000,
    }
  );

  return () => navigator.geolocation.clearWatch(watchId);
}, [trackingBookingId]);

  

useEffect(() => {
  socketRef.current = io(import.meta.env.VITE_API_URL);

  return () => {
    socketRef.current.disconnect();
  };
}, []);
    const fetchData = useCallback(async (tab) => {
  try {
    setIsLoading(true);
    setError(null);

    if (tab === 'dashboard' || !tab) {
      const [tasksData, statsData] = await Promise.all([
        apiRequest('/api/driver/tasks'),
        apiRequest('/api/driver/stats')
      ]);

      setTasks(tasksData.tasks);
      setStats(statsData.stats);

    } else if (tab === 'earnings' || tab === 'history') {
      const historyData = await apiRequest('/api/driver/history');
setHistory(historyData.history || []);   
console.log("History API Response:", historyData); }
  } catch (err) {
    setError(err.message);
  } finally {
    setIsLoading(false);
  }
  
}, []);


    useEffect(() => {
  if (user?.profileStatus === 'Complete') {
    fetchData(activeTab);
  } else {
    setIsLoading(false);
  }
}, [activeTab, user?.profileStatus, fetchData]);
useEffect(() => {
  const fetchProfile = async () => {
    try {
      const data = await apiRequest('/api/driver/profile');

      // ✅ UPDATE GLOBAL USER STATE
      login(data, localStorage.getItem('token'));

    } catch (err) {
      console.error("Profile fetch error:", err.message);
    }
  };

  fetchProfile();
}, []);
useEffect(() => {
  if (!socketRef.current) return;

  const socket = socketRef.current;

  socket.on("ratingUpdated", (data) => {
    setStats((prev) => ({
      ...prev,
      rating: data.rating
    }));
  });

  return () => {
    socket.off("ratingUpdated");
  };
}, []);

useEffect(() => {
  const processTasks = async () => {
    for (let task of tasks) {
      const pickup = task.pickupLocations[0];
      const drop = task.dropLocations[0];

      if (!pickup?.address || !drop?.address) continue;

      const origin = await getCoords(pickup.address);
      const destination = await getCoords(drop.address);

      if (!origin || !destination) continue;

      calculateRoute(task.bookingId, origin, destination);
    }
  };

  if (tasks.length) processTasks();

}, [tasks]); 
useEffect(() => {
  if (user?.isAvailable !== undefined) {
    setIsAvailable(user.isAvailable);
  }
}, [user]);
    const handleTabClick = (tab) => {
        setActiveTab(tab);
    };

    const handleToggleAvailability = async () => {
  try {
    const newStatus = !isAvailable;

    // ✅ Update UI instantly
    setIsAvailable(newStatus);

    const res = await apiRequest('/api/driver/availability', 'PUT', {
      isAvailable: newStatus
    });

    // ✅ Sync UI with backend
    setIsAvailable(res.isAvailable);

    // 🔥 IMPORTANT: UPDATE GLOBAL USER STATE
    login({ ...user, isAvailable: res.isAvailable }, localStorage.getItem('token'));

  } catch (err) {
    setError(err.message);
  }
};
    const handleStatusUpdate = async (bookingId, newStatus) => {
  setIsUpdatingTask(bookingId);

  try {
    await apiRequest(`/api/driver/task/${bookingId}`, 'PUT', {
      status: newStatus
    });

    // ✅ START TRACKING WHEN DELIVERY STARTS
   if (newStatus === "In Transit") {
  localStorage.setItem("trackingBookingId", bookingId); 
  setTrackingBookingId(bookingId);
}

if (newStatus === "Delivered") {
  localStorage.removeItem("trackingBookingId"); 
  setTrackingBookingId(null);
}

    await fetchData('dashboard');

  } catch (err) {
    setError(err.message);
  } finally {
    setIsUpdatingTask(null);
  }
};
    
    const handleProfileUpdate = async (profileData) => {
  setIsUpdatingProfile(true);
  setError(null);

  try {
    const updatedUser = await apiRequest('/api/driver/profile', 'PUT', {
      ...profileData,
      profileImage   // ✅ ADD THIS
    });

login(updatedUser, localStorage.getItem('token'));
setProfileImage(updatedUser.profileImage || "");
    setIsEditingProfile(false);

  } catch (err) {
    setError(err.message);
  } finally {
    setIsUpdatingProfile(false);
  }
};
const getCoords = async (address) => {
  try {
    const cleanAddress = address.replace(/,/g, " ").trim();

    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/geocode?address=${encodeURIComponent(cleanAddress)}`
    );

    const data = await res.json();

    console.log("GEOCODE RESPONSE:", data);

    // ✅ CASE 1: Your backend returns { lat, lng }
    if (data.lat && data.lng) {
      return [data.lat, data.lng];
    }

    // ✅ CASE 2: Your backend returns ARRAY (THIS IS YOUR CASE)
    if (Array.isArray(data) && data.length > 0) {
      const place = data[0];

      // Nominatim format
      if (place.lat && place.lon) {
        return [parseFloat(place.lat), parseFloat(place.lon)];
      }

      // Mapbox format
      if (place.center) {
        return [place.center[1], place.center[0]];
      }
    }

    console.log("❌ Invalid geocode:", data);
    return null;

  } catch (err) {
    console.log("❌ Geocode error:", err);
    return null;
  }
};
const calculateRoute = async (bookingId, origin, destination) => {
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/route?origin=${origin[0]},${origin[1]}&destination=${destination[0]},${destination[1]}`
    );

    const data = await res.json();

    console.log("ROUTE API RESPONSE:", data);

    // ✅ FIX: DIRECT RESPONSE (YOUR CASE)
    if (data.distance && data.duration) {

      const distance = parseFloat(data.distance); // "519.22 km" → 519.22
      const duration = parseInt(data.duration);   // "375 mins" → 375

      setLiveStats(prev => ({
        ...prev,
        [String(bookingId)]: {
          distance: distance.toFixed(2),
          duration: duration
        }
      }));

      console.log("✅ UPDATED STATE:", bookingId);
    }

  } catch (err) {
    console.log("Route error:", err);
  }
};
    const handleClearHistory = async () => {
        if (window.confirm("Are you sure you want to permanently delete your ride history? This action cannot be undone.")) {
            try {
                const response = await apiRequest('/api/driver/history', 'DELETE');
                alert(response.msg);
                setHistory([]);
            } catch (err) {
                setError(err.message);
            }
        }
    };

    if (user?.profileStatus === 'Pending') {
        return (
            <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
                <div className="max-w-xl w-full bg-white p-8 rounded-xl shadow-lg">
                    <h1 className="text-3xl font-bold text-gray-800">Complete Your Profile</h1>
                    <p className="text-gray-600 mt-2">Provide your details to activate your account and start receiving tasks.</p>
                    {error && <p className="mt-4 text-red-500 text-sm">{error}</p>}
                    <DriverProfileForm 
                        initialData={user}
                        onSubmit={handleProfileUpdate}
                        isLoading={isUpdatingProfile}
                        submitButtonText="Save and Activate Profile"
                    />
                </div>
            </div>
        );
    }
    

    if (isLoading || !stats) {
        return (
            <div className="flex justify-center items-center min-h-screen bg-gray-100">
                <div className="text-center">
                    <Loader className="h-12 w-12 animate-spin text-purple-600 mx-auto mb-4"/>
                    <p className="text-gray-600">Loading your dashboard...</p>
                </div>
            </div>
        );
    }
    
    return (
<div className="min-h-screen bg-gray-100 p-4 sm:p-6 lg:p-8 mt-10">
              <div className="max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Driver Dashboard</h1>
                        <p className="mt-1 text-lg text-gray-600">Welcome back, {user?.name || 'Driver'}!</p>
                    </div>
                    <div className="mt-4 sm:mt-0 flex items-center space-x-3 bg-white p-2 rounded-lg shadow">
                        <span className={`font-semibold ${isAvailable ? 'text-green-600' : 'text-red-500'}`}>{isAvailable ? 'Online' : 'Offline'}</span>
                        <button onClick={handleToggleAvailability}  className="transition duration-200">{isAvailable ? <ToggleRight className="h-8 w-8 text-green-500" /> : <ToggleLeft className="h-8 w-8 text-gray-400" />}</button>
                    </div>
                </div>

                {/* THIS IS THE CORRECTED LINE */}
                <div className="mb-6 flex flex-wrap space-x-2 border-b border-gray-200">
                    <button onClick={() => handleTabClick('dashboard')} className={`px-4 py-2 font-semibold flex items-center ${activeTab === 'dashboard' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}><BarChart3 className="h-4 w-4 mr-2"/>Dashboard</button>
                    <button onClick={() => handleTabClick('earnings')} className={`px-4 py-2 font-semibold flex items-center ${activeTab === 'earnings' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}><Wallet className="h-4 w-4 mr-2"/>Earnings</button>
                    <button onClick={() => handleTabClick('history')} className={`px-4 py-2 font-semibold flex items-center ${activeTab === 'history' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}><RouteIcon className="h-4 w-4 mr-2"/>Ride History</button>
                    <button onClick={() => handleTabClick('profile')} className={`px-4 py-2 font-semibold flex items-center ${activeTab === 'profile' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-gray-500'}`}><User className="h-4 w-4 mr-2"/>My Profile</button>
                </div>

                {error && <div className="my-4 text-center p-4 bg-red-100 text-red-700 rounded-lg"><AlertCircle className="inline-block w-5 h-5 mr-2"/>Error: {error}</div>}

                {/* DASHBOARD TAB */}
{activeTab === 'dashboard' && (
  <div>

    {/* STATS */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
        <p className="text-sm text-gray-500">Pending</p>
        <p className="text-3xl font-bold text-blue-600">{stats.pending}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
        <p className="text-sm text-gray-500">In Transit</p>
        <p className="text-3xl font-bold text-yellow-600">{stats.inTransit}</p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
        <p className="text-sm text-gray-500">Earnings Today</p>
        <p className="text-3xl font-bold text-green-600">
          ₹{stats.earningsToday ? stats.earningsToday.toFixed(2) : "0.00"}
        </p>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-lg transition">
        <p className="text-sm text-gray-500">Driver Score</p>
        <p className="text-3xl font-bold text-purple-600">🏆 {stats.score || 0}</p>
      </div>
    </div>

    {/* TASKS */}
    <h2 className="text-2xl font-semibold text-gray-800 mb-4">Your Active Tasks</h2>

    <div className="space-y-4">
      {tasks?.length > 0 ? (
        tasks.map(task => {
          const stats = liveStats[String(task.bookingId)];

          return (
            <div key={task.bookingId} className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-purple-500 hover:shadow-xl transition-shadow">

              {/* HEADER */}
              <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
                <div>
                  <p className="font-bold text-lg text-purple-700">{task.bookingId}</p>
                  <span className={`mt-1 inline-block px-2 py-1 text-xs font-semibold rounded-full ${task.status === 'Pending' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>
                    {task.status}
                  </span>
                </div>

                <button
                  onClick={() => {
                    const pickup = task.pickupLocations[0];
                    const drop = task.dropLocations[0];

                    const pickupAddress = encodeURIComponent(pickup.address);
                    const dropAddress = encodeURIComponent(drop.address);

                    const url = `https://www.google.com/maps/dir/?api=1&origin=${pickupAddress}&destination=${dropAddress}&travelmode=driving`;

                    window.open(url, "_blank");
                  }}
                  className="mt-2 sm:mt-0 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-black"
                >
                  Open in Maps
                </button>
              </div>

              {/* LOCATIONS */}
              <div className="border-t pt-4 grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-600">Pickup Locations</h4>
                  {task.pickupLocations.map((loc, i) => (
                    <div key={i} className="flex items-start text-gray-700">
                      <MapPin className="h-5 w-5 mr-3 text-red-500 mt-1" />
                      <p>{loc.address}</p>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-semibold text-gray-600">Drop-off Locations</h4>
                  {task.dropLocations.map((loc, i) => (
                    <div key={i} className="flex items-start text-gray-700">
                      <MapPin className="h-5 w-5 mr-3 text-green-500 mt-1" />
                      <p>{loc.address}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* DATE */}
              <p className="text-xs text-gray-500 mt-2">
                📅 {new Date(task.createdAt).toLocaleDateString('en-IN')}
                ⏰ {new Date(task.createdAt).toLocaleTimeString('en-IN')}
              </p>

              {/* DISTANCE + ETA */}
              <p className="text-xs text-gray-500 mt-1">
                📍 Distance: {stats ? `${stats.distance} km` : "Calculating..."}
              </p>

              <p className="text-xs text-gray-500">
                ⏱ ETA: {stats ? `${stats.duration} mins` : "..."}
              </p>

              {/* ACTIONS */}
              <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <div className="flex items-center text-sm">
                  <Package className="h-5 w-5 mr-2 text-gray-500" />
                  {task.items.map(i => i.name).join(', ')}
                </div>

                <div className="mt-4 sm:mt-0 flex space-x-3">
  
  <button
    onClick={() => handleStatusUpdate(task.bookingId, 'In Transit')}
    disabled={isUpdatingTask === task.bookingId || task.status !== 'Pending'}
    className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-600 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isUpdatingTask === task.bookingId ? (
      <Loader className="h-4 w-4 animate-spin mr-2"/>
    ) : (
      <ArrowRight className="h-4 w-4 mr-2"/>
    )}
    Mark as Picked Up
  </button>

  <button
    onClick={() => handleStatusUpdate(task.bookingId, 'Delivered')}
    disabled={isUpdatingTask === task.bookingId || task.status !== 'In Transit'}
    className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-600 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
  >
    {isUpdatingTask === task.bookingId ? (
      <Loader className="h-4 w-4 animate-spin mr-2"/>
    ) : (
      <CheckCircle className="h-4 w-4 mr-2"/>
    )}
    Mark as Delivered
  </button>

</div>
              </div>

            </div>
          );
        })
      ) : (
        <div className="text-center py-16 bg-white rounded-xl shadow-md">
          <Truck className="mx-auto h-12 w-12 text-gray-400"/>
          <p>No Active Deliveries</p>
        </div>
      )}
    </div>

  </div>
)}

                {activeTab === 'earnings' && (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <h2 className="text-2xl font-bold text-gray-800 mb-4">Earnings History</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead><tr className="bg-gray-50"><th className="p-3">Booking ID</th><th className="p-3">Date Completed</th><th className="p-3 text-right">Your Earning</th></tr></thead>
                                <tbody>
                                    {history.map(ride => (
                                        <tr key={ride._id} className="border-b"><td className="p-3 font-mono text-purple-600">{ride.bookingId}</td><td className="p-3">
  {ride.completionDate && !isNaN(new Date(ride.completionDate))
    ? new Date(ride.completionDate).toLocaleString('en-IN')
    : "N/A"}
</td><td className="p-3 text-right font-bold text-green-600">
  ₹{(ride.driverEarning || (ride.amount * 0.8)).toFixed(2)}
</td></tr>
                                    ))}
                                </tbody>
                            </table>
                            {history.length === 0 && <p className="text-center text-gray-500 py-8">No completed rides found in your history.</p>}
                        </div>
                    </div>
                )}

                {activeTab === 'history' && (
                    <div className="bg-white p-6 rounded-xl shadow-md">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Ride History</h2>
                            {history.length > 0 && <button onClick={handleClearHistory} className="flex items-center text-sm font-semibold text-red-500 hover:text-red-700"><Trash2 className="h-4 w-4 mr-2"/>Clear History</button>}
                        </div>
                        <div className="space-y-4">
                            {history.map(ride => (
                                <div key={ride._id} className="p-4 border rounded-lg bg-gray-50">
                                    <div className="flex justify-between items-start">
                                        <p className="font-bold text-purple-700">{ride.bookingId} - <span className={`font-normal text-sm ${ride.status === 'Delivered' ? 'text-green-600' : 'text-red-600'}`}>{ride.status}</span></p>
                                        <p className="text-sm font-semibold text-gray-800">₹{ride.amount.toFixed(2)}</p>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">{ride.pickupLocations[0].address} to {ride.dropLocations[0].address}</p>
                                    {ride.status === "Delivered" && ride.rating && (
                                    <p className="text-yellow-500 font-semibold mt-2">
                                        ⭐ Rating: {ride.rating}
                                    </p>
                                    )}
                                </div>
                            ))}
                        </div>
                        {history.length === 0 && <p className="text-center text-gray-500 py-8">No completed rides found in your history.</p>}
                    </div>
                )}

                {activeTab === 'profile' && (
                    <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl mx-auto">
                         <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-800">My Profile</h2>
                            <button onClick={() => setIsEditingProfile(!isEditingProfile)} className="flex items-center text-sm font-semibold text-purple-600 hover:text-purple-800">
                                <Edit className="h-4 w-4 mr-2" />
                                {isEditingProfile ? 'Cancel' : 'Edit Profile'}
                            </button>
                         </div>
                         
                         {isEditingProfile ? (
  <div>
    <p className="text-sm text-gray-500 mb-4">Update your profile details below.</p>
    {error && <p className="mb-4 text-red-500 text-sm">{error}</p>}

    {/* ✅ PROFILE IMAGE + UPLOAD */}
    <div className="flex flex-col items-center mb-6">
      <img
        src={profileImage || user.profileImage || "https://via.placeholder.com/100"}
        alt="Profile"
        className="w-24 h-24 rounded-full object-cover border"
      />

      <input
        type="file"
        accept="image/*"
        className="mt-4"
        onChange={(e) => {
          const file = e.target.files[0];
          const reader = new FileReader();

          reader.onloadend = () => {
            setProfileImage(reader.result);
          };

          if (file) reader.readAsDataURL(file);
        }}
      />
    </div>

    <DriverProfileForm 
      initialData={user}
      onSubmit={handleProfileUpdate}
      isLoading={isUpdatingProfile}
      submitButtonText="Update Profile"
    />
  </div>
                         ) : (
                            <div className="space-y-6">

  {/* PROFILE IMAGE */}
  <div className="flex justify-center">
    <img
      src={profileImage || user.profileImage || "https://ui-avatars.com/api/?name=Driver"}
      alt="Profile"
      className="w-28 h-28 rounded-full object-cover border-4 border-purple-200 shadow-md"
    />
  </div>

  {/* BASIC INFO */}
  <div className="p-5 bg-gray-50 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-5">
    <div>
      <p className="text-xs text-gray-500">Full Name</p>
      <p className="font-semibold text-gray-800">{user.name || 'Not Added'}</p>
    </div>
    <div>
      <p className="text-xs text-gray-500">Email</p>
      <p className="font-semibold text-gray-800">{user.email || 'Not Added'}</p>
    </div>
    <div>
      <p className="text-xs text-gray-500">Phone</p>
      <p className="font-semibold text-gray-800">{user.phone || 'Not Added'}</p>
    </div>
    <div>
      <p className="text-xs text-gray-500">Gender</p>
      <p className="font-semibold text-gray-800">{user.gender || 'Not Added'}</p>
    </div>
  </div>

  {/* ADDRESS */}
  <div className="p-5 bg-gray-50 rounded-xl">
    <p className="text-xs text-gray-500">Address</p>
    <p className="font-semibold text-gray-800">{user.address || 'Not Added'}</p>
  </div>

  {/* DRIVER DETAILS */}
  <div className="p-5 bg-gray-50 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-5">
    <div>
      <p className="text-xs text-gray-500">License Number</p>
      <p className="font-semibold text-gray-800">{user.licenseNumber || 'Not Added'}</p>
    </div>
    <div>
      <p className="text-xs text-gray-500">Experience</p>
      <p className="font-semibold text-gray-800">
        {user.experience ? `${user.experience} years` : 'Not Added'}
      </p>
    </div>
    <div>
      <p className="text-xs text-gray-500">Vehicle Type</p>
      <p className="font-semibold text-gray-800">{user.vehicleType || 'Not Added'}</p>
    </div>
    <div>
      <p className="text-xs text-gray-500">Vehicle Number</p>
      <p className="font-semibold text-gray-800">{user.vehicleNumber || 'Not Added'}</p>
    </div>
  </div>

</div>
                         )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DriverDashboard;