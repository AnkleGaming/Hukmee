import axios from "axios";

class CouponShowModel {
  constructor(id, CouponCode, CouValidity, CouPercentage, CouCount, Status) {
    this.id = id;
    this.CouponCode = CouponCode;
    this.CouValidity = CouValidity;
    this.CouPercentage = CouPercentage;
    this.CouCount = CouCount;
    this.Status = Status;
  }

  static fromJson(json) {
    return new CouponShowModel(
      json.id || "",
      json.CouponCode || "",
      json.CouValidity || "",
      json.CouPercentage || "",
      json.CouCount || "",
      json.Status || ""
    );
  }
}

const CouponShow = async () => {
  const formData = new URLSearchParams();
  formData.append("token", "SWNCMPMSREMXAMCKALVAALI");

  try {
    const response = await axios.post(
      "https://api.hukmee.in/APIs/APIs.asmx/ShowCoupons",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    let rawData = response.data;

    // Response comes as string → try converting to JSON
    if (typeof rawData === "string") {
      try {
        rawData = JSON.parse(rawData);
      } catch (err) {
        console.error("❌ Failed to parse API JSON:", rawData);
        return [];
      }
    }

    // Ensure response is an array
    if (!Array.isArray(rawData)) {
      console.error("❌ Expected array but got:", rawData);
      return [];
    }

    // Convert each item to model
    return rawData.map((item) => CouponShowModel.fromJson(item));
  } catch (error) {
    console.error("❌ API Error (ShowCoupons):", error);
    return [];
  }
};

export default CouponShow;
