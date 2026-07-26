import { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

/**
 * DoctorReviews
 *
 * Fetches GET /reviews/?doctor=<doctorId>
 * Expected response shape:
 *   [{ id, patient_name, rating, comment, created_at }, ...]
 *
 * Props:
 *   doctorId  number | string
 */
export const DoctorReviews = ({ doctorId }) => {
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const { t } = useLanguage();

    useEffect(() => {
        if (!doctorId) return;
        setLoading(true);
        axiosInstance
            .get(`/reviews/?doctor=${doctorId}`)
            .then((res) => setReviews(res.data || []))
            .catch(() => setReviews([]))
            .finally(() => setLoading(false));
    }, [doctorId]);

    if (loading) {
        return (
            <div className="flex items-center gap-2 py-4 text-slate-400 text-xs font-medium">
                <span className="w-3 h-3 rounded-full border-2 border-slate-300 border-t-slate-500 animate-spin" />
                {t('doctorReviews.loading')}
            </div>
        );
    }

    const avg =
        reviews.length > 0
            ? (
                  reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
              ).toFixed(1)
            : null;

    const StarRow = ({ value, max = 5 }) => (
        <div className="flex gap-0.5">
            {Array.from({ length: max }).map((_, i) => (
                <svg
                    key={i}
                    className={`w-3.5 h-3.5 ${i < Math.round(value) ? 'text-amber-400' : 'text-slate-200'}`}
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
            ))}
        </div>
    );

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    {t('doctorReviews.title')}
                </span>
                {avg !== null && (
                    <div className="flex items-center gap-1.5">
                        <span className="text-sm font-bold text-[#0f172a]">
                            {avg}
                        </span>
                        <StarRow value={parseFloat(avg)} />
                        <span className="text-[11px] text-slate-400 font-medium">
                            ({reviews.length})
                        </span>
                    </div>
                )}
            </div>

            {reviews.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">
                    {t('doctorReviews.noReviews')}
                </p>
            ) : (
                <div
                    className="space-y-2.5 max-h-52 overflow-y-auto pr-1"
                    style={{ scrollbarWidth: 'thin' }}
                >
                    {reviews.map((r) => (
                        <div
                            key={r.id}
                            className="bg-[#fafafa] border border-slate-100 rounded-xl p-3 space-y-1.5"
                        >
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-[#0f172a]">
                                    {r.patient_name || t('doctorReviews.anonymous')}
                                </span>
                                <StarRow value={r.rating} />
                            </div>
                            {r.comment && (
                                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                    {r.comment}
                                </p>
                            )}
                            {r.created_at && (
                                <p className="text-[10px] text-slate-400 font-medium">
                                    {new Date(r.created_at).toLocaleDateString(
                                        'en-US',
                                        {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        }
                                    )}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
