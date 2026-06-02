import {  Users, UserPlus, Stethoscope, Calendar, Settings, PieChart } from 'lucide-react';

export const AdminLayout = ({ children, activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 0, title: 'Users', icon: Users },
    { id: 1, title: 'Doctors', icon: Stethoscope },
    { id: 2, title: 'Specialties', icon: UserPlus },
    { id: 3, title: 'Appointments', icon: Calendar },
    { id: 4, title: 'Config', icon: Settings },
    { id: 5, title: 'Analytics', icon: PieChart },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:block">
        <div className="p-6 font-bold text-teal-700 text-xl">Admin Panel</div>
        <nav className="px-4 space-y-1">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                activeTab === item.id ? 'bg-teal-600 text-white' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <item.icon size={20} />
              {item.title}
            </button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">{children}</main>
    </div>
  );
};