import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { Toaster } from 'sonner';
import LoadingSpinner from './components/LoadingSpinner';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from './components/ProtectedRoute';

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
        <ScrollToTop />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            {/* ========================================
                公開ページ（認証不要）
               ======================================== */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/auth/callback" element={<AuthCallbackPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/vehicles" element={<VehiclesPage />} />
            <Route path="/vehicles/:id" element={<VehicleDetailPage />} />
            <Route path="/partners" element={<PartnersPage />} />
            <Route path="/partners/:id" element={<PartnerDetailPage />} />
            <Route path="/portal" element={<PortalPage />} />
            <Route path="/portal/stories" element={<StoriesPage />} />
            <Route path="/portal/stories/:id" element={<StoryDetailPage />} />
            <Route path="/portal/events" element={<EventsPage />} />
            <Route path="/portal/events/:id" element={<EventDetailPage />} />
            <Route path="/portal/questions" element={<QuestionsPage />} />
            <Route path="/portal/qa" element={<QuestionsPage />} />
            <Route path="/portal/questions/:id" element={<QuestionDetailPage />} />
            <Route path="/portal/announcements" element={<AnnouncementsPage />} />
            <Route path="/portal/news" element={<AnnouncementsPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsOfServicePage />} />

            {/* ========================================
                認証必須ページ（ログインのみ必要）
               ======================================== */}
            <Route path="/vehicles/review" element={<ProtectedRoute><VehicleReviewFormPage /></ProtectedRoute>} />
            <Route path="/rental" element={<RentalPage />} />
            <Route path="/rental/vehicles" element={<ProtectedRoute><RentalVehicleSelectionPage /></ProtectedRoute>} />
            <Route path="/rental/equipment" element={<ProtectedRoute><RentalEquipmentSelectionPage /></ProtectedRoute>} />
            <Route path="/rental/activities" element={<ProtectedRoute><RentalActivitySelectionPage /></ProtectedRoute>} />
            <Route path="/rental/confirm" element={<ProtectedRoute><RentalConfirmationPage /></ProtectedRoute>} />
            <Route path="/partners/:id/review" element={<ProtectedRoute><PartnerReviewPage /></ProtectedRoute>} />
            <Route path="/reviews/:id/edit" element={<ProtectedRoute><ReviewEditPage /></ProtectedRoute>} />
            <Route path="/portal/stories/new" element={<ProtectedRoute><StoryFormPage /></ProtectedRoute>} />
            <Route path="/portal/stories/:id/edit" element={<ProtectedRoute><StoryFormPage /></ProtectedRoute>} />
            <Route path="/portal/events/new" element={<ProtectedRoute><EventFormPage /></ProtectedRoute>} />
            <Route path="/portal/events/:id/edit" element={<ProtectedRoute><EventFormPage /></ProtectedRoute>} />
            <Route path="/portal/questions/new" element={<ProtectedRoute><QuestionFormPage /></ProtectedRoute>} />
            <Route path="/portal/questions/:id/edit" element={<ProtectedRoute><QuestionFormPage /></ProtectedRoute>} />
            <Route path="/route" element={<Navigate to="/routes" replace />} />
            <Route path="/routes" element={<RoutePage />} />
            <Route path="/my" element={<Navigate to="/mypage" replace />} />
            <Route path="/my-page" element={<Navigate to="/mypage" replace />} />
            <Route path="/mypage" element={<ProtectedRoute><MyPage /></ProtectedRoute>} />

            {/* ========================================
                Admin 専用ページ
               ======================================== */}
            <Route path="/admin" element={<ProtectedRoute allowedRoles={['Admin']}><AdminPage /></ProtectedRoute>} />
            <Route path="/admin/reservations" element={<ProtectedRoute allowedRoles={['Admin']}><ReservationManagementPage /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute allowedRoles={['Admin']}><UserManagementPage /></ProtectedRoute>} />
            <Route path="/admin/vehicles" element={<ProtectedRoute allowedRoles={['Admin']}><VehicleManagementPage /></ProtectedRoute>} />
            <Route path="/admin/vehicles/new" element={<ProtectedRoute allowedRoles={['Admin']}><VehicleFormPage /></ProtectedRoute>} />
            <Route path="/admin/vehicles/:id/edit" element={<ProtectedRoute allowedRoles={['Admin']}><VehicleFormPage /></ProtectedRoute>} />
            <Route path="/admin/sale-vehicles" element={<ProtectedRoute allowedRoles={['Admin']}><SaleVehicleManagementPage /></ProtectedRoute>} />
            <Route path="/admin/sale-vehicles/new" element={<ProtectedRoute allowedRoles={['Admin']}><SaleVehicleFormPage /></ProtectedRoute>} />
            <Route path="/admin/sale-vehicles/edit/:id" element={<ProtectedRoute allowedRoles={['Admin']}><SaleVehicleFormPage /></ProtectedRoute>} />
            <Route path="/admin/equipment" element={<ProtectedRoute allowedRoles={['Admin']}><EquipmentManagementPage /></ProtectedRoute>} />
            <Route path="/admin/equipment/new" element={<ProtectedRoute allowedRoles={['Admin']}><EquipmentFormPage /></ProtectedRoute>} />
            <Route path="/admin/equipment/:id/edit" element={<ProtectedRoute allowedRoles={['Admin']}><EquipmentFormPage /></ProtectedRoute>} />
            <Route path="/admin/partners" element={<ProtectedRoute allowedRoles={['Admin']}><PartnerManagementPage /></ProtectedRoute>} />
            <Route path="/admin/partners/new" element={<ProtectedRoute allowedRoles={['Admin']}><PartnerFormPage /></ProtectedRoute>} />
            <Route path="/admin/partners/:id/edit" element={<ProtectedRoute allowedRoles={['Admin']}><PartnerFormPage /></ProtectedRoute>} />
            <Route path="/admin/activities" element={<ProtectedRoute allowedRoles={['Admin']}><ActivityManagementPage /></ProtectedRoute>} />
            <Route path="/admin/stories" element={<ProtectedRoute allowedRoles={['Admin']}><StoryManagementPage /></ProtectedRoute>} />
            <Route path="/admin/reviews" element={<ProtectedRoute allowedRoles={['Admin']}><ReviewManagementPage /></ProtectedRoute>} />
            <Route path="/admin/questions" element={<ProtectedRoute allowedRoles={['Admin']}><QuestionManagementPage /></ProtectedRoute>} />
            <Route path="/admin/contacts" element={<ProtectedRoute allowedRoles={['Admin']}><ContactManagementPage /></ProtectedRoute>} />
            <Route path="/admin/categories" element={<ProtectedRoute allowedRoles={['Admin']}><CategoryManagementPage /></ProtectedRoute>} />
            <Route path="/admin/content" element={<ProtectedRoute allowedRoles={['Admin']}><ContentManagementPage /></ProtectedRoute>} />
            <Route path="/admin/news" element={<ProtectedRoute allowedRoles={['Admin']}><NewsManagementPage /></ProtectedRoute>} />
            <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['Admin']}><SystemSettingsPage /></ProtectedRoute>} />

            {/* ========================================
                Staff + Admin ページ
               ======================================== */}
            <Route path="/staff" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><StaffPage /></ProtectedRoute>} />
            <Route path="/staff/contacts" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><ContactManagementPage /></ProtectedRoute>} />
            <Route path="/staff/stories" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><StoryManagementPage /></ProtectedRoute>} />
            <Route path="/staff/reviews" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><ReviewManagementPage /></ProtectedRoute>} />
            <Route path="/staff/questions" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><QuestionManagementPage /></ProtectedRoute>} />
            <Route path="/staff/checkout/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><StaffCheckoutPage /></ProtectedRoute>} />
            <Route path="/staff/return/:id" element={<ProtectedRoute allowedRoles={['Admin', 'Staff']}><StaffReturnPage /></ProtectedRoute>} />

            {/* ========================================
                Partner + Admin ページ
               ======================================== */}
            <Route path="/partner/dashboard" element={<ProtectedRoute allowedRoles={['Admin', 'Partners']}><PartnerDashboardPage /></ProtectedRoute>} />

            {/* ========================================
                フォールバック
               ======================================== */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
