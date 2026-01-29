import { publicAxios } from "./api";

/* 🔑 Login */
export const loginUser = async (loginData) => {
  const res = await publicAxios.post("auth/login/", loginData);

  localStorage.setItem("access_token", res.data.access);
  localStorage.setItem("refresh_token", res.data.refresh);

  return res.data;
};

/* 📝 Signup */
export const signupUser = async (signupData) => {
  const payload = {
    full_name: signupData.full_name,
    mobile_number: signupData.mobile_number,
    password: signupData.password,
  };

  const res = await publicAxios.post("auth/signup/", payload);
  return res.data;
};

/* 🚪 Logout */
export const logoutUser = () => {
  localStorage.clear();
};
