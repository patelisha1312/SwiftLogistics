import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false); // ✅ prevent multiple clicks

  // 🔐 Password strength
  const getStrength = (pwd) => {
    if (pwd.length < 6) return "Weak";
    if (pwd.match(/[A-Z]/) && pwd.match(/[0-9]/)) return "Strong";
    return "Medium";
  };

  const strength = getStrength(password);

  const handleReset = async () => {
  if (loading) return;

  const cleanPassword = password.trim();

  if (!cleanPassword) {
    setMsg("Password is required");
    return;
  }

  setLoading(true);

  try {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/auth/reset-password/${token}`,
      { password: cleanPassword }
    );

    setMsg("Password reset successful!");

    setTimeout(() => {
      navigate("/login");
    }, 2000);

  } catch (err) {
    setMsg(err.response?.data?.msg || "Error resetting password");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700">
      
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white p-8 rounded-2xl shadow-2xl w-[350px]"
      >
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
          Reset Password
        </h2>

        {/* 🔐 Input */}
        <div className="relative mb-3">
          <input
            type={show ? "text" : "password"}
            placeholder="Enter new password"
            autoComplete="new-password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 pr-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
          />

          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-3 top-3"
          >
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* 🔐 Strength */}
        {password && (
          <p className={`text-sm mb-3 ${
            strength === "Weak"
              ? "text-red-500"
              : strength === "Medium"
              ? "text-yellow-500"
              : "text-green-500"
          }`}>
            Strength: {strength}
          </p>
        )}

        {/* 🔘 Button */}
        <button
          onClick={handleReset}
          disabled={loading}
          className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
        >
          {loading ? "Updating..." : "Reset Password"}
        </button>

        {/* ❌ / ✅ Message */}
        {msg && (
          <p className="text-center mt-4 text-sm text-gray-600">{msg}</p>
        )}
      </motion.div>

      {/* 🎉 Popup */}
      {success && (
        <div className="fixed top-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-bounce">
          🎉 Password Updated!
        </div>
      )}
    </div>
  );
};

export default ResetPassword;