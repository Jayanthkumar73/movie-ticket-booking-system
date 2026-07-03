package com.moviebooking.backend.repository;

import com.moviebooking.backend.entity.OtpVerification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

public interface OtpVerificationRepository extends JpaRepository<OtpVerification, Long> {
    Optional<OtpVerification> findByEmailAndOtp(String email, String otp);
    
    @Transactional
    void deleteByEmail(String email);
}
