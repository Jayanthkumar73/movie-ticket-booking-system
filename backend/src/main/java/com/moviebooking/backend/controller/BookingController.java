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

    // ── helper ──────────────────────────────────────────────────────────────
    private Long currentUserId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) return null;
        Object principal = auth.getPrincipal();
        if (principal instanceof UserDetailsImpl) {
            return ((UserDetailsImpl) principal).getId();
        }
        return null; // e.g. super-admin uses a plain Spring User – has no numeric id
    }

    // ── endpoints ────────────────────────────────────────────────────────────
    @PostMapping
    public ResponseEntity<?> bookTicket(@RequestBody BookingRequest request) {
        Long userId = currentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("You must be logged in to book tickets.");
        }
        try {
            return ResponseEntity.ok(bookingService.bookTicket(request, userId));
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
    public ResponseEntity<List<BookingResponse>> getAllBookings() {
        return ResponseEntity.ok(bookingService.getAllBookings());
    }

    @GetMapping("/report")
    @PreAuthorize("hasAnyRole('THEATRE_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<BookingReportDTO> getReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(bookingService.getReport(from, to));
    }

    @GetMapping("/report/export")
    @PreAuthorize("hasAnyRole('THEATRE_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<List<BookingResponse>> getReportExport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        List<BookingResponse> all = bookingService.getAllBookings();
        List<BookingResponse> filtered = all.stream()
                .filter(b -> !b.getShowDate().isBefore(from) && !b.getShowDate().isAfter(to))
                .collect(Collectors.toList());
        return ResponseEntity.ok(filtered);
    }
}
