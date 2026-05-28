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
      Swal.fire({ icon: 'warning', title: 'Validation Error', text: 'Please enter a valid 6-digit OTP code.' });
      return;
    }

    setLoading(true);
    try {
      await authAPI.verifyOTP(email, otp);

      Swal.fire({
        icon: 'success',
        title: 'Account Verified!',
        text: 'Your account has been activated successfully. You can now log in.',
        confirmButtonColor: '#00796b',
      });

      navigate('/login');
    } catch (err) {
      console.error(err);
      Swal.fire({
        icon: 'error',
        title: 'Verification Failed',
        text: err.response?.data?.error || 'Invalid or expired OTP code. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans text-left">
      <div className="sm:mx-auto w-full max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl shadow-gray-200/50 rounded-3xl border border-gray-100 sm:px-10">
          
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-600 mx-auto mb-3 shadow-xs">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
              </svg>
            </div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Verify Your Account</h2>
            <p className="mt-1.5 text-xs font-medium text-gray-500">
              We have sent a 6-digit code to <span className="text-teal-600 font-bold block mt-0.5">{email || 'your email'}</span>
            </p>
          </div>

          <form onSubmit={handleVerify} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block pl-1">Enter OTP Code</label>
              <input
                type="text"
                maxLength="6"
                placeholder="000000"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-600 focus:bg-white text-center text-xl font-black tracking-widest text-gray-800 transition-all placeholder:text-gray-300"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify & Activate'}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};