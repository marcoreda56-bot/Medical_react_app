import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api, { specialtyAPI, profileAPI, userAPI } from '../services/api';
import { ArrowLeft, Save, User, Mail, Calendar, MapPin, Stethoscope, DollarSign, Activity, Camera } from 'lucide-react';

export const Profile = () => {
    const navigate = useNavigate();
    const { currentUser, userRole, userPicture, refreshUser } = useAuth();
    const { t } = useLanguage();
    const fileInputRef = useRef(null);
    
    const [specialties, setSpecialties] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    const [previewUrl, setPreviewUrl] = useState(null);

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

    const handlePictureUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setMessage({ type: 'error', text: t('profile.pictureTooLarge') || 'Image must be under 5MB.' });
            return;
        }

        setPreviewUrl(URL.createObjectURL(file));
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('profile_picture', file);
            await api.post('/users/upload-picture/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            await refreshUser();
            setMessage({ type: 'success', text: t('profile.pictureUploaded') || 'Profile picture updated!' });
        } catch (err) {
            setPreviewUrl(null);
            setMessage({ type: 'error', text: err.response?.data?.error || t('profile.pictureFailed') || 'Failed to upload image.' });
        } finally {
            setUploading(false);
        }
    };

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
            setMessage({ type: 'success', text: t('profile.profileUpdated') });
        } catch (err) {
            setMessage({ type: 'error', text: t('profile.profileFailed') });
        } finally { setLoading(false); }
    };

    const displayPicture = previewUrl || userPicture;
    const baseUrl = 'http://localhost:8000';
    const pictureUrl = displayPicture?.startsWith('/media/') ? `${baseUrl}${displayPicture}` : displayPicture;

    return (
        <div className="min-h-screen bg-gray-50 py-10 px-4">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Header with Back Button */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white">
                    <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors font-medium">
                        <ArrowLeft size={18} /> {t('profile.back')}
                    </button>
                    <h2 className="text-lg font-bold text-gray-800">
                        {userRole === 'admin' ? t('profile.adminSettings') : t('profile.editProfile')}
                    </h2>
                </div>

                <form onSubmit={handleSaveProfile} className="p-8 space-y-6">
                    {message.text && (
                        <div className={`p-4 rounded-xl text-sm font-bold ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {message.text}
                        </div>
                    )}

                    {/* Profile Picture */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="relative group">
                            <div
                                className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {pictureUrl ? (
                                    <img src={pictureUrl} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <User size={40} />
                                    </div>
                                )}
                            </div>
                            <div
                                className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Camera size={20} className="text-white" />
                            </div>
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            onChange={handlePictureUpload}
                            className="hidden"
                        />
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploading}
                            className="text-sm font-medium text-[#00796b] hover:text-[#004f57] transition-colors disabled:opacity-50"
                        >
                            {uploading ? (t('profile.uploading') || 'Uploading...') : (t('profile.changePicture') || 'Change Profile Picture')}
                        </button>
                    </div>

                    {/* Admin Fields */}
                    {userRole === 'admin' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="relative"><User className="absolute left-3 top-3 text-gray-400" size={18}/><input name="username" value={adminData.username} onChange={(e) => setAdminData({...adminData, username: e.target.value})} className="w-full pl-10 p-3 border rounded-xl" placeholder={t('profile.username')} /></div>
                            <div className="relative"><Mail className="absolute left-3 top-3 text-gray-400" size={18}/><input value={adminData.email} disabled className="w-full pl-10 p-3 border rounded-xl bg-gray-50" placeholder={t('profile.emailLabel')} /></div>
                            <input name="first_name" value={adminData.first_name} onChange={(e) => setAdminData({...adminData, first_name: e.target.value})} className="w-full p-3 border rounded-xl" placeholder={t('profile.firstName')} />
                            <input name="last_name" value={adminData.last_name} onChange={(e) => setAdminData({...adminData, last_name: e.target.value})} className="w-full p-3 border rounded-xl" placeholder={t('profile.lastName')} />
                        </div>
                    )}

                    {/* Doctor Fields */}
                    {userRole === 'doctor' && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border"><Stethoscope size={20} className="text-[#00796b]"/><select value={doctorData.specialty} onChange={(e) => setDoctorData({...doctorData, specialty: e.target.value})} className="w-full bg-transparent outline-none">
                                {specialties.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select></div>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border"><DollarSign size={20} className="text-[#00796b]"/><input type="number" value={doctorData.consultation_fee} onChange={(e) => setDoctorData({...doctorData, consultation_fee: e.target.value})} className="w-full bg-transparent outline-none" placeholder={t('profile.fee')} /></div>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border"><MapPin size={20} className="text-[#00796b]"/><input value={doctorData.clinic_address} onChange={(e) => setDoctorData({...doctorData, clinic_address: e.target.value})} className="w-full bg-transparent outline-none" placeholder={t('profile.clinicAddress')} /></div>
                            <textarea value={doctorData.bio} onChange={(e) => setDoctorData({...doctorData, bio: e.target.value})} className="w-full p-3 border rounded-xl h-24" placeholder={`${t('profile.bio')}...`}></textarea>
                        </div>
                    )}

                    {/* Patient Fields */}
                    {userRole === 'patient' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border"><Calendar size={18} className="text-[#00796b]"/><input type="date" value={patientData.date_of_birth} onChange={(e) => setPatientData({...patientData, date_of_birth: e.target.value})} className="w-full bg-transparent outline-none" /></div>
                            <select value={patientData.gender} onChange={(e) => setPatientData({...patientData, gender: e.target.value})} className="w-full p-3 border rounded-xl"><option value="Male">{t('profile.male')}</option><option value="Female">{t('profile.female')}</option></select>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border"><Activity size={18} className="text-[#00796b]"/><input value={patientData.blood_type} onChange={(e) => setPatientData({...patientData, blood_type: e.target.value})} className="w-full bg-transparent outline-none" placeholder={t('profile.bloodType')} /></div>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border"><MapPin size={18} className="text-[#00796b]"/><input value={patientData.address} onChange={(e) => setPatientData({...patientData, address: e.target.value})} className="w-full bg-transparent outline-none" placeholder={t('profile.address')} /></div>
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="w-full flex justify-center items-center gap-2 bg-gray-900 hover:bg-black text-white py-4 rounded-xl font-bold transition-all shadow-md">
                        <Save size={18} /> {loading ? t('profile.saving') : t('profile.saveChanges')}
                    </button>
                </form>
            </div>
        </div>
    );
};