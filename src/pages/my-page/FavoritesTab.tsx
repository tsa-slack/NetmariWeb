import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Car, BookOpen } from 'lucide-react';
import type { PartnerFavorite, VehicleFavorite, StoryFavorite } from './types';
import LoadingSpinner from '../../components/LoadingSpinner';

interface FavoritesTabProps {
  myPartnerFavorites: PartnerFavorite[];
  myVehicleFavorites: VehicleFavorite[];
  myStoryFavorites: StoryFavorite[];
  favoritesLoading: boolean;
}

export default function FavoritesTab({
  myPartnerFavorites,
  myVehicleFavorites,
  myStoryFavorites,
  favoritesLoading,
}: FavoritesTabProps) {
  const [favoriteTab, setFavoriteTab] = useState<'partners' | 'vehicles' | 'stories'>('partners');

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 mb-6">お気に入り</h2>

      <div className="bg-white rounded-xl shadow-lg mb-6">
        <div className="flex border-b">
          <button
            onClick={() => setFavoriteTab('partners')}
            className={`flex-1 px-6 py-4 text-center font-semibold transition border-b-4 ${
              favoriteTab === 'partners'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:bg-gray-50'
            }`}
          >
            <MapPin className={`h-5 w-5 mx-auto mb-1 ${favoriteTab === 'partners' ? 'text-blue-600' : 'text-gray-600'}`} />
            <span className="text-sm">協力店</span>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              favoriteTab === 'partners' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {myPartnerFavorites.length}
            </span>
          </button>
          <button
            onClick={() => setFavoriteTab('vehicles')}
            className={`flex-1 px-6 py-4 text-center font-semibold transition border-b-4 ${
              favoriteTab === 'vehicles'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Car className={`h-5 w-5 mx-auto mb-1 ${favoriteTab === 'vehicles' ? 'text-blue-600' : 'text-gray-600'}`} />
            <span className="text-sm">車両</span>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              favoriteTab === 'vehicles' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {myVehicleFavorites.length}
            </span>
          </button>
          <button
            onClick={() => setFavoriteTab('stories')}
            className={`flex-1 px-6 py-4 text-center font-semibold transition border-b-4 ${
              favoriteTab === 'stories'
                ? 'border-blue-600 text-blue-600 bg-blue-50'
                : 'border-transparent text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BookOpen className={`h-5 w-5 mx-auto mb-1 ${favoriteTab === 'stories' ? 'text-blue-600' : 'text-gray-600'}`} />
            <span className="text-sm">ストーリー</span>
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
              favoriteTab === 'stories' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {myStoryFavorites.length}
            </span>
          </button>
        </div>
      </div>

      {favoritesLoading ? (
        <LoadingSpinner />
      ) : (
        <>
          {favoriteTab === 'partners' && (
            myPartnerFavorites.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow">
                <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">お気に入りの協力店がありません</p>
                <Link
                  to="/partners"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  協力店を探す
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myPartnerFavorites.map((favorite) => {
                  const partner = favorite.partner;
                  const images = Array.isArray(partner?.images) ? partner.images : [];
                  return (
                    <Link
                      key={favorite.id}
                      to={`/partners/${favorite.partner_id}`}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                    >
                      {images.length > 0 ? (
                        <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${images[0]})` }} />
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                          <MapPin className="h-20 w-20 text-white opacity-50" />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="mb-3">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                            {partner?.type === 'RVPark' ? 'RVパーク' :
                             partner?.type === 'Restaurant' ? 'レストラン' :
                             partner?.type === 'GasStation' ? 'ガソリンスタンド' :
                             partner?.type === 'Tourist' ? '観光施設' : 'その他'}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-1">
                          {partner?.name || '協力店'}
                        </h3>
                        {partner?.address && (
                          <div className="flex items-center text-sm text-gray-600 mb-2">
                            <MapPin className="h-4 w-4 mr-1" />
                            {partner.address}
                          </div>
                        )}
                        {partner?.description && (
                          <p className="text-gray-600 text-sm line-clamp-2">{partner.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-3">
                          追加日: {new Date(favorite.created_at || '').toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          )}

          {favoriteTab === 'vehicles' && (
            myVehicleFavorites.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow">
                <Car className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">お気に入りの車両がありません</p>
                <Link
                  to="/vehicles"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  車両を探す
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myVehicleFavorites.map((favorite) => {
                  const vehicle = favorite.rental_vehicle?.vehicle;
                  const images = Array.isArray(vehicle?.images) ? vehicle.images : [];
                  return (
                    <Link
                      key={favorite.id}
                      to={`/vehicles/${favorite.rental_vehicle_id}`}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                    >
                      {images.length > 0 ? (
                        <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${images[0]})` }} />
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                          <Car className="h-20 w-20 text-white opacity-50" />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="mb-3">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                            {vehicle?.type || '車両'}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-1">{vehicle?.name || '車両'}</h3>
                        {vehicle?.manufacturer && (<p className="text-gray-600 text-sm mb-2">{vehicle.manufacturer}</p>)}
                        {vehicle?.price && (
                          <p className="text-lg font-bold text-blue-600 mb-2">
                            ¥{Number(vehicle.price).toLocaleString()}
                          </p>
                        )}
                        <p className="text-xs text-gray-400 mt-3">
                          追加日: {new Date(favorite.created_at || '').toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          )}

          {favoriteTab === 'stories' && (
            myStoryFavorites.length === 0 ? (
              <div className="bg-white rounded-xl p-12 text-center shadow">
                <BookOpen className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">お気に入りのストーリーがありません</p>
                <Link
                  to="/portal/stories"
                  className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  ストーリーを探す
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myStoryFavorites.map((favorite) => {
                  const story = favorite.story;
                  return (
                    <Link
                      key={favorite.id}
                      to={`/portal/stories/${favorite.story_id}`}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition"
                    >
                      {story?.cover_image ? (
                        <div className="h-48 bg-cover bg-center" style={{ backgroundImage: `url(${story.cover_image})` }} />
                      ) : (
                        <div className="h-48 bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <BookOpen className="h-20 w-20 text-white opacity-50" />
                        </div>
                      )}
                      <div className="p-6">
                        <h3 className="text-xl font-semibold text-gray-800 mb-2 line-clamp-2">{story?.title || 'ストーリー'}</h3>
                        {story?.excerpt && (
                          <p className="text-gray-600 text-sm line-clamp-3 mb-3">{story.excerpt}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-3">
                          追加日: {new Date(favorite.created_at || '').toLocaleDateString('ja-JP')}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )
          )}
        </>
      )}
    </div>
  );
}
