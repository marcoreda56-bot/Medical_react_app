import { useState } from 'react';
import axiosInstance from '../api/axios';
import Swal from 'sweetalert2';

/**
 * ReviewModal
 *
 * Assumed API contract (match on Django side):
 *
 *   POST   /reviews/
 *          Body: { appointment: <int>, rating: <1-5>, comment: <str> }
 *          Response: { id, appointment, rating, comment, created_at }
 *          Rules: appointment must belong to requesting user and have status=Completed.
 *                 One review per appointment (unique constraint).
 *
 *   GET    /reviews/?doctor=<int>
 *          Response: [{ id, patient_name, rating, comment, created_at }, ...]
 *          Returns all reviews for a given doctor (public).
 *
 *   GET    /reviews/my/
 *          Response: [{ id, appointment, rating, comment }, ...]
 *          Returns the current patient's submitted reviews.
 *
 * Props:
 *   isOpen          boolean
 *   onClose         () => void
 *   appointment     { id, doctor_name, slot_details }
 *   onReviewPosted  (review) => void   — called after successful submit
 */
export const ReviewModal = ({
    isOpen,
    onClose,
    appointment,
    onReviewPosted,
}) => {
    const [rating, setRating] = useState(0);
    const [hovered, setHovered] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !appointment) return null;

    const reset = () => {
        setRating(0);
        setHovered(0);
        setComment('');
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            Swal.fire({
                icon: 'warning',
                title: 'Please select a rating',
                text: 'Choose between 1 and 5 stars before submitting.',
                confirmButtonColor: '#0f172a',
            });
            return;
        }

        setLoading(true);
        try {
            const res = await axiosInstance.post('/reviews/', {
                appointment: appointment.id,
                rating,
                comment: comment.trim(),
            });
            Swal.fire({
                icon: 'success',
                title: 'Review submitted!',
                text: 'Thank you for your feedback.',
                timer: 1800,
                showConfirmButton: false,
            });
            onReviewPosted?.(res.data);
            handleClose();
        } catch (err) {
            const msg =
                err.response?.data?.non_field_errors?.[0] ||
                err.response?.data?.detail ||
                err.response?.data?.error ||
                'Failed to submit review. Please try again.';
            Swal.fire({
                icon: 'error',
                title: 'Submission failed',
                text: msg,
                confirmButtonColor: '#0f172a',
            });
        } finally {
            setLoading(false);
        }
    };

    const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];
    const active = hovered || rating;

    const fmtDate = (ds) => {
        if (!ds) return '';
        const d = new Date(ds + 'T00:00:00');
        return d.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <div className="fixed inset-0 bg-slate-900/25 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-100 overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-[#0f172a] to-[#1e293b] px-6 py-5">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">
                        Rate your visit
                    </p>
                    <h3 className="text-lg font-bold text-white">
                        Dr. {appointment.doctor_name}
                    </h3>
                    {appointment.slot_details?.date && (
                        <p className="text-xs text-slate-400 font-medium mt-0.5">
                            {fmtDate(appointment.slot_details.date)}
                            {appointment.slot_details?.time
                                ? ` · ${appointment.slot_details.time.split(' - ')[0]}`
                                : ''}
                        </p>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Star Rating */}
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
                            Your Rating
                        </label>
                        <div
                            className="flex gap-1.5"
                            onMouseLeave={() => setHovered(0)}
                        >
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    onMouseEnter={() => setHovered(star)}
                                    className="transition-all duration-100 cursor-pointer focus:outline-none"
                                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                                >
                                    <svg
                                        className={`w-9 h-9 transition-all duration-100 ${
                                            star <= active
                                                ? 'text-amber-400 scale-110 drop-shadow-sm'
                                                : 'text-slate-200 hover:text-slate-300'
                                        }`}
                                        fill="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                    </svg>
                                </button>
                            ))}
                        </div>

                        {/* Rating label */}
                        <div
                            className={`h-6 transition-all duration-150 ${active ? 'opacity-100' : 'opacity-0'}`}
                        >
                            <span
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                                    active >= 4
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                        : active === 3
                                          ? 'bg-sky-50 text-sky-700 border-sky-100'
                                          : 'bg-amber-50 text-amber-700 border-amber-100'
                                }`}
                            >
                                <span>
                                    {
                                        [
                                            '',
                                            '⭐',
                                            '⭐⭐',
                                            '⭐⭐⭐',
                                            '⭐⭐⭐⭐',
                                            '⭐⭐⭐⭐⭐',
                                        ][active]
                                    }
                                </span>
                                {LABELS[active]}
                            </span>
                        </div>
                    </div>

                    {/* Comment */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest block">
                            Comment{' '}
                            <span className="text-slate-300 font-normal normal-case tracking-normal">
                                (optional)
                            </span>
                        </label>
                        <textarea
                            rows={4}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience with this doctor..."
                            maxLength={500}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium placeholder:text-slate-300 placeholder:font-normal focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all resize-none leading-relaxed"
                        />
                        <p className="text-[11px] text-slate-400 text-right font-medium">
                            {comment.length}/500
                        </p>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-2 pt-1">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-5 py-2.5 bg-slate-50 text-slate-600 font-semibold rounded-xl text-xs hover:bg-slate-100 cursor-pointer transition-all border border-slate-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || rating === 0}
                            className="px-5 py-2.5 bg-[#0f172a] text-white font-bold rounded-xl text-xs hover:bg-slate-800 cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm min-w-[100px]"
                        >
                            {loading ? 'Submitting…' : 'Submit Review'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
