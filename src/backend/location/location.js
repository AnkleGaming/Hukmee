import axios from "axios";

// Enhanced Location Model
class LocationModel {
  constructor(latitude, longitude, city, state, pincode, country, address) {
    const latNum = Number(latitude);
    const lngNum = Number(longitude);
    this.latitude = !isNaN(latNum) ? parseFloat(latNum.toFixed(6)) : 0;
    this.longitude = !isNaN(lngNum) ? parseFloat(lngNum.toFixed(6)) : 0;
    this.city = city?.trim() || "Unknown City";
    this.state = state?.trim() || "Unknown State";
    this.pincode = pincode || "";
    this.country = country?.trim() || "Unknown Country";
    this.address = address || "Location found";
    this.isSpoofed = false;
  }

  static fromBigDataCloud(lat, lng, data) {
    const city =
      data.city ||
      data.locality ||
      data.suburb ||
      data.neighbourhood ||
      "Unknown City";

    const state =
      data.principalSubdivision || data.principalSubdivisionCode || "";
    const country = data.countryName || data.countryCode || "IN";
    const pincode = data.postcode || "";

    const parts = [
      data.locality,
      data.suburb,
      data.city,
      state && city !== state ? state : null,
      country,
    ].filter(Boolean);

    const address = parts.length > 0 ? parts.join(", ") : "Somewhere on Earth";

    return new LocationModel(lat, lng, city, state, pincode, country, address);
  }

  static fromNominatim(data) {
    const addr = data.address || {};
    const city =
      addr.city ||
      addr.town ||
      addr.village ||
      addr.suburb ||
      addr.hamlet ||
      addr.state_district ||
      "Unknown City";

    const state = addr.state || addr.province || "";
    const country = addr.country || "India";
    const pincode = addr.postcode || "";

    const parts = [
      addr.neighbourhood,
      addr.suburb,
      addr.village || addr.town,
      city,
      state !== city ? state : null,
      country,
    ].filter(Boolean);

    const address = parts.join(", ") || "Location detected";

    return new LocationModel(
      data.lat,
      data.lon,
      city,
      state,
      pincode,
      country,
      address
    );
  }
}

// MAIN FIXED FUNCTION - NO MORE HOISTING ERROR
const GetLocation = async (mockLat = null, mockLng = null) => {
  return new Promise((resolve, reject) => {
    let latitude = null;
    let longitude = null;

    // THIS FUNCTION MUST BE DEFINED BEFORE ANY CALL TO IT
    const continueWithCoords = async () => {
      if (!latitude || !longitude) {
        return reject("Invalid coordinates");
      }

      try {
        // TRY 1: BigDataCloud API
        try {
          const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`;
          const { data } = await axios.get(url, { timeout: 8000 });

          if (data.city || data.locality) {
            const loc = LocationModel.fromBigDataCloud(
              latitude,
              longitude,
              data
            );
            loc.isSpoofed = !!mockLat;
            return resolve(loc);
          }
        } catch (e) {
          console.log("BigDataCloud failed → trying Nominatim...");
        }

        // TRY 2: Nominatim (OpenStreetMap) — Best for spoofed/fake GPS
        try {
          const nomUrl = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`;
          const { data } = await axios.get(nomUrl, {
            headers: { "User-Agent": "MyApp/1.0 (+https://yourapp.com)" },
            timeout: 10000,
          });

          if (data?.address) {
            const loc = LocationModel.fromNominatim(data);
            loc.latitude = parseFloat(latitude);
            loc.longitude = parseFloat(longitude);
            loc.isSpoofed = !!mockLat;
            return resolve(loc);
          }
        } catch (e) {
          console.log("Nominatim also failed");
        }

        // FINAL FALLBACK
        resolve(
          new LocationModel(
            latitude,
            longitude,
            "Custom Location",
            "Detected Area",
            "",
            "Earth",
            "Location detected via GPS"
          )
        );
      } catch (err) {
        reject("All location services failed");
      }
    };

    // ———— MAIN FLOW STARTS HERE ————

    // Case 1: Manual mock location (for testing or spoofing)
    if (mockLat !== null && mockLng !== null) {
      latitude = mockLat;
      longitude = mockLng;
      continueWithCoords();
      return;
    }

    // Case 2: Use browser geolocation
    if (!navigator.geolocation) {
      reject("Geolocation is not supported by your browser");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        latitude = position.coords.latitude;
        longitude = position.coords.longitude;
        continueWithCoords();
      },
      async (error) => {
        console.warn(
          "Browser GPS failed, trying IP fallback...",
          error.message
        );

        try {
          const { data } = await axios.get("https://ipapi.co/json/");
          latitude = data.latitude;
          longitude = data.longitude;
          continueWithCoords();
        } catch {
          reject("No location access. Allow location or spoof GPS.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 600000,
      }
    );
  });
};

export default GetLocation;
export { LocationModel };
