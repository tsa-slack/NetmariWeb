import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';
import { MapPin, Star, Search, Filter } from 'lucide-react';
import type { Database } from '../lib/database.types';
import { PartnerRepository, useQuery, useRepository } from '../lib/data-access';

type Partner = Database['public']['Tables']['partners']['Row'];

const PARTNER_TYPES = [
  { value: 'all', label: 'すべて' },
  { value: 'RVPark', label: 'RVパーク' },
  { value: 'Restaurant', label: 'レストラン' },
  { value: 'GasStation', label: 'ガソリンスタンド' },
  { value: 'Tourist', label: '観光施設' },
  { value: 'Other', label: 'その他' },
];

export default function PartnersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [sortBy, setSortBy] = useState<'rating' | 'name' | 'newest'>('rating');

  // リポジトリインスタンスを作成
  const partnerRepo = useRepository(PartnerRepository);

  // すべてのパートナーを取得
  const { data: partners, loading, error, refetch } = useQuery<Partner[]>(
    async () => partnerRepo.findAll(),
    { refetchOnMount: true }
  );

  // クライアント側でフィルタリングとソート
  const filteredPartners = useMemo(() => {
    if (!partners) return [];
    
    let filtered = [...partners];

    // 検索フィルター
    if (searchQuery) {
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.address?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // タイプフィルター
    if (selectedType !== 'all') {
      filtered = filtered.filter((p) => p.type === selectedType);
    }

    // ソート
    filtered.sort((a, b) => {
      if (sortBy === 'rating') {
        return (b.rating || 0) - (a.rating || 0);
      } else if (sortBy === 'name') {
        return a.name.localeCompare(b.name, 'ja');
      } else {
        return new Date(b.created_at ?? '').getTime() - new Date(a.created_at ?? '').getTime();
      }
    });

    return filtered;
  }, [partners, searchQuery, selectedType, sortBy]);

  const getTypeLabel = (type: string) => {
    const partnerType = PARTNER_TYPES.find((t) => t.value === type);
    return partnerType ? partnerType.label : type;
  };

  if (error) {
    return (
      <Layout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ErrorState
            message={error.message}
            onRetry={() => refetch()}
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">協力店</h1>
          <p className="text-lg md:text-xl text-gray-600">
            車中泊をサポートする協力店の情報
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="協力店を検索..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
              >
                {PARTNER_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'rating' | 'name' | 'newest')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="rating">評価順</option>
              <option value="name">名前順</option>
              <option value="newest">新着順</option>
            </select>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="読み込み中..." />
        ) : filteredPartners.length === 0 ? (
          <div className="bg-white rounded-xl shadow">
            <EmptyState
              icon={MapPin}
              title={(partners?.length || 0) === 0 ? '現在、協力店情報はありません' : '条件に一致する協力店が見つかりませんでした'}
              message={(partners?.length || 0) === 0 ? '協力店の登録をご希望の方はお気軽にお問い合わせください' : undefined}
              actionLabel={(partners?.length || 0) === 0 ? 'お問い合わせ' : undefined}
              actionTo={(partners?.length || 0) === 0 ? '/contact' : undefined}
            />
          </div>
        ) : (
          <>
            <div className="mb-6 text-gray-600">
              {filteredPartners.length}件の協力店が見つかりました
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredPartners.map((partner) => {
                const images = Array.isArray(partner.images) ? partner.images : [];
                return (
                  <Link
                    key={partner.id}
                    to={`/partners/${partner.id}`}
                    className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                  >
                    {images.length > 0 ? (
                      <div
                        className="h-48 bg-cover bg-center"
                        style={{ backgroundImage: `url(${images[0]})` }}
                      />
                    ) : (
                      <div className="h-48 bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                        <MapPin className="h-20 w-20 text-white" />
                      </div>
                    )}
                    <div className="p-6">
                      <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        {partner.name}
                      </h3>
                      {partner.type && (
                        <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full mb-3">
                          {getTypeLabel(partner.type)}
                        </span>
                      )}
                      {partner.description && (
                        <p className="text-gray-600 mb-4 line-clamp-3">{partner.description}</p>
                      )}
                      {partner.address && (
                        <div className="flex items-start text-sm text-gray-600 mb-3">
                          <MapPin className="h-4 w-4 mr-1 mt-0.5 flex-shrink-0" />
                          <span className="line-clamp-2">{partner.address}</span>
                        </div>
                      )}
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="h-4 w-4 text-yellow-400 mr-1" />
                        <span>{Math.round(partner.rating || 0)}</span>
                        <span className="ml-2">({partner.review_count || 0}件)</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
