import axios from "axios";

class GetSliderImageModel {
  constructor(id, Img) {
    this.id = id;
    this.Img = Img;
  }

  static fromJson(json) {
    return new GetSliderImageModel(json.id || 0, json.Img || "");
  }
}

const GetSliderImage = async (type) => {
  const formData = new URLSearchParams();
  formData.append("token", "SWNCMPMSREMXAMCKALVAALI");

  try {
    const response = await axios.post(
      "https://api.hukmee.in/APIs/APIs.asmx/ShowSlider",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    let rawData = response.data;

    // Sometimes ASMX wraps JSON as string
    if (typeof rawData === "string") {
      try {
        rawData = JSON.parse(rawData);
      } catch {
        console.error("Could not parse response as JSON", rawData);
        return [];
      }
    }

    // Ensure it’s an array
    if (!Array.isArray(rawData)) {
      console.warn("Expected array but got:", rawData);
      return [];
    }

    return rawData.map((item) => GetSliderImageModel.fromJson(item));
  } catch (error) {
    console.error("API Error (GetInTouch):", error);
    return [];
  }
};

export default GetSliderImage;
