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
    TextField,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    InputAdornment,
} from '@mui/material';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import EventNoteIcon from '@mui/icons-material/EventNote';
import SearchIcon from '@mui/icons-material/Search';
import Swal from 'sweetalert2';
import { useNotifications } from '../context/NotificationsContext';
import { useLanguage } from '../context/LanguageContext';

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

const getLocalDateString = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const translateDayName = (dayStr, t) => {
    if (!dayStr) return '';
    return t(`days.${dayStr}`, dayStr);
};

const parseSlotTime = (timeStr, dateStr) => {
    if (!timeStr) return null;
    const startPart = timeStr.split(' - ')[0].trim();
    const match = startPart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return null;
    let [_, hours, minutes, ampm] = match;
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    if (ampm.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
    } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
    }
    const [year, month, day] = dateStr.split('-').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
};

const timeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const startPart = timeStr.split(' - ')[0].trim();
    const match = startPart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 0;
    let [_, hours, minutes, ampm] = match;
    hours = parseInt(hours);
    minutes = parseInt(minutes);
    if (ampm.toUpperCase() === 'PM' && hours !== 12) {
        hours += 12;
    } else if (ampm.toUpperCase() === 'AM' && hours === 12) {
        hours = 0;
    }
    return hours * 60 + minutes;
};

const sortSlots = (slots) => {
    return [...slots].sort((a, b) => {
        if (a.date && b.date && a.date !== b.date) {
            return a.date.localeCompare(b.date);
        }
        return timeToMinutes(a.time) - timeToMinutes(b.time);
    });
};

const isFutureSlot = (slot) => {
    if (!slot.date) return false;
    const todayStr = getLocalDateString();
    if (slot.date < todayStr) return false;
    if (slot.date === todayStr) {
        const slotTime = parseSlotTime(slot.time, slot.date);
        if (slotTime && slotTime < new Date()) {
            return false;
        }
    }
    return true;
};

