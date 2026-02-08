import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { BookOpen, Calendar, MessageSquare, FileText } from 'lucide-react';

export default function PortalPage() {
  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-4">コミュニティポータル</h1>
          <p className="text-xl text-gray-600">
            車中泊愛好家のための情報とコミュニティ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Link
            to="/portal/stories"
            className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition text-center"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">体験記</h3>
            <p className="text-gray-600">みんなの車中泊体験を共有</p>
          </Link>

          <Link
            to="/portal/events"
            className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition text-center"
          >
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">イベント</h3>
            <p className="text-gray-600">車中泊関連のイベント情報</p>
          </Link>

          <Link
            to="/portal/qa"
            className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition text-center"
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Q&A</h3>
            <p className="text-gray-600">質問と回答のコミュニティ</p>
          </Link>

          <Link
            to="/portal/news"
            className="bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition text-center"
          >
            <div className="w-16 h-16 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="h-8 w-8 text-cyan-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">お知らせ</h3>
            <p className="text-gray-600">最新のニュースとお知らせ</p>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
