package com.moviebooking.backend.service;

import com.moviebooking.backend.entity.Booking;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Async
    public void sendOtpEmail(String adminEmail, String superAdminEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(adminEmail, superAdminEmail);
        message.setSubject("Aurora Cinemas Admin Login OTP");
        message.setText("Your OTP for Aurora Cinemas Admin login is: " + otp + "\n\nThis OTP is valid for 5 minutes.\n\n— Aurora Cinemas Management System");
        mailSender.send(message);
    }

    @Async
    public void sendBookingConfirmation(String userEmail, Booking booking) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(userEmail);
            helper.setSubject("🎟️ Booking Confirmed - " + booking.getBookingNumber());

            // Generate QR Code URL with booking details
            String qrData = "Booking: " + booking.getBookingNumber() + 
                            " | Movie: " + booking.getShow().getMovie().getMovieName() + 
                            " | Date: " + booking.getShow().getShowDate() + 
                            " | Seats: " + booking.getSelectedSeats();
            String encodedQrData = URLEncoder.encode(qrData, StandardCharsets.UTF_8);
            String qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=" + encodedQrData;

            // HTML Email Template
            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a2e; color: #fff; padding: 20px; border-radius: 10px;'>" +
                    "<div style='text-align: center; border-bottom: 1px solid #444; padding-bottom: 20px; margin-bottom: 20px;'>" +
                    "<h1 style='color: #e50914; margin: 0;'>Booking Confirmed!</h1>" +
                    "<p style='color: #aaa; margin-top: 5px;'>Your ticket is ready.</p>" +
                    "</div>" +
                    "<div style='background-color: #16213e; padding: 20px; border-radius: 8px; margin-bottom: 20px;'>" +
                    "<h2 style='margin-top: 0; color: #fff;'>" + booking.getShow().getMovie().getMovieName() + "</h2>" +
                    "<p><strong>Booking Number:</strong> " + booking.getBookingNumber() + "</p>" +
                    "<p><strong>Date & Time:</strong> " + booking.getShow().getShowDate() + " at " + booking.getShow().getShowTime() + "</p>" +
                    "<p><strong>Theatre:</strong> " + booking.getShow().getScreen().getTheatre().getTheatreName() + " (" + booking.getShow().getScreen().getScreenName() + ")</p>" +
                    "<p><strong>Seats:</strong> " + booking.getSelectedSeats() + "</p>" +
                    "<p><strong>Total Amount:</strong> Rs. " + booking.getTotalAmount() + "</p>" +
                    "</div>" +
                    "<div style='text-align: center; margin-top: 20px;'>" +
                    "<p style='color: #aaa; margin-bottom: 10px;'>Scan this QR Code at the theatre</p>" +
                    "<img src='" + qrUrl + "' alt='Ticket QR Code' style='border: 4px solid #fff; border-radius: 8px;' />" +
                    "</div>" +
                    "<div style='text-align: center; margin-top: 30px; font-size: 12px; color: #666;'>" +
                    "<p>Thank you for choosing our service. Enjoy the movie!</p>" +
                    "</div>" +
                    "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);

        } catch (MessagingException e) {
            System.err.println("Failed to send HTML email: " + e.getMessage());
            // Fallback to plain text if HTML fails
            SimpleMailMessage fallback = new SimpleMailMessage();
            fallback.setTo(userEmail);
            fallback.setSubject("Booking Confirmed - " + booking.getBookingNumber());
            fallback.setText("Your booking is confirmed!\nBooking Number: " + booking.getBookingNumber() + "\nEnjoy the show!");
            mailSender.send(fallback);
        }
    }

    @Async
    public void sendCancellationEmail(String userEmail, Booking booking) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(userEmail);
        message.setSubject("Booking Cancelled - " + booking.getBookingNumber());
        message.setText("Your booking has been cancelled.\n\nBooking Number: " + booking.getBookingNumber() +
                "\nMovie: " + booking.getShow().getMovie().getMovieName() +
                "\nSeats: " + booking.getSelectedSeats() +
                "\nRefund of Rs. " + booking.getTotalAmount() + " will be processed.");
        mailSender.send(message);
    }

    @Async
    public void sendNewAdminRegistrationNotification(String superAdminEmail, String adminName, String adminEmail) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setTo(superAdminEmail);
            helper.setSubject("🔔 New Admin Registration Request - Action Required");

            String htmlContent = "<div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #1a1a2e; color: #fff; padding: 24px; border-radius: 10px;'>" +
                    "<h1 style='color: #E5B769; margin-top: 0;'>New Admin Registration</h1>" +
                    "<p style='color: #aaa;'>A new theatre admin has registered and is waiting for your approval.</p>" +
                    "<div style='background-color: #16213e; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #E5B769;'>" +
                    "<p style='margin: 0 0 8px;'><strong>Name:</strong> " + adminName + "</p>" +
                    "<p style='margin: 0;'><strong>Email:</strong> " + adminEmail + "</p>" +
                    "</div>" +
                    "<p style='color: #aaa;'>Please login to the Admin Dashboard and visit the <strong style='color:#E5B769;'>Approve Admins</strong> tab to accept or reject this request.</p>" +
                    "<p style='font-size: 12px; color: #555; margin-top: 30px;'>Aurora Cinema Management System</p>" +
                    "</div>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (MessagingException e) {
            System.err.println("Failed to send admin notification email: " + e.getMessage());
        }
    }
}
