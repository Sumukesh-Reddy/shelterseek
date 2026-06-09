// App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from "./store";

import HomePage from './pages/HomePage/HomePage'; // eslint-disable-line no-unused-vars
import RoomLayout from './pages/RoomLayout/RoomLayout';
import About from './components/About/About';
import Wishlist from './pages/Wishlist/Wishlist';
import PrivacyPolicy from './pages/PrivacyPolicy/PrivacyPolicy';
import Messages from './pages/Messages/messages'; // eslint-disable-line no-unused-vars
import Message from './pages/Messages/message'; // eslint-disable-line no-unused-vars
import Login from './pages/Auth/Login'; // eslint-disable-line no-unused-vars
import Signup from './pages/Auth/Signup';
import ResetPassword from './pages/Auth/ResetPassword';
import TravelerLogin from './pages/Auth/TravelerLogin';
import HostLogin from './pages/Auth/HostLogin';
import LoginSelection from './pages/Auth/LoginSelection';
import AdminLogin from './pages/Auth/AdminLogin';
import ForgotPassword from './pages/Auth/ForgotPassword';
import Profile from './pages/profile/profile';
import Payment from './pages/Payment/Payment';
import HostIndex from './pages/Host_page/host_index';
import HostDashboard from './pages/HostDashboard/HostDashboard';
import HostProfile from './pages/HostProfile/HostProfile';
import History from './pages/History/History';
import BookedHistory from './pages/BookedRooms/BookedHistory';
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AdminNotifications from './pages/AdminNotifications/AdminNotifications';
import AdminMaps from './pages/AdminMaps/AdminMaps';
import AdminMapsView from './pages/AdminMaps/AdminMapsView';
import HostDetails from './pages/AdminNotifications/HostDetails';
import AdminTrends from './pages/AdminTrends/AdminTrends';
import TravelerDetails from './pages/AdminNotifications/TravelerDetails';
import HotelChatbot from './pages/HotelChatBot/HotelChatbot'; // eslint-disable-line no-unused-vars
import ChatbotIcon from './components/ChatbotIcon/ChatbotIcon';
import HostRequests from "./pages/HostRequests/HostRequests";
import ChatPage from './pages/ChatPage/ChatPage';
import RoleHome from './components/RoleHome';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';
import ManagerDepartmentRoute from './components/ManagerDepartmentRoute';
import AdminManagerRegister from './pages/AdminManagerRegister/AdmminManagerRegister';
import ManagerLogin from './pages/Auth/ManagerLogin';
import ManagerHome from './pages/ManagerHome/ManagerHome';
import ManagerListings from './pages/ManagerListings/ManagerListings';
import ManagerProfile from './pages/ManagerProfile/ManagerProfile';
import FinanceLayout from "./components/financeNavbar/FinanceLayout";
import UserRevenue from "./pages/finance/UserRevenue";
import UserFinanceDetail from "./pages/finance/UserFinanceDetail";
import FinanceDashboard from './pages/finance/FinanceDashboard';
import HostRevenue from './pages/finance/HostRevenue';
import HostFinanceDetail from './pages/finance/HostFinanceDetail';
import FinanceManagerProfile from './pages/finance/FinanceManagerProfile';
import Contact from './pages/Contact/Contact';

function App() {
  return (
    <Provider store={store}>
      <AuthProvider>
        <Router>
          <ChatbotIcon />
          <Routes>

            {/* Public routes */}
            {/* <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['traveller']}>
                  <HomePage />
                </ProtectedRoute>
              }
            /> */}
            <Route path="/" element={<RoleHome />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/room/:id" element={<RoomLayout />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/loginweb" element={<LoginSelection />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/traveler-login" element={<TravelerLogin />} />
            <Route path="/host-login" element={<HostLogin />} />
            <Route path="/manager-login" element={<ManagerLogin />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/traveler/:email/bookings" element={<TravelerDetails />} />
            <Route path="/host/:email" element={<HostDetails />} />
            <Route path="/bookedhistory" element={<BookedHistory />} />
            <Route path="/finance" element={<FinanceLayout />}>
  <Route path="users" element={<UserRevenue />} />
  <Route path="user/:id" element={<UserFinanceDetail />} />
  <Route path="dashboard" element={<FinanceDashboard />} />
  <Route path="hosts" element={<HostRevenue />} />
  <Route path="host/:email" element={<HostFinanceDetail />} />
  <Route path="profile" element={<FinanceManagerProfile />} />
</Route>
            {/* <Route path="/admin/hostrequests" element={<HostRequests />} /> */}
            {/* Traveler-only */}
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute allowedRoles={['traveller']}>
                  <Wishlist />
                </ProtectedRoute>
              }
            />
            <Route
              path="/history"
              element={
                <ProtectedRoute allowedRoles={['traveller']}>
                  <History />
                </ProtectedRoute>
              }
            />
            {/* <Route
              path="/BookedHistory"
              element={
                <ProtectedRoute allowedRoles={['traveller']}>
                  <BookedHistory />
                </ProtectedRoute>
              }
            /> */}
            <Route
              path="/traveler/profile"
              element={
                <ProtectedRoute allowedRoles={['traveller']}>
                  <Profile />
                </ProtectedRoute>
              }
            />

            {/* Host-only */}
            {/* Host-only */}
<Route
  path="/host_index"
  element={
    <ProtectedRoute allowedRoles={['host']}>
      <HostIndex />
    </ProtectedRoute>
  }
/>

<Route
  path="/dashboard"
  element={
    <ProtectedRoute allowedRoles={['host']}>
      <HostDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/host/Profile"
  element={
    <ProtectedRoute allowedRoles={['host']}>
      <HostProfile />
    </ProtectedRoute>
  }
/>

            {/* Manager-only */}
            <Route
              path="/manager"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <ManagerHome />
                </ProtectedRoute>
              }
            />
            <Route
              path="/manager/listings"
              element={
                <ManagerDepartmentRoute allowedDepartments={['Listings']}>
                  <ManagerListings />
                </ManagerDepartmentRoute>
              }
            />
            <Route
              path="/manager/profile"
              element={
                <ProtectedRoute allowedRoles={['manager']}>
                  <ManagerProfile />
                </ProtectedRoute>
              }
            />


            {/* Admin-only */}
            <Route
              path="/admindashboard"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin_notifications"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminNotifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin_map"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminMaps />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/maps/:hostEmail"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminMapsView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin_trends"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminTrends />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/hostrequests"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <HostRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/managers/register"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminManagerRegister />
                </ProtectedRoute>
              }
            />
            {/* Chat (any authenticated user) */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute allowedRoles={['traveller', 'host', 'admin', 'manager']}>
                  <SocketProvider>
                    <ChatPage />
                  </SocketProvider>
                </ProtectedRoute>
              }
            />

            
          </Routes>
        </Router>
      </AuthProvider>
    </Provider>
  );
}

export default App;
