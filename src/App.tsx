import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import LoadingSpinner from './components/LoadingSpinner';

// --- Lazy-loaded pages ---
// Public
const HomePage = lazy(() => import('./pages/HomePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const AuthCallbackPage = lazy(() => import('./pages/AuthCallbackPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage'));

// Vehicles
const VehiclesPage = lazy(() => import('./pages/VehiclesPage'));
const VehicleDetailPage = lazy(() => import('./pages/VehicleDetailPage'));
const VehicleReviewFormPage = lazy(() => import('./pages/VehicleReviewFormPage'));

// Rental
const RentalPage = lazy(() => import('./pages/RentalPage'));
const RentalVehicleSelectionPage = lazy(() => import('./pages/RentalVehicleSelectionPage'));
const RentalEquipmentSelectionPage = lazy(() => import('./pages/RentalEquipmentSelectionPage'));
const RentalActivitySelectionPage = lazy(() => import('./pages/RentalActivitySelectionPage'));
const RentalConfirmationPage = lazy(() => import('./pages/RentalConfirmationPage'));

// Partners
const PartnersPage = lazy(() => import('./pages/PartnersPage'));
const PartnerDetailPage = lazy(() => import('./pages/PartnerDetailPage'));
const PartnerReviewPage = lazy(() => import('./pages/PartnerReviewPage'));
const PartnerFormPage = lazy(() => import('./pages/PartnerFormPage'));
const ReviewEditPage = lazy(() => import('./pages/ReviewEditPage'));

// Portal
const PortalPage = lazy(() => import('./pages/PortalPage'));
const StoriesPage = lazy(() => import('./pages/StoriesPage'));
const StoryDetailPage = lazy(() => import('./pages/StoryDetailPage'));
const StoryFormPage = lazy(() => import('./pages/StoryFormPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const EventDetailPage = lazy(() => import('./pages/EventDetailPage'));
const EventFormPage = lazy(() => import('./pages/EventFormPage'));
const QuestionsPage = lazy(() => import('./pages/QuestionsPage'));
const QuestionDetailPage = lazy(() => import('./pages/QuestionDetailPage'));
const QuestionFormPage = lazy(() => import('./pages/QuestionFormPage'));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage'));

// User
const MyPage = lazy(() => import('./pages/MyPage'));
const RoutePage = lazy(() => import('./pages/RoutePage'));

// Admin
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ContentManagementPage = lazy(() => import('./pages/ContentManagementPage'));
const NewsManagementPage = lazy(() => import('./pages/NewsManagementPage'));
const SystemSettingsPage = lazy(() => import('./pages/SystemSettingsPage'));
const UserManagementPage = lazy(() => import('./pages/UserManagementPage'));
const VehicleManagementPage = lazy(() => import('./pages/VehicleManagementPage'));
const VehicleFormPage = lazy(() => import('./pages/VehicleFormPage'));
const SaleVehicleManagementPage = lazy(() => import('./pages/SaleVehicleManagementPage'));
const SaleVehicleFormPage = lazy(() => import('./pages/SaleVehicleFormPage'));
const EquipmentManagementPage = lazy(() => import('./pages/EquipmentManagementPage'));
const EquipmentFormPage = lazy(() => import('./pages/EquipmentFormPage'));
const PartnerManagementPage = lazy(() => import('./pages/PartnerManagementPage'));
const ActivityManagementPage = lazy(() => import('./pages/ActivityManagementPage'));
const StoryManagementPage = lazy(() => import('./pages/StoryManagementPage'));
const ReviewManagementPage = lazy(() => import('./pages/ReviewManagementPage'));
const QuestionManagementPage = lazy(() => import('./pages/QuestionManagementPage'));
const ContactManagementPage = lazy(() => import('./pages/ContactManagementPage'));
const CategoryManagementPage = lazy(() => import('./pages/CategoryManagementPage'));
const ReservationManagementPage = lazy(() => import('./pages/ReservationManagementPage'));

// Staff
const StaffPage = lazy(() => import('./pages/StaffPage'));
const StaffCheckoutPage = lazy(() => import('./pages/StaffCheckoutPage'));
const StaffReturnPage = lazy(() => import('./pages/StaffReturnPage'));

// Partner Dashboard
const PartnerDashboardPage = lazy(() => import('./pages/PartnerDashboardPage'));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
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
            <Route path="/admin/content" element={<ContentManagementPage />} />
            <Route path="/admin/news" element={<NewsManagementPage />} />
            <Route path="/admin/settings" element={<SystemSettingsPage />} />
            <Route path="/staff" element={<StaffPage />} />
            <Route path="/staff/contacts" element={<ContactManagementPage />} />
            <Route path="/staff/stories" element={<StoryManagementPage />} />
            <Route path="/staff/reviews" element={<ReviewManagementPage />} />
            <Route path="/staff/questions" element={<QuestionManagementPage />} />
            <Route path="/staff/checkout/:id" element={<StaffCheckoutPage />} />
            <Route path="/staff/return/:id" element={<StaffReturnPage />} />
            <Route path="/partner/dashboard" element={<PartnerDashboardPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
