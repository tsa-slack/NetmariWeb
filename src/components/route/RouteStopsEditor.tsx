import { useState } from 'react';
import {
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  MapPin,
  Edit3,
  Check,
  X,
} from 'lucide-react';
import type { Database } from '../../lib/database.types';
import PlaceAutocomplete from '../PlaceAutocomplete';

type RouteStop = Database['public']['Tables']['route_stops']['Row'];

export interface LocalStop {
  id?: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  notes: string;
  partner_id?: string | null;
  stop_order: number;
  isNew?: boolean;
}

interface RouteStopsEditorProps {
  stops: LocalStop[];
  onStopsChange: (stops: LocalStop[]) => void;
  onAddStop: (stop: Omit<LocalStop, 'stop_order'>) => void;
  onRemoveStop: (index: number) => void;
  onMoveStop: (fromIndex: number, toIndex: number) => void;
  disabled?: boolean;
}

export function routeStopToLocal(stop: RouteStop, index: number): LocalStop {
  return {
    id: stop.id,
    name: stop.name || '',
    address: stop.address || '',
    latitude: stop.latitude,
    longitude: stop.longitude,
    notes: stop.notes || '',
    partner_id: stop.partner_id,
    stop_order: stop.stop_order ?? index + 1,
  };
}

export default function RouteStopsEditor({
  stops,
  onStopsChange,
  onAddStop,
  onRemoveStop,
  onMoveStop,
  disabled = false,
}: RouteStopsEditorProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [newStop, setNewStop] = useState({
    name: '',
    address: '',
    notes: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });
  const [editStop, setEditStop] = useState({
    name: '',
    address: '',
    notes: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  const handleAdd = () => {
    if (!newStop.name.trim()) return;
    onAddStop({
      name: newStop.name.trim(),
      address: newStop.address.trim(),
      notes: newStop.notes.trim(),
      latitude: newStop.latitude,
      longitude: newStop.longitude,
    });
    setNewStop({ name: '', address: '', notes: '', latitude: null, longitude: null });
    setShowAddForm(false);
  };

  const startEdit = (index: number) => {
    const stop = stops[index];
    setEditStop({
      name: stop.name,
      address: stop.address,
      notes: stop.notes,
      latitude: stop.latitude,
      longitude: stop.longitude,
    });
    setEditingIndex(index);
  };

  const saveEdit = (index: number) => {
    const updated = [...stops];
    updated[index] = {
      ...updated[index],
      name: editStop.name.trim(),
      address: editStop.address.trim(),
      notes: editStop.notes.trim(),
      latitude: editStop.latitude,
      longitude: editStop.longitude,
    };
    onStopsChange(updated);
    setEditingIndex(null);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-800 flex items-center">
          <MapPin className="h-5 w-5 mr-2 text-blue-600" />
          経由地 ({stops.length})
        </h2>
        {!disabled && (
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <Plus className="h-4 w-4 mr-1" />
            追加
          </button>
        )}
      </div>

      {/* 追加フォーム */}
      {showAddForm && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
          <div>
            <PlaceAutocomplete
              label="スポット名"
              placeholder="施設名や駅名を入力して検索"
              defaultValue={newStop.name}
              required
              onPlaceSelect={(place) => {
                setNewStop({
                  ...newStop,
                  name: place.name,
                  address: place.address || '',
                  latitude: place.latitude,
                  longitude: place.longitude,
                });
              }}
              onTextChange={(value) => setNewStop({ ...newStop, name: value })}
              id="new-stop-place"
            />
          </div>

          {/* 位置情報ステータス */}
          {newStop.latitude && newStop.longitude ? (
            <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-md px-2.5 py-1.5">
              <MapPin className="h-3.5 w-3.5" />
              位置情報を取得済み（{newStop.latitude.toFixed(4)}, {newStop.longitude.toFixed(4)}）
            </div>
          ) : newStop.name.trim() ? (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2.5 py-1.5">
              💡 候補リストから選択すると住所・位置情報が自動取得されます
            </div>
          ) : null}

          {/* 住所（自動入力 or 手入力） */}
          {newStop.address && (
            <div className="text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-md px-2.5 py-1.5">
              📍 住所: {newStop.address}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メモ（任意）
            </label>
            <input
              type="text"
              value={newStop.notes}
              onChange={(e) => setNewStop({ ...newStop, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              placeholder="例: 駐車場あり、ランチおすすめ"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!newStop.name.trim()}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition"
            >
              追加
            </button>
            <button
              onClick={() => { setShowAddForm(false); setNewStop({ name: '', address: '', notes: '', latitude: null, longitude: null }); }}
              className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
            >
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* 経由地リスト */}
      {stops.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <MapPin className="h-12 w-12 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">経由地がありません</p>
          <p className="text-xs text-gray-400 mt-1">
            「追加」ボタンまたは下の周辺スポットから追加できます
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {stops.map((stop, index) => (
            <div
              key={stop.id || `new-${index}`}
              className="flex items-start gap-2 sm:gap-3 p-2.5 sm:p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition group"
            >
              {/* 順番バッジ + 並べ替えハンドル */}
              <div className="flex flex-col items-center pt-1">
                <div className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                  {index + 1}
                </div>
                {!disabled && (
                  <div className="flex flex-col mt-1 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={() => onMoveStop(index, index - 1)}
                      disabled={index === 0}
                      className="p-0.5 text-gray-400 hover:text-gray-700 disabled:text-gray-200"
                      title="上に移動"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onMoveStop(index, index + 1)}
                      disabled={index === stops.length - 1}
                      className="p-0.5 text-gray-400 hover:text-gray-700 disabled:text-gray-200"
                      title="下に移動"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* 内容 */}
              <div className="flex-1 min-w-0">
                {editingIndex === index ? (
                  <div className="space-y-2">
                    <PlaceAutocomplete
                      label="スポット名"
                      placeholder="施設名や駅名を入力"
                      defaultValue={editStop.name}
                      onPlaceSelect={(place) => {
                        setEditStop({
                          ...editStop,
                          name: place.name,
                          address: place.address || '',
                          latitude: place.latitude,
                          longitude: place.longitude,
                        });
                      }}
                      onTextChange={(value) => setEditStop({ ...editStop, name: value })}
                      id={`edit-stop-${index}`}
                    />
                    {editStop.latitude && editStop.longitude && (
                      <div className="text-xs text-green-700 bg-green-50 rounded px-2 py-1">
                        📍 位置情報あり
                      </div>
                    )}
                    {editStop.address && (
                      <div className="text-xs text-gray-500">住所: {editStop.address}</div>
                    )}
                    <input
                      type="text"
                      value={editStop.notes}
                      onChange={(e) => setEditStop({ ...editStop, notes: e.target.value })}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="メモ"
                    />
                    <div className="flex gap-1">
                      <button onClick={() => saveEdit(index)} className="p-1 text-green-600 hover:text-green-800">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={cancelEdit} className="p-1 text-gray-500 hover:text-gray-700">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4 className="font-semibold text-gray-800 text-sm">{stop.name}</h4>
                    {stop.address && (
                      <p className="text-xs text-gray-500 mt-0.5">{stop.address}</p>
                    )}
                    {stop.latitude && stop.longitude && (
                      <p className="text-xs text-green-600 mt-0.5">📍 位置情報あり</p>
                    )}
                    {stop.notes && (
                      <p className="text-xs text-gray-600 mt-1 italic">💡 {stop.notes}</p>
                    )}
                  </>
                )}
              </div>

              {/* アクションボタン */}
              {!disabled && editingIndex !== index && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => startEdit(index)}
                    className="p-1.5 text-gray-400 hover:text-blue-600 transition"
                    title="編集"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onRemoveStop(index)}
                    className="p-1.5 text-gray-400 hover:text-red-600 transition"
                    title="削除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
