import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useLanguage } from '../../../context/LanguageContext';

export const DoctorsPanel = ({ doctors = [], loading, onBookAppointment, onApprove }) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(6);
  const { t } = useLanguage();

  // حساب الدكاترة المتاحين للعرض في الصفحة الحالية
  const visibleDoctors = useMemo(() => {
    return doctors.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [doctors, page, rowsPerPage]);

  // حساب إجمالي عدد الصفحات
  const totalPages = Math.ceil(doctors.length / rowsPerPage);

  const getInitials = (name) => {
    if (!name) return 'DR';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // في حالة مفيش دكاترة خالص
  if (doctors.length === 0) {
    return (
      <div className="text-center p-12 text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
        {t('admin.panel.doctorsPanel.noDoctors')}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* شبكة عرض كروت الدكاترة */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleDoctors.map((doctor) => {
          const specialty = doctor.specialty_name || t('admin.panel.doctorsPanel.generalPractitioner');
          const fee = doctor.consultation_fee || '0.00';
          const address = doctor.clinic_address || t('admin.panel.doctorsPanel.noAddress');
          const bio = doctor.bio || 'No bio available';
          const isApproved = doctor.status === 'approved';

          return (
            <div key={doctor.id} className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold text-sm shrink-0">
                    {getInitials(doctor.full_name)}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-bold text-slate-900">{doctor.full_name}</h4>
                    
                    <div className="flex flex-wrap gap-2 items-center">
                      <span className="inline-flex px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-bold rounded">
                        {specialty}
                      </span>
                      
                      {isApproved ? (
                        <span className="inline-flex px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded border border-emerald-100">
                          {t('admin.panel.doctorsPanel.approved')}
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-0.5 bg-amber-50 text-amber-700 text-[11px] font-bold rounded border border-amber-100">
                          {t('admin.panel.doctorsPanel.pending')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-slate-500 text-xs mt-3 italic">"{bio}"</p>
                <hr className="my-4 border-slate-100" />

                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="text-slate-700 font-semibold">{doctor.email}</span>
                  </div>
                  <div className="flex justify-between bg-teal-50/50 p-2 rounded-lg">
                    <span className="text-teal-800 font-medium">Consultation Fee:</span>
                    <span className="font-bold text-slate-900">{fee} EGP</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 text-[11px] text-slate-400">
                <p>📍 {address}</p>
                
                {onBookAppointment && (
                  <button
                    onClick={() => onBookAppointment(doctor)}
                    className="w-full mt-3 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    {t('admin.panel.doctorsPanel.bookAppointment')}
                  </button>
                )}

                {onApprove && !isApproved && (
                  <button
                    onClick={() => onApprove(doctor.id)}
                    className="w-full mt-2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer shadow-sm shadow-emerald-100"
                  >
                    {t('admin.panel.doctorsPanel.approveActivate')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 🚀 إضافة شريط الباجينيشن (Pagination Control) هنا */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 px-2">
          <div className="text-sm text-slate-500">
            {t('admin.panel.doctorsPanel.showing')} <span className="font-medium">{page * rowsPerPage + 1}</span> {t('admin.panel.doctorsPanel.to')}{' '}
            <span className="font-medium">
              {Math.min((page + 1) * rowsPerPage, doctors.length)}
            </span>{' '}
            {t('admin.panel.doctorsPanel.of')} <span className="font-medium">{doctors.length}</span> {t('admin.panel.doctorsPanel.doctors')}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 0))}
              disabled={page === 0}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>
            
            {/* أرقام الصفحات */}
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setPage(idx)}
                  className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                    page === idx
                      ? 'bg-teal-600 text-white shadow-md shadow-teal-600/10'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {idx + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages - 1))}
              disabled={page === totalPages - 1}
              className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};