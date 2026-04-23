import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
const Terms = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex justify-center">
     <motion.div
  initial={{ opacity: 0, scale: 0.95 }}
  animate={{ opacity: 1, scale: 1 }}
  transition={{ duration: 0.3 }}
  className="bg-white max-w-3xl w-full p-6 rounded-xl shadow-lg relative"
>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-4 text-purple-600 font-medium"
        >
          ← Back
        </button>

        <div className="sticky top-0 bg-white pb-3 z-10">
  <h1 className="text-2xl font-bold">Terms & Conditions</h1>
</div>

        {/* SCROLLABLE CONTENT */}
<div className="h-[400px] overflow-y-auto pr-2 text-gray-600 space-y-3 border rounded-lg p-3">
          <p>1. Users must provide accurate and complete information.</p>
          <p>2. Bookings once confirmed cannot be cancelled.</p>
          <p>3. Delivery time may vary due to traffic or weather conditions.</p>
          <p>4. Payments must be completed before service.</p>
          <p>5. Drivers must follow safety and legal guidelines.</p>
          <p>6. Company is not responsible for unforeseen delays.</p>
          <p>7. Any misuse of the platform may lead to account suspension.</p>
          <p>8. Refund policy applies only under valid conditions.</p>
          <p>9. Users agree to data usage for service improvement.</p>
          <p>10. Terms may change anytime without prior notice.</p>

          {/* Add more if needed */}
        </div>
<div className="mt-4 flex justify-end">
 <button
  onClick={() => navigate("/signup", { state: { acceptedTerms: true } })}
  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
>
  Accept & Go Back
</button>
</div>
      </motion.div>
      
    </div>
  );
};

export default Terms;