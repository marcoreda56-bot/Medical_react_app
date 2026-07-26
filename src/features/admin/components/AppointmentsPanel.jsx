import { useState, useMemo } from 'react';
import { useLanguage } from '../../../context/LanguageContext';

// تنسيق ألوان الحالة بناءً على الـ Choices اللي في موديل Django
const statusColor = (status) => {
  if (!status) return 'bg-amber-100 text-amber-800';
  const normalized = status.toLowerCase();
  if (normalized === 'confirmed' || normalized === 'completed') return 'bg-green-100 text-green-800';
  if (normalized === 'cancelled' || normalized === 'rejected') return 'bg-rose-100 text-rose-800';
  return 'bg-amber-100 text-amber-800';
};

// دالة تنسيق التاريخ والوقت لتتعامل مع صيغة ISO القادمة من Django (created_at)
const formatDateValue = (value) => {
  if (!value) return '—';
  const parsedDate = new Date(value);
  if (!isNaN(parsedDate.getTime())) {
    return parsedDate.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
  return String(value);
};

export const AppointmentsPanel = ({ appointments, onRefresh, loading, error }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const { t } = useLanguage();

  const visibleAppointments = useMemo(
    () => appointments.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [appointments, page, rowsPerPage]
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
        <h3 className="text-lg font-bold text-slate-800">{t('admin.panel.appointmentsPanel.title')}</h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="inline-flex justify-center items-center bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl text-sm font-semibold transition-all shadow-sm disabled:opacity-60"
        >
          {loading ? t('admin.panel.appointmentsPanel.refreshing') : t('admin.panel.appointmentsPanel.refreshLogs')}
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-medium text-xs rounded-xl">
          {error}
        </div>
      )}

      <div className="overflow-x-auto border border-slate-100 rounded-xl">
        <table className="w-full text-sm text-left text-slate-600 border-collapse">
          <thead className="text-xs font-semibold text-slate-700 bg-cyan-50/60 uppercase border-b border-slate-100">
            <tr>
              <th className="px-6 py-4">{t('admin.panel.appointmentsPanel.patient')}</th>
              <th className="px-6 py-4">{t('admin.panel.appointmentsPanel.doctor')}</th>
              <th className="px-6 py-4">{t('admin.panel.appointmentsPanel.dateSlot')}</th>
              <th className="px-6 py-4">{t('admin.panel.appointmentsPanel.status')}</th>
              <th className="px-6 py-4">{t('admin.panel.appointmentsPanel.payment')}</th>
              <th className="px-6 py-4">{t('admin.panel.appointmentsPanel.notes')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {appointments.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400 font-medium">
                  {t('admin.panel.appointmentsPanel.noAppointments')}
                </td>
              </tr>
            ) : (
              visibleAppointments.map((appointment) => {
                // 1. قراءة الأسماء الصحيحة من الـ Serializer
                const patientName = appointment.patient_name || t('admin.panel.appointmentsPanel.unknown');
                const doctorName = appointment.doctor_name || t('admin.panel.appointmentsPanel.unknown');
                
                // 2. معالجة التاريخ: لو الـ slot_details موجودة بنعرض تاريخ الحجز، لو مش موجودة بنعرض تاريخ الإنشاء created_at
                const slot = appointment.slot_details;
                const displayDate = slot 
                  ? `${slot.date} ${slot.time ? `(${slot.time})` : ''}`
                  : formatDateValue(appointment.created_at);

                // 3. فحص حالة الدفع (بناءً على حقل payment_status و الـ paid_at)
                const isPaid = 
                  appointment.payment_status === 'Completed' || 
                  appointment.payment_status === 'Paid' || 
                  !!appointment.paid_at;

                // 4. ملاحظات الدكتور المحددة في السيريالايزر باسم doctor_notes
                const notes = appointment.doctor_notes || appointment.diagnosis || '—';

                return (
                  <tr key={appointment.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {patientName}
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {doctorName}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {displayDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${statusColor(appointment.status)}`}>
                        {appointment.status || t('admin.doctor.pending')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        isPaid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isPaid ? t('admin.panel.appointmentsPanel.paid') : (appointment.payment_status || t('admin.panel.appointmentsPanel.unpaid'))}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 max-w-xs truncate" title={notes}>
                      {notes}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination component */}
      {appointments.length > 0 && (
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
            <span>{`${page * rowsPerPage + 1}-${Math.min((page + 1) * rowsPerPage, appointments.length)} of ${appointments.length}`}</span>
            <div className="flex gap-1">
              <button
                disabled={page === 0}
                onClick={() => setPage(page - 1)}
                className="p-1.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-50 disabled:hover:bg-white"
              >
                {t('admin.panel.usersPanel.prev')}
              </button>
              <button
                disabled={(page + 1) * rowsPerPage >= appointments.length}
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