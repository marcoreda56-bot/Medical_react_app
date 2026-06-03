import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import {
    Container,
    Paper,
    Typography,
    Box,
    Button,
    TextField,
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationsContext';
import { useLanguage } from '../context/LanguageContext';
import Swal from 'sweetalert2';

const AppointmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userRole } = useAuth();
    const { sendNotification } = useNotifications();
    const { t } = useLanguage();
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [diagnosis, setDiagnosis] = useState('');
    const [prescription, setPrescription] = useState('');

    const translateStatus = (status) =>
        t(`statuses.${String(status || '').toLowerCase()}`, status);

    const translateDay = (day) => t(`days.${day}`, day);

    useEffect(() => {
        const load = async () => {
            const ref = doc(db, 'appointments', id);
            const snap = await getDoc(ref);
            if (snap.exists()) setAppointment({ id: snap.id, ...snap.data() });
            setLoading(false);
        };
        load();
    }, [id]);

    const handleApprove = async () => {
        try {
            const ref = doc(db, 'appointments', id);
            await updateDoc(ref, { status: 'Approved' });
            if (appointment?.patientId)
                await sendNotification(
                    appointment.patientId,
                    t('appointmentDetail.notificationApprovedTitle'),
                    t('appointmentDetail.notificationApprovedBody'),
                    { appointmentId: id }
                );
            Swal.fire(t('appointmentDetail.approved'), '', 'success');
            navigate(userRole === 'doctor' ? '/doctor' : '/patient');
        } catch (err) {
            console.error(err);
            Swal.fire(t('appointmentDetail.failed'), '', 'error');
        }
    };

    const handleCancel = async () => {
        try {
            const ref = doc(db, 'appointments', id);
            await updateDoc(ref, { status: 'Cancelled' });
            if (appointment?.patientId)
                await sendNotification(
                    appointment.patientId,
                    t('appointmentDetail.notificationCancelledTitle'),
                    t('appointmentDetail.notificationCancelledBody'),
                    { appointmentId: id }
                );
            Swal.fire(t('appointmentDetail.cancelled'), '', 'success');
            navigate(userRole === 'doctor' ? '/doctor' : '/patient');
        } catch (err) {
            console.error(err);
            Swal.fire(t('appointmentDetail.failed'), '', 'error');
        }
    };

    const handleComplete = async () => {
        if (!diagnosis.trim() || !prescription.trim()) {
            Swal.fire(
                t('appointmentDetail.fillDiagnosisPrescription'),
                '',
                'warning'
            );
            return;
        }
        try {
            const ref = doc(db, 'appointments', id);
            await updateDoc(ref, {
                status: 'Completed',
                medicalRecord: {
                    diagnosis,
                    prescription,
                    date: new Date().toLocaleDateString(),
                },
            });
            if (appointment?.patientId)
                await sendNotification(
                    appointment.patientId,
                    t('appointmentDetail.notificationCompletedTitle'),
                    t('appointmentDetail.notificationCompletedBody'),
                    { appointmentId: id }
                );
            Swal.fire(t('appointmentDetail.completed'), '', 'success');
            navigate(userRole === 'doctor' ? '/doctor' : '/patient');
        } catch (err) {
            console.error(err);
            Swal.fire(t('appointmentDetail.failed'), '', 'error');
        }
    };

    if (loading)
        return (
            <Container sx={{ mt: 4 }}>
                <Typography>{t('appointmentDetail.loading')}</Typography>
            </Container>
        );
    if (!appointment)
        return (
            <Container sx={{ mt: 4 }}>
                <Typography>{t('appointmentDetail.notFound')}</Typography>
            </Container>
        );

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper sx={{ p: 3 }} elevation={3}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                    {t('appointmentDetail.title')}
                </Typography>
                <Typography>
                    <strong>{t('appointmentDetail.patient')}:</strong>{' '}
                    {appointment.patientName}
                </Typography>
                <Typography>
                    <strong>{t('appointmentDetail.doctor')}:</strong>{' '}
                    {appointment.doctorName}
                </Typography>
                <Typography>
                    <strong>{t('appointmentDetail.dayTime')}:</strong>{' '}
                    {translateDay(appointment.day)}{' '}
                    {appointment.time}
                </Typography>
                <Typography>
                    <strong>{t('appointmentDetail.status')}:</strong>{' '}
                    {translateStatus(appointment.status)}
                </Typography>

                <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                    {userRole === 'doctor' &&
                        appointment.status === 'Pending' && (
                            <>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleApprove}
                                >
                                    {t('appointmentDetail.approve')}
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleCancel}
                                >
                                    {t('appointmentDetail.rejectCancel')}
                                </Button>
                            </>
                        )}

                    {userRole === 'patient' &&
                        appointment.status === 'Pending' && (
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleCancel}
                            >
                                {t('appointmentDetail.cancelAppointment')}
                            </Button>
                        )}
                </Box>

                {userRole === 'doctor' && appointment.status === 'Approved' && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h6">
                            {t('appointmentDetail.completeVisit')}
                        </Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label={t('appointmentDetail.diagnosis')}
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            sx={{ mt: 1, mb: 1 }}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label={t('appointmentDetail.prescription')}
                            value={prescription}
                            onChange={(e) => setPrescription(e.target.value)}
                            sx={{ mt: 1, mb: 1 }}
                        />
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleComplete}
                        >
                            {t('appointmentDetail.saveComplete')}
                        </Button>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default AppointmentDetail;
