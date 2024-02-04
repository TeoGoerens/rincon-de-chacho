//Get user from Local Storage and place it into Store
export const getUserInfoFromLocalStorage = localStorage.getItem("userInfo")
  ? JSON.parse(localStorage.getItem("userInfo"))
  : null;

//Get isAdmin from Local Storage and place it into Store
export const getIsAdminFromLocalStorage = localStorage.getItem("userInfo")
  ? JSON.parse(localStorage.getItem("userInfo")).is_admin
  : null;
