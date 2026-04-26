import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calculator, MapPin, Package, Truck, Tag, Percent, Gift, Star, Zap,
  Shield, Clock, ChevronRight, Check, X, Sparkles, TrendingUp, Award,
  UserCheck, Phone, Loader,IndianRupee
} from "lucide-react";
const getDistanceInKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;

  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) *
    Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
};


// ✅ VEHICLE LOGIC (FIXED)
const getVehicleType = (items) => {
  const totalWeight = items.reduce((sum, item) => sum + (parseFloat(item.weight) || 0), 0);

  if (totalWeight <= 5) return "Bike";
  if (totalWeight <= 10) return "Small Truck";
  return "Large Truck";
};

const PricingPage = ({ pickupLocations, dropLocations, items }) => {
  const navigate = useNavigate();

  
  const [distances, setDistances] = useState([]);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState('standard');
  const [booking, setBooking] = useState(null);
const availableCoupons = [
  { code: 'FIRST50', discount: 50, type: 'flat', description: '₹50 off on your first order' },
  { code: 'SAVE20', discount: 20, type: 'percentage', description: '20% off on total amount' },
  { code: 'BULK100', discount: 100, type: 'flat', description: '₹100 off on orders above ₹2000' },
  { code: 'EXPRESS15', discount: 15, type: 'percentage', description: '15% off on express delivery' }
];
const servicePlans = {
  standard: {
    name: 'Standard',
    multiplier: 1,
    features: ['72-80 hours delivery', 'Basic tracking', 'Email support']
  },
  express: {
    name: 'Express',
    multiplier: 1.5,
    features: ['24-48 hours delivery', 'Real-time tracking', 'Priority support', 'SMS updates']
  },
  premium: {
    name: 'Premium',
    multiplier: 2,
    features: ['Same day delivery', 'Live tracking', '24/7 support', 'Insurance included']
  }
};
  
 

  // DISTANCE
  useEffect(() => {
  if (pickupLocations?.length && dropLocations?.length) {
    const data = [];

    pickupLocations.forEach((p) => {
      dropLocations.forEach((d) => {

       if (!p.lat || !p.lng || !d.lat || !d.lng) {
  console.warn("Invalid coordinates:", p, d);
  return;
}

const distance = getDistanceInKm(
  Number(p.lat),
  Number(p.lng),
  Number(d.lat),
  Number(d.lng)
);

        data.push({
          pickupId: p.id,
          dropId: d.id,
          distance: Number(distance.toFixed(2)) // ✅ REAL DISTANCE
        });

      });
    });

    setDistances(data);
  }
}, [pickupLocations, dropLocations]);

  const calculateBasePrice = (distance) => {
  if (distance <= 5) return 500;
  if (distance <= 10) return 800;
  return 1000;
};


  const itemPricing = useMemo(() => {
    return items.map(item => {
      const route = distances.find(d => d.pickupId === item.pickupLocationId && d.dropId === item.dropLocationId);
      if (!route) return null;

      const basePrice = calculateBasePrice(route.distance);
      const weight = parseFloat(item.weight) || 0;
const weightCharge = weight > 10 ? (weight - 10) * 10 : 0;

      return {
  ...item,
  basePrice,
  weightCharge,
  itemPrice: basePrice + weightCharge,
  distance: route.distance
};
    }).filter(Boolean);
  }, [items, distances]);

  const subtotal = itemPricing.reduce((sum, i) => sum + i.itemPrice, 0);
  useEffect(() => {
  if (!appliedCoupon) return;

  if (appliedCoupon.code === 'EXPRESS15' && selectedPlan !== 'express') {
    setAppliedCoupon(null);
    alert("EXPRESS15 removed (only valid for Express plan)");
  }

  if (appliedCoupon.code === 'BULK100' && subtotal < 2000) {
    setAppliedCoupon(null);
    alert("BULK100 removed (min ₹2000 required)");
  }

  if (appliedCoupon.code === 'SAVE20' && subtotal < 200) {
    setAppliedCoupon(null);
    alert("SAVE20 removed (min ₹200 required)");
  }

  if (appliedCoupon.code === 'FIRST50' && subtotal < 100) {
    setAppliedCoupon(null);
    alert("FIRST50 removed (min ₹100 required)");
  }

}, [selectedPlan, subtotal]);
  const planMultiplier = { standard: 1, express: 1.5, premium: 2 }[selectedPlan];
  const planAdjustedTotal = subtotal * planMultiplier; // ✅ FIX

  const applyCoupon = (codeFromClick) => {
  const code = (codeFromClick || couponCode).toUpperCase();

  const coupon = availableCoupons.find(c => c.code === code);

  if (!coupon) {
    alert("Invalid coupon");
    return;
  }

  // ✅ CONDITIONS
  if (coupon.code === 'FIRST50' && subtotal < 100) {
    alert("Minimum ₹100 required for FIRST50");
    return;
  }

  if (coupon.code === 'SAVE20' && subtotal < 200) {
    alert("Minimum ₹200 required for SAVE20");
    return;
  }

  if (coupon.code === 'BULK100' && subtotal < 2000) {
    alert("Minimum ₹2000 required for BULK100");
    return;
  }

  if (coupon.code === 'EXPRESS15' && selectedPlan !== 'express') {
    alert("EXPRESS15 is only valid for Express plan");
    return;
  }

  // ✅ APPLY ONLY AFTER VALIDATION
  setAppliedCoupon(coupon);
  setCouponCode(code);
};
  const discount = appliedCoupon
  ? appliedCoupon.type === 'flat'
    ? appliedCoupon.discount
    : (planAdjustedTotal * appliedCoupon.discount) / 100
  : 0;

  const finalTotal = Math.max(planAdjustedTotal - discount, 0);

  // PAYMENT FIX
  const handlePayment = async () => {
  const token = localStorage.getItem('token');

  if (!token) {
    alert("Login required");
    return navigate('/login');
  }

  // ✅ GET CORRECT DATA FROM LOCAL STORAGE
const bookingData = JSON.parse(localStorage.getItem("bookingData"));

if (!bookingData) {
  alert("Booking data missing. Please go back and fill details.");
  return navigate('/schedule-pickup');
}
 console.log("FINAL DATA SENT:", bookingData); // DEBUG

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        pickupLocations: bookingData.pickupLocations,   // ✅ FIXED
        dropLocations: bookingData.dropLocations,       // ✅ FIXED
        items: bookingData.items.map(item => ({
          ...item,
          pickupLocationIndex: bookingData.pickupLocations.findIndex(p => p.id === item.pickupLocationId),
          dropLocationIndex: bookingData.dropLocations.findIndex(d => d.id === item.dropLocationId)
        })),
        amount: finalTotal,
        servicePlan: selectedPlan
      })
    });

    const data = await res.json();
    setBooking(data.booking);
    const bookingId = data.bookingId;
    const trackingId = data.trackingId;

    if (!res.ok) throw new Error(data.msg);

    // ✅ SAFETY CHECK
