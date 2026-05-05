function logout() {
  localStorage.removeItem("smartschool_access_token");
  localStorage.removeItem("smartschool_refresh_token");
  location.reload();
}
