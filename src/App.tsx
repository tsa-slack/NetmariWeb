import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VehiclesPage from './pages/VehiclesPage';
import VehicleDetailPage from './pages/VehicleDetailPage';
import VehicleReviewFormPage from './pages/VehicleReviewFormPage';
import RentalPage from './pages/RentalPage';
import RentalVehicleSelectionPage from './pages/RentalVehicleSelectionPage';
import RentalEquipmentSelectionPage from './pages/RentalEquipmentSelectionPage';
import RentalActivitySelectionPage from './pages/RentalActivitySelectionPage';
import RentalConfirmationPage from './pages/RentalConfirmationPage';
import PartnersPage from './pages/PartnersPage';
import PartnerDetailPage from './pages/PartnerDetailPage';
import PartnerReviewPage from './pages/PartnerReviewPage';
import PartnerFormPage from './pages/PartnerFormPage';
import ReviewEditPage from './pages/ReviewEditPage';
import RoutePage from './pages/RoutePage';
import PortalPage from './pages/PortalPage';
import StoriesPage from './pages/StoriesPage';
import StoryDetailPage from './pages/StoryDetailPage';
import StoryFormPage from './pages/StoryFormPage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import EventFormPage from './pages/EventFormPage';
import QuestionsPage from './pages/QuestionsPage';
import QuestionDetailPage from './pages/QuestionDetailPage';
import QuestionFormPage from './pages/QuestionFormPage';
import AnnouncementsPage from './pages/AnnouncementsPage';
import MyPage from './pages/MyPage';
import AdminPage from './pages/AdminPage';
import StaffPage from './pages/StaffPage';
import PartnerDashboardPage from './pages/PartnerDashboardPage';
import AboutPage from './pages/AboutPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ContactPage from './pages/ContactPage';
import ContactManagementPage from './pages/ContactManagementPage';
import SystemSettingsPage from './pages/SystemSettingsPage';
import UserManagementPage from './pages/UserManagementPage';
import VehicleManagementPage from './pages/VehicleManagementPage';
import VehicleFormPage from './pages/VehicleFormPage';
import StoryManagementPage from './pages/StoryManagementPage';
import ReviewManagementPage from './pages/ReviewManagementPage';
import QuestionManagementPage from './pages/QuestionManagementPage';
import ActivityManagementPage from './pages/ActivityManagementPage';
import PartnerManagementPage from './pages/PartnerManagementPage';
import ReservationManagementPage from './pages/ReservationManagementPage';
import EquipmentManagementPage from './pages/EquipmentManagementPage';
import EquipmentFormPage from './pages/EquipmentFormPage';
import SaleVehicleManagementPage from './pages/SaleVehicleManagementPage';
import SaleVehicleFormPage from './pages/SaleVehicleFormPage';
import CategoryManagementPage from './pages/CategoryManagementPage';
import StaffCheckoutPage from './pages/StaffCheckoutPage';
import StaffReturnPage from './pages/StaffReturnPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/vehicles" element={<VehiclesPage />} />
          <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
          <Route path="/vehicles/review" element={<VehicleReviewFormPage />} />
          <Route path="/rental" element={<RentalPage />} />
          <Route path="/rental/vehicles" element={<RentalVehicleSelectionPage />} />
          <Route path="/rental/equipment" element={<RentalEquipmentSelectionPage />} />
          <Route path="/rental/activities" element={<RentalActivitySelectionPage />} />
          <Route path="/rental/confirm" element={<RentalConfirmationPage />} />
          <Route path="/partners" element={<PartnersPage />} />
          <Route path="/partners/:id" element={<PartnerDetailPage />} />
          <Route path="/partners/:id/review" element={<PartnerReviewPage />} />
          <Route path="/reviews/:id/edit" element={<ReviewEditPage />} />
          <Route path="/admin/partners/new" element={<PartnerFormPage />} />
          <Route path="/admin/partners/:id/edit" element={<PartnerFormPage />} />
          <Route path="/route" element={<RoutePage />} />
          <Route path="/routes" element={<RoutePage />} />
          <Route path="/portal" element={<PortalPage />} />
          <Route path="/portal/stories" element={<StoriesPage />} />
          <Route path="/portal/stories/new" element={<StoryFormPage />} />
          <Route path="/portal/stories/:id" element={<StoryDetailPage />} />
          <Route path="/portal/stories/:id/edit" element={<StoryFormPage />} />
          <Route path="/portal/events" element={<EventsPage />} />
          <Route path="/portal/events/new" element={<EventFormPage />} />
          <Route path="/portal/events/:id" element={<EventDetailPage />} />
          <Route path="/portal/events/:id/edit" element={<EventFormPage />} />
          <Route path="/portal/questions" element={<QuestionsPage />} />
          <Route path="/portal/qa" element={<QuestionsPage />} />
          <Route path="/portal/questions/new" element={<QuestionFormPage />} />
          <Route path="/portal/questions/:id" element={<QuestionDetailPage />} />
          <Route path="/portal/questions/:id/edit" element={<QuestionFormPage />} />
          <Route path="/portal/announcements" element={<AnnouncementsPage />} />
          <Route path="/portal/news" element={<AnnouncementsPage />} />
          <Route path="/my" element={<MyPage />} />
          <Route path="/my-page" element={<MyPage />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/reservations" element={<ReservationManagementPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/vehicles" element={<VehicleManagementPage />} />
          <Route path="/admin/vehicles/new" element={<VehicleFormPage />} />
          <Route path="/admin/vehicles/:id/edit" element={<VehicleFormPage />} />
          <Route path="/admin/sale-vehicles" element={<SaleVehicleManagementPage />} />
          <Route path="/admin/sale-vehicles/new" element={<SaleVehicleFormPage />} />
          <Route path="/admin/sale-vehicles/edit/:id" element={<SaleVehicleFormPage />} />
          <Route path="/admin/equipment" element={<EquipmentManagementPage />} />
          <Route path="/admin/equipment/new" element={<EquipmentFormPage />} />
          <Route path="/admin/equipment/:id/edit" element={<EquipmentFormPage />} />
          <Route path="/admin/partners" element={<PartnerManagementPage />} />
          <Route path="/admin/activities" element={<ActivityManagementPage />} />
          <Route path="/admin/stories" element={<StoryManagementPage />} />
          <Route path="/admin/reviews" element={<ReviewManagementPage />} />
          <Route path="/admin/questions" element={<QuestionManagementPage />} />
          <Route path="/admin/contacts" element={<ContactManagementPage />} />
          <Route path="/admin/categories" element={<CategoryManagementPage />} />
          <Route path="/admin/settings" element={<SystemSettingsPage />} />
          <Route path="/staff" element={<StaffPage />} />
          <Route path="/staff/contacts" element={<ContactManagementPage />} />
          <Route path="/staff/checkout/:id" element={<StaffCheckoutPage />} />
          <Route path="/staff/return/:id" element={<StaffReturnPage />} />
          <Route path="/partner/dashboard" element={<PartnerDashboardPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
