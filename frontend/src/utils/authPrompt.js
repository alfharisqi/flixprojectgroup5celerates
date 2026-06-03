export const isUserLoggedIn = () => Boolean(localStorage.getItem("token"));

export const showLoginRequired = () => {
  window.dispatchEvent(new CustomEvent("flix:require-login"));
};

export const requireLogin = () => {
  if (isUserLoggedIn()) {
    return true;
  }

  showLoginRequired();
  return false;
};
