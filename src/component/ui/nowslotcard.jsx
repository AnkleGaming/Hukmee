import React, { useState, useEffect } from "react";
import { format, addDays, startOfDay } from "date-fns";
import { Calendar, Clock, ChevronRight } from "lucide-react";
import Colors from "../../core/constant";

const NowSlotCard = ({ onSelectSlot }) => {
  const [today, setToday] = useState(null);
  const [nearestSlot, setNearestSlot] = useState(null);

  useEffect(() => {
    const now = new Date();

    const cutoffHour = 20; // 8 PM
    const startHour = 10; // 10 AM
    const endHour = 21; // 9 PM

    let selectedDay = new Date();

    // ---- ✅ If time >= 8 PM → move to next day
    if (now.getHours() >= cutoffHour) {
      selectedDay = addDays(startOfDay(now), 1);
      selectedDay.setHours(startHour, 0, 0, 0);
    }

    // ---- Build TODAY/TOMORROW object
    const todayObj = {
      label: format(selectedDay, "EEE"),
      date: format(selectedDay, "d"),
      month: format(selectedDay, "MMM"),
      fullDate: format(selectedDay, "yyyy-MM-dd"),
      recommended: true,
    };

    setToday(todayObj);

    // ---- Nearest Slot Logic
    let slotTime = new Date(selectedDay);

    if (now.getHours() >= cutoffHour) {
      // If after 8 PM → first slot = 10 AM tomorrow
      slotTime.setHours(startHour, 0, 0, 0);
    } else {
      // Otherwise find next slot from current time
      slotTime = new Date(now);
      slotTime.setMinutes(0, 0, 0);
      slotTime.setHours(slotTime.getHours() + 1);

      // If current hour is past 9 PM → tomorrow 10 AM
      if (slotTime.getHours() >= endHour) {
        slotTime = addDays(startOfDay(now), 1);
        slotTime.setHours(startHour, 0, 0, 0);
      }
    }

    const slot = {
      time: format(slotTime, "h:mm a"),
      fullTime: format(slotTime, "HH:mm"),
    };

    setNearestSlot(slot);
  }, []);

  const handleProceed = () => {
    if (today && nearestSlot) {
      const formatted = formatSlot(today.fullDate, nearestSlot.fullTime);

      onSelectSlot({
        day: today,
        time: nearestSlot,
        dateTime: formatted, // 👉 "07/12/2025 - 3:00 PM"
      });
    }
  };

  if (!today || !nearestSlot) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-lg animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
        <div className="space-y-4">
          <div className="h-20 bg-gray-100 rounded-xl"></div>
          <div className="h-12 bg-gray-100 rounded-lg"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-xl max-w-md mx-auto font-sans hover:shadow-2xl transition-shadow duration-300">
      {/* Header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="p-3 bg-orange-100 rounded-xl">
          <Calendar className="w-6 h-6 text-orange-600" />
        </div>
        <h2
          className={`text-2xl font-bold bg-gradient-to-r ${Colors.primaryFrom} ${Colors.primaryTo} bg-clip-text text-transparent`}
        >
          Schedule Your Service
        </h2>
      </div>

      {/* Show Today’s Date */}
      <div className="mb-7 text-center border border-gray-200 rounded-xl py-4 shadow-sm bg-orange-50">
        <p className="text-sm text-gray-600">{today.label}</p>
        <p className="text-3xl font-bold text-orange-600">{today.date}</p>
        <p className="text-sm text-gray-500">{today.month}</p>
        <p className="text-xs text-orange-500 font-medium mt-1">
          ⭐ Today’s Recommended Slot
        </p>
      </div>

      {/* Nearest Slot */}
      <div className="mb-8 text-center">
        <h4 className="text-lg font-semibold text-gray-900 mb-3 flex justify-center items-center gap-2">
          <Clock className="w-5 h-5 text-gray-600" />
          Nearest Available Time
        </h4>
        <div className="py-3 px-6 inline-block border-2 border-orange-500 bg-orange-50 text-orange-600 rounded-xl shadow-md font-medium text-sm">
          {nearestSlot.time}
        </div>
      </div>

      {/* Proceed Button */}
      <button
        onClick={handleProceed}
        className={`w-full py-4 px-6 rounded-xl font-bold text-white bg-gradient-to-r ${Colors.primaryFrom} ${Colors.primaryTo} hover:shadow-lg transform hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-2`}
      >
        Proceed
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* <p className="text-xs text-gray-500 text-center mt-4">
        Service starts at selected time • Professional arrives within 30 mins
      </p> */}
    </div>
  );
};

export default NowSlotCard;
