// src/components/cart/CartPage.jsx
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { Minus, Plus, Trash2, X, IndianRupee } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion"; // ← Required for modal animation
import GetOrder from "../../backend/order/getorderid";
import DeleteOrder from "../../backend/order/deleteorder";
import Colors from "../../core/constant";
import ShowOrders from "../../backend/order/showorder";
import UpdateOrderQuantity from "../../backend/order/updateorderquantity";
import UpdateOrderstatus from "../../backend/order/updateorder";
import CartSummary from "./cartsummury";

const CartPage = () => {
  const [orders, setOrders] = useState([]);
  const [isCartLoading, setIsCartLoading] = useState(false);
  const [deletingItemId, setDeletingItemId] = useState(null);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [pending1, setPending1] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("cart");
  const UserID = localStorage.getItem("userPhone");
  const navigate = useNavigate();

  // Payment Modal States
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);

  // Fetch cart orders (Pending)
  const fetchCartOrders = useCallback(async () => {
    if (!UserID) {
      setOrders([]);
      return;
    }
    setIsCartLoading(true);
    try {
      const data = await GetOrder(UserID, "Pending");
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Error fetching cart:", err);
      setOrders([]);
    } finally {
      setIsCartLoading(false);
    }
  }, [UserID]);

  // Fetch Pending1 (vendor suggestions)
  const fetchPending1Orders = useCallback(async () => {
    if (!UserID) {
      setPending1([]);
      return;
    }
    setPendingLoading(true);
    try {
      const data = await ShowOrders({
        orderid: "",
        UserID,
        VendorPhone: "",
        Status: "Pending1",
      });
      setPending1(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching pending1 orders:", error);
      setPending1([]);
    } finally {
      setPendingLoading(false);
    }
  }, [UserID]);

  useEffect(() => {
    fetchCartOrders();
    fetchPending1Orders();
  }, [fetchCartOrders, fetchPending1Orders]);

  useEffect(() => {
    if (Array.isArray(pending1) && pending1.length > 0) {
      setActiveTab("reorder");
    } else {
      setActiveTab("cart");
      fetchCartOrders();
    }
  }, [pending1]);

  const canShowCart = pending1.length === 0;
  const hiddenCartBecauseReorder = pending1.length > 0;

  // Remove item
  const handleRemove = async (id) => {
    if (!id) return;
    setDeletingItemId(id);
    try {
      if (activeTab === "cart" && canShowCart) {
        setOrders((prev) =>
          prev.filter((item) => String(item.ID) !== String(id))
        );
        await DeleteOrder(id);
        await fetchCartOrders();
      } else {
        setPending1((prev) =>
          prev.filter((item) => String(item.ID) !== String(id))
        );
        await DeleteOrder(id);
        await fetchPending1Orders();
      }
    } catch (err) {
      console.error("Delete failed:", err);
      await fetchCartOrders();
      await fetchPending1Orders();
      alert("Failed to remove item. Please try again.");
    } finally {
      setDeletingItemId(null);
    }
  };

  // Update quantity
  const handleUpdateQuantity = async (rowId, newQty) => {
    if (!rowId) return;

    const orderToUpdate =
      activeTab === "cart" && canShowCart
        ? orders.find((item) => String(item.ID) === String(rowId))
        : pending1.find((item) => String(item.ID) === String(rowId));

    if (!orderToUpdate) return;

    const clampedQty = Math.max(1, Number(newQty));

    if (activeTab === "cart" && canShowCart) {
      setOrders((prev) =>
        prev.map((item) =>
          String(item.ID) === String(rowId)
            ? { ...item, Quantity: clampedQty }
            : item
        )
      );
    } else {
      setPending1((prev) =>
        prev.map((item) =>
          String(item.ID) === String(rowId)
            ? { ...item, Quantity: clampedQty }
            : item
        )
      );
    }

    setUpdatingItemId(rowId);

    try {
      await UpdateOrderQuantity({
        Id: String(orderToUpdate.ID),
        OrderID: orderToUpdate.OrderID || "",
        Price: String(orderToUpdate.Price || "0"),
        Quantity: String(clampedQty),
      });

      activeTab === "cart" && canShowCart
        ? await fetchCartOrders()
        : await fetchPending1Orders();
    } catch (err) {
      console.error("Update quantity failed:", err);
      await fetchCartOrders();
      await fetchPending1Orders();
      alert("Failed to update quantity. Please try again.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  // Totals
  const cartTotal = useMemo(
    () =>
      (orders || []).reduce(
        (a, i) => a + Number(i.Price || 0) * Number(i.Quantity || 0),
        0
      ),
    [orders]
  );

  const pending1Total = useMemo(
    () =>
      (pending1 || []).reduce(
        (a, i) => a + Number(i.Price || 0) * Number(i.Quantity || 0),
        0
      ),
    [pending1]
  );

  const totalCartItemsQty = useMemo(
    () => orders.reduce((sum, item) => sum + Number(item.Quantity || 0), 0),
    [orders]
  );

  const totalPending1ItemsQty = useMemo(
    () => pending1.reduce((sum, item) => sum + Number(item.Quantity || 0), 0),
    [pending1]
  );

  const currentItems = activeTab === "cart" && canShowCart ? orders : pending1;
  const currentTotal =
    activeTab === "cart" && canShowCart ? cartTotal : pending1Total;
  const currentItemCount =
    activeTab === "cart" && canShowCart
      ? totalCartItemsQty
      : totalPending1ItemsQty;

  const handleProceed = () => {
    if (activeTab === "cart" && canShowCart) {
      navigate("/paymentpage", {
        state: { cartItems: orders, total: cartTotal, totalDiscount: 0 },
      });
    } else {
      navigate("/paymentpage", {
        state: { cartItems: pending1, total: pending1Total, isReorder: true },
      });
    }
  };

  // Open Payment Modal when "Update Items" is clicked
  const openPaymentModal = () => {
    const orderId = pending1[0]?.OrderID || "N/A";
    setPaymentOrderId(orderId);
    setPaymentAmount(pending1Total);
    setShowPaymentModal(true);
  };

  const handlePaymentComplete = async (orderId, amount, mode) => {
    try {
      // 1. Update Order Status (PaymentMethod)
      const updateResponse = await UpdateOrderstatus({
        OrderID: orderId,
        Price: "",
        Quantity: "",
        Status: "Onservice",
        VendorPhone: UserID,
        BeforVideo: "",
        AfterVideo: "",
        OTP: "",
        PaymentMethod: "",
      });

      alert("Payment Complited...");

      window.location.reload();
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment process failed.");
    }
  };

  const pending1RemoveAllowed = () => pending1.length > 1;

  // Payment Confirmation Modal Component
  const PaymentModal = ({ isOpen, onClose, orderId, amount, onConfirm }) => {
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-gray-500 hover:text-red-600 transition"
              >
                <X size={20} />
              </button>

              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <IndianRupee className="text-blue-600" size={32} />
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Payment By?
              </h3>
              <p className="text-sm text-gray-600 mb-5">
                Confirm ₹{amount} has been paid for Order #{orderId}
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    onConfirm(orderId, amount, "Cash");
                    onClose();
                  }}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2.5 rounded-xl font-medium hover:shadow-md transition"
                >
                  Cash
                </button>
                <button
                  onClick={() => {
                    onConfirm(orderId, amount, "Online");
                    onClose();
                  }}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-2.5 rounded-xl font-medium hover:shadow-md transition"
                >
                  Online
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  return (
    <>
      {/* Main Cart Container */}
      <div className="w-full max-w-md mx-auto bg-white rounded-2xl shadow-xl overflow-hidden font-sans">
        {/* Header */}
        <div className="py-5 sm:p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-2xl font-bold text-gray-900 mb-1">Your Cart</h2>
          <p className="text-sm text-gray-500">Review and confirm your items</p>

          {/* Tab Switcher */}
          {!hiddenCartBecauseReorder && (
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setActiveTab("cart")}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                  activeTab === "cart"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Cart Items
              </button>
              <button
                onClick={() => setActiveTab("reorder")}
                className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all ${
                  activeTab === "reorder"
                    ? "bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/30"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                Reorder
              </button>
            </div>
          )}

          {/* Reorder Warning */}
          {hiddenCartBecauseReorder && (
            <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl">
              <p className="text-sm font-medium text-orange-700">
                Vendor suggested changes are pending
              </p>
              <p className="text-xs text-orange-600 mt-1">
                You can only edit the reordered items
              </p>
            </div>
          )}
        </div>

        {/* Scrollable Cart Items */}
        <div
          className="px-5 sm:px-6 pt-4 pb-2"
          style={{
            maxHeight: "calc(100vh - 460px)",
            overflowY: "auto",
            scrollbarWidth: "thin",
          }}
        >
          {/* Empty State */}
          {activeTab === "cart" &&
            !hiddenCartBecauseReorder &&
            orders.length === 0 &&
            !isCartLoading && (
              <div className="text-center py-12">
                <div className="bg-gray-100 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <p className="text-gray-500 font-medium">Your cart is empty</p>
                <p className="text-xs text-gray-400 mt-1">
                  Add items to get started
                </p>
              </div>
            )}

          {/* Loading State */}
          {(isCartLoading || pendingLoading) && (
            <div className="space-y-4 py-8">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex gap-4 animate-pulse">
                  <div className="bg-gray-200 rounded-xl w-20 h-20 flex-shrink-0" />
                  <div className="flex-1 space-y-3">
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Cart Items List */}
          {(activeTab === "cart" && !hiddenCartBecauseReorder
            ? orders
            : pending1
          ).map((item) => (
            <div
              key={item.ID}
              className="flex gap-4 py-5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors rounded-xl -mx-1 px-1"
            >
              {/* Item Name & Remove */}
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-base">
                  {item.ItemName}
                </h3>

                <button
                  onClick={() => handleRemove(item.ID)}
                  disabled={
                    deletingItemId === item.ID ||
                    (activeTab === "reorder" && !pending1RemoveAllowed())
                  }
                  className={`flex items-center gap-1.5 mt-3 text-sm font-medium transition-colors ${
                    activeTab === "reorder" && !pending1RemoveAllowed()
                      ? "text-gray-400 cursor-not-allowed"
                      : "text-red-600 hover:text-red-700"
                  }`}
                  title={
                    activeTab === "reorder" && !pending1RemoveAllowed()
                      ? "Cannot remove last vendor-suggested item"
                      : "Remove item"
                  }
                >
                  <Trash2 size={15} />
                  {deletingItemId === item.ID ? "Removing..." : "Remove"}
                </button>
              </div>

              {/* Quantity & Price */}
              <div className="flex flex-col items-end gap-3">
                {/* Quantity Controls */}
                <div className="flex items-center bg-gray-100 rounded-full px-3 py-2 gap-3">
                  <button
                    onClick={() =>
                      handleUpdateQuantity(item.ID, Number(item.Quantity) - 1)
                    }
                    disabled={
                      Number(item.Quantity) <= 1 || updatingItemId === item.ID
                    }
                    className="text-gray-600 hover:text-gray-900 disabled:opacity-50 transition"
                  >
                    <Minus size={16} />
                  </button>

                  {updatingItemId === item.ID ? (
                    <div className="w-8">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-orange-500 border-t-transparent mx-auto" />
                    </div>
                  ) : (
                    <span className="w-8 text-center font-semibold text-gray-800">
                      {item.Quantity}
                    </span>
                  )}

                  <button
                    onClick={() =>
                      handleUpdateQuantity(item.ID, Number(item.Quantity) + 1)
                    }
                    disabled={updatingItemId === item.ID}
                    className="text-gray-600 hover:text-gray-900 transition"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Price */}
                <p className="font-bold text-lg bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  ₹
                  {(
                    Number(item.Price || 0) * Number(item.Quantity || 0)
                  ).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Cart Summary Footer */}
        {currentItems.length > 0 && (
          <div className="border-t border-gray-200 bg-gray-50/70">
            <CartSummary
              total={currentTotal}
              cartItems={currentItems}
              customButtonText={
                activeTab === "reorder" || hiddenCartBecauseReorder
                  ? `Update Items (${currentItemCount} ${
                      currentItemCount === 1 ? "Item" : "Items"
                    })`
                  : "Proceed to Payment"
              }
              customOnClick={
                activeTab === "reorder" || hiddenCartBecauseReorder
                  ? openPaymentModal
                  : undefined
              }
            />
          </div>
        )}
      </div>

      {/* Payment Modal */}
      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        orderId={paymentOrderId}
        amount={paymentAmount}
        onConfirm={handlePaymentComplete}
      />
    </>
  );
};

export default CartPage;
