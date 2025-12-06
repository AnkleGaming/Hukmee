import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { Minus, Plus, Trash2, X, IndianRupee } from "lucide-react";
import PaymentCard from "./paymentCard";
import PaymentCard2 from "./paymentCard2";
import PaymentCardButton from "./paymentCardButton";
import AddressFormCard from "./addressCard";
import SlotCard from "./slotCard";
import NowSlotCard from "./nowslotcard";
import { motion, AnimatePresence } from "framer-motion";
import UpdateOrder from "../../backend/order/updateorder";
import GetOrder from "../../backend/order/getorderid";
import Colors from "../../core/constant";
import AssignLeads from "../../backend/order/assignleads";
import UpdateWallet from "../../backend/getwallet/updatewallet";

const PaymentPage = () => {
  const location = useLocation();
  const {
    cartItems: incomingCartItems = [],
    total = 0,
    discountfee = 0,
    title = "Selected Package",
  } = location.state || {};

  const itemTotal = Number(total) || 0;
  const navigate = useNavigate();

  const calculateTotal = () => {
    const rawTotal = itemTotal;
    return rawTotal > 0 ? rawTotal : 0;
  };

  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showSlotModal, setShowSlotModal] = useState(false);
  const [showSlotFirst, setShowSlotFirst] = useState(false);
  const [showNow, setShowNow] = useState(false);
  const [showLater, setShowLater] = useState(false);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("isLoggedIn") === "true"
      : false
  );
  const [loading, setLoading] = useState(false);
  const [cartItems, setCartItems] = useState(
    Array.isArray(incomingCartItems) ? incomingCartItems : []
  );

  const [orderType, setOrderType] = useState(null);
  const isProduct = orderType === "Product";

  const [finalPayable, setFinalPayable] = useState(0);
  const [walletUsed, setWalletUsed] = useState(0);
  const [useWalletFlag, setUseWalletFlag] = useState(false);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [selectedCoupon, setSelectedCoupon] = useState(null);

  const UserID = localStorage.getItem("userPhone");

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 640);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const [orders, setOrders] = useState([]);
  const [orderId, setOrderId] = useState(null);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrderId, setPaymentOrderId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(0);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!UserID) {
        setOrderId(null);
        setCartItems([]);
        return;
      }

      try {
        const rawItems = await GetOrder(UserID, "Pending");
        console.log("Raw pending items from backend:", rawItems);

        if (!Array.isArray(rawItems) || rawItems.length === 0) {
          setOrderId(null);
          setCartItems([]);
          return;
        }

        // Group by OrderID (in case user has multiple pending orders — rare but safe)
        const ordersMap = {};

        rawItems.forEach((item) => {
          const oid = item.OrderID;
          if (!ordersMap[oid]) {
            ordersMap[oid] = {
              OrderID: oid,
              Address: item.Address,
              Slot: item.Slot,
              SlotDatetime: item.SlotDatetime,
              items: [],
            };
          }
          ordersMap[oid].items.push(item);
        });

        // Take the first (and usually only) pending order
        const orderIds = Object.keys(ordersMap);
        const firstOrderId = orderIds[0];
        const pendingOrder = ordersMap[firstOrderId];

        setOrderId(firstOrderId);

        // Convert backend items → clean cart items
        const cartItemsFromBackend = pendingOrder.items.map((item, index) => ({
          id: item.ID || `item-${index}`,
          name: item.ItemName || "Service",
          price: Number(item.Price) || 0,
          quantity: Number(item.Quantity) || 1,
          image: item.ItemImages || null,
          orderId: item.OrderID,
        }));

        setCartItems(cartItemsFromBackend);

        // Auto-fill address
        // if (pendingOrder.Address) {
        //   setSelectedAddress({
        //     FullAddress: pendingOrder.Address,
        //     Name: "", // not available in this model
        //     Phone: UserID,
        //   });
        // }

        console.log("Cart loaded successfully:", cartItemsFromBackend);
        console.log("Total items:", cartItemsFromBackend.length);
        console.log("Total quantity:", getTotalQuantity(cartItemsFromBackend));
      } catch (err) {
        console.error("Failed to load pending order:", err);
        setCartItems([]);
        setOrderId(null);
      }
    };

    fetchOrders();
  }, [UserID]);

  useEffect(() => {
    return () => {
      console.log("Leaving PaymentPage → Resetting address & slot");

      setSelectedAddress(null);
      setSelectedSlot(null);
    };
  }, []);

  const getTotalQuantity = () => {
    return cartItems.reduce((sum, item) => sum + (item.quantity || 1), 0);
  };

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await GetOrder(UserID, "Pending");
        console.log("Fetched orders:", res);

        if (Array.isArray(res) && res.length > 0) {
          setOrders(res);
          setOrderId(res[0].OrderID);

          // SET ORDER TYPE HERE
          setOrderType(res[0].OrderType || null);
        } else {
          setOrders([]);
          setOrderId(null);
          setOrderType(null);
        }
      } catch (err) {
        console.error("Error fetching order id:", err);
      }
    };
    fetchOrders();
  }, [UserID]);

  const handleLaterClick = async () => {
    setShowSlotModal(true);
  };

  const handleNowClick = async () => {
    setShowNow(true);
  };

  const handleproceed = async (
    amount = finalPayable,
    useWallet = useWalletFlag,
    walletAmountUsed = walletUsed
  ) => {
    if (!isLoggedIn) {
      alert("Please login to continue.");
      return;
    }

    if (!selectedAddress) {
      alert("Please select an address before proceeding.");
      setShowAddressModal(true);
      return;
    }

    if (!selectedSlot) {
      alert("Please select a slot before proceeding.");
      setShowSlotModal(true);
      return;
    }

    if (!orderId) {
      alert("Order ID not available. Try again.");
      return;
    }

    // debug
    console.log("Proceeding with orderId:", orderId);
    console.log("cartItems before proceed:", cartItems);

    try {
      setLoading(true);

      const slotString =
        selectedSlot?.slotName ||
        `${selectedSlot?.day?.label || ""} ${selectedSlot?.day?.date || ""} - ${
          selectedSlot?.time?.time || selectedSlot?.time || ""
        }`;

      // Update order on backend
      const updateResponse = await UpdateOrder({
        OrderID: orderId,
        Price: "",
        Quantity: "",
        Address: selectedAddress?.FullAddress || "",
        Slot: slotString,
        Status: "Pending",
        VendorPhone: "",
        BeforVideo: "",
        AfterVideo: "",
        OTP: "",
        PaymentMethod: "",
      });

      console.log("UpdateOrder Response:", updateResponse);

      const success =
        updateResponse &&
        (typeof updateResponse === "string"
          ? updateResponse.toLowerCase().includes("success")
          : updateResponse?.message?.toLowerCase?.().includes("success"));

      if (!success) {
        alert("Failed to update order. Please try again.");
        setLoading(false);
        return;
      }

      // Assign leads
      console.log("orderID from paymentpage:", orderId);
      const assignResponse = await AssignLeads(orderId);
      console.log("AssignLeads API Response:", assignResponse);

      const assignSuccess =
        assignResponse?.message === "Leads Assigned Successfully" ||
        assignResponse === "Leads Assigned Successfully";

      if (assignSuccess) {
        // ensure cartItems includes OrderID for backward compatibility
        const cartWithOrder = cartItems.map((c) =>
          c.OrderID ? c : { ...c, OrderID: orderId }
        );

        // debug before navigating
        console.log("Navigating to vendorwait with:", {
          cartWithOrder,
          orderId,
        });

        alert("Leads assigned successfully!");
        navigate("/vendorwait", {
          state: { cartItems: cartWithOrder, orderId },
        });
      } else {
        alert("Failed to assign leads. Please try again.");
      }
    } catch (error) {
      console.error("Error during handleproceed:", error);
      alert("Something went wrong while updating or assigning leads.");
    } finally {
      setLoading(false);
    }
  };

  const handleServiceProceed = async () => {
    handleproceed(finalPayable, walletUsed);
  };

  const handleProductProceed = async () => {
    if (!isLoggedIn) {
      alert("Please login to continue.");
      return;
    }

    if (!selectedAddress) {
      alert("Please select an address.");
      setShowAddressModal(true);
      return;
    }

    try {
      setLoading(true);

      const updateResponse = await UpdateOrder({
        OrderID: orderId,
        Price: finalPayable,
        Quantity: getTotalQuantity(),
        Address: selectedAddress.FullAddress,
        Slot: "N/A",
        Status: "Placed",
      });

      console.log("Product Update Response:", updateResponse);

      const success =
        typeof updateResponse === "string"
          ? updateResponse
              .toLowerCase()
              .includes('{"message":"updated successfully"}')
          : updateResponse?.message?.toLowerCase?.().includes("success");

      if (!success) {
        alert("Failed to place order. Try again.");
        return;
      }

      // ⭐ Deduct wallet if used
      if (useWalletFlag && walletUsed > 0) {
        const remaining = walletBalance - walletUsed;

        const walletRes = await UpdateWallet(UserID, remaining);

        if (walletRes.success) {
          console.log("Wallet updated successfully!");
        } else {
          console.log("Wallet update failed:", walletRes);
        }
      }

      alert("Product order Placed!");
      navigate("/");
    } catch (err) {
      console.error("Product proceed error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleOnlinePayment = async () => {
    if (!isLoggedIn) return alert("Please login first");
    if (!selectedAddress) return alert("Please select address");
    if (finalPayable <= 0) return alert("Invalid amount");

    setLoading(true);

    // Load Razorpay SDK if not already loaded
    const loadRazorpay = () => {
      return new Promise((resolve) => {
        if (window.Razorpay) return resolve();

        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => alert("Failed to load payment gateway");
        document.body.appendChild(script);
      });
    };

    try {
      await loadRazorpay();

      const options = {
        key: "rzp_test_RkTL7QV0DSn6sD", // Your test key (or live key later)
        amount: finalPayable * 100, // in paise
        currency: "INR",
        name: "Hukmee",
        description: "Service Booking Payment",
        image: "https://your-logo.png", // optional
        handler: async function (response) {
          // This runs when payment is SUCCESSFUL
          const paymentId = response.razorpay_payment_id;

          // Mark order as Paid (you already have UpdateOrder)
          try {
            await UpdateOrder({
              OrderID: orderId,
              Price: finalPayable,
              Quantity: getTotalQuantity(),
              Address: selectedAddress.FullAddress,
              Slot: isProduct ? "N/A" : selectedSlot?.slotName || "N/A",
              Status: "Placed",
              PaymentMethod: "Online (Razorpay)",
              PaymentID: paymentId, // optional: save payment ID
            });

            // Deduct wallet if used
            if (useWalletFlag && walletUsed > 0) {
              const remaining = walletBalance - walletUsed;
              await UpdateWallet(UserID, remaining);
            }

            alert(`Payment Successful! 🎉\nPayment ID: ${paymentId}`);
            navigate("/");
          } catch (err) {
            alert("Payment done but order update failed. Contact support.");
            console.error(err);
          }
        },
        prefill: {
          name: selectedAddress?.Name || "Customer",
          contact: UserID,
          email: "customer@example.com",
        },
        notes: {
          order_id: orderId,
          user_phone: UserID,
        },
        theme: {
          color: "#4C6EF5",
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            alert("Payment cancelled");
          },
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      // On payment failure
      razorpay.on("payment.failed", function (response) {
        alert("Payment Failed: " + response.error.description);
        console.log(response.error);
        setLoading(false);
      });
    } catch (error) {
      alert("Payment gateway error");
      console.error(error);
      setLoading(false);
    }
  };

  const handleMainProceed = () => {
    if (isProduct) {
      openPaymentModal(finalPayable);
    } else {
      handleServiceProceed(finalPayable, useWalletFlag, walletUsed);
    }
  };

  const goBack = () => {
    // Check if user can go back in history
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1); // go back in stack
    } else {
      navigate("/"); // fallback route
    }
  };

  const openPaymentModal = () => {
    setPaymentOrderId(orderId || "N/A");
    setPaymentAmount(finalPayable);
    setShowPaymentModal(true);
  };

  const PaymentModal = ({ isOpen, onClose }) => (
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
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.9 }}
            className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <IndianRupee className="text-blue-600" size={32} />
            </div>

            <h3 className="text-lg font-semibold mb-2">Payment Method?</h3>
            <p className="text-sm text-gray-600 mb-5">
              Order #{orderId} • ₹{finalPayable}
            </p>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  onClose();
                  handleProductProceed();
                }}
                disabled={loading}
                className="bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition text-sm disabled:opacity-70"
              >
                {loading ? "Processing..." : "Cash on Delivery"}
              </button>

              <button
                onClick={() => {
                  onClose();
                  handleOnlinePayment();
                }}
                disabled={loading}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition text-sm disabled:opacity-70"
              >
                Pay Online
              </button>
            </div>

            <p className="text-xs text-gray-500 mt-4">
              You can pay when our expert arrives
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 via-white to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="md:hidden fixed top-0 left-0 w-full bg-white shadow-md z-10 border-b border-gray-200">
          <div className="flex items-center justify-start px-4 py-3 sm:px-6">
            <button
              onClick={goBack}
              className="p-2 rounded-full hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-400"
              aria-label="Go back"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-6 h-6 text-gray-600 hover:text-gray-800"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <h2
              className={`text-xl sm:text-3xl font-bold bg-${Colors.primaryMain} bg-clip-text text-transparent`}
            >
              Checkout
            </h2>
          </div>
        </div>
        {/* <div className="pt-[35px] mb-[10px]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-gray-500">
                Confirm details & complete payment
              </p>
              {orderId && (
                <p className="text-xs text-green-600 mt-1">
                  Current Order ID: {orderId}
                </p>
              )}
            </div>
          </div>
        </div> */}
        <div className="w-full mt-[30px] max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <PaymentCard
              onSelectAddress={() => setShowAddressModal(true)}
              onSelectSlot={() => {
                if (!selectedAddress) {
                  alert("Please select address first!");
                  setShowAddressModal(true);
                } else {
                  setShowSlotFirst(true);
                }
              }}
              onProceed={handleMainProceed}
              selectedAddress={selectedAddress}
              selectedSlot={selectedSlot}
              calculateTotal={calculateTotal}
            />
          </div>

          <div className="flex flex-col gap-4 md:mt-[40px] mb-[70px]">
            <PaymentCard2
              cartItems={cartItems}
              calculateTotal={calculateTotal}
              setCartItems={setCartItems}
            />
            <PaymentCardButton
              itemTotal={itemTotal}
              onProceed={({
                payableAmount,
                useWallet,
                walletUsed,
                totalAmount,
                walletBalance,
                couponDiscount: couponDisc, // ← NEW
                selectedCoupon: coupon, // ← NEW
              }) => {
                console.log("Payment Summary:", {
                  totalAmount,
                  couponDisc,
                  walletUsed,
                  payableAmount,
                });

                setFinalPayable(payableAmount);
                setWalletUsed(walletUsed);
                setUseWalletFlag(useWallet);
                setWalletBalance(walletBalance);
                setCouponDiscount(couponDisc); // ← Save coupon discount
                setSelectedCoupon(coupon); // ← Save selected coupon
              }}
            />
          </div>
        </div>
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
        />

        {showAddressModal && (
          <AnimatePresence>
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl shadow-xl w-full max-w-md p-5"
                initial={{ y: 20, scale: 0.98 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 20, scale: 0.98 }}
              >
                <AddressFormCard
                  onSelectAddress={(address) => {
                    // normalize address
                    const formattedAddress = {
                      Name: address.Name || address.name || "",
                      Email: address.Email || address.email || "",
                      Phone: address.Phone || address.phone || "",
                      FullAddress:
                        address.FullAddress ||
                        `${address.Address || address.address || ""}, ${
                          address.City || address.city || ""
                        }, ${address.State || address.state || ""} - ${
                          address.PinCode || address.pincode || ""
                        }`,
                    };
                    setSelectedAddress(formattedAddress);
                    setShowAddressModal(false);
                  }}
                  onClose={() => setShowAddressModal(false)}
                />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowAddressModal(false)}
                    className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 rounded-lg transition"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
        {showSlotModal && (
          <AnimatePresence>
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl shadow-xl w-full max-w-md p-5"
                initial={{ y: 20, scale: 0.98 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 20, scale: 0.98 }}
              >
                <SlotCard
                  onSelectSlot={(slot) => {
                    const normalized = {
                      slotName: slot.dateTime,
                      slotIso: slot.time.iso,
                      day: slot.day,
                      time: slot.time,
                      dateTime: slot.dateTime,
                    };

                    setSelectedSlot(normalized);
                    setShowSlotModal(false);
                  }}
                />

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowSlotModal(false)}
                    className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
        {showNow && (
          <AnimatePresence>
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-white rounded-xl shadow-xl w-full max-w-md p-5"
                initial={{ y: 20, scale: 0.98 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 20, scale: 0.98 }}
              >
                <NowSlotCard
                  onSelectSlot={(slot) => {
                    setSelectedSlot(slot);
                    setShowNow(false);
                  }}
                  onClose={() => setShowNow(false)}
                />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={() => setShowNow(false)}
                    className="px-4 py-2 text-sm font-medium text-orange-600 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 rounded-lg transition"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
        {showSlotFirst && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative bg-white p-6 rounded-2xl shadow-2xl w-[90%] max-w-sm text-center"
              >
                {/* ❌ Cross (Close) Button */}
                <button
                  onClick={() => setShowSlotFirst(false)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-red-600 transition"
                >
                  ✕
                </button>

                <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-2">
                  Select slot
                </h3>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => {
                      handleNowClick();
                      setShowSlotFirst(false);
                    }}
                    className={`px-4 py-2 text-${Colors.primaryMain} rounded-lg bg-orange-100 hover:bg-orange-500 hover:text-white hover:cursor-pointer transition`}
                  >
                    Now
                  </button>

                  <button
                    onClick={() => {
                      handleLaterClick();
                      setShowSlotFirst(false);
                    }}
                    className={`px-4 py-2 text-${Colors.primaryMain} rounded-lg bg-orange-100 hover:bg-orange-500 hover:text-white hover:cursor-pointer transition`}
                  >
                    Later
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default PaymentPage;
