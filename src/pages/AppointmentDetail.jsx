import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { appointmentAPI } from '../services/api';
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
import Swal from 'sweetalert2';

const AppointmentDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { userRole } = useAuth();
    const { sendNotification } = useNotifications();
    const [appointment, setAppointment] = useState(null);
    const [loading, setLoading] = useState(true);
    const [diagnosis, setDiagnosis] = useState('');
    const [prescription, setPrescription] = useState('');

    useEffect(() => {
        const load = async () => {
            try {
                const res = await appointmentAPI.getAppointmentDetail(id);
                const data = res.data;
                const mappedData = {
                    ...data,
                    patientName: data.patient_name,
                    doctorName: data.doctor_name,
                    day: data.slot_details?.day || '',
                    time: data.slot_details?.time || '',
                    patientId: data.patient,
                };
                setAppointment(mappedData);
            } catch (err) {
                console.error('Failed to load appointment details:', err);
                Swal.fire('Error', 'Could not load appointment details.', 'error');
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [id]);

    const handleApprove = async () => {
        try {
            await appointmentAPI.approveAppointment(id);
            if (appointment?.patientId)
                await sendNotification(
                    appointment.patientId,
                    'Appointment approved',
                    'Your appointment was approved.',
                    { appointmentId: id }
                );
            Swal.fire('Approved', '', 'success');
            navigate(userRole === 'doctor' ? '/doctor' : '/patient');
        } catch (err) {
            console.error(err);
            Swal.fire('Failed', '', 'error');
        }
    };

    const handleCancel = async () => {
        try {
            await appointmentAPI.cancelAppointment(id);
            if (appointment?.patientId)
                await sendNotification(
                    appointment.patientId,
                    'Appointment cancelled',
                    'Your appointment was cancelled.',
                    { appointmentId: id }
                );
            Swal.fire('Cancelled', '', 'success');
            navigate(userRole === 'doctor' ? '/doctor' : '/patient');
        } catch (err) {
            console.error(err);
            Swal.fire('Failed', '', 'error');
        }
    };

    const handleComplete = async () => {
        if (!diagnosis.trim() || !prescription.trim()) {
            Swal.fire('Please fill diagnosis and prescription', '', 'warning');
            return;
        }
        try {
            await appointmentAPI.completeAppointment(id, {
                diagnosis,
                prescription,
                doctor_notes: 'Completed'
            });
            if (appointment?.patientId)
                await sendNotification(
                    appointment.patientId,
                    'Visit completed',
                    'Your visit was completed and prescription is available.',
                    { appointmentId: id }
                );
            Swal.fire('Completed', '', 'success');
            navigate(userRole === 'doctor' ? '/doctor' : '/patient');
        } catch (err) {
            console.error(err);
            Swal.fire('Failed', '', 'error');
        }
    };

    if (loading)
        return (
            <Container sx={{ mt: 4 }}>
                <Typography>Loading...</Typography>
            </Container>
        );
    if (!appointment)
        return (
            <Container sx={{ mt: 4 }}>
                <Typography>No appointment found.</Typography>
            </Container>
        );

    return (
        <Container maxWidth="md" sx={{ mt: 4 }}>
            <Paper sx={{ p: 3 }} elevation={3}>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Appointment Details
                </Typography>
                <Typography>
                    <strong>Patient:</strong> {appointment.patientName}
                </Typography>
                <Typography>
                    <strong>Doctor:</strong> {appointment.doctorName}
                </Typography>
                <Typography>
                    <strong>Day / Time:</strong> {appointment.day}{' '}
                    {appointment.time}
                </Typography>
                <Typography>
                    <strong>Status:</strong> {appointment.status}
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
                                    Approve
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="error"
                                    onClick={handleCancel}
                                >
                                    Reject / Cancel
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
                                Cancel Appointment
                            </Button>
                        )}
                </Box>

                {userRole === 'doctor' && appointment.status === 'Approved' && (
                    <Box sx={{ mt: 3 }}>
                        <Typography variant="h6">Complete Visit</Typography>
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Diagnosis"
                            value={diagnosis}
                            onChange={(e) => setDiagnosis(e.target.value)}
                            sx={{ mt: 1, mb: 1 }}
                        />
                        <TextField
                            fullWidth
                            multiline
                            rows={3}
                            label="Prescription"
                            value={prescription}
                            onChange={(e) => setPrescription(e.target.value)}
                            sx={{ mt: 1, mb: 1 }}
                        />
                        <Button
                            variant="contained"
                            color="success"
                            onClick={handleComplete}
                        >
                            Save & Complete
                        </Button>
                    </Box>
                )}
            </Paper>
        </Container>
    );
};

export default AppointmentDetail;
