import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminUsers = () => {
  const [users, setUsers] = useState([]);

  // 🔐 GET TOKEN
  const token = localStorage.getItem("token");

  // ✅ FETCH USERS
  const fetchUsers = async () => {
    try {
      const res = await axios.get(
        "https://swiftlogistics-backend.onrender.com/api/auth/users",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setUsers(res.data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ DELETE USER
  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `https://swiftlogistics-backend.onrender.com/api/auth/users/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // 🔄 Refresh list
      fetchUsers();

    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-10 px-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-lg p-6">
        
        <h2 className="text-2xl font-bold mb-6 text-purple-600">
          Users Management
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full border rounded-lg overflow-hidden">
            
            <thead className="bg-gray-200">
              <tr>
                <th className="p-3 text-left">Name</th>
                <th className="p-3 text-left">Email</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-left">Action</th>
              </tr>
            </thead>

            <tbody>
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u._id} className="border-t hover:bg-gray-50">
                    <td className="p-3">{u.name}</td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3 capitalize">{u.role}</td>

                    <td className="p-3">
                      <button
                        onClick={() => handleDelete(u._id)}
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Delete
                      </button>
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center p-6 text-gray-500">
                    No users found
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

export default AdminUsers;