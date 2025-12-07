import React, { useState, useEffect } from "react";
import InsertAddress from "../../backend/address/insertaddress";
import GetAddress from "../../backend/address/getaddress";
import GetLocation from "../../backend/location/location";
import GetUser from "../../backend/authentication/getuser";

const AddressFormCard = ({ onClose, onSelectAddress }) => {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    state: "",
    city: "",
    pincode: "",
  });

  const [pincodeError, setPincodeError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [message, setMessage] = useState("");
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const phone = localStorage.getItem("userPhone");
  const [user, setUser] = useState([]);

  const validatePincode = (value) => {
    const pin = value.trim();
    if (!pin) return "Pincode is required";
    if (!/^\d{6}$/.test(pin)) return "Pincode must be exactly 6 digits";
    return "";
  };

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const data = await GetAddress(phone);
        setAddresses(data || []);
      } catch {
        setMessage("Failed to load addresses");
      }
    };
    fetchAddresses();
  }, [phone]);

  useEffect(() => {
    const fetchUser = async () => {
      if (!phone) return;
      try {
        const u = await GetUser(phone);
        setUser(u || []);
        if (u?.[0]?.Fullname && !formData.name) {
          setFormData((prev) => ({ ...prev, name: u[0].Fullname }));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchUser();
  }, [phone]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "pincode") {
      const num = value.replace(/[^0-9]/g, "").slice(0, 6);
      setFormData((prev) => ({ ...prev, pincode: num }));
      setPincodeError(validatePincode(num));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleLocationFetch = async () => {
    setIsGettingLocation(true);
    setMessage("Getting your location...");

    try {
      const loc = await GetLocation(); // Your fixed version – works with fake GPS!

      const pin = (loc.pincode || "").toString().slice(0, 6);

      setFormData({
        name: formData.name || user[0]?.Fullname || "",
        address: loc.address || "Current location area",
        city: loc.city || "Unknown City",
        state: loc.state || "Unknown State",
        pincode: pin,
      });

      setPincodeError(validatePincode(pin));
      setMessage(`Location detected: ${loc.city}`);
    } catch (err) {
      setMessage("Location failed – enter manually or use Fake GPS app");
    } finally {
      setIsGettingLocation(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validatePincode(formData.pincode);
    if (err) {
      setPincodeError(err);
      return;
    }

    setIsLoading(true);
    try {
      const res = await InsertAddress(
        formData.name || user[0]?.Fullname,
        phone,
        formData.address,
        formData.city,
        formData.pincode,
        formData.state
      );

      if (res?.message === "Inserted Successfully!") {
        setMessage("Address saved!");
        const updated = await GetAddress(phone);
        setAddresses(updated || []);
        setTimeout(() => onClose?.(), 1200);
      }
    } catch {
      setMessage("Failed to save");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (addr) => {
    onSelectAddress(addr);
    onClose?.();
  };

  return (
    <>
      {/* BEAUTIFUL BLUR BACKGROUND – LIKE YOUR OLD ONE */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop blur */}
        <div
          className="absolute inset-0 bg-white/70 dark:bg-black/50 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Card */}
        <div className="relative w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                Delivery Address
              </h2>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div className="p-6 max-h-96 overflow-y-auto">
            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm font-medium ${
                  message.includes("saved") || message.includes("detected")
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {message}
              </div>
            )}

            {/* Saved Addresses */}
            {!showForm ? (
              <>
                <div className="flex justify-between items-center mb-5">
                  <h3 className="font-semibold text-lg">Saved Addresses</h3>
                  <button
                    onClick={() => setShowForm(true)}
                    className="bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-orange-700 transition"
                  >
                    + Add New
                  </button>
                </div>

                {addresses.length === 0 ? (
                  <p className="text-center text-gray-500 py-12">
                    No saved addresses yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div
                        key={addr.id}
                        onClick={() => handleSelect(addr)}
                        className="p-4 bg-gray-50 rounded-xl border border-gray-200 cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition"
                      >
                        <p className="font-semibold">{addr.Name}</p>
                        <p className="text-sm text-gray-600 mt-1">
                          {addr.Address}
                        </p>
                        <p className="text-sm text-gray-600">
                          {addr.City} - {addr.PinCode}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              /* Add New Form */
              <form onSubmit={handleSubmit} className="space-y-5">
                <button
                  type="button"
                  onClick={handleLocationFetch}
                  disabled={isGettingLocation}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-bold rounded-xl hover:from-orange-700 hover:to-orange-800 transition disabled:opacity-70 shadow-lg"
                >
                  {isGettingLocation
                    ? "Detecting Location..."
                    : "Use Current Location"}
                </button>

                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Full Name"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition"
                  required
                />

                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="House no, Building, Street, Landmark"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition"
                  rows={3}
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    placeholder="City"
                    className="px-4 py-3 border border-gray-200 rounded-xl"
                    required
                  />
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="State"
                    className="px-4 py-3 border border-gray-200 rounded-xl"
                    required
                  />
                </div>

                <div>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    placeholder="Pincode (6 digits)"
                    maxLength={6}
                    className={`w-full px-4 py-3 border rounded-xl transition ${
                      pincodeError ? "border-red-500" : "border-gray-200"
                    }`}
                    required
                  />
                  {pincodeError && (
                    <p className="text-red-600 text-xs mt-2">{pincodeError}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="submit"
                    disabled={isLoading || pincodeError}
                    className="flex-1 py-3.5 bg-orange-600 text-white font-bold rounded-xl hover:bg-orange-700 disabled:opacity-60 transition shadow-md"
                  >
                    {isLoading ? "Saving..." : "Save Address"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setMessage("");
                      setPincodeError("");
                    }}
                    className="px-6 py-3.5 border border-orange-600 text-orange-600 rounded-xl hover:bg-orange-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AddressFormCard;
