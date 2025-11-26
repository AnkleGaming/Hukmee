import axios from "axios";

class FAQModel {
  constructor(id, Questions, ANSWER, Type) {
    this.id = id;
    this.Questions = Questions;
    this.ANSWER = ANSWER;
    this.Type = Type;
  }

  static fromJson(json) {
    return new FAQModel(
      json.id || 0,
      json.Questions || "",
      json.ANSWER || "",
      json.Type || ""
    );
  }
}

const FAQAPI = async (type) => {
  const formData = new URLSearchParams();
  formData.append("token", "SWNCMPMSREMXAMCKALVAALI");
  formData.append("Type", type);

  try {
    const response = await axios.post(
      "https://api.hukmee.in/APIs/APIs.asmx/ShowFAQ",
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

    return rawData.map((item) => FAQModel.fromJson(item));
  } catch (error) {
    console.error("API Error (GetInTouch):", error);
    return [];
  }
};

export default FAQAPI;
