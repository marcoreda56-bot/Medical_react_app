export const OverviewCards = ({ stats }) => {
  const items = [
    { title: 'Users', value: stats.totalUsers, borderColor: 'border-l-[#388e3c]', textColor: 'text-[#388e3c]' },
    { title: 'Doctors', value: stats.totalDoctors, borderColor: 'border-l-[#1976d2]', textColor: 'text-[#1976d2]' },
    { title: 'Pending Approvals', value: stats.pendingDoctors, borderColor: 'border-l-[#f57c00]', textColor: 'text-[#f57c00]' },
    { title: 'Appointments', value: stats.totalAppointments, borderColor: 'border-l-[#7b1fa2]', textColor: 'text-[#7b1fa2]' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {items.map((item) => (
        <div
          key={item.title}
          className={`bg-white p-5 rounded-2xl border-y border-r border-slate-200 border-l-[6px] ${item.borderColor} shadow-sm flex items-center min-h-[120px] transition-transform duration-200 hover:-translate-y-0.5`}
        >
          <div className="w-full">
            <p className={`text-xs font-bold uppercase tracking-wider ${item.textColor}`}>{item.title}</p>
            <h3 className="text-3xl font-extrabold text-slate-800 mt-2">{item.value ?? 0}</h3>
          </div>
        </div>
      ))}
    </div>
  );
};