import React, { useState, useEffect } from "react";
import { format, addDays, startOfDay, addMinutes } from "date-fns";
import { Calendar, Clock, ChevronRight, Sparkles } from "lucide-react";
import Colors from "../../core/constant";

const SlotCard = ({ onSelectSlot }) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [days, setDays] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Generate 3 days: Today + Next 2 days
  useEffect(() => {
    const now = new Date();
    const todayStr = format(startOfDay(now), "yyyy-MM-dd");

    const generatedDays = Array.from({ length: 3 }, (_, i) => {
      const date = addDays(startOfDay(now), i);
      return {
        label: format(date, "EEE"),
        date: format(date, "d"),
        month: format(date, "MMM"),
        fullDate: format(date, "yyyy-MM-dd"),
        iso: date.toISOString(),
        recommended: i === 0,
      };
    });

    setDays(generatedDays);
    setSelectedDay(generatedDays[0]);
    setLoading(false);
  }, []);

  // Generate time slots whenever day changes
  useEffect(() => {
    if (!selectedDay) return;

    const today = format(startOfDay(new Date()), "yyyy-MM-dd");
    const isToday = selectedDay.fullDate === today;
    const now = new Date();

    const slots = [];
    let startHour = 10; // Always start from 10 AM

    // If it's today, start from next full hour (only if before 8 PM)
    if (isToday) {
      const currentHour = now.getHours();
      const currentMinutes = now.getMinutes();

      // If current time is before 10 AM → start from 10 AM
      if (currentHour < 10) {
        startHour = 10;
      }
      // If between 10 AM and 7 PM → start from next full hour
      else if (
        currentHour < 19 ||
        (currentHour === 19 && currentMinutes === 0)
      ) {
        startHour = currentHour + (currentMinutes > 0 ? 1 : 0);
      }
      // If after 8 PM → no slots
      else {
        setTimeSlots([]);
        setSelectedTime(null);
        return;
      }
    }

    // Generate slots from startHour to 20:00 (8 PM inclusive)
    const baseDate = new Date(
      `${selectedDay.fullDate}T${startHour.toString().padStart(2, "0")}:00:00`
    );

    let currentTime = baseDate;
    const endTime = new Date(`${selectedDay.fullDate}T20:00:00`); // 8:00 PM

    while (currentTime <= endTime) {
      slots.push({
        time: format(currentTime, "h:mm a"), // 10:00 AM
        fullTime: format(currentTime, "HH:mm"), // 10:00
        iso: currentTime.toISOString(),
      });
      currentTime = addMinutes(currentTime, 60);
    }

    setTimeSlots(slots);
    setSelectedTime(slots[0] || null); // Auto-select first available
  }, [selectedDay]);

  const handleProceed = () => {
    if (selectedDay && selectedTime) {
      const finalDate = new Date(
        `${selectedDay.fullDate}T${selectedTime.fullTime}`
      );
      const formatted = format(finalDate, "dd/MM/yyyy - h:mm a");

      onSelectSlot({
        day: selectedDay,
        time: selectedTime,
        dateTime: formatted,
        iso: finalDate.toISOString(),
      });
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 shadow-xl max-w-md mx-auto h-[540px] flex flex-col animate-pulse">
        <div className="h-8 bg-gray-200 rounded-lg w-3/4 mb-6"></div>
        <div className="space-y-8 flex-1">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-2xl"></div>
            ))}
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-12 bg-gray-100 rounded-full"></div>
            ))}
          </div>
        </div>
        <div className="h-14 bg-gray-200 rounded-xl mt-6"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl max-w-md mx-auto border border-gray-100 h-[540px] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-br from-orange-100 to-pink-100 rounded-xl">
            <Calendar className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2
              className={`text-2xl font-bold bg-gradient-to-r ${Colors.primaryFrom} ${Colors.primaryTo} bg-clip-text text-transparent`}
            >
              Schedule Service
            </h2>
            <p className="text-sm text-gray-600">
              Available 10:00 AM – 8:00 PM
            </p>
          </div>
        </div>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
        {/* Day Selection */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Select Date</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            {days.map((day) => (
              <button
                key={day.fullDate}
                onClick={() => setSelectedDay(day)}
                className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-center
                  ${
                    selectedDay?.fullDate === day.fullDate
                      ? "border-orange-500 bg-gradient-to-br from-orange-50 to-pink-50 shadow-lg"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
              >
                {day.recommended && (
                  <div className="absolute -top-3 -right-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Fastest
                  </div>
                )}
                <p className="text-xs text-gray-500 uppercase">{day.month}</p>
                <p
                  className={`text-3xl font-bold mt-1 ${
                    selectedDay?.fullDate === day.fullDate
                      ? "text-orange-600"
                      : "text-gray-900"
                  }`}
                >
                  {day.date}
                </p>
                <p className="text-sm font-medium text-gray-600 mt-1">
                  {day.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Time Slots */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Choose Time</h3>
          </div>

          {timeSlots.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-2xl">
              <Clock className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 font-medium">No slots available</p>
              <p className="text-sm text-gray-500 mt-1">
                Service hours: 10 AM – 8 PM
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {timeSlots.map((slot) => (
                <button
                  key={slot.iso}
                  onClick={() => setSelectedTime(slot)}
                  className={`py-3 px-4 rounded-full font-medium text-sm transition-all duration-300
                    ${
                      selectedTime?.iso === slot.iso
                        ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white shadow-lg"
                        : "bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200"
                    }`}
                >
                  {slot.time}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-100 bg-gray-50/80">
        <button
          onClick={handleProceed}
          disabled={!selectedDay || !selectedTime || timeSlots.length === 0}
          className={`w-full py-4 rounded-xl font-bold text-white text-lg flex items-center justify-center gap-3 transition-all duration-300
            bg-gradient-to-r ${Colors.primaryFrom} ${Colors.primaryTo}
            hover:shadow-xl hover:scale-[1.02] active:scale-98
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
          `}
        >
          {timeSlots.length === 0 ? "No Slots Today" : "Confirm Booking"}
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default SlotCard;
