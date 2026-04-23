import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const FacebookCallback = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");

    if (code) {
      console.log("FB Code:", code);

      // 👉 Send code to backend
      fetch(`${import.meta.env.VITE_API_URL}/api/auth/facebook/callback?code=${code}`)
        .then(res => res.json())
        .then(data => {
          localStorage.setItem("token", data.token);

          // redirect after login
          navigate("/");
        })
        .catch(err => {
          console.error(err);
          navigate("/login");
        });
    }
  }, [navigate]);

  return <h2>Logging in with Facebook...</h2>;
};

export default FacebookCallback;