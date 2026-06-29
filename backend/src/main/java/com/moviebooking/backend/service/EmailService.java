package com.moviebooking.backend.service;

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
}
