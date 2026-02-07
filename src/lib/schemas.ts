import { z } from 'zod';

export const registerSchema = z.object({
    lastName: z.string().min(1, '姓を入力してください'),
    firstName: z.string().min(1, '名を入力してください'),
    email: z.string().email('有効なメールアドレスを入力してください'),
    phoneNumber: z.string().min(1, '電話番号を入力してください'),
    postalCode: z.string().min(7, '郵便番号は7桁で入力してください').max(8, '郵便番号はハイフン込みで8文字以内です'),
    prefecture: z.string().min(1, '都道府県を入力してください'),
    city: z.string().min(1, '市区町村を入力してください'),
    addressLine: z.string().min(1, '番地を入力してください'),
    building: z.string().optional(),
    password: z.string().min(8, 'パスワードは8文字以上で入力してください'),
    confirmPassword: z.string().min(1, '確認用パスワードを入力してください'),
    agreedToTerms: z.boolean().refine((val) => val === true, {
        message: '利用規約とプライバシーポリシーに同意してください',
    }),
}).refine((data) => data.password === data.confirmPassword, {
    message: 'パスワードが一致しません',
    path: ['confirmPassword'],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
