package com.moviebooking.backend.service;

import com.moviebooking.backend.entity.Booking;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Async
    public void sendOtpEmail(String adminEmail, String superAdminEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(adminEmail, superAdminEmail);
        message.setSubject("BookMyShow Admin Login OTP");
        message.setText("Your OTP for Admin login is: " + otp + "\n\nThis OTP is valid for 5 minutes.");
        mailSender.send(message);
    }

    @Async
    public void sendBookingConfirmation(String userEmail, Booking booking) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(userEmail);
        message.setSubject("Booking Confirmed - " + booking.getBookingNumber());
        message.setText("Your booking is confirmed!\n\nBooking Number: " + booking.getBookingNumber() +
                "\nMovie: " + booking.getShow().getMovie().getMovieName() +
                "\nDate: " + booking.getShow().getShowDate() +
                "\nTime: " + booking.getShow().getShowTime() +
                "\nSeats: " + booking.getSelectedSeats() +
                "\nTotal Amount: Rs. " + booking.getTotalAmount() +
                "\n\nEnjoy the show!");
        mailSender.send(message);
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
}
