import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../api/axios';
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

export const PatientDashBoard = () => {
    const { currentUser } = useAuth();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState(0);

    const [doctors, setDoctors] = useState([]);
    const [allSlots, setAllSlots] = useState([]);
    const [myAppointments, setMyAppointments] = useState([]);
    const [specialties, setSpecialties] = useState([]);
    const [selectedDayForDoc, setSelectedDayForDoc] = useState({});

    const [openModal, setOpenModal] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState('');

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
    });

    const fetchData = async () => {
        try {
            const [doctorsRes, slotsRes, appsRes, specsRes] = await Promise.all(
                [
                    axiosInstance.get('/doctors/'),
                    axiosInstance.get('/slots/available/'),
                    axiosInstance.get('/appointments/'),
                    axiosInstance.get('/specialties/'),
                ]
            );

            setDoctors(doctorsRes.data);
            setAllSlots(slotsRes.data);
            setMyAppointments(appsRes.data);
            setSpecialties(specsRes.data);

            const initialDays = {};
            doctorsRes.data.forEach((doc) => {
                const docSlots = slotsRes.data.filter(
                    (s) => s.doctor === doc.id
                );
                if (docSlots.length > 0) initialDays[doc.id] = docSlots[0].date;
            });
            setSelectedDayForDoc(initialDays);
        } catch (err) {
            console.error('Error loading patient data:', err);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleBookSlot = async (doctor, slot) => {
        const result = await Swal.fire({
            title: t('doctor.bookingConfirmationTitle'),
            text: `Book with Dr. ${doctor.full_name} on ${slot.day} (${slot.date}) [${slot.time.split(' - ')[0]}]?`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#00796b',
            cancelButtonColor: '#d33',
            confirmButtonText: t('doctor.confirmBookBtn'),
            cancelButtonText: t('doctor.cancelBookBtn'),
        });

        if (result.isConfirmed) {
            try {
                await axiosInstance.post('/appointments/book/', {
                    slot_id: slot.id,
                    doctor_id: doctor.id,
                    consultation_fee: doctor.profile?.consultation_fee || 250,
                });
                Swal.fire(
                    t('notifications.bookedTitle'),
                    t('notifications.bookedSuccess'),
                    'success'
                );
                fetchData();
            } catch (err) {
                Toast.fire({
                    icon: 'error',
                    title:
                        err.response?.data?.error ||
                        t('notifications.bookingFailed'),
                });
            }
        }
    };

    const filteredDoctors = doctors.filter((doc) => {
        const matchesSearch = (doc.full_name || doc.username)
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        const docSpecialty = doc.profile?.specialty_name || '';
        const matchesSpecialty =
            !selectedSpecialty ||
            docSpecialty.toLowerCase() === selectedSpecialty.toLowerCase();
        return matchesSearch && matchesSpecialty;
    });

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
                    {t('patient.title')}
                </Typography>
                <Typography
                    variant="body1"
                    color="textSecondary"
                    sx={{ fontWeight: 500 }}
                >
                    {t('patient.subtitle')}
                </Typography>
            </Box>

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
                        icon={<LocalHospitalIcon />}
                        iconPosition="start"
                        label={t('patient.tabs.0')}
                    />
                    <Tab
                        icon={<EventNoteIcon />}
                        iconPosition="start"
                        label={t('patient.tabs.1')}
                    />
                </Tabs>
            </Paper>

            {activeTab === 0 && (
                <Box>
                    <Typography
                        variant="h5"
                        sx={{ fontWeight: 'bold', mb: 3, color: '#333' }}
                    >
                        {t('patient.availableDoctors')}
                    </Typography>

                    <Box sx={{ mb: 4 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={8}>
                                <TextField
                                    fullWidth
                                    variant="outlined"
                                    placeholder={t('patient.searchPlaceholder')}
                                    value={searchQuery}
                                    onChange={(e) =>
                                        setSearchQuery(e.target.value)
                                    }
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <SearchIcon
                                                    sx={{ color: '#00796b' }}
                                                />
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
                            <Grid item xs={12} md={4}>
                                <FormControl fullWidth variant="outlined">
                                    <InputLabel
                                        sx={{
                                            color: '#00796b',
                                            '&.Mui-focused': {
                                                color: '#00796b',
                                            },
                                        }}
                                    >
                                        {t('patient.specialtyFilter')}
                                    </InputLabel>
                                    <Select
                                        value={selectedSpecialty}
                                        onChange={(e) =>
                                            setSelectedSpecialty(e.target.value)
                                        }
                                        label={t('patient.specialtyFilter')}
                                        sx={{
                                            borderRadius: 3,
                                            '&.Mui-focused .MuiOutlinedInput-notchedOutline':
                                                { borderColor: '#00796b' },
                                        }}
                                    >
                                        <MenuItem value="">
                                            <em>
                                                {t('patient.allSpecialties')}
                                            </em>
                                        </MenuItem>
                                        {specialties.map((spec) => (
                                            <MenuItem
                                                key={spec.id}
                                                value={spec.name}
                                            >
                                                {spec.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                        </Grid>
                    </Box>

                    {filteredDoctors.length === 0 ? (
                        <Typography color="textSecondary">
                            {t('patient.noDoctors')}
                        </Typography>
                    ) : (
                        <Grid container spacing={3}>
                            {filteredDoctors.map((doc) => {
                                const doctorSlots = allSlots.filter(
                                    (s) => s.doctor === doc.id
                                );
                                const uniqueDates = [
                                    ...new Set(doctorSlots.map((s) => s.date)),
                                ];
                                const currentSelectedDate =
                                    selectedDayForDoc[doc.id] || uniqueDates[0];
                                const slotsForDay = doctorSlots.filter(
                                    (s) => s.date === currentSelectedDate
                                );

                                return (
                                    <Grid item xs={12} md={6} key={doc.id}>
                                        <Card
                                            elevation={3}
                                            sx={{
                                                borderRadius: 3,
                                                height: '100%',
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
                                                        {(
                                                            doc.full_name ||
                                                            doc.username
                                                        )
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
                                                            Dr.{' '}
                                                            {doc.full_name ||
                                                                doc.username}
                                                        </Typography>
                                                        <Typography
                                                            variant="caption"
                                                            sx={{
                                                                fontWeight: 600,
                                                                color: '#00796b',
                                                            }}
                                                        >
                                                            {doc.profile
                                                                ?.specialty_name ||
                                                                t(
                                                                    'patient.specialist'
                                                                )}
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
                                                    {t('patient.chooseDay')}
                                                </Typography>
                                                {uniqueDates.length === 0 ? (
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
                                                        {uniqueDates.map(
                                                            (dateVal) => {
                                                                const s =
                                                                    doctorSlots.find(
                                                                        (sl) =>
                                                                            sl.date ===
                                                                            dateVal
                                                                    );
                                                                return (
                                                                    <Chip
                                                                        key={
                                                                            dateVal
                                                                        }
                                                                        label={`${s?.day || ''} (${dateVal})`}
                                                                        clickable
                                                                        variant={
                                                                            currentSelectedDate ===
                                                                            dateVal
                                                                                ? 'filled'
                                                                                : 'outlined'
                                                                        }
                                                                        sx={{
                                                                            bgcolor:
                                                                                currentSelectedDate ===
                                                                                dateVal
                                                                                    ? '#00796b'
                                                                                    : 'transparent',
                                                                            color:
                                                                                currentSelectedDate ===
                                                                                dateVal
                                                                                    ? '#fff'
                                                                                    : '#00796b',
                                                                            borderColor:
                                                                                '#00796b',
                                                                            fontWeight:
                                                                                'bold',
                                                                            '&:hover':
                                                                                {
                                                                                    bgcolor:
                                                                                        currentSelectedDate ===
                                                                                        dateVal
                                                                                            ? '#004d40'
                                                                                            : '#e0f2f1',
                                                                                },
                                                                        }}
                                                                        onClick={() =>
                                                                            setSelectedDayForDoc(
                                                                                {
                                                                                    ...selectedDayForDoc,
                                                                                    [doc.id]:
                                                                                        dateVal,
                                                                                }
                                                                            )
                                                                        }
                                                                    />
                                                                );
                                                            }
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
                                                    {t(
                                                        'patient.availableTimes'
                                                    )}
                                                </Typography>
                                                {slotsForDay.length === 0 ? (
                                                    <Typography
                                                        variant="caption"
                                                        color="textSecondary"
                                                    >
                                                        {t('patient.selectDay')}
                                                    </Typography>
                                                ) : (
                                                    <Box
                                                        sx={{
                                                            display: 'flex',
                                                            flexWrap: 'wrap',
                                                            gap: 1.5,
                                                        }}
                                                    >
                                                        {slotsForDay.map(
                                                            (slot) => (
                                                                <Button
                                                                    key={
                                                                        slot.id
                                                                    }
                                                                    variant="outlined"
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleBookSlot(
                                                                            doc,
                                                                            slot
                                                                        )
                                                                    }
                                                                    sx={{
                                                                        borderRadius:
                                                                            '6px',
                                                                        borderColor:
                                                                            '#00796b',
                                                                        color: '#00796b',
                                                                        fontWeight: 500,
                                                                        textTransform:
                                                                            'none',
                                                                        '&:hover':
                                                                            {
                                                                                bgcolor:
                                                                                    '#00796b',
                                                                                color: '#fff',
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
                        {t('patient.yourHistory')}
                    </Typography>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ bgcolor: '#f4f7f6' }}>
                                <TableRow>
                                    {[
                                        t('patient.doctorName'),
                                        'Day & Time',
                                        t('doctor.status'),
                                        t('patient.medicalPrescription'),
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
                                {myAppointments.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            align="center"
                                            sx={{ py: 4, color: '#999' }}
                                        >
                                            No appointments yet.
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
                                            <TableCell sx={{ fontWeight: 500 }}>
                                                Dr. {app.doctor_name}
                                            </TableCell>
                                            <TableCell>{`${app.slot_details?.day || ''} (${app.slot_details?.date || ''}) - [${app.slot_details?.time?.split(' - ')[0] || ''}]`}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={app.status}
                                                    size="small"
                                                    color={
                                                        app.status ===
                                                        'Completed'
                                                            ? 'success'
                                                            : app.status ===
                                                                'Cancelled'
                                                              ? 'error'
                                                              : 'warning'
                                                    }
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {app.status === 'Completed' &&
                                                app.prescription ? (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        sx={{
                                                            bgcolor: '#00796b',
                                                        }}
                                                        onClick={() => {
                                                            setSelectedRecord(
                                                                app
                                                            );
                                                            setOpenModal(true);
                                                        }}
                                                    >
                                                        View Prescription 📄
                                                    </Button>
                                                ) : (
                                                    <Typography
                                                        variant="caption"
                                                        color="textSecondary"
                                                    >
                                                        {t(
                                                            'patient.appointmentAvailableAfter'
                                                        )}
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
                            <Typography
                                variant="h5"
                                sx={{
                                    fontWeight: 'bold',
                                    color: '#00796b',
                                    mb: 2,
                                }}
                            >
                                {t('patient.officialPrescription')}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>Date:</strong>{' '}
                                {selectedRecord.slot_details?.date || '—'}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 1 }}>
                                <strong>Diagnosis:</strong>{' '}
                                {selectedRecord.diagnosis || '—'}
                            </Typography>
                            <Typography variant="body1" sx={{ mb: 3 }}>
                                <strong>Prescription:</strong>{' '}
                                {selectedRecord.prescription || '—'}
                            </Typography>
                            <Button
                                fullWidth
                                variant="outlined"
                                sx={{
                                    borderColor: '#00796b',
                                    color: '#00796b',
                                }}
                                onClick={() => setOpenModal(false)}
                            >
                                {t('patient.close')}
                            </Button>
                        </>
                    )}
                </Box>
            </Modal>
        </Container>
    );
};
