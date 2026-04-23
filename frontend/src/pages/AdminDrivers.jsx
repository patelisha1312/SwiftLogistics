import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminDrivers = () => {
  const [drivers, setDrivers] = useState([]);

  useEffect(() => {
    axios.get("http://localhost:5000/api/driver/all")
  .then((res) => setDrivers(res.data.drivers)) // ✅ FIXED
  .catch((err) => console.error(err));
  }, []);
const approveDriver = async (id) => {
  await axios.put(`http://localhost:5000/api/driver/approve/${id}`);
  
  // refresh
  const res = await axios.get("http://localhost:5000/api/driver/all");
  setDrivers(res.data.drivers);
};

const rejectDriver = async (id) => {
  await axios.put(`http://localhost:5000/api/driver/reject/${id}`);
  setDrivers(drivers.filter((d) => d._id !== id));
};
  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        
        <h2 className="text-2xl font-bold mb-6 text-green-600">
          Drivers Management
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border rounded-lg overflow-hidden">
            
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Phone</th>
                <th className="p-3 text-left">Vehicle</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {drivers.length > 0 ? (
                drivers.map((d) => (
                  <tr key={d._id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{d.name}</td>
                    <td className="p-3">{d.phone}</td>
                    <td className="p-3">{d.vehicleNumber}</td>
                    <td className="p-3 space-x-2">
  <button
    onClick={() => approveDriver(d._id)}
    className="bg-green-500 text-white px-3 py-1 rounded"
  >
    Approve
  </button>

  <button
    onClick={() => rejectDriver(d._id)}
    className="bg-red-500 text-white px-3 py-1 rounded"
  >
    Reject
  </button>
</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="text-center p-6 text-gray-500">
                    No drivers found
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

export default AdminDrivers;