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

  const [pincodeError, setPincodeError] = useState(""); // Only for pincode error
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const phone = localStorage.getItem("userPhone");
  const [user, setUser] = useState([]);

  // Pincode Validation: Exactly 6 digits only
  const validatePincode = (value) => {
    const pin = value.trim();
    if (!pin) return "Pincode is required";
    if (!/^\d{6}$/.test(pin)) return "Pincode must be exactly 6 digits";
    return "";
  };

  useEffect(() => {
    const fetchAddresses = async () => {
      try {
        const fetchedAddresses = await GetAddress(phone);
        setAddresses(fetchedAddresses || []);
      } catch (error) {
        setMessage("Failed to load addresses.");
      }
    };
    fetchAddresses();
  }, [phone]);

  useEffect(() => {
    const fetchuser = async () => {
      if (!phone) return;
      try {
        const fetchedUser = await GetUser(phone);
        setUser(fetchedUser || []);
      } catch (error) {
        console.error("Error fetching user:", error);
      }
    };
    fetchuser();
  }, [phone]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "pincode") {
      // Allow only numbers and max 6 digits
      const numericValue = value.replace(/[^0-9]/g, "").slice(0, 6);
      setFormData({ ...formData, pincode: numericValue });

      // Validate live
      const error = validatePincode(numericValue);
      setPincodeError(error);
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleLocationFetch = async () => {
    setMessage("Getting current location...");

    try {
      const location = await GetLocation();

      const cleanPincode = (location.pincode || "").toString().slice(0, 6);

      setFormData((prev) => ({
        ...prev,
        name: user[0]?.Fullname || "",
        address: location.address || "",
        city: location.city || "",
        state: location.state || "",
        pincode: cleanPincode,
      }));

      // Validate auto-filled pincode
      setPincodeError(validatePincode(cleanPincode));

      setMessage(`Location fetched: ${location.city}`);
    } catch (error) {
      setMessage("Failed to get location.");
      setPincodeError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Final pincode check
    const error = validatePincode(formData.pincode);
    if (error) {
      setPincodeError(error);
      setMessage("Please enter a valid 6-digit pincode");
      return;
    }

    setIsLoading(true);
    setMessage("");

    try {
      const response = await InsertAddress(
        formData.name || user[0]?.Fullname,
        phone,
        formData.address,
        formData.city,
        formData.pincode
      );

      if (response?.message === "Inserted Successfully!") {
        setMessage("Address saved successfully!");
        setFormData({
          name: "",
          address: "",
          state: "",
          city: "",
          pincode: "",
        });
        setPincodeError("");

        const updated = await GetAddress(phone);
        setAddresses(updated || []);

        setTimeout(() => {
          setShowForm(false);
          setIsOpen(false);
          onClose?.();
        }, 1500);
      } else {
        setMessage("Failed to save address.");
      }
    } catch (error) {
      setMessage("Error saving address.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAddress = (address) => {
    setSelectedAddressId(address.id);
    onSelectAddress(address);
    setIsOpen(false);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`max-w-md mx-auto p-6 sm:p-8 bg-white rounded-2xl border border-gray-100 font-sans shadow-xl`}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
          Delivery Address
        </h2>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="p-3 bg-orange-600 text-white rounded-full hover:bg-orange-700 transition"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        )}
      </div>

      <div className="max-h-96 overflow-y-auto hide-scrollbar">
        {showForm ? (
          <>
            {message && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  message.includes("success")
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {message}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <button
                type="button"
                onClick={handleLocationFetch}
                className="w-full py-3 bg-orange-600 text-white font-medium rounded-lg hover:bg-orange-700 transition"
              >
                Use Current Location
              </button>

              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Full Name"
                className="w-full p-3 border border-gray-200 rounded-lg"
                required
              />

              <textarea
                name="address"
                rows={3}
                value={formData.address}
                onChange={handleChange}
                placeholder="House no, Street, Landmark"
                className="w-full p-3 border border-gray-200 rounded-lg"
                required
              />

              <div className="grid grid-cols-2 gap-4">
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  className="p-3 border border-gray-200 rounded-lg"
                  required
                />
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className="p-3 border border-gray-200 rounded-lg"
                  required
                />
              </div>

              {/* PINCODE FIELD WITH VALIDATION */}
              <div>
                <label className="block text-sm font-semibold text-gray-800 mb-1">
                  Pincode <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  placeholder="800001"
                  maxLength="6"
                  className={`w-full p-3 border rounded-lg transition-all ${
                    pincodeError
                      ? "border-red-500 focus:ring-red-300"
                      : "border-gray-200 focus:ring-orange-500"
                  }`}
                  required
                />
                {pincodeError && (
                  <p className="text-red-600 text-xs mt-1 flex items-center">
                    {pincodeError}
                  </p>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={isLoading || pincodeError}
                  className={`flex-1 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition ${
                    isLoading || pincodeError
                      ? "opacity-60 cursor-not-allowed"
                      : ""
                  }`}
                >
                  {isLoading ? "Saving..." : "Save Address"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setPincodeError("");
                    setMessage("");
                  }}
                  className="px-6 py-3 border border-orange-600 text-orange-600 rounded-lg hover:bg-orange-50"
                >
                  Cancel
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Saved Addresses</h3>
            {addresses.length === 0 ? (
              <p className="text-gray-500 text-center py-8">
                No addresses saved yet
              </p>
            ) : (
              <div className="space-y-3">
                {addresses.map((address) => (
                  <div
                    key={address.id}
                    onClick={() => handleSelectAddress(address)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition ${
                      selectedAddressId === address.id
                        ? "border-orange-500 bg-orange-50"
                        : "border-gray-200 hover:border-orange-300"
                    }`}
                  >
                    <p className="font-semibold">{address.Name}</p>
                    <p className="text-sm text-gray-600">{address.Address}</p>
                    <p className="text-sm text-gray-600">
                      {address.City}, {address.PinCode}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressFormCard;
