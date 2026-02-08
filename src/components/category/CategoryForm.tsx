import {
  X,
  Save,
} from 'lucide-react';

export interface CategoryFormData {
  type: 'vehicle' | 'equipment' | 'partner' | 'contact';
  key: string;
  label_ja: string;
  label_en: string;
  description: string;
  display_order: number;
  is_active: boolean;
}

interface CategoryFormProps {
  formData: CategoryFormData;
  onChange: (data: CategoryFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isEditing: boolean;
}

export default function CategoryForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isEditing,
}: CategoryFormProps) {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'カテゴリー編集' : 'カテゴリー追加'}
        </h2>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-6 w-6" />
        </button>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              タイプ<span className="text-red-600">*</span>
            </label>
            <select
              value={formData.type}
              onChange={(e) =>
                onChange({
                  ...formData,
                  type: e.target.value as CategoryFormData['type'],
                })
              }
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="vehicle">車両</option>
              <option value="equipment">ギヤ</option>
              <option value="partner">協力店</option>
              <option value="contact">お問い合わせ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              キー<span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) =>
                onChange({ ...formData, key: e.target.value })
              }
              placeholder="例: cabcon"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ラベル（日本語）<span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={formData.label_ja}
              onChange={(e) =>
                onChange({ ...formData, label_ja: e.target.value })
              }
              placeholder="例: キャブコン"
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ラベル（英語）
            </label>
            <input
              type="text"
              value={formData.label_en}
              onChange={(e) =>
                onChange({ ...formData, label_en: e.target.value })
              }
              placeholder="例: Cab-over"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              表示順序
            </label>
            <input
              type="number"
              value={formData.display_order}
              onChange={(e) =>
                onChange({
                  ...formData,
                  display_order: parseInt(e.target.value),
                })
              }
              min="0"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) =>
                onChange({ ...formData, is_active: e.target.checked })
              }
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 block text-sm text-gray-700">
              アクティブ
            </label>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              説明
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                onChange({ ...formData, description: e.target.value })
              }
              rows={3}
              placeholder="カテゴリーの説明..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center"
          >
            <Save className="h-5 w-5 mr-2" />
            {isEditing ? '更新' : '登録'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
}
