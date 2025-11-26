// FAQ.jsx
import React, { useState, useEffect } from "react";
import FAQAPI from "../../backend/faq/getfaq";
import Colors from "../../core/constant";

const FAQ = () => {
  const [openId, setOpenId] = useState(null);
  const [faqData, setFaqData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const toggle = (id) => {
    setOpenId(openId === id ? null : id);
  };

  useEffect(() => {
    const fetchFaq = async () => {
      try {
        setLoading(true);
        setError(false);

        const data = await FAQAPI("User"); // Fetching User type FAQs

        console.log("Fetched FAQ Data:", data);

        if (Array.isArray(data) && data.length > 0) {
          setFaqData(data);
        } else {
          console.warn("No FAQ data received or empty");
          setFaqData([]);
        }
      } catch (err) {
        console.error("Error fetching FAQs:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchFaq();
  }, []);

  return (
    <div
      className={`bg-gradient-to-br${Colors.gradientFrom} ${Colors.gradientTo}  py-12 px-4`}
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-gray-600">
            Click on a question to see the answer
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-orange-600"></div>
            <p className="mt-4 text-gray-600 text-lg">Loading FAQs...</p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="text-center py-20">
            <p className="text-red-600 text-xl font-medium">
              Failed to load FAQs. Please try again later.
            </p>
          </div>
        )}

        {/* No Data */}
        {!loading && !error && faqData.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-600 text-xl">
              No FAQs available at the moment.
            </p>
          </div>
        )}

        {/* FAQ List */}
        {!loading && !error && faqData.length > 0 && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {faqData.map((item) => (
              <div
                key={item.id}
                className="border-b border-gray-200 last:border-b-0"
              >
                <button
                  onClick={() => toggle(item.id)}
                  className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-orange-50 transition-all duration-300 group"
                >
                  <div className="flex-1">
                    <span className="text-xl font-semibold text-gray-800 group-hover:text-ornage-600 transition">
                      {item.Questions}
                    </span>
                  </div>

                  <div className="flex items-center gap-4">
                    <span
                      className={`px-4 py-2 rounded-full text-xs font-bold tracking-wider uppercase ${
                        item.Type === "User"
                          ? "bg-orange-100 text-orange-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {item.Type}
                    </span>

                    <span
                      className={`text-3xl font-light text-orange-600 transition-transform duration-300 ${
                        openId === item.id ? "rotate-180" : ""
                      }`}
                    >
                      {openId === item.id ? "−" : "+"}
                    </span>
                  </div>
                </button>

                {/* Answer */}
                <div
                  className={`overflow-hidden transition-all duration-500 ease-in-out ${
                    openId === item.id
                      ? "max-h-96 opacity-100"
                      : "max-h-0 opacity-0"
                  }`}
                >
                  <div className="px-8 pb-6 pt-2">
                    <p className="text-gray-700 text-lg leading-relaxed bg-gradient-to-r from-orange-50 to-purple-50 p-6 rounded-2xl border-l-4 border-orange-500 shadow-sm">
                      {item.ANSWER}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FAQ;