export const PatientDashBoard = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState(0);

    const [doctors, setDoctors] = useState([]);
    const [allSlots, setAllSlots] = useState([]);
    const [myAppointments, setMyAppointments] = useState([]);

    const [selectedDayForDoc, setSelectedDayForDoc] = useState({});

    const [openModal, setOpenModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);


    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('');
    const [specialties, setSpecialties] = useState([]);

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

                const profilesSnapshot = await getDocs(collection(db, 'doctors_profiles'));
                const profiles = new Map(profilesSnapshot.docs.map((docSnap) => [docSnap.id, docSnap.data()]));

                const usersQuery = query(
                    collection(db, 'users'),
                    where('role', '==', 'doctor')
                );
                const usersSnapshot = await getDocs(usersQuery);
                const doctorsData = usersSnapshot.docs.map((doc) => ({
                    id: doc.id,
                    ...doc.data(),
                    profile: profiles.get(doc.id) || {},
                }));
                setDoctors(doctorsData);

                const slotsQuery = query(
                    collection(db, 'doctor_slots'),
                    where('isBooked', '==', false)
                );
                const slotsSnapshot = await getDocs(slotsQuery);

                const slotsData = slotsSnapshot.docs
                    .map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }))
                    .filter(isFutureSlot);
                setAllSlots(sortSlots(slotsData));


                const specsSnapshot = await getDocs(collection(db, 'specialties'));
                const dbSpecs = specsSnapshot.docs.map((d) => d.data().name).filter(Boolean);
                const docSpecs = doctorsData.map((d) => d.profile?.specialty).filter(Boolean);
                const mergedSpecs = [...new Set([...dbSpecs, ...docSpecs])];
                setSpecialties(mergedSpecs.map((name, index) => ({ id: `spec-${index}`, name })));

                const initialDays = {};
                usersSnapshot.docs.forEach((dDoc) => {
                    const dSlots = slotsData.filter(
                        (s) => s.doctorId === dDoc.id
                    );
                    if (dSlots.length > 0) {
                        initialDays[dDoc.id] = dSlots[0].date;
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
            sortSlots(
                slotsSnapshot.docs
                    .map((doc) => ({ id: doc.id, ...doc.data() }))
                    .filter(isFutureSlot)
            )
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
        const dayLabel = `${translateDayName(slot.day, t)} (${slot.date})`;
        const startTimeStr = slot.time.split(' - ')[0];

        const titleText = t('doctor.bookingConfirmationTitle');
        const confirmText = t('doctor.bookingConfirmationText')
            .replace('{doctor}', doctor.name)
            .replace('{day}', dayLabel)
            .replace('{time}', startTimeStr);

        const confirmBtn = t('doctor.confirmBookBtn');
        const cancelBtn = t('doctor.cancelBookBtn');

        const result = await Swal.fire({
            title: titleText,
            text: confirmText,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#00796b',
            cancelButtonColor: '#d33',
            confirmButtonText: confirmBtn,
            cancelButtonText: cancelBtn,
        });

        if (result.isConfirmed) {
            try {
                const appRef = await addDoc(collection(db, 'appointments'), {
                    patientId: currentUser.uid,
                    patientName: currentUser.displayName || 'Patient',
                    doctorId: doctor.id,
                    doctorName: doctor.name,
                    day: slot.day,
                    date: slot.date,
                    time: slot.time,
                    slotId: slot.id,
                    status: 'Pending',
                });

                const appointmentId = appRef.id;

                const slotRef = doc(db, 'doctor_slots', slot.id);
                await updateDoc(slotRef, { isBooked: true });

                const docNotificationTitle = t('notifications.newRequestTitle');
                const docNotificationBody = t('notifications.newRequestBody')
                    .replace('{patient}', currentUser.displayName || 'Patient')
                    .replace('{day}', dayLabel)
                    .replace('{time}', startTimeStr);

                await sendNotification(
                    doctor.id,
                    docNotificationTitle,
                    docNotificationBody,
                    { appointmentId, from: currentUser.uid }
                );

                const patientNotificationTitle = t('notifications.bookingCreatedTitle');
                const patientNotificationBody = t('notifications.bookingCreatedBody')
                    .replace('{doctor}', doctor.name)
                    .replace('{day}', dayLabel)
                    .replace('{time}', startTimeStr);

                await sendNotification(
                    currentUser.uid,
                    patientNotificationTitle,
                    patientNotificationBody,
                    { appointmentId }
                );

                Swal.fire(
                    t('notifications.bookedTitle'),
                    t('notifications.bookedSuccess'),
                    'success'
                );
                fetchUpdatedData();
            } catch (err) {
                console.error(err);
                Toast.fire({
                    icon: 'error',
                    title: t('notifications.bookingFailed')
                });
            }
        }
    };

    const handleOpenRecord = (medicalRecord) => {
        setSelectedRecord(medicalRecord);
        setOpenModal(true);
    };

    const filteredDoctors = doctors.filter((docItem) => {
        const matchesSearch = docItem.name.toLowerCase().includes(searchQuery.toLowerCase());
        const doctorSpecialty = docItem.profile?.specialty || '';
        const matchesSpecialty = !selectedSpecialty || doctorSpecialty.toLowerCase() === selectedSpecialty.toLowerCase();
        return matchesSearch && matchesSpecialty;
    });

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00796b' }}>
                    {t('patient.title', 'Patient Center')}
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ fontWeight: '500' }}>
                    {t('patient.subtitle', 'Stay healthy! 🛡️')}
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
                    <Tab icon={<LocalHospitalIcon />} iconPosition="start" label={t('patient.tabs.0', 'Book An Appointment')} />
                    <Tab icon={<EventNoteIcon />} iconPosition="start" label={t('patient.tabs.1', 'My Bookings & Records')} />
                </Tabs>
            </Paper>

            {activeTab === 0 && (
                <Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, color: '#333' }}>
                        {t('patient.availableDoctors', 'Available Doctors & Specialists')}
                    </Typography>

                    { }
                    <Box sx={{ mb: 4 }}>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 8 }}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder={t('patient.searchPlaceholder', 'Search doctor name...')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon sx={{ color: '#00796b' }} />
                                            </InputAdornment>
                                        ),
                                    }}
                                    sx={{
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: 3,
                                            '&.Mui-focused fieldset': {
                                                borderColor: '#00796b',
                                            },
                                        },
                                    }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel id="specialty-select-label" sx={{ color: '#00796b', '&.Mui-focused': { color: '#00796b' } }}>
                                        {t('patient.specialtyFilter', 'Filter by Specialty')}
                                    </InputLabel>
                                    <Select
                                        labelId="specialty-select-label"
                                        value={selectedSpecialty}
                                        onChange={(e) => setSelectedSpecialty(e.target.value)}
                                        label={t('patient.specialtyFilter', 'Filter by Specialty')}
                                        sx={{
                                            borderRadius: 3,
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                                                borderColor: '#00796b',
                                            },
                                        }}
                                    >
                                        <MenuItem value="">
                                            <em>{t('patient.allSpecialties', 'All Specialties')}</em>
                                        </MenuItem>
                                        {specialties.map((spec) => (
                                            <MenuItem key={spec.id} value={spec.name}>
                                                {spec.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>

                    {filteredDoctors.length === 0 ? (
                        <Typography variant="body1" color="textSecondary">
                            {t('patient.noDoctors', 'No registered doctors available right now.')}
                        </Typography>
                    ) : (
                        <Grid container spacing={3}>
                            {filteredDoctors.map((docItem) => {
                                const doctorSlots = allSlots.filter((s) => s.doctorId === docItem.id);
                                const uniqueDates = [...new Set(doctorSlots.map((s) => s.date))];
                                const currentSelectedDate = selectedDayForDoc[docItem.id] || uniqueDates[0];
                                const slotsForSelectedDay = doctorSlots.filter((s) => s.date === currentSelectedDate);

                                const getDayAndDateLabel = (dateStr) => {
                                    const s = doctorSlots.find((slot) => slot.date === dateStr);
                                    if (!s) return dateStr;
                                    const translatedDay = translateDayName(s.day, t);
                                    return `${translatedDay} (${dateStr})`;
                                };

                                return (
                                    <Grid size={{ xs: 12, md: 6 }} key={docItem.id}>
                                        <Card elevation={3} sx={{ borderRadius: 3, height: '100%' }}>
                                            <CardContent>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                                                    <Avatar sx={{ bgcolor: '#00796b', width: 56, height: 56 }}>
                                                        {docItem.name.charAt(0).toUpperCase()}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                                            Dr. {docItem.name}
                                                        </Typography>
                                                        <Typography variant="caption" sx={{ fontWeight: '600', color: '#00796b' }}>
                                                            {docItem.profile?.specialty || t('patient.specialist', 'Specialist')}
                                                        </Typography>
                                                    </Box>
                                                </Box>

                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#555', mb: 1 }}>
                                                    {t('patient.chooseDay', 'Choose Day:')}
                                                </Typography>
                                                {uniqueDates.length === 0 ? (
                                                    <Typography variant="caption" color="error" display="block" sx={{ mb: 2 }}>
                                                        {t('doctor.noDoctorRecords', 'No working days scheduled yet.')}
                                                    </Typography>
                                                ) : (
                                                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 3 }}>
                                                        {uniqueDates.map((dateVal) => (
                                                            <Chip
                                                                key={dateVal}
                                                                label={getDayAndDateLabel(dateVal)}
                                                                clickable
                                                                variant={currentSelectedDate === dateVal ? 'filled' : 'outlined'}
                                                                sx={{
                                                                    bgcolor: currentSelectedDate === dateVal ? '#00796b' : 'transparent',
                                                                    color: currentSelectedDate === dateVal ? '#fff' : '#00796b',
                                                                    borderColor: '#00796b',
                                                                    fontWeight: 'bold',
                                                                    '&:hover': {
                                                                        bgcolor: currentSelectedDate === dateVal ? '#004d40' : '#e0f2f1',
                                                                    },
                                                                }}
                                                                onClick={() => setSelectedDayForDoc({ ...selectedDayForDoc, [docItem.id]: dateVal })}
                                                            />
                                                        ))}
                                                    </Box>
                                                )}

                                                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#00796b', mb: 1.5 }}>
                                                    {t('patient.availableTimes', 'Available Times:')}
                                                </Typography>
                                                {slotsForSelectedDay.length === 0 ? (
                                                    <Typography variant="caption" color="textSecondary">
                                                        {t('patient.selectDay', 'Select a day to view slots.')}
                                                    </Typography>
                                                ) : (
                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                                                        {slotsForSelectedDay.map((slot) => (
                                                            <Button
                                                                key={slot.id}
                                                                variant="outlined"
                                                                size="small"
                                                                onClick={() => handleBookSlot(docItem, slot)}
                                                                sx={{
                                                                    borderRadius: '6px',
                                                                    borderColor: '#00796b',
                                                                    color: '#00796b',
                                                                    fontWeight: '500',
                                                                    textTransform: 'none',
                                                                    '&:hover': { bgcolor: '#00796b', color: '#fff', borderColor: '#00796b' },
                                                                }}
                                                            >
                                                                {slot.time.split(' - ')[0]}
                                                            </Button>
                                                        ))}
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
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', mb: 3 }}>
                        {t('patient.yourHistory', 'Your Booking History')}
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f4f7f6' }}>
                                <TableRow>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#00796b' }}>{t('patient.doctorName', 'Doctor Name')}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#00796b' }}>{t('doctor.dayTime', 'Day & Time')}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#00796b' }}>{t('doctor.status', 'Status')}</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold', color: '#00796b' }}>{t('patient.medicalPrescription', 'Medical Prescription')}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {myAppointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 4, color: '#999' }}>
                                            {t('doctor.noAppointments', "You haven't booked any appointments yet.")}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    myAppointments.map((app) => (
                                        <TableRow key={app.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                                            <TableCell sx={{ fontWeight: '500' }}>Dr. {app.doctorName}</TableCell>
                                            <TableCell>
                                                {`${translateDayName(app.day, t)} ${app.date ? `(${app.date})` : ''} - [${app.time.split(' - ')[0]}]`}
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={t('statuses.' + app.status.toLowerCase(), app.status)}
                                                    color={app.status === 'Completed' ? 'success' : app.status === 'Cancelled' ? 'error' : 'warning'}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {app.status === 'Completed' && app.medicalRecord ? (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        sx={{ bgcolor: '#00796b' }}
                                                        onClick={() => handleOpenRecord(app.medicalRecord)}
                                                    >
                                                        {t('patient.medicalPrescription', 'View Prescription')} 📄
                                                    </Button>
                                                ) : (
                                                    <Typography variant="caption" color="textSecondary">
                                                        {t('patient.appointmentAvailableAfter', 'Available after visit')}
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
                    {selectedRecord && (
                        <>
                            <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#00796b', mb: 2 }}>
                                {t('patient.officialPrescription', 'Medical Prescription Details')}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}><strong>{t('doctor.dateOfVisit', 'Date')}:</strong> {selectedRecord.date}</Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}><strong>{t('patient.diagnosisLabel', 'Diagnosis')}:</strong> {selectedRecord.diagnosis}</Typography>
                            <Typography variant="body1" sx={{ mb: 3 }}><strong>{t('patient.prescriptionLabel', 'Prescription')}:</strong> {selectedRecord.prescription}</Typography>
                            <Button fullWidth variant="outlined" sx={{ borderColor: '#00796b', color: '#00796b' }} onClick={() => setOpenModal(false)}>
                                {t('patient.close', 'Close')}
                            </Button>
                        </>
                    )}
                </Box>
            </Modal>
        </Container>
    );
};