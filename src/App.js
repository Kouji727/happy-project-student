import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AuthProvider } from "./components/AuthContext";

import SignIn from "./pages/SignIn";
import Settings from "./pages/Settings";
import StudentClearance from "./pages/StudentClearance";
import Dashboard from "./pages/Dashboard";
import ActivityLog from "./pages/ActivityLog";
import Notifications from "./pages/Notifications";

const router = createBrowserRouter([
  { path: "/", element: <SignIn /> },
  { path: "/dashboard", element: <Dashboard /> },
  { path: "/student-clearance", element: <StudentClearance /> },
  { path: "/notifications", element: <Notifications /> },
  { path: "/activitylog", element: <ActivityLog /> },
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