// PaymentCardButton.jsx - FINAL VERSION (Using your CouponShow)
import React, { useMemo, useState, useEffect } from "react";
import { Sparkles, CheckCircle, Tag, ChevronDown } from "lucide-react";
import GetOrder from "../../backend/order/getorderid";
import GetWallet from "../../backend/getwallet/getwallet";
import CouponShow from "../../backend/coupon/coupon"; // ← Your reusable function

const PaymentCardButton = ({ itemTotal = 0, onProceed, loading = false }) => {
  const UserID = localStorage.getItem("userPhone");

  const [cartItems, setCartItems] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);
  const [orderType, setOrderType] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [showCoupons, setShowCoupons] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const isProduct = orderType === "Product";

  // 1. FINAL TOTAL - MUST BE FIRST
  const finalTotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) =>
        total + Number(item.Price || 0) * Number(item.Quantity || 1),
      0
    );
  }, [cartItems]);

  // 2. COUPON DISCOUNT
  const couponDiscount = useMemo(() => {
    if (!selectedCoupon || !isProduct) return 0;
    const percentage = Number(selectedCoupon.CouPercentage || 0);
    const discount = (finalTotal * percentage) / 100;
    return Math.floor(Math.min(discount, finalTotal));
  }, [selectedCoupon, finalTotal, isProduct]);

  // 3. WALLET AFTER COUPON
  const walletUsed = useMemo(() => {
    if (!isProduct || !useWallet) return 0;
    const remainingAfterCoupon = finalTotal - couponDiscount;
    return Math.min(walletBalance, remainingAfterCoupon);
  }, [isProduct, useWallet, walletBalance, finalTotal, couponDiscount]);

  // 4. PAYABLE AMOUNT
  const payableAmount = finalTotal - couponDiscount - walletUsed;

  // FETCH WALLET
  useEffect(() => {
    const fetchWallet = async () => {
      if (!UserID) {
        setWalletBalance(0);
        return;
      }
      try {
        const walletData = await GetWallet(UserID);
        const balance = Number(
          walletData?.[0]?.WalletBalance || walletData?.WalletBalance || 0
        );
        setWalletBalance(balance);
      } catch (e) {
        setWalletBalance(0);
      }
    };

    fetchWallet();
  }, [UserID]);

  // FETCH CART + ORDER TYPE + COUPONS (using your CouponShow)
  useEffect(() => {
    const fetchData = async () => {
      if (!UserID) return;

      // Fetch cart & order type
      try {
        const data = await GetOrder(UserID, "Pending");
        if (Array.isArray(data) && data.length > 0) {
          setOrderType(data[0].OrderType || null);
          setCartItems(data);
        } else {
          setCartItems([]);
          setOrderType(null);
        }
      } catch (err) {
        console.error("Failed to fetch cart:", err);
      }

      // Fetch coupons using your clean reusable function
      try {
        const couponList = await CouponShow(); // ← This is here!
        const activeCoupons = couponList.filter((c) => c.Status === "Active");
        setCoupons(activeCoupons);
      } catch (err) {
        console.error("Failed to load coupons:", err);
        setCoupons([]);
      }
    };

    fetchData();
  }, [UserID]);

  // SEND DATA TO PARENT (PaymentPage)
  useEffect(() => {
    if (onProceed) {
      onProceed({
        payableAmount,
        useWallet,
        walletUsed,
        totalAmount: finalTotal,
        walletBalance,
        couponDiscount,
        selectedCoupon,
      });
    }
  }, [
    payableAmount,
    useWallet,
    walletUsed,
    finalTotal,
    walletBalance,
    couponDiscount,
    selectedCoupon,
    onProceed,
  ]);

  // FORMATTER
  const fmt = (amount) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount) || 0);

  const applyCoupon = (coupon) => {
    setSelectedCoupon(coupon);
    setShowCoupons(false);
  };

  const removeCoupon = () => setSelectedCoupon(null);

  return (
    <div className="w-full max-w-md mx-auto p-5 bg-white border border-gray-200 rounded-2xl shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-orange-50">
            <Sparkles className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-900">Payment Summary</h3>
            <p className="text-xs text-gray-500">Review before proceeding</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Subtotal</p>
          <p className="text-lg font-semibold text-orange-600">
            {fmt(finalTotal)}
          </p>
        </div>
      </div>

      {/* Coupon Section */}
      {isProduct && (
        <div className="mb-4">
          {selectedCoupon ? (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 mb-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-emerald-800">
                    {selectedCoupon.CouponCode}
                  </p>
                  <p className="text-xs text-emerald-600">
                    {selectedCoupon.CouPercentage}% OFF
                  </p>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-sm font-medium text-emerald-700 hover:text-emerald-900"
                >
                  Remove
                </button>
              </div>
              <p className="text-xs text-emerald-700 mt-1">
                Saved: {fmt(couponDiscount)}
              </p>
            </div>
          ) : (
            <div className="relative">
              <button
                onClick={() => setShowCoupons(!showCoupons)}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-blue-50 border-2 border-dashed border-blue-300 hover:border-blue-400 transition"
              >
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">
                    Apply Coupon Code
                  </span>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-blue-600 transition-transform ${
                    showCoupons ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showCoupons && (
                <div className="absolute z-20 w-full mt-2 bg-white rounded-xl shadow-xl border border-gray-200 max-h-60 overflow-y-auto">
                  {coupons.length > 0 ? (
                    coupons.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => applyCoupon(c)}
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 flex justify-between items-center border-b last:border-0"
                      >
                        <div>
                          <p className="font-bold text-gray-800">
                            {c.CouponCode}
                          </p>
                          <p className="text-xs text-gray-600">
                            {c.CouPercentage}% off
                          </p>
                        </div>
                        <span className="text-indigo-600 font-bold">Apply</span>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">
                      No coupons available
                    </p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Wallet Section */}
      {isProduct && (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-200 mb-4">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-600">Wallet Balance</p>
              <p className="text-lg font-bold text-green-600">
                {fmt(walletBalance)}
              </p>
            </div>
            <button
              onClick={() => setUseWallet(!useWallet)}
              className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition ${
                useWallet ? "bg-green-500 border-green-600" : "border-gray-300"
              }`}
            >
              {useWallet && <CheckCircle className="w-5 h-5 text-white" />}
            </button>
          </div>
          {useWallet && walletUsed > 0 && (
            <p className="text-xs text-green-600 mt-2">
              Applied: {fmt(walletUsed)}
            </p>
          )}
        </div>
      )}

      {/* Final Payable */}
      <div className="border-t pt-4 pt-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-lg font-bold text-gray-800">
            Payable Amount
          </span>
          <span className="text-2xl font-bold text-orange-600">
            {fmt(payableAmount)}
          </span>
        </div>

        {/* Breakdown */}
        {(couponDiscount > 0 || walletUsed > 0) && (
          <div className="text-xs space-y-1 text-right">
            {couponDiscount > 0 && (
              <div className="text-emerald-600">
                Coupon Discount: -{fmt(couponDiscount)}
              </div>
            )}
            {walletUsed > 0 && (
              <div className="text-green-600">
                Wallet Used: -{fmt(walletUsed)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentCardButton;
