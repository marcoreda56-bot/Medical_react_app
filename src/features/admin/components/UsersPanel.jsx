import { useState, useMemo } from 'react';
import { CheckCircle, Ban } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

const labelCase = (value) => (value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Unknown');

export const UsersPanel = ({ usersList, onStatusChange }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const { t } = useLanguage();

  const visibleUsers = useMemo(
    () => usersList.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [usersList, page, rowsPerPage]
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-slate-800">{t('admin.panel.usersPanel.title')}</h3>
      </div>
      
      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-sm text-left text-slate-600 border-collapse">
          <thead className="text-xs font-semibold text-slate-700 bg-emerald-50/60 uppercase border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">{t('admin.panel.usersPanel.name')}</th>
              <th className="px-6 py-4">{t('admin.panel.usersPanel.email')}</th>
              <th className="px-6 py-4">{t('admin.panel.usersPanel.role')}</th>
              <th className="px-6 py-4">{t('admin.panel.usersPanel.status')}</th>
              <th className="px-6 py-4 text-right">{t('admin.panel.usersPanel.actions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {usersList.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-slate-400 font-medium">
                  {t('admin.noUsers')}
                </td>
              </tr>
            ) : (
              visibleUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{user.name || 'Unknown'}</td>
                  <td className="px-6 py-4 text-slate-500">{user.email}</td>
                  <td className="px-6 py-4 font-medium text-slate-700">{labelCase(user.role)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                      user.status === 'approved' ? 'bg-green-100 text-green-700' :
                      user.status === 'blocked' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {labelCase(user.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2 flex-wrap">
                      {user.status !== 'approved' && (
                        <button
                          onClick={() => onStatusChange(user.id, 'approved')}
                          className="inline-flex items-center gap-1 bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-green-700 transition-colors shadow-sm"
                        >
                          <CheckCircle size={14} />
                          <span>{t('admin.panel.usersPanel.approve')}</span>
                        </button>
                      )}
                      {user.status !== 'blocked' && (
                        <button
                          onClick={() => onStatusChange(user.id, 'blocked')}
                          className="inline-flex items-center gap-1 bg-white border border-rose-200 text-rose-600 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-rose-50 transition-colors"
                        >
                          <Ban size={14} />
                          <span>{t('admin.panel.usersPanel.block')}</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Custom Tailwind Pagination Controls */}
      {usersList.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between pt-2 text-xs font-medium text-slate-500">
          <div className="flex items-center gap-2">
            <span>{t('admin.panel.usersPanel.rowsPerPage')}:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
              className="border border-slate-200 bg-white rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-teal-500"
            >
              {[5, 10, 25].map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-4">
            <span>{`${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, usersList.length)} of ${usersList.length}`}</span>
            <div className="flex gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
              >
                {t('admin.panel.usersPanel.prev')}
              </button>
              <button
                disabled={(page + 1) * rowsPerPage >= usersList.length}
                onClick={() => setPage(page + 1)}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
              >
                {t('admin.panel.usersPanel.next')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};