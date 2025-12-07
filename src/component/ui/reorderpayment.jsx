// ReorderPayment.jsx
import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Tag,
  ChevronDown,
  CheckCircle,
  IndianRupee,
  X,
  ShoppingBag,
} from "lucide-react";
import GetWallet from "../../backend/getwallet/getwallet";
import CouponShow from "../../backend/coupon/coupon";
import UpdateOrderstatus from "../../backend/order/updateorder";
import UpdateWallet from "../../backend/getwallet/updatewallet";

const ReorderPayment = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const UserID = localStorage.getItem("userPhone");

  const navigatedCartItems = state?.cartData || [];
  const [cartItems] = useState(navigatedCartItems);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [coupons, setCoupons] = useState([]);
  const [showCoupons, setShowCoupons] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const orderId = cartItems[0]?.OrderID || "N/A";

  const subtotal = useMemo(() => {
    return cartItems.reduce(
      (sum, item) => sum + Number(item.Price || 0) * Number(item.Quantity || 1),
      0
    );
  }, [cartItems]);

  const couponDiscount = useMemo(() => {
    if (!selectedCoupon) return 0;
    const percentage = Number(selectedCoupon.CouPercentage || 0);
    if (percentage <= 0) return 0;
    return Math.floor((subtotal * percentage) / 100);
  }, [selectedCoupon, subtotal]);

  const walletUsed = useMemo(() => {
    if (!useWallet || walletBalance <= 0) return 0;
    const remaining = subtotal - couponDiscount;
    return Math.min(walletBalance, remaining);
  }, [useWallet, walletBalance, subtotal, couponDiscount]);

  const payableAmount = Math.max(0, subtotal - couponDiscount - walletUsed);

  const fmt = (amount) => {
    const value = Math.round(Number(amount) || 0);
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);
  };

  useEffect(() => {
    const load = async () => {
      if (!UserID) return;
      try {
        const walletData = await GetWallet(UserID);
        setWalletBalance(Number(walletData?.[0]?.WalletBalance || 0));
      } catch (e) {
        setWalletBalance(0);
      }
      try {
        const list = await CouponShow(UserID);
        setCoupons(list.filter((c) => c.Status === "Active"));
      } catch (e) {
        setCoupons([]);
      }
    };
    load();
  }, [UserID]);

  const applyCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    setShowCoupons(false);
  };

  const removeCoupon = () => setSelectedCoupon(null);

  const handlePaymentComplete = async (mode) => {
    try {
      await UpdateOrderstatus({
        OrderID: orderId,
        Status: "Onservice",
        PayCustomer: mode === "Cash" ? "Cash" : "Online",
        PaymentMethod: "",
        FinalPrice: payableAmount,
        Coupon: selectedCoupon ? selectedCoupon.CouponCode : "",
      });

      // Deduct wallet for Cash also (since payment is confirmed)
      if (useWallet && walletUsed > 0) {
        const newBalance = walletBalance - walletUsed;
        await UpdateWallet(UserID, newBalance);
      }

      alert(`Order placed successfully via ${mode}!`);
      navigate("/");
    } catch (error) {
      console.error("Order update failed:", error);
      alert("Failed. Please try again.");
    }
  };

  const handleOnlinePayment = async () => {
    if (payableAmount <= 0) {
      alert("Amount is zero or invalid");
      return;
    }

    // Load Razorpay script
    const loadRazorpay = () => {
      return new Promise((resolve, reject) => {
        if (window.Razorpay) return resolve(true);

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => reject(new Error("Razorpay SDK failed to load"));
        document.body.appendChild(script);
      });
    };

    try {
      await loadRazorpay();

      const options = {
        key: "rzp_test_RkTL7QV0DSn6sD", // Replace with your actual key
        amount: payableAmount * 100, // in paise
        currency: "INR",
        name: "Hukmee",
        description: `Reorder Payment - Order #${orderId}`,
        image: "/logo.png", // optional
        handler: async function (response) {
          const paymentId = response.razorpay_payment_id;

          try {
            // Step 1: Update Order Status to "Onservice" + Save Payment Details
            await UpdateOrderstatus({
              OrderID: orderId,
              Status: "Onservice",
              PaymentMethod: "",
              PayCustomer: "Online",
              FinalPrice: payableAmount,
              Coupon: selectedCoupon ? selectedCoupon.CouponCode : "",
              PaymentID: paymentId, // Optional: store for reference
            });

            // Step 2: Deduct Wallet Amount (only if used)
            if (useWallet && walletUsed > 0) {
              const newBalance = walletBalance - walletUsed;
              await UpdateWallet(UserID, newBalance);
              console.log(`Wallet updated: ₹${walletUsed} deducted`);
            }

            // Success!
            alert(`Payment Successful! Payment ID: ${paymentId}`);
            navigate("/");
          } catch (error) {
            console.error("Post-payment update failed:", error);
            alert(
              "Payment successful but order update failed. Contact support with Payment ID: " +
                paymentId
            );
          }
        },
        prefill: {
          contact: UserID,
          name: "Customer",
        },
        theme: {
          color: "#F97316", // orange to match your design
        },
        modal: {
          ondismiss: () => {
            alert("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.on("payment.failed", function (response) {
        alert("Payment Failed: " + (response.error.description || "Try again"));
        console.log(response.error);
      });

      razorpay.open();
    } catch (error) {
      alert("Failed to load payment gateway. Check internet connection.");
      console.error(error);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <p className="text-gray-600 text-base">No items to reorder.</p>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto px-4 pt-5 mt-5 pb-24">
          {/* Header */}
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-orange-600" />
              <h1 className="text-xl font-bold text-gray-800">Cart</h1>
            </div>
          </div>

          {/* Cart Items */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-4">
            {cartItems.map((item, i) => (
              <div
                key={item.ID}
                className={`flex justify-between items-center py-3 ${
                  i !== cartItems.length - 1 ? "border-b border-gray-100" : ""
                }`}
              >
                <div>
                  <p className="font-medium text-gray-900 text-sm">
                    {item.ItemName}
                  </p>
                  {item.duration && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.duration}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">×{item.Quantity}</p>
                  <p className="font-bold text-orange-600 text-sm">
                    ₹{Number(item.Price) * Number(item.Quantity)}
                  </p>
                </div>
              </div>
            ))}
            <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between">
              <span className="text-sm font-medium text-gray-700">
                Subtotal
              </span>
              <span className="font-bold text-gray-900">{fmt(subtotal)}</span>
            </div>
          </div>

          {/* Coupon Section */}
          <div className="mb-4">
            {selectedCoupon ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-600" />
                  <div>
                    <p className="font-bold text-emerald-800 text-sm">
                      {selectedCoupon.CouponCode}
                    </p>
                    <p className="text-xs text-emerald-700">
                      ₹{couponDiscount} off applied
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-xs text-emerald-700 font-medium"
                >
                  Remove
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setShowCoupons(!showCoupons)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl px-4 py-3 flex items-center justify-between shadow-md active:scale-98 transition"
                >
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium text-sm">Apply Coupon</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 transition ${
                      showCoupons ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {showCoupons && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden"
                    >
                      {coupons.length === 0 ? (
                        <p className="text-center py-6 text-gray-500 text-sm">
                          No coupons available
                        </p>
                      ) : (
                        coupons.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => applyCoupon(c)}
                            className="w-full px-4 py-3 flex justify-between items-center border-b border-gray-100 last:border-0 hover:bg-gray-50"
                          >
                            <div className="text-left">
                              <p className="font-bold text-gray-800 text-sm">
                                {c.CouponCode}
                              </p>
                              <p className="text-xs text-gray-600">
                                {c.CouPercentage}% off • till{" "}
                                {new Date(c.CouValidity).toLocaleDateString(
                                  "en-IN"
                                )}
                              </p>
                            </div>
                            <span className="text-xs font-bold text-indigo-600">
                              APPLY
                            </span>
                          </button>
                        ))
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Wallet */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-600">Wallet Balance</p>
                <p className="font-bold text-green-600 text-lg">
                  {fmt(walletBalance)}
                </p>
              </div>
              <button
                onClick={() => setUseWallet(!useWallet)}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                  useWallet
                    ? "bg-green-500 border-green-600"
                    : "border-gray-300"
                }`}
              >
                {useWallet && <CheckCircle className="w-6 h-6 text-white" />}
              </button>
            </div>
            {useWallet && walletUsed > 0 && (
              <p className="text-right text-xs text-green-600 mt-2 font-medium">
                Using {fmt(walletUsed)}
              </p>
            )}
          </div>

          {/* Final Amount */}
          <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-2xl p-5 shadow-xl">
            <div className="flex justify-between items-end">
              <div>
                {(couponDiscount > 0 || walletUsed > 0) && (
                  <p className="text-xs opacity-80 line-through mb-1">
                    ₹{subtotal}
                  </p>
                )}
                <p className="text-sm opacity-90">Amount to Pay</p>
                <p className="text-3xl font-bold">{fmt(payableAmount)}</p>
                {(couponDiscount > 0 || walletUsed > 0) && (
                  <p className="text-xs mt-1 opacity-90">
                    You saved ₹{couponDiscount + walletUsed}
                  </p>
                )}
              </div>
              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-white text-orange-600 font-bold px-6 py-3 rounded-xl text-sm shadow-lg active:scale-95 transition"
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>

        {/* Payment Modal */}
        <AnimatePresence>
          {showPaymentModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end justify-center p-4"
              onClick={() => setShowPaymentModal(false)}
            >
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                className="bg-white rounded-2xl w-full max-w-sm p-6"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-bold text-lg">Confirm Payment</h3>
                  <button onClick={() => setShowPaymentModal(false)}>
                    <X className="w-5 h-5 text-gray-500" />
                  </button>
                </div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <IndianRupee className="w-9 h-9 text-indigo-600" />
                  </div>
                  <p className="text-gray-600 text-sm">
                    Order <strong>#{orderId}</strong>
                  </p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">
                    {fmt(payableAmount)}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      handlePaymentComplete("Cash");
                      setShowPaymentModal(false);
                    }}
                    className="bg-green-600 text-white py-3 rounded-xl font-medium active:scale-95 transition"
                  >
                    Cash
                  </button>
                  <button
                    onClick={() => {
                      handleOnlinePayment();
                      setShowPaymentModal(false);
                    }}
                    className="bg-indigo-600 text-white py-3 rounded-xl font-medium active:scale-95 transition"
                  >
                    Online
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default ReorderPayment;
