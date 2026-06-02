import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';

const buildItems = (counts) =>
  Object.entries(counts).map(([key, value]) => ({
    name: `${key.replace(/([A-Z])/g, ' $1').replace(/\b\w/g, (c) => c.toUpperCase())}`,
    value,
  }));

const COLORS = ['#1976d2', '#388e3c', '#f57c00', '#d32f2f', '#7b1fa2', '#0288d1', '#9c27b0'];

export const AnalyticsPanel = ({ userStatusCounts, appointmentStatusCounts, specialtyCounts }) => {
  const userItems = buildItems(userStatusCounts);
  const appointmentItems = buildItems(appointmentStatusCounts);
  const specialtyItems = Object.entries(specialtyCounts || {}).map(([name, value]) => ({ name, value }));

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-bold text-slate-800">System Analytics Engine</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h4 className="text-sm font-bold text-slate-700 mb-4">Appointment Status Chart</h4>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={appointmentItems} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label>
                  {appointmentItems.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <h4 className="text-sm font-bold text-slate-700 mb-4">User Status Distribution</h4>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={userItems} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                <Tooltip />
                <Bar dataKey="value" fill="#1976d2" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Doctors Specialty List Layout Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm col-span-1 lg:col-span-2">
          <h4 className="text-sm font-bold text-slate-700 mb-4">Doctors by Specialty Summary</h4>
          <ul className="divide-y divide-slate-100 border border-slate-100 rounded-xl bg-slate-50/30 overflow-hidden">
            {specialtyItems.length === 0 ? (
              <li className="px-5 py-4 text-sm text-slate-400 text-center font-medium">No specialty data available.</li>
            ) : (
              specialtyItems.map((item) => (
                <li key={item.name} className="flex justify-between items-center px-5 py-3 hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-medium text-slate-700">{item.name}</span>
                  <span className="bg-teal-50 text-teal-700 font-bold px-3 py-1 rounded-full text-xs border border-teal-100">
                    {item.value} Doctors
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};