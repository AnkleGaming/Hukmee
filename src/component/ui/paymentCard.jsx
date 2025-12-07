import React, { useState, useEffect, useCallback } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { IoIosTime } from "react-icons/io";
import { MdEdit } from "react-icons/md";
import FocusTrap from "focus-trap-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import LoginCard from "./loginCard";
import OtpVerification from "./otpverification";
import Colors from "../../core/constant";
import GetOrder from "../../backend/order/getorderid";

// Framer Motion Variants for Modal
const modalVariants = {
  hidden: { y: 50, opacity: 0, scale: 0.95 },
  visible: { y: 0, opacity: 1, scale: 1 },
  exit: { y: -50, opacity: 0, scale: 0.95 },
};

const PaymentCard = ({
  onSelectAddress,
  onSelectSlot,
  onProceed,
  selectedAddress,
  selectedSlot,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(
    localStorage.getItem("isLoggedIn") === "true"
  );
  const [userPhone, setUserPhone] = useState(
    localStorage.getItem("userPhone") || ""
  );
  const navigate = useNavigate();

  const [orderType, setOrderType] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState(""); // For OTP flow
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const fetchCartOrders = useCallback(async () => {
    if (!userPhone) return;
    try {
      const data = await GetOrder(userPhone, "Pending");
      if (Array.isArray(data) && data.length > 0) {
        setOrderType(data[0].OrderType || null);
      }
    } catch (err) {
      console.error("Error fetching order type:", err);
    }
  }, [userPhone]);

  useEffect(() => {
    if (isLoggedIn && userPhone) {
      fetchCartOrders();
    }
  }, [isLoggedIn, userPhone, fetchCartOrders]);

  // Login → Enter Phone → Show OTP
  const handleLoginClick = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      setShowLoginModal(true);
    }, 300);
  };

  // When user submits phone number from LoginCard
  const handleLoginSubmit = (phone) => {
    setPhoneNumber(phone);
    setShowLoginModal(false);
    setShowOtpModal(true);
  };

  // OTP Verified → Login Success
  const handleOtpVerified = () => {
    setShowOtpModal(false);
    setIsLoggedIn(true);
    setUserPhone(phoneNumber);
    localStorage.setItem("isLoggedIn", "true");
    localStorage.setItem("userPhone", phoneNumber);
    fetchCartOrders(); // Refresh order type after login
  };

  useEffect(() => {
    const openLoginModal = () => {
      setShowLoginModal(true);
      setShowOtpModal(false);
    };

    window.addEventListener("open-login-modal", openLoginModal);

    return () => {
      window.removeEventListener("open-login-modal", openLoginModal);
    };
  }, []);

  const isProduct = orderType === "Product";

  // Address always required; Slot only for services
  const canActuallyProceed = selectedAddress && (isProduct || selectedSlot);

  const getButtonLabel = () => {
    if (!isLoggedIn) return "Login to Continue";
    if (!selectedAddress) return "Select Address";
    if (!isProduct && !selectedSlot) return "Select Slot";
    return "Proceed";
  };

  const handleMainClick = () => {
    if (!isLoggedIn) return handleLoginClick();
    if (!selectedAddress) return onSelectAddress();
    if (!isProduct && !selectedSlot) return onSelectSlot();
    onProceed();
  };

  const handleSlotClick = () => {
    if (!selectedAddress) {
      alert("Please select your address first!");
      onSelectAddress();
    } else {
      onSelectSlot();
    }
  };

  const Desktop = () => (
    <div className="max-w-md mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <FaLocationDot className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium text-gray-900">Delivering to</p>
            <p className="text-sm text-gray-600">
              +91 {selectedAddress?.Phone || userPhone || "Your Number"}
            </p>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Address */}
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
            <FaLocationDot className="w-5 h-5 text-orange-600" />
            Delivery Address
          </h3>
          {selectedAddress ? (
            <div
              onClick={onSelectAddress}
              className="p-4 bg-orange-50 border border-orange-200 rounded-xl cursor-pointer hover:bg-orange-100 transition"
            >
              <p className="font-medium text-gray-800">
                {selectedAddress.Name}
              </p>
              <p className="text-sm text-gray-600 mt-1">
                {selectedAddress.FullAddress}
              </p>
              <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
                <MdEdit className="w-3.5 h-3.5" />
                Change Address
              </p>
            </div>
          ) : (
            <button
              onClick={onSelectAddress}
              className={`w-full py-3 rounded-xl font-medium text-white bg-${Colors.primaryMain} shadow-md hover:shadow-lg transition`}
            >
              Select Address
            </button>
          )}
        </div>

        {/* Slot - Only for Services */}
        {!isProduct && (
          <div>
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
              <IoIosTime className="w-5 h-5 text-indigo-600" />
              Preferred Slot
            </h3>
            {selectedSlot ? (
              <div
                onClick={handleSlotClick}
                className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl cursor-pointer hover:bg-indigo-100 transition"
              >
                <p className="font-medium text-gray-800">
                  {selectedSlot.day?.label} {selectedSlot.day?.date}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Time: {selectedSlot.time?.time}
                </p>
                {selectedSlot.day?.recommended && (
                  <p className="text-xs text-amber-600 mt-2">
                    Recommended Slot
                  </p>
                )}
                <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                  <MdEdit className="w-3.5 h-3.5" />
                  Change Slot
                </p>
              </div>
            ) : (
              <button
                onClick={handleSlotClick}
                disabled={!selectedAddress}
                className={`w-full py-3 rounded-xl font-medium transition-all ${
                  !selectedAddress
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : `bg-${Colors.primaryMain} text-white shadow-md hover:shadow-lg`
                }`}
              >
                Select Slot
              </button>
            )}
          </div>
        )}

        {/* Proceed Button */}
        <button
          onClick={handleMainClick}
          disabled={
            isProcessing ||
            (!isLoggedIn && getButtonLabel() !== "Login to Continue")
          }
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
            !canActuallyProceed && isLoggedIn
              ? "bg-gray-300 text-gray-600 cursor-not-allowed"
              : `bg-${Colors.primaryMain} text-white hover:shadow-xl active:scale-98`
          }`}
        >
          {getButtonLabel()}
        </button>
      </div>
    </div>
  );

  const Mobile = () => {
    const label = getButtonLabel();
    const isActionable =
      !isLoggedIn ||
      label === "Select Address" ||
      label === "Select Slot" ||
      label === "Proceed";

    return (
      <>
        <div className="fixed inset-x-0 bottom-0 z-40 bg-white border-t border-gray-200 shadow-2xl">
          <div className="p-3 space-y-3 safe-area-bottom">
            {/* Selected Info Pills */}
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
              {selectedAddress && (
                <div
                  onClick={onSelectAddress}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-300 rounded-full whitespace-nowrap cursor-pointer hover:bg-orange-100 transition"
                >
                  <FaLocationDot className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {selectedAddress.Name.split(" ")[0]}
                  </span>
                  <MdEdit className="w-4 h-4 text-gray-500" />
                </div>
              )}

              {!isProduct && selectedSlot && (
                <div
                  onClick={handleSlotClick}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-300 rounded-full whitespace-nowrap cursor-pointer hover:bg-indigo-100 transition"
                >
                  <IoIosTime className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">
                    {selectedSlot.time?.time}
                  </span>
                  <MdEdit className="w-4 h-4 text-gray-500" />
                </div>
              )}
            </div>

            {/* Main Action Button */}
            <button
              onClick={handleMainClick}
              disabled={isProcessing}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-95 shadow-lg ${
                !isActionable || isProcessing
                  ? "bg-gray-300 text-gray-600"
                  : "bg-orange-500 text-white hover:bg-orange-600"
              }`}
            >
              {isProcessing ? "Please wait..." : label}
            </button>
          </div>
        </div>

        {/* Login Modal */}
        <AnimatePresence>
          {showLoginModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <FocusTrap>
                <motion.div
                  variants={modalVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                >
                  <LoginCard
                    onClose={() => setShowLoginModal(false)}
                    onSubmit={handleLoginSubmit}
                  />
                </motion.div>
              </FocusTrap>
            </motion.div>
          )}
        </AnimatePresence>

        {/* OTP Modal */}
        <AnimatePresence>
          {showOtpModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <FocusTrap>
                <motion.div
                  variants={modalVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
                >
                  <OtpVerification
                    phone={phoneNumber}
                    onClose={() => setShowOtpModal(false)}
                    onVerified={handleOtpVerified}
                  />
                </motion.div>
              </FocusTrap>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  };

  return <>{isMobile ? <Mobile /> : <Desktop />}</>;
};

export default PaymentCard;
