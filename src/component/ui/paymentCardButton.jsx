// PaymentCardButton.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Sparkles, CheckCircle } from "lucide-react";
import GetOrder from "../../backend/order/getorderid";
import GetWallet from "../../backend/getwallet/getwallet";

const PaymentCardButton = ({ itemTotal = 0, onProceed, loading = false }) => {
  const UserID = localStorage.getItem("userPhone");

  const [cartItems, setCartItems] = useState([]);
  const [walletBalance, setWalletBalance] = useState(0);
  const [useWallet, setUseWallet] = useState(false);

  // ------------------------------
  // FETCH WALLET BALANCE
  // ------------------------------
  useEffect(() => {
    const fetchWallet = async () => {
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

    if (UserID) fetchWallet();
  }, [UserID]);

  // ------------------------------
  // FETCH CART ITEMS
  // ------------------------------
  useEffect(() => {
    const fetchCart = async () => {
      try {
        const data = await GetOrder(UserID, "Pending");
        setCartItems(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };

    fetchCart();
  }, []);

  // ------------------------------
  // FINAL TOTAL PRICE
  // ------------------------------
  const finalTotal = useMemo(() => {
    return cartItems.reduce(
      (total, item) => total + Number(item.Price) * Number(item.Quantity),
      0
    );
  }, [cartItems]);

  // ------------------------------
  // APPLY WALLET
  // ------------------------------
  const walletUsed = useWallet ? Math.min(walletBalance, finalTotal) : 0;
  const payableAmount = finalTotal - walletUsed;

  // 🔥 SEND DATA TO PARENT AUTOMATICALLY
  useEffect(() => {
    if (onProceed) {
      onProceed({
        payableAmount,
        useWallet,
        walletUsed,
        totalAmount: finalTotal,
        walletBalance,
      });
    }
  }, [payableAmount, useWallet, walletUsed, finalTotal, onProceed]);

  // ------------------------------
  // FORMATTER
  // ------------------------------
  const fmt = (v) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(v) || 0);

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

      {/* Wallet Section */}
      <div className="p-3 mt-3 rounded-xl bg-gray-50 border border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">Wallet Balance</p>
            <p className="text-lg font-bold text-green-600">
              {fmt(walletBalance)}
            </p>
          </div>

          {/* Tick Button */}
          <button
            onClick={() => setUseWallet(!useWallet)}
            className={`w-7 h-7 flex items-center justify-center rounded-full border ${
              useWallet ? "bg-green-500 border-green-600" : "border-gray-300"
            }`}
          >
            <CheckCircle
              className={`w-5 h-5 ${
                useWallet ? "text-white" : "text-gray-400"
              }`}
            />
          </button>
        </div>

        {useWallet && (
          <p className="text-xs text-green-600 mt-1">
            Wallet Applied: {fmt(walletUsed)}
          </p>
        )}
      </div>

      {/* Payable Amount */}
      <div className="mt-4 flex justify-between items-center">
        <span className="text-lg font-semibold text-gray-800">
          Payable Amount
        </span>
        <span className="text-xl font-bold text-orange-600">
          {fmt(payableAmount)}
        </span>
      </div>
    </div>
  );
};

export default PaymentCardButton;
