import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { UserPlus, Eye, EyeOff, Search, CheckCircle, XCircle, Mail } from 'lucide-react';

import { useAuth } from '../contexts/AuthContext';
import { useSystemSettings } from '../hooks/useSystemSettings';
import Layout from '../components/Layout';
import { registerSchema, RegisterFormData } from '../lib/schemas';
import { logger } from '../lib/logger';

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const { signUp } = useAuth();
  const { settings, loading: settingsLoading } = useSystemSettings();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    trigger,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      agreedToTerms: false,
    },
  });

  const password = watch('password');
  const confirmPassword = watch('confirmPassword');
  const postalCode = watch('postalCode');

  const searchAddress = async () => {
    if (!postalCode || postalCode.length < 7) {
      toast.error('郵便番号は7桁で入力してください');
      return;
    }

    setSearchingAddress(true);
    try {
      const cleanPostalCode = postalCode.replace(/[^0-9]/g, '');
      const response = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleanPostalCode}`);
      const data = await response.json();

      if (data.status === 200 && data.results && data.results.length > 0) {
        const result = data.results[0];
        setValue('prefecture', result.address1);
        setValue('city', result.address2 + result.address3);
        // Trigger validation for these fields to clear any errors
        trigger(['prefecture', 'city']);
        toast.success('住所を検索しました');
      } else {
        toast.error('郵便番号が見つかりませんでした');
      }
    } catch {
      toast.error('住所の検索に失敗しました');
    } finally {
      setSearchingAddress(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await signUp(data.email, data.password, {
        firstName: data.firstName,
        lastName: data.lastName,
        phoneNumber: data.phoneNumber,
        postalCode: data.postalCode,
        prefecture: data.prefecture,
        city: data.city,
        addressLine: data.addressLine,
        building: data.building,
      });
      setSubmittedEmail(data.email);
      setRegistrationSuccess(true);
      toast.success('登録が完了しました！メールをご確認ください。');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      logger.error(err);
      toast.error(err.message || '登録に失敗しました');
    }
  };

  if (registrationSuccess) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  登録が完了しました
                </h2>
                <p className="text-gray-600 mb-4">
                  {submittedEmail} にメールを送信しました
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div className="text-sm text-gray-700">
                    <p className="font-semibold mb-2">次のステップ：</p>
                    <ol className="space-y-1 list-decimal list-inside">
                      <li>受信したメールを開く</li>
                      <li>メール内のリンクをクリックしてメールアドレスを確認</li>
                      <li>確認後、ログインしてサービスを利用開始</li>
                    </ol>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate('/login')}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                ログインページへ
              </button>

              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  メールが届かない場合は、迷惑メールフォルダをご確認ください。
                  それでも届かない場合は、カスタマーサポートまでお問い合わせください。
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // ユーザー登録機能が無効の場合
  if (!settingsLoading && !settings.user_registration_enabled) {
    return (
      <Layout>
        <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full">
            <div className="bg-white rounded-2xl shadow-xl p-8">
              <div className="text-center mb-6">
                <div className="mx-auto w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                  <XCircle className="w-10 h-10 text-yellow-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  新規登録を一時停止中
                </h2>
                <p className="text-gray-600">
                  現在、新規ユーザー登録を一時的に停止しております。
                  再開までしばらくお待ちください。
                </p>
              </div>

              <div className="space-y-3">
                <Link
                  to="/login"
                  className="block w-full text-center bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  ログインページへ
                </Link>
                <Link
                  to="/contact"
                  className="block w-full text-center bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition font-medium"
                >
                  お問い合わせ
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-[calc(100vh-200px)] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <UserPlus className="h-8 w-8 text-blue-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-800">新規登録</h1>
              <p className="text-gray-600 mt-2">無料でアカウント作成</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    姓 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('lastName')}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                      errors.lastName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="山田"
                  />
                  {errors.lastName && <p className="mt-1 text-xs text-red-600">{errors.lastName.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    名 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('firstName')}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                      errors.firstName ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="太郎"
                  />
                  {errors.firstName && <p className="mt-1 text-xs text-red-600">{errors.firstName.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  メールアドレス <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  {...register('email')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                    errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="your@email.com"
                />
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  電話番号 <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  {...register('phoneNumber')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                    errors.phoneNumber ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="090-1234-5678"
                />
                {errors.phoneNumber && <p className="mt-1 text-xs text-red-600">{errors.phoneNumber.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  郵便番号 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    {...register('postalCode')}
                    className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                      errors.postalCode ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="1234567"
                    maxLength={8}
                  />
                  <button
                    type="button"
                    onClick={searchAddress}
                    disabled={searchingAddress}
                    className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:bg-gray-50 transition flex items-center gap-2"
                  >
                    <Search className="h-4 w-4" />
                    {searchingAddress ? '...' : '検索'}
                  </button>
                </div>
                {errors.postalCode && <p className="mt-1 text-xs text-red-600">{errors.postalCode.message}</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    都道府県 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('prefecture')}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                      errors.prefecture ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="東京都"
                  />
                  {errors.prefecture && <p className="mt-1 text-xs text-red-600">{errors.prefecture.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    市区町村 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register('city')}
                    className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                      errors.city ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="渋谷区"
                  />
                  {errors.city && <p className="mt-1 text-xs text-red-600">{errors.city.message}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  番地 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('addressLine')}
                  className={`w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                    errors.addressLine ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  placeholder="1-2-3"
                />
                {errors.addressLine && <p className="mt-1 text-xs text-red-600">{errors.addressLine.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  建物名・部屋番号
                </label>
                <input
                  type="text"
                  {...register('building')}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  placeholder="〇〇マンション 101号室"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password')}
                    className={`w-full px-4 py-2.5 pr-12 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                      errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
                {!errors.password && <p className="mt-1 text-xs text-gray-500">8文字以上</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  パスワード（確認） <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...register('confirmPassword')}
                    className={`w-full px-4 py-2.5 pr-20 border rounded-lg focus:ring-2 focus:border-transparent transition ${
                      errors.confirmPassword
                        ? 'border-red-300 focus:ring-red-500'
                        : confirmPassword && password && password === confirmPassword
                        ? 'border-green-300 focus:ring-green-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    placeholder="••••••••"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    {confirmPassword && password && (
                      password === confirmPassword ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )
                    )}
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-gray-500 hover:text-gray-700"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="border-t border-gray-200 pt-5">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('agreedToTerms')}
                    className="mt-1 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">
                    <Link to="/terms" target="_blank" className="text-blue-600 hover:text-blue-700 font-medium underline">
                      利用規約
                    </Link>
                    および
                    <Link to="/privacy" target="_blank" className="text-blue-600 hover:text-blue-700 font-medium underline">
                      プライバシーポリシー
                    </Link>
                    に同意します <span className="text-red-500">*</span>
                  </span>
                </label>
                {errors.agreedToTerms && <p className="mt-1 text-xs text-red-600">{errors.agreedToTerms.message}</p>}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-400 transition"
              >
                {isSubmitting ? '登録中...' : '登録する'}
              </button>
            </form>

            <div className="mt-6 text-center text-sm text-gray-600">
              すでにアカウントをお持ちの方は
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold ml-1">
                ログイン
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
