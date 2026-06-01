import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api, { specialtyAPI, profileAPI } from '../services/api'; 

export const Profile = () => {
    const { currentUser, userRole } = useAuth();
    const { t } = useLanguage();
    
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [doctorData, setDoctorData] = useState({
        specialty: '',
        bio: '',
        consultation_fee: '',
        clinic_address: '',
    });

    const [patientData, setPatientData] = useState({
        date_of_birth: '',
        gender: '',
        blood_type: '',
        address: '',
    });

    useEffect(() => {
        specialtyAPI.getSpecialties()
            .then(res => setSpecialties(res.data))
            .catch(err => console.error('Failed to fetch specialties:', err));

        if (userRole === 'doctor') {
            profileAPI.getDoctorProfile()
                .then(res => {
                    if (res.data) {
                        setDoctorData({
                            specialty: res.data.specialty || '',
                            bio: res.data.bio || '',
                            consultation_fee: res.data.consultation_fee || '',
                            clinic_address: res.data.clinic_address || '',
                        });
                    }
                })
                .catch(err => console.error('Failed to fetch doctor profile:', err));
        } else if (userRole === 'patient') {
            api.get('/users/me/')
                .then(res => {
                    api.get('/patient-profiles/me/').then(pRes => {
                        setPatientData({
                            date_of_birth: pRes.data.date_of_birth || '',
                            gender: pRes.data.gender || '',
                            blood_type: pRes.data.blood_type || '',
                            address: pRes.data.address || '',
                        });
                    }).catch(() => {
                        if(res.data.profile) {
                            setPatientData(res.data.profile);
                        }
                    });
                })
                .catch(err => console.error('Failed to fetch patient data:', err));
        }
    }, [userRole]);

    const handleDoctorChange = (e) => {
        const { name, value } = e.target;
        setDoctorData({ ...doctorData, [name]: value });
    };

    const handlePatientChange = (e) => {
        const { name, value } = e.target;
        setPatientData({ ...patientData, [name]: value });
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            if (userRole === 'doctor') {
                const dataToSend = {
                    ...doctorData,
                    specialty: doctorData.specialty ? parseInt(doctorData.specialty) : null,
                    consultation_fee: doctorData.consultation_fee ? parseFloat(doctorData.consultation_fee) : 0.0,
                };
                await profileAPI.saveDoctorProfile(dataToSend);
            } else if (userRole === 'patient') {
                await api.patch('/patient-profiles/me/', patientData);
            }
            
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            console.error('Error saving profile:', err);
            const errorData = err.response?.data;
            let errorMsg = 'Failed to save profile. Please check your data.';
            if (errorData && typeof errorData === 'object') {
                errorMsg = Object.values(errorData).flat().join(' | ');
            }
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f6f8fb] py-10 px-4">
            <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden text-left">
                
                <div className="bg-gradient-to-r from-[#00796b] to-[#004d40] px-8 py-6 text-white">
                    <h1 className="text-2xl font-black tracking-wide">
                        {userRole === 'doctor' ? 'Doctor Profile Settings' : 'Patient Profile Settings'}
                    </h1>
                    <p className="text-sm text-teal-100/80 mt-1">
                        {userRole === 'doctor' ? 'Keep your clinic info and specialties up to date.' : 'Manage your personal health profile info.'}
                    </p>
                </div>

                <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
                    
                    {message.text && (
                        <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${
                            message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                        }`}>
                            <span>{message.text}</span>
                        </div>
                    )}

                    {userRole === 'doctor' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-black text-gray-700">Specialty</label>
                                    <select
                                        name="specialty"
                                        value={doctorData.specialty || ''}
                                        onChange={handleDoctorChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#00796b] focus:border-transparent transition-all cursor-pointer"
                                        required
                                    >
                                        <option value="" disabled>Select your specialty</option>
                                        {specialties.map((spec) => (
                                            <option key={spec.id} value={spec.id}>
                                                {spec.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-black text-gray-700">Consultation Fee ($)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        name="consultation_fee"
                                        value={doctorData.consultation_fee}
                                        onChange={handleDoctorChange}
                                        placeholder="e.g. 250"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#00796b] focus:border-transparent transition-all"
                                    />
                                </div>
                                <div className="flex flex-col gap-2 md:col-span-2">
                                    <label className="text-sm font-black text-gray-700">Clinic Address</label>
                                    <input
                                        type="text"
                                        name="clinic_address"
                                        value={doctorData.clinic_address}
                                        onChange={handleDoctorChange}
                                        placeholder="e.g. 12 El-Tahrir St, Cairo"
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#00796b] focus:border-transparent transition-all"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-black text-gray-700">Biography / Notes</label>
                                <textarea
                                    name="bio"
                                    value={doctorData.bio}
                                    onChange={handleDoctorChange}
                                    rows="4"
                                    placeholder="Write a brief description..."
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#00796b] focus:border-transparent transition-all resize-none"
                                ></textarea>
                            </div>
                        </div>
                    )}

                    {userRole === 'patient' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Date of Birth */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-black text-gray-700">Date of Birth</label>
                                <input
                                    type="date"
                                    name="date_of_birth"
                                    value={patientData.date_of_birth || ''}
                                    onChange={handlePatientChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#00796b] focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Gender */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-black text-gray-700">Gender</label>
                                <select
                                    name="gender"
                                    value={patientData.gender || ''}
                                    onChange={handlePatientChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#00796b] focus:border-transparent transition-all cursor-pointer"
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>

                            {/* Blood Type */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-black text-gray-700">Blood Type</label>
                                <input
                                    type="text"
                                    name="blood_type"
                                    value={patientData.blood_type || ''}
                                    onChange={handlePatientChange}
                                    placeholder="e.g. A+, O-"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#00796b] focus:border-transparent transition-all"
                                />
                            </div>

                            {/* Address */}
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-black text-gray-700">Address</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={patientData.address || ''}
                                    onChange={handlePatientChange}
                                    placeholder="Your address"
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-[#00796b] focus:border-transparent transition-all"
                                />
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-3 bg-[#00796b] hover:bg-[#004d40] text-white font-black rounded-xl shadow-md transition-all transform active:scale-98 disabled:opacity-50 disabled:scale-100 cursor-pointer text-center min-w-[140px]"
                        >
                            {loading ? 'Saving...' : 'Save Profile'}
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
};