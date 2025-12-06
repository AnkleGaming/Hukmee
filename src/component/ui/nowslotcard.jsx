// src/components/nowslotcard.jsx
import React, { useState, useEffect } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { Calendar, Clock, ChevronRight, Sparkles } from "lucide-react";
import Colors from "../../core/constant";

const NowSlotCard = ({ onSelectSlot }) => {
  const [today, setToday] = useState(null);
  const [nearestSlot, setNearestSlot] = useState(null);

  useEffect(() => {
    const now = new Date();
    let targetDate = new Date();
    let targetHour = 10;

    const hour = now.getHours();
    const min = now.getMinutes();

    if (hour >= 20) {
      // After 8 PM → tomorrow 10 AM
      targetDate = addDays(startOfDay(now), 1);
      targetHour = 10;
    } else if (hour < 10) {
      // Before 10 AM → today 10 AM
      targetHour = 10;
    } else {
      // 10 AM to 7:59 PM → next full hour
      targetHour = hour + (min > 0 ? 1 : 0);
      if (targetHour > 20) targetHour = 20; // cap at 8 PM
    }

    const slotTime = new Date(targetDate);
    slotTime.setHours(targetHour, 0, 0, 0);

    setToday({
      label: format(slotTime, "EEE"),
      date: format(slotTime, "d"),
      month: format(slotTime, "MMM"),
      fullDate: format(slotTime, "yyyy-MM-dd"),
    });

    setNearestSlot({
      time: format(slotTime, "h:mm a"),
      fullTime: format(slotTime, "HH:mm"),
      iso: slotTime.toISOString(),
    });
  }, []);

  const handleConfirm = () => {
    const finalDate = new Date(`${today.fullDate}T${nearestSlot.fullTime}`);
    const formatted = format(finalDate, "dd/MM/yyyy - h:mm a"); // 07/12/2025 - 3:00 PM

    onSelectSlot({
      day: today,
      time: nearestSlot,
      dateTime: formatted,
      iso: finalDate.toISOString(),
      slotName: formatted,
    });
  };

  if (!today || !nearestSlot) {
    return <div className="text-center py-10">Loading slot...</div>;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md mx-auto border border-gray-100">
      <div className="text-center mb-8">
        <h2
          className={`text-xl font-bold bg-gradient-to-r ${Colors.primaryFrom} ${Colors.primaryTo} bg-clip-text text-transparent`}
        >
          Book Now
        </h2>
        <p className="text-gray-600 mt-2">Fastest available slot</p>
      </div>

      <div className="bg-gradient-to-br from-orange-50 to-pink-50 rounded-2xl p-3 text-center mb-2 border-2 border-orange-200">
        <Sparkles className="w-5 h-5 text-orange-600 mx-auto mb-3" />
        <p className="text-xl font-bold text-orange-600">{today.date}</p>
        <p className="text-l text-gray-700">
          {today.label}, {today.month}
        </p>
      </div>

      <div className="text-center mb-5">
        <p className="text-l font-medium text-gray-800 mb-4">Available at</p>
        <div className="inline-block bg-gradient-to-r from-orange-500 to-pink-600 text-white text-xl font-bold px-10 py-3 rounded-2xl shadow-xl">
          {nearestSlot.time}
        </div>
      </div>

      <button
        onClick={handleConfirm}
        className={`w-full py-3 rounded-2xl font-bold text-white text-l bg-gradient-to-r ${Colors.primaryFrom} ${Colors.primaryTo} shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3`}
      >
        Confirm This Slot
        <ChevronRight className="w-6 h-6" />
      </button>

      <p className="text-center text-xs text-gray-500 mt-6">
        Service available 10:00 AM – 8:00 PM
      </p>
    </div>
  );
};

export default NowSlotCard;
