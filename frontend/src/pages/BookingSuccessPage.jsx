import React, { useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, Paper, Button, Divider } from '@mui/material';
import { CheckCircle, Download } from '@mui/icons-material';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { NOIR, pageBg } from '../theme';

const BookingSuccessPage = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const ticketRef = useRef(null);
  const booking = state?.booking;

  const downloadTicket = async () => {
    if (!ticketRef.current) return;
    const canvas = await html2canvas(ticketRef.current, { backgroundColor: '#16213e', scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    
    // A4 dimensions in mm: 210 x 297
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pdfWidth = pdf.internal.pageSize.getWidth();
    // Calculate aspect ratio
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Ticket_${booking?.bookingNumber}.pdf`);
  };

  const details = booking ? [
    ['Movie', booking.movieName],
    ['Theatre', booking.theatreName],
    ['Screen', booking.screenName],
    ['Date', booking.showDate],
    ['Time', booking.showTime?.substring(0, 5)],
    ['Seats', booking.selectedSeats?.join(', ')],
    ['Amount Paid', `₹${booking.totalAmount}`],
  ] : [];

  const qrData = booking ? `Booking: ${booking.bookingNumber} | Movie: ${booking.movieName} | Date: ${booking.showDate} | Seats: ${booking.selectedSeats?.join(', ')}` : '';

  return (
    <Box sx={{ ...pageBg, display: 'flex', alignItems: 'center', py: 5 }}>
      <Container maxWidth="sm">
        <Paper sx={{ p: { xs: 4, md: 5 }, borderRadius: 5, textAlign: 'center', bgcolor: NOIR.surface, border: `1px solid rgba(95,191,128,0.35)` }}>
          
          <Box sx={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 80, height: 80, borderRadius: '50%',
            bgcolor: NOIR.successSoft, border: `2px solid rgba(95,191,128,0.5)`, mb: 3
          }}>
            <CheckCircle sx={{ fontSize: 48, color: NOIR.success }} />
          </Box>

          <Typography sx={{ fontFamily: '"Fraunces", serif', fontWeight: 600, color: NOIR.text, fontSize: '1.8rem', mb: 1 }}>
            Booking Confirmed
          </Typography>
          <Typography sx={{ color: NOIR.textDim, mb: 4 }}>
            A confirmation and QR code have been sent to your email.
          </Typography>

          {booking && (
            <Box 
              ref={ticketRef} 
              sx={{ 
                bgcolor: '#16213e', // Solid color for clean PDF export
                borderRadius: 3, 
                p: 3, 
                mb: 3, 
                textAlign: 'left', 
                border: `2px dashed ${NOIR.border}`,
                position: 'relative'
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography sx={{ color: NOIR.amber, fontWeight: 700, fontSize: '1rem', letterSpacing: '0.1em' }}>
                  TICKET #{booking.bookingNumber}
                </Typography>
              </Box>
              
              <Divider sx={{ borderColor: NOIR.border, mb: 3 }} />
              
              <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3, alignItems: 'center' }}>
                <Box sx={{ flex: 1, width: '100%' }}>
                  {details.map(([label, value]) => (
                    <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography sx={{ color: '#94a3b8', fontSize: '0.9rem' }}>{label}</Typography>
                      <Typography sx={{ color: '#ffffff', fontWeight: 600, fontSize: '0.9rem', textAlign: 'right', maxWidth: '60%', wordBreak: 'break-word' }}>{value}</Typography>
                    </Box>
                  ))}
                </Box>
                
                <Box sx={{ 
                  bgcolor: '#ffffff', 
                  p: 1.5, 
                  borderRadius: 2, 
                  display: 'flex', 
                  flexDirection: 'column',
                  alignItems: 'center',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
                }}>
                  <QRCodeSVG value={qrData} size={110} level="M" />
                  <Typography sx={{ color: '#000', fontSize: '0.7rem', mt: 1, fontWeight: 700, letterSpacing: '0.1em' }}>SCAN ME</Typography>
                </Box>
              </Box>
            </Box>
          )}

          <Button 
            variant="contained" 
            startIcon={<Download />}
            onClick={downloadTicket} 
            sx={{ width: '100%', py: 1.5, mb: 3, bgcolor: NOIR.accent, '&:hover': { bgcolor: NOIR.accentLight } }}
          >
            Download E-Ticket
          </Button>

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button variant="outlined" onClick={() => navigate('/bookings')} sx={{ flex: 1, py: 1.5 }}>
              View My Bookings
            </Button>
            <Button variant="outlined" onClick={() => navigate('/movies')} sx={{ flex: 1, py: 1.5 }}>
              Browse Movies
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default BookingSuccessPage;
