import axios from "axios";

// Enhanced Location Model
class LocationModel {
  constructor(latitude, longitude, city, state, pincode, country, address) {
    this.latitude = latitude;
    this.longitude = longitude;
    this.city = city || "Unknown City";
    this.state = state = state || "Unknown State";
    this.pincode = "";
    this.country = country || "Unknown Country";
    this.address = address || "Address not found";
  }

  static fromJson(latitude, longitude, json) {
    // Extract fields safely with fallbacks
    const city =
      json.city ||
      json.locality ||
      json.suburb ||
      json.county ||
      json.administrativeAreaLevel3 ||
      "";

    const state =
      json.principalSubdivision || json.principalSubdivisionCode || "";

    const country = json.countryName || json.countryCode || "";

    // Better pincode detection (India-specific mostly)
    const pincode = json.postcode || json.postalCode || "";

    // Build clean address (avoid repeating city/state)
    let addressParts = [];

    if (json.locality && json.locality !== city)
      addressParts.push(json.locality);
    if (json.city && json.city !== city) addressParts.push(json.city);
    if (city) addressParts.push(city);

    if (state && state !== city) addressParts.push(state);
    if (country) addressParts.push(country);

    const address = addressParts.filter(Boolean).join(", ") || "Location found";

    return new LocationModel(
      parseFloat(latitude.toFixed(6)),
      parseFloat(longitude.toFixed(6)),
      city.trim(),
      state.trim(),
      pincode,
      country,
      address
    );
  }
}

// MAIN FUNCTION - Improved & Reliable
const GetLocation = async () => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      return reject("Geolocation is not supported by this browser.");
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;

          const response = await axios.get(url);
          const data = response.data;

          console.log("Full API Response:", data); // Debug this once

          // Use improved parser
          const location = LocationModel.fromJson(latitude, longitude, data);

          // Final result example:
          // city: "New Delhi"
          // state: "Delhi"
          // pincode: "110001"
          // address: "Connaught Place, New Delhi, Delhi, India"

          resolve(location);
        } catch (error) {
          console.error("API Error:", error.response?.data || error.message);
          reject("Unable to fetch location details. Try again.");
        }
      },
      (error) => {
        let message = "Location access denied or error occurred.";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Location access denied by user.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }
        reject(message);
      },
      { timeout: 10000, enableHighAccuracy: true } // Better options
    );
  });
};

export default GetLocation;
export { LocationModel };
