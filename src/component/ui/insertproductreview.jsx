import { useState, useEffect } from "react";
import { Star, X } from "lucide-react";
import Colors from "../../core/constant";

const ReviewModal = ({ orderId, itemName, isOpen, onClose, onSubmit }) => {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [reviewText, setReviewText] = useState("");

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (rating === 0) {
      alert("Please select a star rating!");
      return;
    }

    onSubmit({
      orderId,
      rating,
      review: reviewText.trim(),
    });

    // Reset form
    setRating(0);
    setReviewText("");
    onClose();
  };

  const getRatingText = () => {
    if (rating === 0) return "Tap a star to rate";
    if (rating === 5) return "Amazing!";
    if (rating === 4) return "Good!";
    if (rating === 3) return "Okay";
    if (rating === 2) return "Not great";
    return "Bad";
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-60 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container - Scrollable on small screens */}
      <div className="relative bg-white w-full max-w-md mx-4 sm:mx-0 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header - Fixed */}
        <div className={`bg-${Colors.primaryMain} text-white p-5 relative`}>
          <h2 className="text-xl font-bold text-center pr-8">
            Rate Your Experience
          </h2>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white/20 rounded-full p-2 transition"
            aria-label="Close modal"
          >
            <X size={28} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 pt-6 pb-8 space-y-8">
          {/* Order Info */}
          <div className="text-center -mt-2">
            <p className="text-sm text-gray-600">Order ID</p>
            <p className="font-bold text-lg tracking-wider">#{orderId}</p>
            {itemName && (
              <p className="text-sm text-gray-700 mt-1 italic">"{itemName}"</p>
            )}
          </div>

          {/* Star Rating */}
          <div className="flex flex-col items-center space-y-5">
            <p className="text-gray-700 font-medium text-lg">
              How was your experience?
            </p>
            <div className="flex gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  onTouchStart={() => setRating(star)} // Better touch support
                  className="transition-transform active:scale-95 hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-300 rounded-full"
                  aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                >
                  <Star
                    size={40}
                    strokeWidth={1.5}
                    className={`drop-shadow-sm transition-all duration-200 ${
                      star <= (hoveredStar || rating)
                        ? `fill-${Colors.primaryMain} text-${Colors.primaryMain}`
                        : "fill-gray-200 text-gray-400"
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-lg font-medium text-gray-700 animate-in slide-in-from-bottom duration-300">
              {getRatingText()}
            </p>
          </div>

          {/* Review Text */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Write your review{" "}
              <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              rows={5}
              placeholder="Share your experience... What did you like? Any suggestions?"
              onFocus={() => {
                setTimeout(
                  () => window.scrollTo(0, document.body.scrollHeight),
                  300
                );
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-base"
            />
          </div>
        </div>

        {/* Fixed Bottom Buttons - Always visible even when keyboard opens */}
        <div className=" bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-4 sm:relative sm:border-t-0 sm:pb-6">
          <div className="max-w-md mx-auto flex gap-3">
            <button
              onClick={handleSubmit}
              disabled={rating === 0}
              className={`flex-1 py-4 font-semibold rounded-xl shadow-md transition-all active:scale-95 ${
                rating === 0
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : `bg-${Colors.primaryMain} hover:bg-${Colors.primaryMain}/90 text-white hover:shadow-lg`
              }`}
            >
              Submit Review
            </button>
          </div>
          {/* Extra space for iPhone home bar */}
          <div className="h-8 sm:hidden" />
        </div>
      </div>
    </div>
  );
};

export default ReviewModal;
