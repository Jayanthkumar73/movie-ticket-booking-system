package com.moviebooking.backend.controller;

import com.moviebooking.backend.dto.BookingRequest;
import com.moviebooking.backend.dto.BookingReportDTO;
import com.moviebooking.backend.dto.BookingResponse;
import com.moviebooking.backend.security.UserDetailsImpl;
import com.moviebooking.backend.service.BookingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Helper to safely extract the authenticated user's ID from the SecurityContext.
 * Returns null if the user is not authenticated or is not a UserDetailsImpl (e.g. super-admin).
 */

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    @Autowired
    private BookingService bookingService;

    // ── helpers ──────────────────────────────────────────────────────────────
    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) principal).getId();
        }
        return null; // e.g. super-admin uses a plain Spring User – has no numeric id
    }

    private Long currentTheatreId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) principal).getTheatreId();
        }
        return null;
    }

    private boolean isSuperAdmin() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream().anyMatch(a -> "ROLE_SUPER_ADMIN".equals(a.getAuthority()));
    }

    // ── endpoints ────────────────────────────────────────────────────────────
    @PostMapping("/lock")
    public ResponseEntity<?> lockSeats(@RequestBody BookingRequest request) {
        Long userId = currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("You must be logged in to book tickets.");
        }
        try {
            return ResponseEntity.ok(bookingService.lockSeats(request, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/create-order")
    public ResponseEntity<?> createOrder(@PathVariable Long id) {
        Long userId = currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You must be logged in.");
        }
        try {
            return ResponseEntity.ok(bookingService.createRazorpayOrder(id, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PostMapping("/{id}/verify-payment")
    public ResponseEntity<?> verifyPayment(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Long userId = currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("You must be logged in.");
        }
        try {
            String paymentId = payload.get("razorpayPaymentId");
            String signature = payload.get("razorpaySignature");
            return ResponseEntity.ok(bookingService.verifyPayment(id, paymentId, signature, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/confirm")
    public ResponseEntity<?> confirmBooking(@PathVariable Long id) {
        // Fallback for legacy flows (or we can remove it entirely if we exclusively use Razorpay).
        // Let's keep it just in case, but frontend won't use it.
        Long userId = currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("You must be logged in to confirm tickets.");
        }
        try {
            return ResponseEntity.ok(bookingService.confirmBooking(id, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @PutMapping("/{id}/release")
    public ResponseEntity<?> releaseSeats(@PathVariable Long id) {
        Long userId = currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("You must be logged in to release tickets.");
        }
        try {
            bookingService.releaseSeats(id, userId);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/my")
    public ResponseEntity<?> getMyBookings() {
        Long userId = currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("You must be logged in to view your bookings.");
        }
        return ResponseEntity.ok(bookingService.getUserBookings(userId));
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id) {
        Long userId = currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("You must be logged in to cancel a booking.");
        }
        try {
            return ResponseEntity.ok(bookingService.cancelBooking(id, userId));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/admin")
    @PreAuthorize("hasAnyRole('THEATRE_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> getAllBookings() {
        if (isSuperAdmin()) {
            return ResponseEntity.ok(bookingService.getAllBookings());
        }
        Long theatreId = currentTheatreId();
        if (theatreId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("Your account is not linked to any theatre.");
        }
        return ResponseEntity.ok(bookingService.getBookingsByTheatre(theatreId));
    }

    @GetMapping("/report")
    @PreAuthorize("hasAnyRole('THEATRE_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<BookingReportDTO> getReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        if (isSuperAdmin()) {
            return ResponseEntity.ok(bookingService.getReport(from, to));
        }
        Long theatreId = currentTheatreId();
        if (theatreId == null) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
        }
        return ResponseEntity.ok(bookingService.getReportByTheatre(theatreId, from, to));
    }

    @GetMapping("/report/export")
    @PreAuthorize("hasAnyRole('THEATRE_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<BookingResponse>> getReportExport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<BookingResponse> all;
        if (isSuperAdmin()) {
            all = bookingService.getAllBookings();
        } else {
            Long theatreId = currentTheatreId();
            if (theatreId == null) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(null);
            }
            all = bookingService.getBookingsByTheatre(theatreId);
        }
        List<BookingResponse> filtered = all.stream()
                .filter(b -> !b.getShowDate().isBefore(from) && !b.getShowDate().isAfter(to))
                .collect(Collectors.toList());
        return ResponseEntity.ok(filtered);
    }
}
