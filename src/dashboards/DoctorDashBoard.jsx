import  { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { 
  collection, addDoc, query, where, getDocs, updateDoc, doc 
} from 'firebase/firestore';
import { 
  Container, Grid, Paper, Typography, Box, TextField, Button, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Chip, Modal, MenuItem, Select, InputLabel, FormControl, Tabs, Tab
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AssignmentIcon from '@mui/icons-material/Assignment';
import Swal from 'sweetalert2';

const modalStyle = {
  position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
  width: 450, bgcolor: 'background.paper', borderRadius: 3, boxShadow: 24, p: 4,
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

  const [day, setDay] = useState('');
  const [startTime, setStartTime] = useState('');      
  const [workHours, setWorkHours] = useState('');      
  const [duration, setDuration] = useState(30);        
  const [slots, setSlots] = useState([]);

  const [appointments, setAppointments] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [diagnosis, setDiagnosis] = useState('');
  const [prescription, setPrescription] = useState('');

  const Toast = Swal.mixin({
    toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true
  });

  useEffect(() => {
    if (!currentUser?.uid) return;

    async function loadDashboardData() {
      try {
        const slotsQuery = query(collection(db, 'doctor_slots'), where('doctorId', '==', currentUser.uid));
        const slotsSnapshot = await getDocs(slotsQuery);
        setSlots(slotsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));

        const appsQuery = query(collection(db, 'appointments'), where('doctorId', '==', currentUser.uid));
        const appsSnapshot = await getDocs(appsQuery);
        setAppointments(appsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error("Error loading dashboard data: ", err);
      }
    }

    loadDashboardData();
  }, [currentUser]);

  async function fetchDoctorSlots() {
    const q = query(collection(db, 'doctor_slots'), where('doctorId', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);
    setSlots(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }

  async function fetchAppointments() {
    const q = query(collection(db, 'appointments'), where('doctorId', '==', currentUser.uid));
    const querySnapshot = await getDocs(q);
    setAppointments(querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  }

  const handleGenerateShift = async (e) => {
    e.preventDefault();

    if (!day || !startTime || !workHours) {
      Toast.fire({ icon: 'error', title: 'Please fill all fields!' });
      return;
    }

    const [startH, startM] = startTime.split(':').map(Number);
    let startTotalMinutes = startH * 60 + startM;
    const endTotalMinutes = startTotalMinutes + (parseInt(workHours) * 60);

    try {
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
          day,
          time: finalTimeFormat,
          isBooked: false
        });

        startTotalMinutes += duration;
      }

      Toast.fire({ icon: 'success', title: 'Shift and slots generated successfully!' });
      setDay('');
      setStartTime('');
      setWorkHours('');
      fetchDoctorSlots();
    } catch (err) {
      console.error(err);
      Toast.fire({ icon: 'error', title: 'Failed to generate shift slots.' });
    }
  };

  const handleCancelAppointment = async (appId) => {
    try {
      const appRef = doc(db, 'appointments', appId);
      await updateDoc(appRef, { status: 'Cancelled' });
      Toast.fire({ icon: 'success', title: 'Appointment cancelled.' });
      fetchAppointments();
    } catch (err) {
      console.error(err);
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
          date: new Date().toLocaleDateString()
        }
      });

      Swal.fire({
        icon: 'success', title: 'Visit Completed!', text: 'Patient record updated.', confirmButtonColor: '#00796b'
      });

      setOpenModal(false);
      setDiagnosis('');
      setPrescription('');
      fetchAppointments();
    } catch (err) {
      console.error(err);
      Toast.fire({ icon: 'error', title: 'Failed to save record.' });
    }
  };

  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.day]) acc[slot.day] = [];
    acc[slot.day].push(slot);
    return acc;
  }, {});

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: '#00796b' }}>
          Doctor Workspace
        </Typography>
        <Typography variant="body1" color="textSecondary" sx={{ fontWeight: '500' }}>
          Welcome back, Doc! 🩺
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
            '& .Mui-selected': { color: '#00796b !important', fontWeight: 'bold' }
          }}
        >
          <Tab icon={<AssignmentIcon />} iconPosition="start" label="Patient Appointments" />
          <Tab icon={<CalendarMonthIcon />} iconPosition="start" label="Manage Work Schedule" />
        </Tabs>
      </Paper>

      {activeTab === 0 && (
        <Paper elevation={3} sx={{ p: 4, borderRadius: 3 }}>
          <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#333', mb: 3 }}>
            Today's & Upcoming Bookings
          </Typography>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f4f7f6' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold', color: '#00796b' }}>Patient Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#00796b' }}>Day & Time</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#00796b' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: '#00796b', align: 'center' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {appointments.length === 0 ? (
                  <TableRow><TableCell colSpan={4} align="center" sx={{ py: 4, color: '#999' }}>No patient appointments scheduled yet.</TableCell></TableRow>
                ) : appointments.map((app) => (
                  <TableRow key={app.id} sx={{ '&:hover': { bgcolor: '#fafafa' } }}>
                    <TableCell sx={{ fontWeight: '500' }}>{app.patientName}</TableCell>
                    <TableCell>{`${app.day} (${app.time})`}</TableCell>
                    <TableCell>
                      <Chip label={app.status} color={app.status === 'Completed' ? 'success' : app.status === 'Cancelled' ? 'error' : 'warning'} size="small" />
                    </TableCell>
                    <TableCell>
                      {app.status === 'Pending' && (
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" variant="contained" color="success" onClick={() => handleOpenCompleteModal(app)}>Complete</Button>
                          <Button size="small" variant="outlined" color="error" onClick={() => handleCancelAppointment(app.id)}>Cancel</Button>
                        </Box>
                      )}
                      {app.status === 'Completed' && <Typography variant="caption" color="success.main" sx={{ fontWeight: 'bold' }}>Record Saved ✓</Typography>}
                      {app.status === 'Cancelled' && <Typography variant="caption" color="error" sx={{ textDecoration: 'line-through' }}>Cancelled</Typography>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {activeTab === 1 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#00796b', mb: 2 }}>
                Setup Working Shift
              </Typography>
              <Box component="form" noValidate>
                <FormControl fullWidth margin="normal" required>
                  <InputLabel>Select Day</InputLabel>
                  <Select value={day} label="Select Day" onChange={(e) => setDay(e.target.value)}>
                    {['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map(d => (
                      <MenuItem key={d} value={d}>{d}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  label="Start Time" type="time" fullWidth margin="normal" required
                  InputLabelProps={{ shrink: true }}
                  value={startTime} onChange={(e) => setStartTime(e.target.value)}
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
                    {[15, 20, 30, 45, 60].map(m => (
                      <MenuItem key={m} value={m}>{m} Minutes</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button 
                  type="button" onClick={handleGenerateShift}
                  fullWidth variant="contained" 
                  sx={{ mt: 2, py: 1.2, bgcolor: '#00796b', '&:hover': { bgcolor: '#004d40' }, fontWeight: 'bold', borderRadius: 2 }}
                >
                  Generate Shift Slots
                </Button>
              </Box>
            </Paper>
          </Grid>

          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 4, borderRadius: 3, minHeight: '400px' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#333', mb: 3 }}>
                Your Weekly Schedule (Grouped by Day)
              </Typography>

              {slots.length === 0 ? (
                <Box sx={{ textAlign: 'center', mt: 6, color: '#999' }}>
                  <Typography variant="body1">No slots active on your schedule yet.</Typography>
                  <Typography variant="caption">Use the panel on the left to add your working hours.</Typography>
                </Box>
              ) : (
                Object.entries(groupedSlots).map(([dayName, daySlots]) => (
                  <Box key={dayName} sx={{ mb: 4, p: 2.5, bgcolor: '#fcfdfe', borderRadius: 2, borderLeft: '5px solid #00796b', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#00796b', mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                      📅 {dayName} 
                      <Chip label={`${daySlots.length} Slots`} size="small" sx={{ bgcolor: '#e0f2f1', color: '#00796b', fontWeight: 'bold' }} />
                    </Typography>
                    
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                      {daySlots.map((s) => (
                        <Chip 
                          key={s.id} 
                          label={s.time} 
                          variant={s.isBooked ? "filled" : "outlined"} 
                          disabled={s.isBooked}
                          sx={{ 
                            fontWeight: '500',
                            borderRadius: '6px',
                            borderColor: s.isBooked ? '#e0e0e0' : '#00796b',
                            color: s.isBooked ? '#9e9e9e' : '#00796b',
                            bgcolor: s.isBooked ? '#f5f5f5' : 'transparent',
                          }} 
                        />
                      ))}
                    </Box>
                  </Box>
                ))
              )}
            </Paper>
          </Grid>
        </Grid>
      )}

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box sx={modalStyle}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#00796b', mb: 2 }}>Patient Medical Record</Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>Patient: <strong>{selectedAppointment?.patientName}</strong></Typography>
          <TextField label="Diagnosis " fullWidth multiline rows={3} margin="normal" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
          <TextField label="Prescription & Notes " fullWidth multiline rows={4} margin="normal" value={prescription} onChange={(e) => setPrescription(e.target.value)} />
          <Box sx={{ display: 'flex', justifyContent: 'end', gap: 2, mt: 3 }}>
            <Button variant="text" onClick={() => setOpenModal(false)}>Cancel</Button>
            <Button variant="contained" color="success" onClick={handleCompleteAppointment}>Save & Complete Visit</Button>
          </Box>
        </Box>
      </Modal>
    </Container>
  );
};