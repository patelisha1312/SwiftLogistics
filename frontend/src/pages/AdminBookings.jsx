import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminBookings = () => {
  const [bookings, setBookings] = useState([]);

  const token = localStorage.getItem("token");



useEffect(() => {
  axios
    .get("https://swiftlogistics-backend.onrender.com/api/bookings/all", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    .then((res) => {
      console.log("BOOKINGS:", res.data); // debug
      setBookings(res.data.bookings); // ✅ FIX
    })
    .catch((err) => console.error(err));
}, []);
const updateStatus = async (id, status) => {
  await axios.put(
    `https://swiftlogistics-backend.onrender.com/api/bookings/update-status/${id}`,
    { status }
  );

  // 🔄 refresh
  const res = await axios.get("https://swiftlogistics-backend.onrender.com/api/bookings/all", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  setBookings(res.data.bookings); // ✅ FIX
};
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        
        <h2 className="text-2xl font-bold mb-6 text-blue-600">
          Bookings Management
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border rounded-lg overflow-hidden">
            
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">Booking ID</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Amount</th>
                <th className="p-3 text-left">Update Status</th>
              </tr>
            </thead>

            <tbody>
              {bookings.length > 0 ? (
                bookings.map((b) => (
                  <tr key={b._id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{b.bookingId}</td>
                    <td className="p-3">{b.status}</td>
                    <td className="p-3">₹{b.amount}</td>
                    <td className="p-3">
  <select
    value={b.status}
    onChange={(e) => updateStatus(b._id, e.target.value)}
    className="border p-1 rounded"
  >
    <option>Pending</option>
    <option>In Transit</option>
    <option>Delivered</option>
    <option>Delayed</option>
  </select>
</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center p-6 text-gray-500">
                    No bookings found
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        </div>

      </div>
    </div>
  );
};

export default AdminBookings;