if (!window.Razorpay) {
  alert("Razorpay SDK not loaded");
  return;
}

// ✅ MUST HAVE ORDER ID
if (!data.razorpayOrderId) {
  alert("Order ID missing from backend");
  console.error(data);
  return;
}
console.log("RAZORPAY KEY:", import.meta.env.VITE_RAZORPAY_KEY_ID);
const options = {
  key: import.meta.env.VITE_RAZORPAY_KEY_ID,
  amount: data.amount,
  currency: "INR",
  name: "SwiftLogistics",
  order_id: data.razorpayOrderId,

  method: {
  card: true,
  netbanking: true,
  wallet: true,
  upi: true
},

  

  handler: async function (response) {
    try {
      const verifyRes = await fetch(
        `${import.meta.env.VITE_API_URL}/api/payment/verify-payment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature
          })
        }
      );

      const verifyData = await verifyRes.json();

      if (!verifyData.success) {
        alert("Payment verification failed ❌");
        return;
      }

      alert("Payment Successful ✅");

      navigate(`/track/${verifyData.trackingId}`);

    } catch (err) {
      console.error(err);
      alert("Verification error ❌");
    }
  }
};

const rzp = new window.Razorpay(options);
rzp.open();
  } catch (err) {
    console.error(err);
    alert("Something went wrong with payment");
  }
};
// ✅ ADD THIS ABOVE PricingPage COMPONENT

  return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 mt-10 via-white to-blue-50">
            <div className="bg-gradient-to-r from-purple-900 to-blue-900 text-white py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto w-full">
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center"><Calculator className="mr-2 h-6 w-6 sm:h-8 sm:w-8" />Pricing & Checkout</h1>
                    <p className="mt-1 sm:mt-2 text-purple-200 text-sm sm:text-base">Transparent pricing with amazing offers!</p>
                </div>
            </div>
            <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8 w-full">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 flex items-center"><Package className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />Item-wise Pricing Breakdown</h2>
                            <div className="space-y-3 sm:space-y-4">
                                {itemPricing.map((item, idx) => (
                                    <div key={item.id || idx} className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-3 sm:p-4">
                                        <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-gray-800 flex items-center text-sm sm:text-base">
                                                    {item.image && (
                                                        <img src={item.image} alt={item.name} className="h-8 w-8 sm:h-10 sm:w-10 object-cover rounded mr-2 sm:mr-3" />
                                                    )}
                                                    {item.name || `Item ${idx + 1}`}
                                                </h4>
                                                <div className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-600 space-y-1">
                                                    <p className="flex items-center">
                                                        <MapPin className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-purple-600" /> Distance: {item.distance ? item.distance.toFixed(1) : 0} km
                                                    </p>
                                                    {item.weight && (
                                                        <p className="flex items-center">
                                                            <Package className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-blue-600" /> Weight: {item.weight} kg
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-xs sm:text-sm text-gray-600">
                                                    <div>
                                                    <div>
                                                              <p>Base: ₹{item.basePrice}</p>
                                                              {item.weightCharge > 0 && (
                                                                <p>Weight: +₹{item.weightCharge}</p>
                                                              )}
                                                              <p className="font-bold text-purple-600">
                                                                Total: ₹{item.itemPrice}
                                                              </p>
                                                            </div>
                                                    </div>
                                                    
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl shadow-xl p-4 sm:p-6 text-white">
                            <h3 className="text-lg sm:text-xl font-bold mb-3 sm:mb-4 flex items-center"><Gift className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />Limited Time Offers!</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                                {availableCoupons.map((coupon, idx) => (
                                    <div key={idx} className="bg-white/20 backdrop-blur rounded-lg p-3">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-bold text-sm sm:text-base">{coupon.code}</p>
                                                <p className="text-xs sm:text-sm opacity-90">{coupon.description}</p>
                                            </div>
                                            <button
                                            onClick={() => {
                                            setCouponCode(coupon.code);
                                            applyCoupon(coupon.code); // ✅ use validation function
                                          }}                                              
                                             className="bg-white text-orange-500 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold hover:bg-orange-50 transition-colors"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 flex items-center"><Zap className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />Choose Your Service Plan</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                                {Object.entries(servicePlans).map(([key, plan]) => (
                                    <div
                                        key={key}
                                        onClick={() => setSelectedPlan(key)}
                                        className={`relative cursor-pointer rounded-xl p-4 sm:p-6 transition-all transform hover:scale-105 ${
                                            selectedPlan === key ? 'bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-2xl' : 'bg-gray-50 hover:bg-gray-100'
                                        }`}
                                    >
                                        {key === 'express' && (
                                            <div className="absolute -top-2 sm:-top-3 -right-2 sm:-right-3 bg-red-500 text-white text-xs px-2 sm:px-3 py-1 rounded-full">Popular</div>
                                        )}
                                        <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2">{plan.name}</h3>
                                        <p className={`text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4 ${selectedPlan === key ? 'text-white' : 'text-purple-600'}`}>
                                            {plan.multiplier}x
                                        </p>
                                        <ul className="space-y-1 sm:space-y-2">
                                            {plan.features.map((feature, idx) => (
                                                <li key={idx} className="flex items-start text-xs sm:text-sm">
                                                    <Check className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 flex-shrink-0 mt-0.5" /> {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6">
                            {booking?.driver ? (
  <div className="p-4 bg-green-50 rounded-lg">
    <p className="font-bold text-green-700">🚚 Driver Assigned</p>

    <p><strong>Name:</strong> {booking.driver.name}</p>
    <p><strong>Vehicle:</strong> {booking.driver.vehicleNumber}</p>
    <p><strong>Phone:</strong> {booking.driver.phone}</p>
  </div>
) : (
  <div className="p-4 bg-yellow-50 rounded-lg text-yellow-700">
    Driver will be assigned after booking
  </div>
)}
                        </div>
                        <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-6 sticky top-4 sm:top-6">
                            <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-4 sm:mb-6 flex items-center"><TrendingUp className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-green-600" />Order Summary</h2>
                            <div className="mb-4 sm:mb-6">
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-1 sm:mb-2">Have a coupon code?</label>
                                <div className="flex flex-col sm:flex-row gap-2">
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        placeholder="Enter code"
                                        className="flex-1 px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                                    />
                                    <button
                                        onClick={applyCoupon}
                                        className="bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm"
                                    >
                                        Apply
                                    </button>
                                </div>
                                
                            </div>
                            <div className="space-y-3 border-t pt-3 sm:pt-4">
                                <div className="flex justify-between text-gray-600 text-sm sm:text-base"><span>Subtotal ({items.length} items)</span><span>₹{subtotal.toFixed(2)}</span></div>
                                {selectedPlan !== 'standard' && (
                                    <div className="flex justify-between text-gray-600 text-sm sm:text-base"><span>{servicePlans[selectedPlan].name} Plan</span><span>+₹{(planAdjustedTotal - subtotal).toFixed(2)}</span></div>
                                )}
                                {appliedCoupon && (
                                    <div className="flex justify-between text-green-600 font-semibold text-sm sm:text-base"><span className="flex items-center"><Tag className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />{appliedCoupon.code}</span><span>-₹{discount.toFixed(2)}</span></div>
                                )}
                                <div>
                                    <div className="flex items-center font-semibold text-gray-700 mb-1 sm:mb-2 text-sm sm:text-base">
                                        <IndianRupee className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2 text-green-600" />
                                        Total Amount
                                    </div>
                                    <p className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">
                                        ₹{finalTotal.toFixed(2)}
                                    </p>
                                   <p className="mt-2 text-sm">
  Payment Status:
  <span className="ml-2 font-semibold text-orange-600">
    Will update after payment
  </span>
</p>
                                </div>                           </div>
                            <div className="mt-4 sm:mt-6 space-y-2 text-xs sm:text-sm text-gray-600">
                                <div className="flex items-center"><Shield className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-green-600" />100% Secure Payment</div>
                                <div className="flex items-center"><Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-blue-600" />On-time Delivery Guarantee</div>
                                <div className="flex items-center"><Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-yellow-500" />Rated 4.9/5 by 10,000+ customers</div>
                            </div>
                            <div className="mt-4 sm:mt-6 space-y-2 sm:space-y-3">
                                <button
                                    onClick={handlePayment}
disabled={false}
                                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 sm:py-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all transform hover:scale-105 shadow-lg flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                                >
                                    <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                                    Proceed to Payment
                                </button>
                                
                                <button
                                    onClick={() => {
                                    const bookingData = {
                                      pickupLocations,
                                      dropLocations,
                                      items
                                    };

                                    // ✅ STORE DATA (IMPORTANT FIX)

                                    // ✅ NAVIGATE WITH STATE
                                    navigate('/schedule-pickup', {
                                      state: {
                                        formData: {
                                              pickupLocations,
                                              dropLocations,
                                              items
                                            }
                                      }
                                    });
                                  }}
                                    className="w-full border border-gray-300 text-gray-700 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors text-sm sm:text-base"
                                >
                                    Back to Edit
                                </button>
                            </div>
                            <div className="mt-4 sm:mt-6 flex flex-wrap justify-center gap-3 sm:gap-4">
                                <div className="text-center"><Award className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600 mx-auto" /><p className="text-xs text-gray-600 mt-1">Best Service</p></div>
                                <div className="text-center"><Shield className="h-6 w-6 sm:h-8 sm:w-8 text-green-600 mx-auto" /><p className="text-xs text-gray-600 mt-1">Secure</p></div>
                                <div className="text-center"><Truck className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mx-auto" /><p className="text-xs text-gray-600 mt-1">Fast Delivery</p></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="mt-4 sm:mt-6 lg:mt-8 bg-gradient-to-r from-purple-100 to-blue-100 rounded-2xl p-4 sm:p-6">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-3 sm:mb-4 flex items-center"><MapPin className="mr-2 h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />Distance-based Pricing Structure</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                        <div className="bg-white rounded-xl p-3 sm:p-4 text-center transform hover:scale-105 transition-transform"><div className="text-xl sm:text-2xl md:text-3xl font-bold text-purple-600 mb-1 sm:mb-2">₹500</div><p className="text-sm sm:text-base text-gray-700 font-semibold">0-5 km</p><p className="text-xs sm:text-sm text-gray-600 mt-1">Local deliveries</p></div>
                        <div className="bg-white rounded-xl p-3 sm:p-4 text-center transform hover:scale-105 transition-transform"><div className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-600 mb-1 sm:mb-2">₹800</div><p className="text-sm sm:text-base text-gray-700 font-semibold">5-10 km</p><p className="text-xs sm:text-sm text-gray-600 mt-1">City-wide delivery</p></div>
                        <div className="bg-white rounded-xl p-3 sm:p-4 text-center transform hover:scale-105 transition-transform"><div className="text-xl sm:text-2xl md:text-3xl font-bold text-green-600 mb-1 sm:mb-2">₹1000</div><p className="text-xs sm:text-sm text-gray-600 mt-1">Long distance</p></div>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 mt-3 sm:mt-4 text-center">* Additional charges apply for weight over 5kg (₹10/kg)</p>
                </div>
            </div>
        </div>
    );
};

export default PricingPage;