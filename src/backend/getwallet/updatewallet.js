import axios from "axios";

const UpdateWallet = async (phone, bal) => {
  const formData = new URLSearchParams();
  formData.append("token", "SWNCMPMSREMXAMCKALVAALI");
  formData.append("phone", phone);
  formData.append("bal", bal);

  try {
    const response = await axios.post(
      "https://api.hukmee.in/APIs/APIs.asmx/UpdateWallet",
      formData,
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );

    const data = response.data;

    if (data?.message === "Successfully Updated") {
      return { success: true };
    } else {
      return { success: false, data };
    }
  } catch (error) {
    console.log("API Error (UpdateWallet):", error.message);
    return { success: false, error };
  }
};

export default UpdateWallet;
