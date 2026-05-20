import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import {
    collection,
    query,
    where,
    getDocs,
    addDoc,
    updateDoc,
    doc,
} from 'firebase/firestore';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Modal,
    Tabs,
    Tab,
    Card,
    CardContent,
    Avatar,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventNoteIcon from '@mui/icons-material/EventNote';
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

export const PatientDashBoard = () => {
    const { currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState(0);

    const [doctors, setDoctors] = useState([]);
    const [allSlots, setAllSlots] = useState([]);
    const [myAppointments, setMyAppointments] = useState([]);

    const [selectedDayForDoc, setSelectedDayForDoc] = useState({});

    const [openModal, setOpenModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);

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

        async function loadPatientData() {
            try {
                const usersQuery = query(
                    collection(db, 'users'),
                    where('role', '==', 'doctor')
                );
                const usersSnapshot = await getDocs(usersQuery);
                setDoctors(
                    usersSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }))
                );

                const slotsQuery = query(
                    collection(db, 'doctor_slots'),
                    where('isBooked', '==', false)
                );
                const slotsSnapshot = await getDocs(slotsQuery);
                const slotsData = slotsSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setAllSlots(slotsData);

                const initialDays = {};
                usersSnapshot.docs.forEach((dDoc) => {
                    const dSlots = slotsData.filter(
                        (s) => s.doctorId === dDoc.id
                    );
                    if (dSlots.length > 0) {
                        initialDays[dDoc.id] = dSlots[0].day;
                    }
                });
                setSelectedDayForDoc(initialDays);

                const appsQuery = query(
                    collection(db, 'appointments'),
                    where('patientId', '==', currentUser.uid)
                );
                const appsSnapshot = await getDocs(appsQuery);
                setMyAppointments(
                    appsSnapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }))
                );
            } catch (err) {
                console.error('Error loading patient data: ', err);
            }
        }

        loadPatientData();
    }, [currentUser]);

    const fetchUpdatedData = async () => {
        const slotsQuery = query(
            collection(db, 'doctor_slots'),
            where('isBooked', '==', false)
        );
        const slotsSnapshot = await getDocs(slotsQuery);
        setAllSlots(
            slotsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );

        const appsQuery = query(
            collection(db, 'appointments'),
            where('patientId', '==', currentUser.uid)
        );
        const appsSnapshot = await getDocs(appsQuery);
        setMyAppointments(
            appsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
    };

    const handleBookSlot = async (doctor, slot) => {
        const result = await Swal.fire({
            title: 'Confirm Booking',
            text: `Book with Dr. ${doctor.name} on ${slot.day} [${slot.time}]?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#00796b',
            confirmButtonText: 'Yes, Book it!',
        });

        if (result.isConfirmed) {
            try {
                const appRef = await addDoc(collection(db, 'appointments'), {
                    patientId: currentUser.uid,
                    patientName: currentUser.displayName || 'Patient',
                    doctorId: doctor.id,
                    doctorName: doctor.name,
                    day: slot.day,
                    time: slot.time,
                    status: 'Pending',
                });

                const appointmentId = appRef.id;

                const slotRef = doc(db, 'doctor_slots', slot.id);
                await updateDoc(slotRef, { isBooked: true });

                // Notify the doctor about the new booking
                await sendNotification(
                    doctor.id,
                    'New appointment request',
                    `Patient ${currentUser.displayName || 'Patient'} requested ${slot.day} ${slot.time}`,
                    { appointmentId, from: currentUser.uid }
                );

                // Notify patient as confirmation (in-app)
                await sendNotification(
                    currentUser.uid,
                    'Booking created',
                    `Your booking with Dr. ${doctor.name} on ${slot.day} ${slot.time} is pending.`,
                    { appointmentId }
                );

                Swal.fire(
                    'Booked!',
                    'Appointment secured successfully.',
                    'success'
                );
                fetchUpdatedData();
            } catch (err) {
                console.error(err);
                Toast.fire({ icon: 'error', title: 'Booking failed.' });
            }
        }
    };

    const handleOpenRecord = (medicalRecord) => {
        setSelectedRecord(medicalRecord);
        setOpenModal(true);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                }}
            >
                <Typography
                    variant="h4"
                    sx={{ fontWeight: 'bold', color: '#00796b' }}
                >
                    Patient Center
                </Typography>
                <Typography
                    variant="body1"
                    color="textSecondary"
                    sx={{ fontWeight: '500' }}
                >
                    Stay healthy! 🛡️
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
                        icon={<LocalHospitalIcon />}
                        iconPosition="start"
                        label="Book An Appointment"
                    />
                    <Tab
                        icon={<EventNoteIcon />}
                        iconPosition="start"
                        label="My Bookings & Records"
                    />
                </Tabs>
            </Paper>

            {activeTab === 0 && (
                <Box>
                    <Typography
                        variant="h5"
                        sx={{ fontWeight: 'bold', mb: 3, color: '#333' }}
                    >
                        Available Doctors & Specialists
                    </Typography>

                    {doctors.length === 0 ? (
                        <Typography variant="body1" color="textSecondary">
                            No registered doctors available right now.
                        </Typography>
                    ) : (
                        <Grid container spacing={3}>
                            {doctors.map((docItem) => {
                                const doctorSlots = allSlots.filter(
                                    (s) => s.doctorId === docItem.id
                                );
                                const uniqueDays = [
                                    ...new Set(doctorSlots.map((s) => s.day)),
                                ];
                                const currentSelectedDay =
                                    selectedDayForDoc[docItem.id] ||
                                    uniqueDays[0];
                                const slotsForSelectedDay = doctorSlots.filter(
                                    (s) => s.day === currentSelectedDay
                                );

                                return (
                                    <Grid item xs={12} md={6} key={docItem.id}>
                                        <Card
                                            elevation={3}
                                            sx={{
                                                borderRadius: 3,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                minHeight: '320px',
                                            }}
                                        >
                                            <CardContent>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 2,
                                                        mb: 3,
                                                    }}
                                                >
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: '#00796b',
                                                            width: 56,
                                                            height: 56,
                                                        }}
                                                    >
                                                        {docItem.name
                                                            .charAt(0)
                                                            .toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography
                                                            variant="h6"
                                                            sx={{
                                                                fontWeight:
                                                                    'bold',
                                                            }}
                                                        >
                                                            Dr. {docItem.name}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            color="textSecondary"
                                                        >
                                                            Specialist
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: '#555',
                                                        mb: 1,
                                                    }}
                                                >
                                                    1. Choose Day:
                                                </Typography>
                                                {uniqueDays.length === 0 ? (
                                                    <Typography
                                                        variant="caption"
                                                        color="error"
                                                        display="block"
                                                        sx={{ mb: 2 }}
                                                    >
                                                        No working days
                                                        scheduled yet.
                                                    </Typography>
                                                ) : (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            gap: 1,
                                                            flexWrap: 'wrap',
                                                            mb: 3,
                                                        }}
                                                    >
                                                        {uniqueDays.map(
                                                            (dayName) => (
                                                                <Chip
                                                                    key={
                                                                        dayName
                                                                    }
                                                                    label={
                                                                        dayName
                                                                    }
                                                                    clickable
                                                                    variant={
                                                                        currentSelectedDay ===
                                                                        dayName
                                                                            ? 'filled'
                                                                            : 'outlined'
                                                                    }
                                                                    sx={{
                                                                        bgcolor:
                                                                            currentSelectedDay ===
                                                                            dayName
                                                                                ? '#00796b'
                                                                                : 'transparent',
                                                                        color:
                                                                            currentSelectedDay ===
                                                                            dayName
                                                                                ? '#fff'
                                                                                : '#00796b',
                                                                        borderColor:
                                                                            '#00796b',
                                                                        fontWeight:
                                                                            'bold',
                                                                        '&:hover':
                                                                            {
                                                                                bgcolor:
                                                                                    currentSelectedDay ===
                                                                                    dayName
                                                                                        ? '#004d40'
                                                                                        : '#e0f2f1',
                                                                            },
                                                                    }}
                                                                    onClick={() =>
                                                                        setSelectedDayForDoc(
                                                                            {
                                                                                ...selectedDayForDoc,
                                                                                [docItem.id]:
                                                                                    dayName,
                                                                            }
                                                                        )
                                                                    }
                                                                />
                                                            )
                                                        )}
                                                    </Box>
                                                )}

                                                <Typography
                                                    variant="subtitle2"
                                                    sx={{
                                                        fontWeight: 'bold',
                                                        color: '#00796b',
                                                        mb: 1.5,
                                                    }}
                                                >
                                                    2. Available Times:
                                                </Typography>
                                                {slotsForSelectedDay.length ===
                                                0 ? (
                                                    <Typography
                                                        variant="caption"
                                                        color="textSecondary"
                                                    >
                                                        Select a day to view
                                                        slots.
                                                    </Typography>
                                                ) : (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            flexWrap: 'wrap',
                                                            gap: 1.5,
                                                        }}
                                                    >
                                                        {slotsForSelectedDay.map(
                                                            (slot) => (
                                                                <Button
                                                                    key={
                                                                        slot.id
                                                                    }
                                                                    variant="outlined"
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleBookSlot(
                                                                            docItem,
                                                                            slot
                                                                        )
                                                                    }
                                                                    sx={{
                                                                        borderRadius:
                                                                            '6px',
                                                                        borderColor:
                                                                            '#00796b',
                                                                        color: '#00796b',
                                                                        fontWeight:
                                                                            '500',
                                                                        textTransform:
                                                                            'none',
                                                                        '&:hover':
                                                                            {
                                                                                bgcolor:
                                                                                    '#00796b',
                                                                                color: '#fff',
                                                                                borderColor:
                                                                                    '#00796b',
                                                                            },
                                                                    }}
                                                                >
                                                                    {
                                                                        slot.time.split(
                                                                            ' - '
                                                                        )[0]
                                                                    }
                                                                </Button>
                                                            )
                                                        )}
                                                    </Box>
                                                )}
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                );
                            })}
                        </Grid>
                    )}
                </Box>
            )}

            {activeTab === 1 && (
                <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
                    <Typography
                        variant="h5"
                        sx={{ fontWeight: 'bold', color: '#333', mb: 3 }}
                    >
                        Your Booking History
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f4f7f6' }}>
                                <TableRow>
                                    <TableCell
                                        sx={{
                                            fontWeight: 'bold',
                                            color: '#00796b',
                                        }}
                                    >
                                        Doctor Name
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            fontWeight: 'bold',
                                            color: '#00796b',
                                        }}
                                    >
                                        Day & Time
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            fontWeight: 'bold',
                                            color: '#00796b',
                                        }}
                                    >
                                        Status
                                    </TableCell>
                                    <TableCell
                                        sx={{
                                            fontWeight: 'bold',
                                            color: '#00796b',
                                        }}
                                    >
                                        Medical Prescription
                                    </TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {myAppointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            align="center"
                                            sx={{ py: 4, color: '#999' }}
                                        >
                                            You haven't booked any appointments
                                            yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    myAppointments.map((app) => (
                                        <TableRow
                                            key={app.id}
                                            sx={{
                                                '&:hover': {
                                                    bgcolor: '#fafafa',
                                                },
                                            }}
                                        >
                                            <TableCell
                                                sx={{ fontWeight: '500' }}
                                            >
                                                Dr. {app.doctorName}
                                            </TableCell>
                                            <TableCell>{`${app.day} (${app.time})`}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={app.status}
                                                    color={
                                                        app.status ===
                                                        'Completed'
                                                            ? 'success'
                                                            : app.status ===
                                                                'Cancelled'
                                                              ? 'error'
                                                              : 'warning'
                                                    }
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {app.status === 'Completed' &&
                                                app.medicalRecord ? (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        sx={{
                                                            bgcolor: '#00796b',
                                                        }}
                                                        onClick={() =>
                                                            handleOpenRecord(
                                                                app.medicalRecord
                                                            )
                                                        }
                                                    >
                                                        View Prescription 📄
                                                    </Button>
                                                ) : (
                                                    <Typography
                                                        variant="caption"
                                                        color="textSecondary"
                                                    >
                                                        Available after visit
                                                    </Typography>
                                                )}
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
                        sx={{
                            fontWeight: 'bold',
                            color: '#00796b',
                            mb: 2,
                            textAlign: 'center',
                        }}
                    >
                        Official Medical Prescription 🩺
                    </Typography>
                    <Typography
                        variant="caption"
                        display="block"
                        sx={{ mb: 3, textAlign: 'center', color: '#777' }}
                    >
                        Date of Visit: {selectedRecord?.date}
                    </Typography>

                    <Box
                        sx={{
                            mb: 2,
                            p: 2,
                            bgcolor: '#f9f9f9',
                            borderRadius: 2,
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 'bold', color: '#333' }}
                        >
                            Diagnosis (التشخيص):
                        </Typography>
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{ mt: 0.5, whiteSpace: 'pre-line' }}
                        >
                            {selectedRecord?.diagnosis}
                        </Typography>
                    </Box>

                    <Box
                        sx={{
                            mb: 3,
                            p: 2,
                            bgcolor: '#e0f2f1',
                            borderRadius: 2,
                            borderLeft: '4px solid #00796b',
                        }}
                    >
                        <Typography
                            variant="subtitle2"
                            sx={{ fontWeight: 'bold', color: '#00796b' }}
                        >
                            Prescription & Notes (العلاج والتعليمات):
                        </Typography>
                        <Typography
                            variant="body2"
                            color="textSecondary"
                            sx={{
                                mt: 0.5,
                                whiteSpace: 'pre-line',
                                fontWeight: '500',
                            }}
                        >
                            {selectedRecord?.prescription}
                        </Typography>
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                        <Button
                            variant="contained"
                            sx={{ bgcolor: '#00796b' }}
                            onClick={() => setOpenModal(false)}
                        >
                            Close
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Container>
    );
};
