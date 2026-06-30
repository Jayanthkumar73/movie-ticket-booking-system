package com.moviebooking.backend.service;

import com.moviebooking.backend.dto.BookingRequest;
import com.moviebooking.backend.dto.BookingReportDTO;
import com.moviebooking.backend.dto.BookingResponse;
import com.moviebooking.backend.entity.*;
import com.moviebooking.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class BookingService {

    @Autowired
    private BookingRepository bookingRepository;

    @Autowired
    private ShowRepository showRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmailService emailService;

    @Transactional
    public BookingResponse bookTicket(BookingRequest request, Long userId) {
        Show show = showRepository.findById(request.getShowId())
                .orElseThrow(() -> new RuntimeException("Show not found"));

        if (show.getStatus() != ShowStatus.ACTIVE) {
            throw new RuntimeException("Show is not available for booking");
        }

        LocalDateTime showDateTime = LocalDateTime.of(show.getShowDate(), show.getShowTime());
        if (showDateTime.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot book tickets for past shows");
        }

        List<String> alreadyBooked = bookingRepository.findByShowId(show.getId()).stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .flatMap(b -> Arrays.stream(b.getSelectedSeats().split(",")))
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        List<String> requested = request.getSelectedSeats();
        List<String> conflicts = requested.stream()
                .filter(alreadyBooked::contains)
                .collect(Collectors.toList());

        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Seats already booked: " + String.join(", ", conflicts));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BigDecimal totalAmount = show.getPricePerSeat().multiply(BigDecimal.valueOf(requested.size()));

        Booking booking = new Booking();
        booking.setBookingNumber(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        booking.setSelectedSeats(String.join(",", requested));
        booking.setTotalAmount(totalAmount);
        booking.setStatus(BookingStatus.CONFIRMED);
        booking.setBookingDate(LocalDateTime.now());
        booking.setShow(show);
        booking.setUser(user);

        Booking saved = bookingRepository.save(booking);

        try {
            emailService.sendBookingConfirmation(user.getEmail(), saved);
        } catch (Exception e) {
            // non-critical
        }

        return toResponse(saved);
    }

    public List<BookingResponse> getUserBookings(Long userId) {
        return bookingRepository.findByUserId(userId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public BookingResponse cancelBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: cannot cancel another user's booking");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking is already cancelled");
        }

        LocalDateTime showDateTime = LocalDateTime.of(
                booking.getShow().getShowDate(),
                booking.getShow().getShowTime()
        );

        if (showDateTime.minusHours(1).isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot cancel within 1 hour of show time");
        }

        booking.setStatus(BookingStatus.CANCELLED);
        Booking saved = bookingRepository.save(booking);

        try {
            emailService.sendCancellationEmail(booking.getUser().getEmail(), saved);
        } catch (Exception e) {
            // non-critical
        }

        return toResponse(saved);
    }

    public List<BookingResponse> getAllBookings() {
        return bookingRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public BookingReportDTO getReport(LocalDate from, LocalDate to) {
        List<Booking> bookings = bookingRepository.findByShow_ShowDateBetween(from, to);

        long total = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .count();

        long cancelled = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CANCELLED)
                .count();

        BigDecimal revenue = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .map(Booking::getTotalAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<LocalDate, Long> byDay = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .collect(Collectors.groupingBy(
                        b -> b.getShow().getShowDate(),
                        Collectors.counting()
                ));

        List<Map<String, Object>> dailyStats = byDay.entrySet().stream()
                .sorted(Map.Entry.comparingByKey())
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("date", e.getKey().toString());
                    m.put("bookings", e.getValue());
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Long> byMovie = bookings.stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED)
                .collect(Collectors.groupingBy(
                        b -> b.getShow().getMovie().getMovieName(),
                        Collectors.counting()
                ));

        List<Map<String, Object>> movieStats = byMovie.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("movie", e.getKey());
                    m.put("bookings", e.getValue());
                    return m;
                })
                .collect(Collectors.toList());

        return new BookingReportDTO(total, revenue, cancelled, dailyStats, movieStats);
    }

    private BookingResponse toResponse(Booking b) {
        BookingResponse r = new BookingResponse();
        r.setId(b.getId());
        r.setBookingNumber(b.getBookingNumber());
        r.setMovieName(b.getShow().getMovie().getMovieName());
        r.setTheatreName(b.getShow().getScreen().getTheatre().getTheatreName());
        r.setScreenName(b.getShow().getScreen().getScreenName());
        r.setShowDate(b.getShow().getShowDate());
        r.setShowTime(b.getShow().getShowTime());
        r.setSelectedSeats(Arrays.asList(b.getSelectedSeats().split(",")));
        r.setTotalAmount(b.getTotalAmount());
        r.setStatus(b.getStatus());
        r.setBookingDate(b.getBookingDate());
        r.setUserEmail(b.getUser().getEmail());
        r.setUserName(b.getUser().getName());
        return r;
    }
}
