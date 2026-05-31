import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';
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
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';

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
    return `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
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

    const fetchSlots = async () => {
        try {
            const res = await axiosInstance.get('/slots/');
            setSlots(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchAppointments = async () => {
        try {
            const res = await axiosInstance.get('/appointments/');
            setAppointments(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchSlots();
        fetchAppointments();
    }, []);

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
                text: 'Please select today or a future date.',
                confirmButtonColor: '#00796b',
            });
            return;
        }

        const options = { weekday: 'long' };
        const dayName = new Date(selectedDate).toLocaleDateString(
            'en-US',
            options
        );
        const [startH, startM] = startTime.split(':').map(Number);
        let startTotalMinutes = startH * 60 + startM;
        const endTotalMinutes = startTotalMinutes + parseInt(workHours) * 60;
        const slotsToCreate = [];

        while (startTotalMinutes + duration <= endTotalMinutes) {
            const currentH = Math.floor(startTotalMinutes / 60) % 24;
            const currentM = startTotalMinutes % 60;
            const currentSlotStart = `${String(currentH).padStart(2, '0')}:${String(currentM).padStart(2, '0')}`;
            const nextTotalMinutes = startTotalMinutes + duration;
            const nextH = Math.floor(nextTotalMinutes / 60) % 24;
            const nextM = nextTotalMinutes % 60;
            const currentSlotEnd = `${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
            const finalTimeFormat = `${formatTimeTo12Hour(currentSlotStart)} - ${formatTimeTo12Hour(currentSlotEnd)}`;
            slotsToCreate.push({
                date: selectedDate,
                day: dayName,
                time: finalTimeFormat,
            });
            startTotalMinutes += duration;
        }

        try {
            await Promise.all(
                slotsToCreate.map((s) => axiosInstance.post('/slots/', s))
            );
            Toast.fire({
                icon: 'success',
                title: 'Shift slots generated for ' + selectedDate,
            });
            setSelectedDate('');
            setStartTime('');
            setWorkHours('');
            fetchSlots();
        } catch (err) {
            Toast.fire({
                icon: 'error',
                title:
                    err.response?.data?.non_field_errors?.[0] ||
                    'Failed to generate slots.',
            });
        }
    };

    const handleDeleteSlot = async (slotId, slotTime) => {
        const result = await Swal.fire({
            title: 'Delete Slot?',
            text: `Delete slot [${slotTime}]?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Yes, delete it!',
        });
        if (!result.isConfirmed) return;
        try {
            await axiosInstance.delete(`/slots/${slotId}/`);
            Toast.fire({ icon: 'success', title: 'Slot deleted!' });
            fetchSlots();
        } catch {
            Toast.fire({ icon: 'error', title: 'Failed to delete slot.' });
        }
    };

    const handleDeleteWholeDay = async (daySlots, dateLabel) => {
        const unbookedSlots = daySlots.filter((s) => !s.is_booked);
        if (unbookedSlots.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'All slots are booked!',
                confirmButtonColor: '#00796b',
            });
            return;
        }
        const result = await Swal.fire({
            title: 'Delete Whole Day?',
            text: `Delete all ${unbookedSlots.length} available slots for ${dateLabel}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            confirmButtonText: 'Yes, delete day!',
        });
        if (!result.isConfirmed) return;
        try {
            await Promise.all(
                unbookedSlots.map((s) =>
                    axiosInstance.delete(`/slots/${s.id}/`)
                )
            );
            Toast.fire({ icon: 'success', title: 'Day slots deleted!' });
            fetchSlots();
        } catch {
            Toast.fire({ icon: 'error', title: 'Failed to delete day slots.' });
        }
    };

    const handleApproveAppointment = async (appId) => {
        try {
            await axiosInstance.post(`/appointments/${appId}/approve/`);
            Toast.fire({ icon: 'success', title: 'Appointment Approved!' });
            fetchAppointments();
        } catch {
            Toast.fire({ icon: 'error', title: 'Action failed.' });
        }
    };

    const handleCancelAppointment = async (appId) => {
        try {
            await axiosInstance.post(`/appointments/${appId}/cancel/`, {
                reason: 'Cancelled by doctor.',
            });
            Toast.fire({ icon: 'success', title: 'Appointment cancelled!' });
            fetchAppointments();
            fetchSlots();
        } catch {
            Toast.fire({ icon: 'error', title: 'Action failed.' });
        }
    };

    const handleCompleteAppointment = async () => {
        if (!diagnosis.trim() || !prescription.trim()) {
            Toast.fire({ icon: 'error', title: 'Please fill in both fields.' });
            return;
        }
        try {
            await axiosInstance.post(
                `/appointments/${selectedAppointment.id}/complete/`,
                {
                    diagnosis,
                    prescription,
                    doctor_notes: '',
                }
            );
            Swal.fire({
                icon: 'success',
                title: 'Visit Completed!',
                text: 'Patient record updated.',
                confirmButtonColor: '#00796b',
            });
            setOpenModal(false);
            setDiagnosis('');
            setPrescription('');
            fetchAppointments();
            fetchSlots();
        } catch {
            Toast.fire({ icon: 'error', title: 'Failed to save record.' });
        }
    };

    const activeAppointments = appointments.filter(
        (a) =>
            a.status !== 'Completed' &&
            a.status !== 'Cancelled' &&
            a.status !== 'Rejected'
    );
    const completedAppointments = appointments.filter((a) => {
        const isCompleted = a.status === 'Completed';
        const matchesSearch = (a.patient_name || 'Patient')
            .toLowerCase()
            .includes(searchTerm.toLowerCase());
        return isCompleted && matchesSearch;
    });

    const groupedSlots = slots.reduce((acc, slot) => {
        const key = slot.date
            ? `${slot.day} (${slot.date})`
            : slot.day || 'Unknown';
        if (!acc[key]) acc[key] = [];
        acc[key].push(slot);
        return acc;
    }, {});

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography
                variant="h4"
                sx={{ fontWeight: 'bold', color: '#00796b', mb: 3 }}
            >
                Doctor Workspace
            </Typography>

            <Paper elevation={2} sx={{ mb: 4, borderRadius: 2 }}>
                <Tabs
                    value={activeTab}
                    onChange={(e, v) => setActiveTab(v)}
                    variant="fullWidth"
                    sx={{
                        '& .MuiTabs-indicator': {
                            bgcolor: '#00796b',
                            height: 3,
                        },
                        '& .Mui-selected': {
                            color: '#00796b !important',
                            fontWeight: 'bold',
                        },
                    }}
                >
                    <Tab
                        icon={<AssignmentIcon />}
                        iconPosition="start"
                        label="Patient Appointments"
                    />
                    <Tab
                        icon={<CalendarMonthIcon />}
                        iconPosition="start"
                        label="Manage Work Schedule"
                    />
                    <Tab
                        icon={<HistoryEduIcon />}
                        iconPosition="start"
                        label="Patients Medical History"
                    />
                </Tabs>
            </Paper>

            {activeTab === 0 && (
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                        Current & Recent Bookings
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f4f7f6' }}>
                                <TableRow>
                                    {[
                                        'Patient Name',
                                        'Day & Time',
                                        'Status',
                                        'Actions',
                                    ].map((h) => (
                                        <TableCell
                                            key={h}
                                            sx={{
                                                fontWeight: 'bold',
                                                color: '#00796b',
                                            }}
                                        >
                                            {h}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {activeAppointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            align="center"
                                            sx={{ py: 4, color: '#999' }}
                                        >
                                            No active appointments.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    activeAppointments.map((app) => (
                                        <TableRow
                                            key={app.id}
                                            sx={{
                                                '&:hover': {
                                                    bgcolor: '#fafafa',
                                                },
                                            }}
                                        >
                                            <TableCell sx={{ fontWeight: 500 }}>
                                                {app.patient_name || 'Patient'}
                                            </TableCell>
                                            <TableCell>{`${app.slot_details?.day || ''} (${app.slot_details?.date || ''}) - [${app.slot_details?.time?.split(' - ')[0] || ''}]`}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={app.status}
                                                    size="small"
                                                    color={
                                                        app.status ===
                                                        'Confirmed'
                                                            ? 'success'
                                                            : 'warning'
                                                    }
                                                    variant={
                                                        app.status === 'Pending'
                                                            ? 'outlined'
                                                            : 'filled'
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        gap: 1,
                                                    }}
                                                >
                                                    {app.status ===
                                                        'Pending' && (
                                                        <>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="primary"
                                                                onClick={() =>
                                                                    handleApproveAppointment(
                                                                        app.id
                                                                    )
                                                                }
                                                            >
                                                                Approve
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                color="error"
                                                                onClick={() =>
                                                                    handleCancelAppointment(
                                                                        app.id
                                                                    )
                                                                }
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </>
                                                    )}
                                                    {app.status ===
                                                        'Confirmed' && (
                                                        <>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                color="success"
                                                                onClick={() => {
                                                                    setSelectedAppointment(
                                                                        app
                                                                    );
                                                                    setOpenModal(
                                                                        true
                                                                    );
                                                                }}
                                                            >
                                                                Complete &
                                                                Prescribe
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                variant="outlined"
                                                                color="error"
                                                                onClick={() =>
                                                                    handleCancelAppointment(
                                                                        app.id
                                                                    )
                                                                }
                                                            >
                                                                Cancel
                                                            </Button>
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
                            <Typography
                                variant="h6"
                                sx={{
                                    fontWeight: 'bold',
                                    color: '#00796b',
                                    mb: 2,
                                }}
                            >
                                Setup Working Shift
                            </Typography>
                            <Box
                                component="form"
                                onSubmit={handleGenerateShift}
                                noValidate
                            >
                                <TextField
                                    label="Select Date"
                                    type="date"
                                    fullWidth
                                    margin="normal"
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    inputProps={{
                                        min: new Date()
                                            .toISOString()
                                            .split('T')[0],
                                    }}
                                    value={selectedDate}
                                    onChange={(e) =>
                                        setSelectedDate(e.target.value)
                                    }
                                />
                                <TextField
                                    label="Start Time"
                                    type="time"
                                    fullWidth
                                    margin="normal"
                                    required
                                    InputLabelProps={{ shrink: true }}
                                    value={startTime}
                                    onChange={(e) =>
                                        setStartTime(e.target.value)
                                    }
                                />
                                <FormControl fullWidth margin="normal" required>
                                    <InputLabel>Total Work Hours</InputLabel>
                                    <Select
                                        value={workHours}
                                        label="Total Work Hours"
                                        onChange={(e) =>
                                            setWorkHours(e.target.value)
                                        }
                                    >
                                        {[...Array(24)].map((_, i) => (
                                            <MenuItem key={i + 1} value={i + 1}>
                                                {i + 1} Hours
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth margin="normal" required>
                                    <InputLabel>Slot Duration</InputLabel>
                                    <Select
                                        value={duration}
                                        label="Slot Duration"
                                        onChange={(e) =>
                                            setDuration(Number(e.target.value))
                                        }
                                    >
                                        {[15, 20, 30, 45, 60].map((m) => (
                                            <MenuItem key={m} value={m}>
                                                {m} Minutes
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <Button
                                    type="submit"
                                    fullWidth
                                    variant="contained"
                                    sx={{
                                        mt: 2,
                                        py: 1.2,
                                        bgcolor: '#00796b',
                                        '&:hover': { bgcolor: '#004d40' },
                                        fontWeight: 'bold',
                                        borderRadius: 2,
                                    }}
                                >
                                    Generate Shift Slots
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={8}>
                        <Paper
                            elevation={3}
                            sx={{ p: 4, borderRadius: 3, minHeight: 400 }}
                        >
                            <Typography
                                variant="h6"
                                sx={{ fontWeight: 'bold', mb: 3 }}
                            >
                                Your Schedule (Grouped by Date)
                            </Typography>
                            {slots.length === 0 ? (
                                <Typography
                                    color="textSecondary"
                                    sx={{ mt: 6, textAlign: 'center' }}
                                >
                                    No slots yet.
                                </Typography>
                            ) : (
                                Object.entries(groupedSlots).map(
                                    ([dateLabel, daySlots]) => (
                                        <Box
                                            key={dateLabel}
                                            sx={{
                                                mb: 4,
                                                p: 2.5,
                                                bgcolor: '#fcfdfe',
                                                borderRadius: 2,
                                                borderLeft: '5px solid #00796b',
                                            }}
                                        >
                                            <Typography
                                                variant="subtitle1"
                                                sx={{
                                                    fontWeight: 'bold',
                                                    color: '#00796b',
                                                    mb: 1.5,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent:
                                                        'space-between',
                                                }}
                                            >
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1,
                                                    }}
                                                >
                                                    📅 {dateLabel}
                                                    <Chip
                                                        label={`${daySlots.length} Slots`}
                                                        size="small"
                                                        sx={{
                                                            bgcolor: '#e0f2f1',
                                                            color: '#00796b',
                                                            fontWeight: 'bold',
                                                        }}
                                                    />
                                                </Box>
                                                <Button
                                                    size="small"
                                                    variant="outlined"
                                                    color="error"
                                                    startIcon={<DeleteIcon />}
                                                    onClick={() =>
                                                        handleDeleteWholeDay(
                                                            daySlots,
                                                            dateLabel
                                                        )
                                                    }
                                                    sx={{
                                                        textTransform: 'none',
                                                        borderRadius: 2,
                                                    }}
                                                >
                                                    Delete Day
                                                </Button>
                                            </Typography>
                                            <Box
                                                sx={{
                                                    display: 'flex',
                                                    flexWrap: 'wrap',
                                                    gap: 1.5,
                                                }}
                                            >
                                                {daySlots.map((s) => (
                                                    <Chip
                                                        key={s.id}
                                                        label={s.time}
                                                        color={
                                                            s.is_booked
                                                                ? 'error'
                                                                : 'success'
                                                        }
                                                        variant={
                                                            s.is_booked
                                                                ? 'filled'
                                                                : 'outlined'
                                                        }
                                                        onDelete={
                                                            !s.is_booked
                                                                ? () =>
                                                                      handleDeleteSlot(
                                                                          s.id,
                                                                          s.time
                                                                      )
                                                                : undefined
                                                        }
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    )
                                )
                            )}
                        </Paper>
                    </Grid>
                </Grid>
            )}

            {activeTab === 2 && (
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3 }}>
                        Patients Medical History
                    </Typography>
                    <TextField
                        label="Search Patient Name..."
                        fullWidth
                        margin="normal"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ mb: 3 }}
                    />
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f4f7f6' }}>
                                <TableRow>
                                    {[
                                        'Patient Name',
                                        'Visit Date',
                                        'Diagnosis',
                                        'Record',
                                    ].map((h) => (
                                        <TableCell
                                            key={h}
                                            sx={{
                                                fontWeight: 'bold',
                                                color: '#00796b',
                                            }}
                                        >
                                            {h}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {completedAppointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            align="center"
                                            sx={{ py: 4, color: '#999' }}
                                        >
                                            No records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    completedAppointments.map((app) => (
                                        <TableRow
                                            key={app.id}
                                            sx={{
                                                '&:hover': {
                                                    bgcolor: '#fafafa',
                                                },
                                            }}
                                        >
                                            <TableCell sx={{ fontWeight: 500 }}>
                                                {app.patient_name || 'Patient'}
                                            </TableCell>
                                            <TableCell>
                                                {app.slot_details?.date || '—'}
                                            </TableCell>
                                            <TableCell>
                                                {app.diagnosis || '—'}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    size="small"
                                                    variant="contained"
                                                    sx={{ bgcolor: '#00796b' }}
                                                    onClick={() => {
                                                        setSelectedHistoryRecord(
                                                            app
                                                        );
                                                        setHistoryModalOpen(
                                                            true
                                                        );
                                                    }}
                                                >
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

            <Modal open={openModal} onClose={() => setOpenModal(false)}>
                <Box sx={modalStyle}>
                    <Typography
                        variant="h5"
                        sx={{ fontWeight: 'bold', color: '#00796b', mb: 2 }}
                    >
                        Complete Visit & Prescribe
                    </Typography>
                    <TextField
                        label="Diagnosis"
                        fullWidth
                        multiline
                        rows={2}
                        margin="normal"
                        value={diagnosis}
                        onChange={(e) => setDiagnosis(e.target.value)}
                    />
                    <TextField
                        label="Prescription & Notes"
                        fullWidth
                        multiline
                        rows={4}
                        margin="normal"
                        value={prescription}
                        onChange={(e) => setPrescription(e.target.value)}
                    />
                    <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                        <Button
                            fullWidth
                            variant="contained"
                            sx={{
                                bgcolor: '#00796b',
                                '&:hover': { bgcolor: '#004d40' },
                            }}
                            onClick={handleCompleteAppointment}
                        >
                            Save & Close
                        </Button>
                        <Button
                            fullWidth
                            variant="outlined"
                            color="error"
                            onClick={() => setOpenModal(false)}
                        >
                            Cancel
                        </Button>
                    </Box>
                </Box>
            </Modal>

            <Modal
                open={historyModalOpen}
                onClose={() => setHistoryModalOpen(false)}
            >
                <Box sx={modalStyle}>
                    {selectedHistoryRecord && (
                        <>
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 'bold',
                                    color: '#00796b',
                                    mb: 2,
                                }}
                            >
                                Medical History Details
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>Date:</strong>{' '}
                                {selectedHistoryRecord.slot_details?.date ||
                                    '—'}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>Diagnosis:</strong>{' '}
                                {selectedHistoryRecord.diagnosis || '—'}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3 }}>
                                <strong>Prescription:</strong>{' '}
                                {selectedHistoryRecord.prescription || '—'}
                            </Typography>
                            <Button
                                fullWidth
                                variant="outlined"
                                sx={{
                                    borderColor: '#00796b',
                                    color: '#00796b',
                                }}
                                onClick={() => setHistoryModalOpen(false)}
                            >
                                Close
                            </Button>
                        </>
                    )}
                </Box>
            </Modal>
        </Container>
    );
};
