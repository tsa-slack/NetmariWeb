import Layout from '../components/Layout';
import { FileText } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12">
            <div className="flex items-center gap-3 mb-8">
              <FileText className="h-8 w-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">利用規約</h1>
            </div>

            <div className="space-y-8 text-gray-700">
              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">第1条（適用）</h2>
                <p className="leading-relaxed">
                  本規約は、当社が提供するキャンピングカーレンタルサービス（以下「本サービス」といいます）の利用に関する条件を定めるものです。ユーザーは、本規約に同意の上、本サービスを利用するものとします。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">第2条（利用登録）</h2>
                <p className="leading-relaxed mb-3">
                  本サービスの利用を希望する者は、本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。
                </p>
                <p className="leading-relaxed">
                  当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあります：
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
                  <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                  <li>本規約に違反したことがある者からの申請である場合</li>
                  <li>その他、当社が利用登録を相当でないと判断した場合</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">第3条（アカウント管理）</h2>
                <p className="leading-relaxed">
                  ユーザーは、自己の責任において、本サービスのアカウント情報を適切に管理するものとします。ユーザーは、いかなる場合にも、アカウントを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。アカウント情報の管理不十分、使用上の過誤、第三者の使用等によって生じた損害については、当社は一切の責任を負いません。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">第4条（利用料金および支払方法）</h2>
                <p className="leading-relaxed mb-3">
                  ユーザーは、本サービスの利用料金として、当社が別途定める料金を、当社が指定する方法により支払うものとします。
                </p>
                <p className="leading-relaxed">
                  ユーザーが利用料金の支払を遅滞した場合には、遅延損害金として年14.6％の割合による金額を支払うものとします。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">第5条（キャンセルポリシー）</h2>
                <p className="leading-relaxed">
                  予約のキャンセルには、以下のキャンセル料が発生します：
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
                  <li>利用日の30日前まで：無料</li>
                  <li>利用日の29日前～15日前：利用料金の30％</li>
                  <li>利用日の14日前～7日前：利用料金の50％</li>
                  <li>利用日の6日前～前日：利用料金の80％</li>
                  <li>利用日当日：利用料金の100％</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">第6条（禁止事項）</h2>
                <p className="leading-relaxed">
                  ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません：
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
                  <li>法令または公序良俗に違反する行為</li>
                  <li>犯罪行為に関連する行為</li>
                  <li>当社、本サービスの他の利用者、または第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為</li>
                  <li>他のユーザーまたは第三者に対する誹謗中傷、名誉毀損、侮辱、差別、ハラスメント行為</li>
                  <li>コミュニティ機能（体験記、Q&A、イベント等）において、他のユーザーを不快にさせる発言や攻撃的な言動</li>
                  <li>他のユーザーの投稿や意見に対する不当な批判、揚げ足取り、執拗な反論</li>
                  <li>虚偽の情報、誤解を招く情報、他のユーザーを欺く行為</li>
                  <li>スパム行為、商業目的の広告宣伝、勧誘行為</li>
                  <li>本サービスのネットワークまたはシステム等に過度な負荷をかける行為</li>
                  <li>本サービスの運営を妨害するおそれのある行為</li>
                  <li>不正アクセスをし、またはこれを試みる行為</li>
                  <li>レンタルしたキャンピングカーを第三者に転貸する行為</li>
                  <li>レンタルしたキャンピングカーを故意に破損させる行為</li>
                  <li>その他、コミュニティの健全な運営を妨げる行為</li>
                  <li>その他、当社が不適切と判断する行為</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">第7条（コミュニティガイドライン）</h2>
                <p className="leading-relaxed mb-3">
                  本サービスは、キャンピングカー愛好者が互いに情報交換し、体験を共有するコミュニティを提供しています。すべてのユーザーが安心して利用できる環境を維持するため、以下のガイドラインを遵守してください：
                </p>
                <div className="ml-4 space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">1. 相互尊重</h3>
                    <p className="leading-relaxed text-sm">
                      他のユーザーの意見や体験を尊重し、思いやりを持ったコミュニケーションを心がけてください。意見の相違があっても、建設的で礼儀正しい対話を行ってください。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">2. 批判的な発言について</h3>
                    <p className="leading-relaxed text-sm">
                      建設的な批判は歓迎しますが、個人攻撃や感情的な誹謗中傷は禁止します。改善提案をする際は、具体的かつ前向きな表現を使用してください。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">3. 正確な情報共有</h3>
                    <p className="leading-relaxed text-sm">
                      体験記やレビューを投稿する際は、事実に基づいた正確な情報を提供してください。意図的な虚偽情報や誇張表現は避けてください。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">4. プライバシーの保護</h3>
                    <p className="leading-relaxed text-sm">
                      他のユーザーの個人情報や、許可なく撮影した写真を公開しないでください。また、プライベートな会話内容を無断で共有しないでください。
                    </p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">5. 違反行為の報告</h3>
                    <p className="leading-relaxed text-sm">
                      本ガイドラインに違反する行為を発見した場合は、直接対応せず、運営チームに報告してください。運営チームが適切に対処いたします。
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">第8条（本サービスの提供の停止等）</h2>
                <p className="leading-relaxed">
                  当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします：
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
                  <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                  <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                  <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                  <li>その他、当社が本サービスの提供が困難と判断した場合</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">第9条（利用制限および登録抹消）</h2>
                <p className="leading-relaxed">
                  当社は、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、ユーザーに対して、本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします：
                </p>
                <ul className="list-disc list-inside mt-3 space-y-2 ml-4">
                  <li>本規約のいずれかの条項に違反した場合</li>
                  <li>登録事項に虚偽の事実があることが判明した場合</li>
                  <li>料金等の支払債務の不履行があった場合</li>
                  <li>当社からの連絡に対し、一定期間返答がない場合</li>
                  <li>その他、当社が本サービスの利用を適当でないと判断した場合</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">第10条（保証の否認および免責事項）</h2>
                <p className="leading-relaxed mb-3">
                  当社は、本サービスに事実上または法律上の瑕疵（安全性、信頼性、正確性、完全性、有効性、特定の目的への適合性、セキュリティなどに関する欠陥、エラーやバグ、権利侵害などを含みます）がないことを明示的にも黙示的にも保証しておりません。
                </p>
                <p className="leading-relaxed">
                  当社は、本サービスに起因してユーザーに生じたあらゆる損害について、当社の故意又は重過失による場合を除き、一切の責任を負いません。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">第11条（サービス内容の変更等）</h2>
                <p className="leading-relaxed">
                  当社は、ユーザーへの事前の告知をもって、本サービスの内容を変更、追加または廃止することがあり、ユーザーはこれを承諾するものとします。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">第12条（利用規約の変更）</h2>
                <p className="leading-relaxed">
                  当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。変更後の本規約は、本サービス上に表示した時点より効力を生じるものとします。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">第13条（個人情報の取扱い）</h2>
                <p className="leading-relaxed">
                  当社は、本サービスの利用によって取得する個人情報については、当社「プライバシーポリシー」に従い適切に取り扱うものとします。
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">第14条（準拠法・裁判管轄）</h2>
                <p className="leading-relaxed mb-3">
                  本規約の解釈にあたっては、日本法を準拠法とします。
                </p>
                <p className="leading-relaxed">
                  本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
                </p>
              </section>

              <div className="mt-12 pt-8 border-t border-gray-200">
                <p className="text-sm text-gray-600">制定日: 2026年2月4日</p>
                <p className="text-sm text-gray-600">最終更新日: 2026年2月4日</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
