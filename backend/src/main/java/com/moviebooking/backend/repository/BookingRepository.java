package com.moviebooking.backend.repository;

import com.moviebooking.backend.entity.Booking;
import com.moviebooking.backend.entity.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserId(Long userId);
    List<Booking> findByShowId(Long showId);
    List<Booking> findByStatus(BookingStatus status);
    List<Booking> findByShow_ShowDateBetween(LocalDate from, LocalDate to);
    Optional<Booking> findByBookingNumber(String bookingNumber);

    // Theatre-scoped queries for theatre admin isolation
    List<Booking> findByShow_Screen_Theatre_Id(Long theatreId);
    List<Booking> findByShow_Screen_Theatre_IdAndShow_ShowDateBetween(Long theatreId, LocalDate from, LocalDate to);
}
