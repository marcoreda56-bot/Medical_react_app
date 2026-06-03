import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const features = [
    {
        key: 'findDoctor',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 0 0 .75-.75 2.25 2.25 0 0 0-.1-.664m-5.8 0A2.251 2.251 0 0 1 13.5 2.25H15c1.03 0 1.9.732 2.076 1.704m-5.8 0a48.555 48.555 0 0 1 5.8 0M4.105 6.108c-.114-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M4.105 6.108V19.5a2.25 2.25 0 0 0 2.25 2.25h.75"
                />
            </svg>
        ),
    },
    {
        key: 'bookFast',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5m-9-6h.008v.008H12v-.008ZM12 15h.008v.008H12V15Zm0 2.25h.008v.008H12v-.008ZM9.75 15h.008v.008H9.75V15Zm0 2.25h.008v.008H9.75v-.008ZM7.5 15h.008v.008H7.5V15Zm0 2.25h.008v.008H7.5v-.008Zm6.75-4.5h.008v.008h-.008v-.008Zm0 2.25h.008v.008h-.008V15Zm0 2.25h.008v.008h-.008v-.008Zm2.25-4.5h.008v.008H16.5v-.008Zm0 2.25h.008v.008H16.5V15Z"
                />
            </svg>
        ),
    },
    {
        key: 'payments',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-6 h-6"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
                />
            </svg>
        ),
    },
];

const Landing = () => {
    const navigate = useNavigate();
    const { currentUser, userRole } = useAuth();
    const { t, language } = useLanguage();
    const isRtl = language === 'ar';

    const dashboardPath =
        userRole === 'doctor'
            ? '/doctor'
            : userRole === 'admin'
              ? '/admin'
              : '/patient';

    const stats = [
        { label: t('landing.stats.doctors'), value: '120+' },
        { label: t('landing.stats.specialties'), value: '35+' },
        { label: t('landing.stats.patientVisits'), value: '18k' },
    ];

    return (
        <div
            className={`bg-[#f6f8fb] min-h-screen font-sans ${
                isRtl ? 'text-right' : 'text-left'
            }`}
        >
            <div className="min-h-none md:min-h-[76vh] flex items-center py-12 md:py-16 bg-gradient-to-br from-[#006d77]/95 to-[#13547a]/90 bg-cover bg-center text-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
                        <div
                            className={`md:col-span-7 flex flex-col ${
                                isRtl
                                    ? 'items-end text-right'
                                    : 'items-start text-left'
                            }`}
                        >
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-bold mb-6">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    strokeWidth={2.5}
                                    stroke="currentColor"
                                    className="w-4 h-4"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
                                    />
                                </svg>
                                {t('landing.badge')}
                            </div>

                            <h1 className="text-4xl md:text-7xl font-black max-w-[720px] tracking-tight leading-none mb-4">
                                {t('landing.headline')}
                            </h1>

                            <p className="text-lg md:text-xl text-white/85 max-w-[700px] mb-8 font-normal leading-relaxed">
                                {t('landing.subtitle')}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                                <button
                                    onClick={() =>
                                        navigate(
                                            currentUser
                                                ? dashboardPath
                                                : '/register'
                                        )
                                    }
                                    className="px-6 py-3 bg-[#ef8354] hover:bg-[#d87245] text-white font-bold rounded-xl shadow-md transition-all transform active:scale-98 cursor-pointer text-center"
                                >
                                    {currentUser
                                        ? t('landing.makeAppointment')
                                        : t('landing.createAccount')}
                                </button>
                            </div>
                        </div>

                        <div className="md:col-span-5 w-full">
                            <div className="p-6 rounded-2xl bg-white/95 text-[#102a43] border border-white/20 shadow-xl shadow-black/5">
                                <span className="text-xs font-black uppercase tracking-wider text-[#006d77]">
                                    {t('landing.statsTitle')}
                                </span>
                                <div className="space-y-4 mt-4">
                                    {stats.map((item) => (
                                        <div
                                            key={item.label}
                                            className="flex justify-between items-center py-3 border-b border-[#e8eef5] last:border-0"
                                        >
                                            <span className="text-gray-500 font-medium">
                                                {item.label}
                                            </span>
                                            <span className="text-2xl font-black text-gray-900">
                                                {item.value}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((feature) => (
                        <div
                            key={feature.key}
                            className={`p-6 bg-white border border-gray-100 rounded-2xl shadow-xs flex flex-col ${
                                isRtl ? 'items-end' : 'items-start'
                            }`}
                        >
                            <div className="w-12 h-12 rounded-xl bg-[#006d77] text-white flex items-center justify-center mb-4">
                                {feature.icon}
                            </div>
                            <h3 className="text-lg font-black text-gray-900 mb-2">
                                {t(
                                    `landing.features.${feature.key}.title`
                                )}
                            </h3>
                            <p className="text-gray-500 text-sm font-medium leading-relaxed">
                                {t(`landing.features.${feature.key}.text`)}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            <footer className="border-t border-gray-200 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                    <div
                        className={`flex flex-col md:flex-row gap-4 md:items-center md:justify-between ${
                            isRtl ? 'md:flex-row-reverse' : ''
                        }`}
                    >
                        <div>
                            <h2 className="text-lg font-black text-[#006d77]">
                                CarePulse
                            </h2>
                            <p className="mt-1 text-sm font-medium text-gray-500 max-w-xl">
                                {t('landing.footer.text')}
                            </p>
                        </div>

                        <p className="text-sm font-semibold text-gray-500">
                            {t('landing.footer.copyright')}
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Landing;
