import React, { useState, useEffect, useCallback } from "react";
import { FaLocationDot } from "react-icons/fa6";
import { IoIosTime } from "react-icons/io";
import { MdEdit } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import Colors from "../../core/constant";
import GetOrder from "../../backend/order/getorderid";

const PaymentCard = ({
  onSelectAddress,
  onSelectSlot,
  onProceed,
  selectedAddress,
  selectedSlot,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLoggedIn] = useState(localStorage.getItem("isLoggedIn") === "true");
  const navigate = useNavigate();
  const UserID = localStorage.getItem("userPhone");
  const [orderType, setOrderType] = useState(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const fetchCartOrders = useCallback(async () => {
    if (!UserID) return;
    try {
      const data = await GetOrder(UserID, "Pending");
      if (Array.isArray(data) && data.length > 0) {
        setOrderType(data[0].OrderType || null);
      }
    } catch (err) {
      console.error("Error fetching order type:", err);
    }
  }, [UserID]);

  useEffect(() => {
    fetchCartOrders();
  }, [fetchCartOrders]);

  const isProduct = orderType === "Product";

  // Address is ALWAYS required
  const canActuallyProceed = selectedAddress && (isProduct || selectedSlot);

  const getButtonLabel = () => {
    if (!isLoggedIn) return "Login to Continue";
    if (!selectedAddress) return "Select Address";
    if (!isProduct && !selectedSlot) return "Select Slot";
    return "Proceed";
  };

  const handleMainClick = () => {
    if (!isLoggedIn) return navigate("/login");
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

  // Button should be ENABLED when asking user to select address/slot
  const isButtonInteractive =
    isLoggedIn && (!selectedAddress || (!isProduct && !selectedSlot));

  const Desktop = () => (
    <div className="max-w-md mx-auto p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 space-y-6">
        <div className="flex items-center gap-3">
          <FaLocationDot className="w-6 h-6 text-green-600" />
          <div>
            <p className="font-medium text-gray-900">Booking details to</p>
            <p className="text-sm text-gray-600">
              +91 {selectedAddress?.Phone || localStorage.getItem("userPhone")}
            </p>
          </div>
        </div>

        <hr className="border-gray-200" />

        {/* Address */}
        <div>
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900 mb-3">
            <FaLocationDot className="w-5 h-5 text-orange-600" />
            Address
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
                Change
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
              Slot
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
                  <p className="text-xs text-amber-600 mt-2">Recommended</p>
                )}
                <p className="text-xs text-indigo-600 mt-2 flex items-center gap-1">
                  <MdEdit className="w-3.5 h-3.5" />
                  Change
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
          disabled={!isLoggedIn || !canActuallyProceed} // Only disable when truly cannot proceed
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg ${
            !isLoggedIn || !canActuallyProceed
              ? "bg-gray-200 text-gray-500 cursor-not-allowed"
              : `bg-${Colors.primaryMain} text-white hover:shadow-lg`
          }`}
        >
          {getButtonLabel()}
        </button>
      </div>
    </div>
  );

  const Mobile = () => {
    const label = getButtonLabel();
    const shouldEnableButton =
      label === "Select Address" ||
      label === "Select Slot" ||
      label === "Proceed";

    return (
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
        <div className="p-3 space-y-3">
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

          {/* Main Action Button - Always enabled when guiding user */}
          <button
            onClick={handleMainClick}
            className={`w-full py-4 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95 ${
              !shouldEnableButton
                ? "bg-gray-300 text-gray-600"
                : "bg-orange-500 text-white hover:bg-orange-600"
            }`}
          >
            {label}
          </button>
        </div>
      </div>
    );
  };

  return <>{isMobile ? <Mobile /> : <Desktop />}</>;
};

export default PaymentCard;
