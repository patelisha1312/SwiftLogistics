import { useState } from "react";
import axios from "axios";
import { motion } from "framer-motion";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false); // ✅ prevent multiple clicks

  const handleSubmit = async (e) => {
    e.preventDefault(); // ✅ prevent default reload

    if (loading) return; // ✅ stop multiple calls

    setLoading(true);

    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/auth/forgot-password`,
        { email: email.trim() } // ✅ trim fix
      );

      setMsg("📩 Reset link sent! Check your email.");
    } catch (err) {
      setMsg(err.response?.data?.msg || "Error sending email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-2xl w-[350px]"
      >
        <h2 className="text-2xl font-bold text-center mb-4 text-gray-800">
          Forgot Password
        </h2>

        {/* ✅ FORM ADDED */}
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition disabled:opacity-50"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {msg && (
          <p className="text-center mt-4 text-sm text-gray-600">{msg}</p>
        )}
      </motion.div>
    </div>
  );
};

export default ForgotPassword;