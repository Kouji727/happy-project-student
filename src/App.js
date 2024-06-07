import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";

import SignIn from "./pages/SignIn";
import Settings from "./pages/Settings";
import StudentClearance from "./pages/StudentClearance";
import Home from "./pages/Home";

const router = createBrowserRouter([
  { path: "/", element: <SignIn /> },
  { path: "//home", element: <Home /> },
  { path: "/student-clearance", element: <StudentClearance /> },
  { path: "/settings", element: <Settings /> },
]);
function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App;