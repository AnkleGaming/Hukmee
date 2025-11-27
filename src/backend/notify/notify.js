import axios from "axios";

const SendNotification = async (Number, Model) => {
  const formData = new URLSearchParams();
  formData.append("token", "SWNCMPMSREMXAMCKALVAALI");
  formData.append("Phone", Number);
  formData.append("ModelNumber", Model);

  try {
    const response = await axios.post(
      "https://api.hukmee.in/APIs/APIs.asmx/AddNotification",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    return response.data;
  } catch (error) {
    console.error("Getting error while sending notification:", error);
  }
};
export default SendNotification;
