package com.moviebooking.backend.service;

import com.moviebooking.backend.dto.BookingRequest;
import com.moviebooking.backend.dto.BookingReportDTO;
import com.moviebooking.backend.dto.BookingResponse;
import com.moviebooking.backend.entity.*;
import com.moviebooking.backend.repository.*;
import com.moviebooking.backend.util.SeatLayoutUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;

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

    @Value("${razorpay.key.id}")
    private String razorpayKeyId;

    @Value("${razorpay.key.secret}")
    private String razorpayKeySecret;

    @Transactional
    public BookingResponse lockSeats(BookingRequest request, Long userId) {
        Show show = showRepository.findById(request.getShowId())
                .orElseThrow(() -> new RuntimeException("Show not found"));

        if (show.getStatus() != ShowStatus.ACTIVE) {
            throw new RuntimeException("Show is not available for booking");
        }

        LocalDateTime showDateTime = LocalDateTime.of(show.getShowDate(), show.getShowTime());
        if (showDateTime.isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Cannot book tickets for past shows");
        }

        // Check for conflicts: Seats that are CONFIRMED or currently PENDING (less than 5 mins old)
        LocalDateTime lockExpiryTime = LocalDateTime.now().minusMinutes(5);
        List<String> bookedOrLocked = bookingRepository.findByShowId(show.getId()).stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || 
                            (b.getStatus() == BookingStatus.PENDING && b.getBookingDate().isAfter(lockExpiryTime)))
                .flatMap(b -> Arrays.stream(b.getSelectedSeats().split(",")))
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());

        List<String> requested = request.getSelectedSeats();
        List<String> conflicts = requested.stream()
                .filter(bookedOrLocked::contains)
                .collect(Collectors.toList());

        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Seats already booked or temporarily locked: " + String.join(", ", conflicts));
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        BigDecimal totalAmount = computeTotal(show, requested);

        Booking booking = new Booking();
        booking.setBookingNumber(UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        booking.setSelectedSeats(String.join(",", requested));
        booking.setTotalAmount(totalAmount);
        booking.setStatus(BookingStatus.PENDING); // Mark as PENDING initially
        booking.setBookingDate(LocalDateTime.now());
        booking.setShow(show);
        booking.setUser(user);

        Booking saved = bookingRepository.save(booking);

        return toResponse(saved);
    }

    /**
     * Prices a booking server-side. When the screen has priced categories, each seat is
     * charged by the category of its row letter; otherwise falls back to the show's flat price.
     * The client only sends seat labels — never a price — so this is the single source of truth.
     */
    private BigDecimal computeTotal(Show show, List<String> seats) {
        Screen screen = show.getScreen();
        Map<Character, BigDecimal> rowToPrice = SeatLayoutUtil.rowLetterToPrice(screen);

        // Legacy flat-price screen (no categories defined).
        if (rowToPrice.isEmpty()) {
            return show.getPricePerSeat().multiply(BigDecimal.valueOf(seats.size()));
        }

        BigDecimal total = BigDecimal.ZERO;
        for (String label : seats) {
            if (label == null || label.trim().isEmpty()) {
                throw new RuntimeException("Invalid seat selection");
            }
            char row = Character.toUpperCase(label.trim().charAt(0));
            BigDecimal price = rowToPrice.get(row);
            if (price == null) {
                throw new RuntimeException("Seat " + label + " is not in any priced section");
            }
            total = total.add(price);
        }
        return total;
    }

    @Transactional
    public BookingResponse confirmBooking(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: cannot confirm another user's booking");
        }

        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new RuntimeException("Booking is already confirmed");
        }

        if (booking.getStatus() == BookingStatus.CANCELLED) {
            throw new RuntimeException("Booking was cancelled");
        }

        // Check if 5 minutes have passed
        if (booking.getBookingDate().plusMinutes(5).isBefore(LocalDateTime.now())) {
            booking.setStatus(BookingStatus.CANCELLED);
            bookingRepository.save(booking);
            throw new RuntimeException("Booking session expired (5 minutes timeout). Please select seats again.");
        }

        booking.setStatus(BookingStatus.CONFIRMED);
        Booking saved = bookingRepository.save(booking);

        try {
            emailService.sendBookingConfirmation(booking.getUser().getEmail(), saved);
        } catch (Exception e) {
            // non-critical
        }

        return toResponse(saved);
    }

    public Map<String, String> createRazorpayOrder(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        if (!booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }
        if (booking.getStatus() == BookingStatus.CONFIRMED) {
            throw new RuntimeException("Booking already confirmed");
        }
        
        try {
            RazorpayClient razorpay = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
            JSONObject orderRequest = new JSONObject();
            // Amount in paise
            orderRequest.put("amount", booking.getTotalAmount().multiply(new BigDecimal("100")).intValue());
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "txn_" + booking.getBookingNumber());

            Order order = razorpay.orders.create(orderRequest);
            booking.setRazorpayOrderId(order.get("id"));
            bookingRepository.save(booking);

            Map<String, String> response = new HashMap<>();
            response.put("orderId", order.get("id"));
            response.put("amount", String.valueOf(booking.getTotalAmount()));
            return response;
        } catch (Exception e) {
            throw new RuntimeException("Error creating Razorpay order: " + e.getMessage());
        }
    }

    @Transactional
    public BookingResponse verifyPayment(Long bookingId, String razorpayPaymentId, String razorpaySignature, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
                
        if (!booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized");
        }

        try {
            JSONObject options = new JSONObject();
            options.put("razorpay_order_id", booking.getRazorpayOrderId());
            options.put("razorpay_payment_id", razorpayPaymentId);
            options.put("razorpay_signature", razorpaySignature);

            boolean status = Utils.verifyPaymentSignature(options, razorpayKeySecret);
            if (!status) {
                throw new RuntimeException("Payment signature verification failed");
            }
            
            booking.setRazorpayPaymentId(razorpayPaymentId);
            booking.setStatus(BookingStatus.CONFIRMED);
            Booking saved = bookingRepository.save(booking);

            try {
                emailService.sendBookingConfirmation(booking.getUser().getEmail(), saved);
            } catch (Exception e) {}

            return toResponse(saved);
        } catch (Exception e) {
            throw new RuntimeException("Error verifying payment: " + e.getMessage());
        }
    }

    @Transactional
    public void releaseSeats(Long bookingId, Long userId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
                
        if (!booking.getUser().getId().equals(userId)) {
            throw new RuntimeException("Unauthorized: cannot release another user's booking");
        }
        
        if (booking.getStatus() == BookingStatus.PENDING) {
            booking.setStatus(BookingStatus.CANCELLED);
            bookingRepository.save(booking);
        }
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
        return buildReport(bookings);
    }

    public List<BookingResponse> getBookingsByTheatre(Long theatreId) {
        return bookingRepository.findByShow_Screen_Theatre_Id(theatreId).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    public BookingReportDTO getReportByTheatre(Long theatreId, LocalDate from, LocalDate to) {
        List<Booking> bookings = bookingRepository.findByShow_Screen_Theatre_IdAndShow_ShowDateBetween(theatreId, from, to);
        return buildReport(bookings);
    }

    private BookingReportDTO buildReport(List<Booking> bookings) {
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
