import { createContext, useState, useEffect } from "react";
import jwt_decode from "jwt-decode";

export const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwt_decode(token);
        setUser({ id: decoded.id, email: decoded.email });
      } catch (err) {
        console.error("Invalid token:", err);
      }
    }
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
