import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authAPI } from '../services/api'; 
import Swal from 'sweetalert2';

export const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const email = location.state?.email || '';

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 6) {
      Swal.fire({ icon: 'warning', title: 'Invalid Input', text: 'Please enter the 6-digit code.' });
      return;
    }

    setLoading(true);
    try {
      await authAPI.verifyOTP(email, otp);
      Swal.fire({ icon: 'success', title: 'Verified!', confirmButtonColor: '#0f766e' });
      navigate('/login');
    } catch (err) {
      Swal.fire({ icon: 'error', title: 'Verification Failed', text: 'The code is incorrect or has expired.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-100 p-6">
      
      <div className="w-full max-w-md bg-white p-12 rounded-[2.5rem] shadow-2xl border border-slate-100">
        
        <div className="flex flex-col items-center text-center mb-12">
          <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center text-teal-700 mb-8 shadow-inner">
             <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
             </svg>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-800 mb-3">Verify Account</h2>
          <p className="text-slate-500 text-sm">Enter the code sent to <span className="font-bold text-teal-700">{email || 'your email'}</span></p>
        </div>

        <form onSubmit={handleVerify}>
          
          {/* هنا الـ Input بياخد مساحة سفلية كبيرة ثابتة */}
          <div className="mb-12">
            <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest text-center mb-4">
              Verification Code
            </label>
            <input
              type="text"
              maxLength="6"
              placeholder="000000"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
              className="w-full h-16 text-center text-4xl font-black tracking-[0.5em] text-slate-800 bg-slate-50 border-2 border-slate-200 rounded-2xl focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full h-16 text-lg font-bold text-white bg-teal-700 rounded-2xl hover:bg-teal-800 active:scale-95 transition-all shadow-lg shadow-teal-500/30 cursor-pointer"
          >
            {loading ? 'Verifying...' : 'Activate Account'}
          </button>
        </form>

      </div>
    </div>
  );
};