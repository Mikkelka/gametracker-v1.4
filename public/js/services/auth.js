// auth.js
const googleLogin = document.getElementById("googleLogin");

googleLogin.addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  window.auth
    .signInWithPopup(provider)
    .then((result) => {
      console.log("User logged in:", result.user);
      window.location.href = "index.html";
    })
    .catch((error) => {
      console.error("Login error:", error);
    });
});

window.auth.onAuthStateChanged((user) => {
  if (user) {
    console.log("Bruger er logget ind:", user);
    window.location.href = "index.html";
  } else {
    console.log("Ingen bruger er logget ind");
  }
});
