import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import {
    collection,
    addDoc,
    query,
    where,
    getDocs,
    updateDoc,
    doc,
    getDoc,
    deleteDoc,
} from 'firebase/firestore';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    TextField,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Modal,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Tabs,
    Tab,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssignmentIcon from '@mui/icons-material/Assignment';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import Swal from 'sweetalert2';
import { useNotifications } from '../context/NotificationsContext';

const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 450,
    bgcolor: 'background.paper',
    borderRadius: 3,
    boxShadow: 24,
    p: 4,
};

const formatTimeTo12Hour = (timeString) => {
    if (!timeString) return '';
    let [hours, minutes] = timeString.split(':');
    hours = parseInt(hours);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedHours = hours < 10 ? `0${hours}` : hours;
    return `${formattedHours}:${minutes} ${ampm}`;
};

export const DoctorDashBoard = () => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState(0);

    const [selectedDate, setSelectedDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [workHours, setWorkHours] = useState('');
    const [duration, setDuration] = useState(30);
    const [slots, setSlots] = useState([]);

    const [appointments, setAppointments] = useState([]);
    const [openModal, setOpenModal] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState(null);
    const [diagnosis, setDiagnosis] = useState('');
    const [prescription, setPrescription] = useState('');

    const [searchTerm, setSearchTerm] = useState('');

    const [historyModalOpen, setHistoryModalOpen] = useState(false);
    const [selectedHistoryRecord, setSelectedHistoryRecord] = useState(null);

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });
    const { sendNotification } = useNotifications();

    useEffect(() => {
        if (!currentUser?.uid) return;

        async function loadDashboardData() {
            try {
                const slotsQuery = query(
                    collection(db, 'doctor_slots'),
                    where('doctorId', '==', currentUser.uid)
                );
                const slotsSnapshot = await getDocs(slotsQuery);
                setSlots(slotsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));

                const appsQuery = query(
                    collection(db, 'appointments'),
                    where('doctorId', '==', currentUser.uid)
                );
                const appsSnapshot = await getDocs(appsQuery);
                setAppointments(appsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                console.error('Error loading dashboard data: ', err);
            }
        }

        loadDashboardData();
    }, [currentUser]);

    const fetchDoctorSlots = async () => {
        const q = query(collection(db, 'doctor_slots'), where('doctorId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        setSlots(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    const fetchAppointments = async () => {
        const q = query(collection(db, 'appointments'), where('doctorId', '==', currentUser.uid));
        const querySnapshot = await getDocs(q);
        setAppointments(querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    };

    const clearAllSlots = async () => {
        const result = await Swal.fire({
            title: 'Clear Unbooked Slots?',
            text: "This will permanently delete ALL available slots. Booked slots will remain safe!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, clear available slots!'
        });

        if (!result.isConfirmed) return;

        try {
            const slotsRef = collection(db, 'doctor_slots');
            const unbookedQuery = query(slotsRef, where('doctorId', '==', currentUser.uid), where('isBooked', '==', false));
            const querySnapshot = await getDocs(unbookedQuery);

            if (querySnapshot.empty) {
                Toast.fire({ icon: 'info', title: 'No unbooked slots to clear!' });
                return;
            }

            const deletePromises = querySnapshot.docs.map((docSnap) => deleteDoc(doc(db, 'doctor_slots', docSnap.id)));
            await Promise.all(deletePromises);

            Swal.fire({
                icon: 'success',
                title: 'Cleared!',
                text: 'All unbooked slots have been wiped out. Booked slots are untouched!',
                confirmButtonColor: '#00796b',
            });

            fetchDoctorSlots();
        } catch (err) {
            console.error("Error clearing slots: ", err);
            Toast.fire({ icon: 'error', title: 'Failed to clear slots.' });
        }
    };

    const handleApproveAppointment = async (appId) => {
        try {
            const appRef = doc(db, 'appointments', appId);
            const appSnap = await getDoc(appRef);
            const patientId = appSnap.exists() ? appSnap.data().patientId : null;

            await updateDoc(appRef, { status: 'Approved' });
            if (patientId) {
                await sendNotification(
                    patientId,
                    'Appointment approved',
                    'Your appointment has been approved by the doctor.',
                    { appointmentId: appId }
                );
            }

            Toast.fire({ icon: 'success', title: 'Appointment Approved! ' });
            fetchAppointments();
        } catch (err) {
            console.error(err);
            Toast.fire({ icon: 'error', title: 'Action failed.' });
        }
    };

    const handleCancelAppointment = async (appId) => {
        try {
            const appRef = doc(db, 'appointments', appId);
            const appSnap = await getDoc(appRef);
            
            if (!appSnap.exists()) {
                Toast.fire({ icon: 'error', title: 'Appointment not found.' });
                return;
            }

            const appData = appSnap.data();
            const patientId = appData.patientId;
            const slotId = appData.slotId; 

            await updateDoc(appRef, { status: 'Cancelled' });

            if (slotId) {
                const slotRef = doc(db, 'doctor_slots', slotId);
                await updateDoc(slotRef, { isBooked: false });
            }

            if (patientId) {
                await sendNotification(
                    patientId,
                    'Appointment cancelled',
                    'Your appointment was cancelled by the doctor and the time slot is now released.',
                    { appointmentId: appId }
                );
            }

            Toast.fire({ icon: 'success', title: 'Appointment cancelled & Slot released! 🔓' });
            
            fetchAppointments();
            fetchDoctorSlots(); 
        } catch (err) {
            console.error("Error cancelling appointment: ", err);
            Toast.fire({ icon: 'error', title: 'Action failed.' });
        }
    };

    const handleOpenCompleteModal = (appointment) => {
        setSelectedAppointment(appointment);
        setOpenModal(true);
    };

    const handleCompleteAppointment = async () => {
        if (!diagnosis.trim() || !prescription.trim()) {
            Toast.fire({ icon: 'error', title: 'Please fill in both fields.' });
            return;
        }

        try {
            const appRef = doc(db, 'appointments', selectedAppointment.id);
            await updateDoc(appRef, {
                status: 'Completed',
                medicalRecord: {
                    diagnosis,
                    prescription,
                    date: new Date().toLocaleDateString(),
                },
            });

            const slotId = selectedAppointment.slotId;
            if (slotId) {
                const slotRef = doc(db, 'doctor_slots', slotId);
                await deleteDoc(slotRef); 
            }

            if (selectedAppointment?.patientId) {
                await sendNotification(
                    selectedAppointment.patientId,
                    'Visit completed',
                    'Your appointment has been marked completed and the prescription is available.',
                    { appointmentId: selectedAppointment.id }
                );
            }

            Swal.fire({
                icon: 'success',
                title: 'Visit Completed!',
                text: 'Patient record updated and schedule cleared.',
                confirmButtonColor: '#00796b',
            });

            setOpenModal(false);
            setDiagnosis('');
            setPrescription('');
            fetchAppointments();
            fetchDoctorSlots();
        } catch (err) {
            console.error(err);
            Toast.fire({ icon: 'error', title: 'Failed to save record.' });
        }
    };

    const handleGenerateShift = async (e) => {
        e.preventDefault();
        if (!selectedDate || !startTime || !workHours) {
            Toast.fire({ icon: 'error', title: 'Please fill all fields!' });
            return;
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0); 
        const inputDate = new Date(selectedDate);
        inputDate.setHours(0, 0, 0, 0);

        if (inputDate < today) {
            Swal.fire({
                icon: 'error',
                title: 'Invalid Date!',
                text: 'You cannot generate slots for a past date. Please select today or a future date.',
                confirmButtonColor: '#00796b'
            });
            return; 
        }

        try {
            const checkQuery = query(collection(db, 'doctor_slots'), where('doctorId', '==', currentUser.uid), where('date', '==', selectedDate));
            const checkSnapshot = await getDocs(checkQuery);
            
            if (!checkSnapshot.empty) {
                Swal.fire({
                    icon: 'warning',
                    title: 'Slots Already Exist!',
                    text: 'You have already generated slots for this specific date. Choose another date.',
                    confirmButtonColor: '#00796b'
                });
                return; 
            }

            const options = { weekday: 'long' };
            const dayName = new Date(selectedDate).toLocaleDateString('en-US', options);

            const [startH, startM] = startTime.split(':').map(Number);
            let startTotalMinutes = startH * 60 + startM;
            const endTotalMinutes = startTotalMinutes + parseInt(workHours) * 60;

            while (startTotalMinutes + duration <= endTotalMinutes) {
                const currentH = Math.floor(startTotalMinutes / 60) % 24;
                const currentM = startTotalMinutes % 60;
                const currentSlotStart = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;

                const nextTotalMinutes = startTotalMinutes + duration;
                const nextH = Math.floor(nextTotalMinutes / 60) % 24;
                const nextM = nextTotalMinutes % 60;
                const currentSlotEnd = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;

                const finalTimeFormat = `${formatTimeTo12Hour(currentSlotStart)} - ${formatTimeTo12Hour(currentSlotEnd)}`;

                await addDoc(collection(db, 'doctor_slots'), {
                    doctorId: currentUser.uid,
                    date: selectedDate,    
                    day: dayName,          
                    time: finalTimeFormat,
                    isBooked: false,
                });

                startTotalMinutes += duration;
            }

            Toast.fire({ icon: 'success', title: 'Shift slots generated successfully for ' + selectedDate });
            setSelectedDate('');
            setStartTime('');
            setWorkHours('');
            fetchDoctorSlots();
        } catch (err) {
            console.error(err);
            Toast.fire({ icon: 'error', title: 'Failed to generate shift slots.' });
        }
    };

    const completedAppointments = appointments.filter((app) => {
        const isCompleted = app.status === 'Completed';
        const matchesSearch = (app.patientName || app.name || 'Patient').toLowerCase().includes(searchTerm.toLowerCase());
        return isCompleted && matchesSearch;
    });

    const groupedSlots = slots.reduce((acc, slot) => {
        const key = `${slot.day} (${slot.date})`;
        if (!acc[key]) acc[key] = [];
        acc[key].push(slot);
        return acc;
    }, {});

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00796b' }}>
                    Doctor Workspace
                </Typography>
            </Box>

            <Paper elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, newValue) => setActiveTab(newValue)}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="fullWidth"
                    sx={{
                        '& .MuiTabs-indicator': { bgcolor: '#00796b', height: 3 },
                        '& .Mui-selected': { color: '#00796b !important', fontWeight: 'bold' },
                    }}
                >
                    <Tab icon={<AssignmentIcon />} iconPosition="start" label="Patient Appointments" />
                    <Tab icon={<CalendarMonthIcon />} iconPosition="start" label="Manage Work Schedule" />
                    <Tab icon={<HistoryEduIcon />} iconPosition="start" label="Patients Medical History" />
                </Tabs>
            </Paper>

            {activeTab === 0 && (
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', mb: 3 }}>
                        Current & Recent Bookings
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f4f7f6' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#00796b' }}>Patient Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#00796b' }}>Day & Time</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#00796b' }}>Status</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#00796b' }}>Actions</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {appointments.filter((a) => a.status !== 'Completed' && a.status !== 'Cancelled').length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#999' }}>
                                            No active appointments found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    appointments
                                        .filter((a) => a.status !== 'Completed' && a.status !== 'Cancelled')
                                        .map((app) => (
                                            <TableRow key={app.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                                <TableCell sx={{ fontWeight: '500' }}>
                                                    {app.patientName || app.name || "Unknown Patient"}
                                                </TableCell>
                                                <TableCell>{`${app.day} (${app.time})`}</TableCell>
                                                <TableCell>
                                                    <Chip
                                                        label={app.status}
                                                        color={app.status === 'Approved' ? 'success' : 'warning'}
                                                        variant={app.status === 'Pending' ? 'outlined' : 'filled'}
                                                        size="small"
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                                        {app.status === 'Pending' && (
                                                            <>
                                                                <Button size="small" variant="contained" color="primary" onClick={() => handleApproveAppointment(app.id)}>Approve</Button>
                                                                <Button size="small" variant="outlined" color="error" onClick={() => handleCancelAppointment(app.id)}>Cancel</Button>
                                                            </>
                                                        )}
                                                        {app.status === 'Approved' && (
                                                            <>
                                                                <Button size="small" variant="contained" color="success" onClick={() => handleOpenCompleteModal(app)}>Complete & Prescribe</Button>
                                                                <Button size="small" variant="outlined" color="error" onClick={() => handleCancelAppointment(app.id)}>Cancel</Button>
                                                            </>
                                                        )}
                                                    </Box>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {activeTab === 1 && (
                <Grid container spacing={4}>
                    <Grid item xs={12} md={4}>
                        <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
                            <Button variant="contained" color="error" fullWidth sx={{ mb: 3, fontWeight: 'bold' }} onClick={clearAllSlots}>
                                🛑 Wipe Free Slots Only
                            </Button>

                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#00796b', mb: 2 }}>
                                Setup Working Shift
                            </Typography>
                            <Box component="form" onSubmit={handleGenerateShift} noValidate>
                                <TextField
                                    label="Select Specific Date"
                                    type="date"
                                    fullWidth
                                    margin="normal"
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{ 
                                        min: new Date().toISOString().split('T')[0],
                                        max: "2030-12-31" 
                                    }}
                                    value={selectedDate}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        const year = val.split('-')[0];
                                        if (year && year.length > 4) return; 
                                        setSelectedDate(val);
                                    }}
                                />
                                <TextField
                                    label="Start Time"
                                    type="time"
                                    fullWidth
                                    margin="normal"
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    value={startTime}
                                    onChange={(e) => setStartTime(e.target.value)}
                                />
                                <FormControl fullWidth margin="normal" required>
                                    <InputLabel>Total Work Hours</InputLabel>
                                    <Select value={workHours} label="Total Work Hours" onChange={(e) => setWorkHours(e.target.value)}>
                                        {[...Array(24)].map((_, i) => (
                                            <MenuItem key={i + 1} value={i + 1}>{i + 1} Hours</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth margin="normal" required>
                                    <InputLabel>Slot Duration</InputLabel>
                                    <Select value={duration} label="Slot Duration" onChange={(e) => setDuration(Number(e.target.value))}>
                                        {[15, 20, 30, 45, 60].map((m) => (
                                            <MenuItem key={m} value={m}>{m} Minutes</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, py: 1.2, bgcolor: '#00796b', '&:hover': { bgcolor: '#004d40' }, fontWeight: 'bold', borderRadius: 2 }}>
                                    Generate Shift Slots
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Paper elevation={3} sx={{ p: 4, borderRadius: 3, minHeight: '400px' }}>
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: 3 }}>
                                Your Weekly Schedule (Grouped by Date)
                            </Typography>
                            {slots.length === 0 ? (
                                <Box sx={{ textAlign: 'center', mt: 6, color: '#999' }}>
                                    <Typography variant="body1">No slots active on your schedule yet.</Typography>
                                </Box>
                            ) : (
                                Object.entries(groupedSlots).map(([dateLabel, daySlots]) => (
                                    <Box key={dateLabel} sx={{ mb: 4, p: 2.5, bgcolor: '#fcfdfe', borderRadius: 2, borderLeft: '5px solid #00796b' }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#00796b', mb: 1.5 }}>
                                            📅 {dateLabel}{' '}
                                            <Chip label={`${daySlots.length} Slots`} size="small" sx={{ bgcolor: '#e0f2f1', color: '#00796b', fontWeight: 'bold' }} />
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                            {daySlots.map((s) => (
                                                <Chip key={s.id} label={s.time} color={s.isBooked ? 'error' : 'success'} variant={s.isBooked ? 'filled' : 'outlined'} />
                                            ))}
                                        </Box>
                                    </Box>
                                ))
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {activeTab === 2 && (
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', mb: 3 }}>
                        Patients Medical History Search
                    </Typography>
                    <TextField label="Search Patient Name..." fullWidth margin="normal" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ mb: 3 }} />
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f4f7f6' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#00796b' }}>Patient Name</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#00796b' }}>Visit Date</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#00796b' }}>Diagnosis</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#00796b' }}>History Record</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {completedAppointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#999' }}>
                                            No past records matching the search.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    completedAppointments.map((app) => (
                                        <TableRow key={app.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                            <TableCell sx={{ fontWeight: '500' }}>{app.patientName || app.name || "Patient"}</TableCell>
                                            <TableCell>{app.medicalRecord?.date || app.day}</TableCell>
                                            <TableCell>{app.medicalRecord?.diagnosis}</TableCell>
                                            <TableCell>
                                                <Button size="small" variant="contained" sx={{ bgcolor: '#00796b' }} onClick={() => { setSelectedHistoryRecord(app.medicalRecord); setHistoryModalOpen(true); }}>
                                                    View Details 📄
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Paper>
            )}

            {/* Modal: Complete Visit */}
            <Modal open={openModal} onClose={() => setOpenModal(false)}>
                <Box sx={modalStyle}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#00796b', mb: 2 }}>
                        Complete Visit & Prescribe
                    </Typography>
                    <TextField label="Diagnosis" fullWidth multiline rows={2} margin="normal" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
                    <TextField label="Prescription & Notes" fullWidth multiline rows={4} margin="normal" value={prescription} onChange={(e) => setPrescription(e.target.value)} />
                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                        <Button fullWidth variant="contained" sx={{ bgcolor: '#00796b', '&:hover': { bgcolor: '#004d40' } }} onClick={handleCompleteAppointment}>Save & Close</Button>
                        <Button fullWidth variant="outlined" color="error" onClick={() => setOpenModal(false)}>Cancel</Button>
                    </Box>
                </Box>
            </Modal>

            <Modal open={historyModalOpen} onClose={() => setHistoryModalOpen(false)}>
                <Box sx={modalStyle}>
                    {selectedHistoryRecord && (
                        <>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#00796b', mb: 2 }}>Medical History Details</Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}><strong>Date:</strong> {selectedHistoryRecord.date}</Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}><strong>Diagnosis:</strong> {selectedHistoryRecord.diagnosis}</Typography>
                            <Typography variant="body1" sx={{ mb: 3 }}><strong>Prescription:</strong> {selectedHistoryRecord.prescription}</Typography>
                            <Button fullWidth variant="outlined" sx={{ borderColor: '#00796b', color: '#00796b' }} onClick={() => setHistoryModalOpen(false)}>Close</Button>
                        </>
                    )}
                </Box>
            </Modal>
        </Container>
    );
};