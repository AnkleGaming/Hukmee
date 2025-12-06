// src/components/cart/CartSummary.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Colors from "../../core/constant";
import { ShoppingBag, ArrowRight, Sparkles } from "lucide-react";

const CartSummary = ({ total, cartItems, customButtonText, customOnClick }) => {
  const navigate = useNavigate();
  const [isMobile] = useState(window.innerWidth < 640);

  // Calculate savings
  const totalDiscount = useMemo(() => {
    return cartItems.reduce((acc, item) => {
      const original = Number(item.Price) || 0;
      const discounted = Number(item.DiscountPrice) || original;
      const qty = Number(item.Quantity) || 1;
      return acc + (original - discounted) * qty;
    }, 0);
  }, [cartItems]);

  const totalItemsQty = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + Number(item.Quantity || 0), 0);
  }, [cartItems]);

  const handleClick =
    customOnClick ||
    (() => {
      navigate("/paymentpage", {
        state: { cartItems, total, totalDiscount },
      });
    });

  if (!cartItems || cartItems.length === 0) return null;

  return (
    <div className="bg-gradient-to-b from-white to-orange-50/30 border-t border-gray-200">
      <div className="p-5 sm:p-6 space-y-5">
        {/* Subtotal & Items */}

        {/* CTA Button */}
        <button
          onClick={handleClick}
          className={`
            w-full relative overflow-hidden
            bg-gradient-to-r from-orange-500 via-orange-600 to-red-600
            hover:from-orange-600 hover:to-red-700
            text-white font-bold text-lg p-5 rounded-2xl
            shadow-xl hover:shadow-2xl transform hover:scale-[1.02]
            transition-all duration-300 flex items-center justify-center gap-4
            group
          `}
        >
          {/* Shiny effect */}
          <div className="absolute inset-0 bg-white opacity-20 translate-x-[-100%] group-hover:translate-x-full transition-transform duration-1000" />

          <span className="text-[13px] md:text-xl ">
            ₹{Number(total).toFixed(2)}
          </span>

          <span className="border-white/40 flex items-center gap-3 text-[13px] md:text-xl">
            {customButtonText || "Proceed to Pay"}
            <ArrowRight className="group-hover:translate-x-1 transition-transform w-[20px] h-[20px] mr-2" />
          </span>
        </button>

        {/* Trust badges */}
        <div className="flex items-center justify-center gap-6 text-xs text-gray-500 pt-3 border-t border-gray-100">
          <span className="flex items-center gap-1">
            <svg
              className="w-4 h-4 text-green-500"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Secure Payment
          </span>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
