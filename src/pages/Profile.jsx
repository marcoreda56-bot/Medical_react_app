import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api, { specialtyAPI, profileAPI, userAPI } from '../services/api';
import { ArrowLeft, Save, User, Mail, Calendar, MapPin, Stethoscope, DollarSign, Activity } from 'lucide-react';

export const Profile = () => {
    const navigate = useNavigate();
    const { currentUser, userRole } = useAuth();
    
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const [adminData, setAdminData] = useState({ username: '', first_name: '', last_name: '', email: '' });
    const [doctorData, setDoctorData] = useState({ specialty: '', bio: '', consultation_fee: '', clinic_address: '' });
    const [patientData, setPatientData] = useState({ date_of_birth: '', gender: '', blood_type: '', address: '' });

    useEffect(() => {
        specialtyAPI.getSpecialties().then(res => setSpecialties(res.data)).catch(console.error);

        if (userRole === 'doctor') {
            profileAPI.getDoctorProfile().then(res => {
                if (res.data) setDoctorData(res.data);
            }).catch(console.error);
        } else if (userRole === 'patient') {
            api.get('/users/me/').then(res => {
                api.get('/patient-profiles/me/').then(pRes => setPatientData(pRes.data)).catch(() => {
                    if (res.data.profile) setPatientData(res.data.profile);
                });
            }).catch(console.error);
        } else if (userRole === 'admin') {
            userAPI.getCurrent().then(res => {
                if (res.data) setAdminData(res.data);
            }).catch(console.error);
        }
    }, [userRole]);

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (userRole === 'doctor') {
                await profileAPI.saveDoctorProfile({ ...doctorData, specialty: parseInt(doctorData.specialty), consultation_fee: parseFloat(doctorData.consultation_fee) });
            } else if (userRole === 'patient') {
                await api.patch('/patient-profiles/me/', patientData);
            } else if (userRole === 'admin') {
                await userAPI.update(currentUser.id, adminData);
            }
            setMessage({ type: 'success', text: 'Profile updated successfully!' });
        } catch (err) {
            setMessage({ type: 'error', text: 'Failed to update profile.' });
        } finally { setLoading(false); }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium">
                        <ArrowLeft size={18} /> Back
                    </button>
                    <h2 className="text-lg font-bold text-gray-800">
                        {userRole === 'admin' ? 'Admin Settings' : 'Edit Profile'}
                    </h2>
                </div>

                <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
                    {message.text && (
                        <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Admin Fields */}
                    {userRole === 'admin' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative"><User className="absolute left-3 top-3 text-gray-400" size={18}/><input name="username" value={adminData.username} onChange={(e) => setAdminData({...adminData, username: e.target.value})} className="w-full pl-10 p-3 border rounded-xl" placeholder="Username" /></div>
                            <div className="relative"><Mail className="absolute left-3 top-3 text-gray-400" size={18}/><input value={adminData.email} disabled className="w-full pl-10 p-3 border rounded-xl bg-gray-50" placeholder="Email" /></div>
                            <input name="first_name" value={adminData.first_name} onChange={(e) => setAdminData({...adminData, first_name: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="First Name" />
                            <input name="last_name" value={adminData.last_name} onChange={(e) => setAdminData({...adminData, last_name: e.target.value})} className="w-full p-3 border rounded-xl" placeholder="Last Name" />
                        </div>
                    )}

                    {/* Doctor Fields */}
                    {userRole === 'doctor' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border"><Stethoscope size={20} className="text-[#00796b]"/><select value={doctorData.specialty} onChange={(e) => setDoctorData({...doctorData, specialty: e.target.value})} className="w-full bg-transparent outline-none">
                                {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select></div>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border"><DollarSign size={20} className="text-[#00796b]"/><input type="number" value={doctorData.consultation_fee} onChange={(e) => setDoctorData({...doctorData, consultation_fee: e.target.value})} className="w-full bg-transparent outline-none" placeholder="Fee" /></div>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border"><MapPin size={20} className="text-[#00796b]"/><input value={doctorData.clinic_address} onChange={(e) => setDoctorData({...doctorData, clinic_address: e.target.value})} className="w-full bg-transparent outline-none" placeholder="Clinic Address" /></div>
                            <textarea value={doctorData.bio} onChange={(e) => setDoctorData({...doctorData, bio: e.target.value})} className="w-full p-3 border rounded-xl h-24" placeholder="Professional Bio..."></textarea>
                        </div>
                    )}

                    {/* Patient Fields */}
                    {userRole === 'patient' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border"><Calendar size={18} className="text-[#00796b]"/><input type="date" value={patientData.date_of_birth} onChange={(e) => setPatientData({...patientData, date_of_birth: e.target.value})} className="w-full bg-transparent outline-none" /></div>
                            <select value={patientData.gender} onChange={(e) => setPatientData({...patientData, gender: e.target.value})} className="w-full p-3 border rounded-xl"><option value="Male">Male</option><option value="Female">Female</option></select>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border"><Activity size={18} className="text-[#00796b]"/><input value={patientData.blood_type} onChange={(e) => setPatientData({...patientData, blood_type: e.target.value})} className="w-full bg-transparent outline-none" placeholder="Blood Type" /></div>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border"><MapPin size={18} className="text-[#00796b]"/><input value={patientData.address} onChange={(e) => setPatientData({...patientData, address: e.target.value})} className="w-full bg-transparent outline-none" placeholder="Address" /></div>
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold transition-all shadow-md">
                        <Save size={18} /> {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </form>
            </div>
        </div>
    );
};