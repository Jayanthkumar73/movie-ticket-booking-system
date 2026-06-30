package com.moviebooking.backend.dto;

import com.moviebooking.backend.entity.BookingStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingResponse {
    private Long id;
    private String bookingNumber;
    private String movieName;
    private String theatreName;
    private String screenName;
    private LocalDate showDate;
    private LocalTime showTime;
    private List<String> selectedSeats;
    private BigDecimal totalAmount;
    private BookingStatus status;
    private LocalDateTime bookingDate;
    private String userEmail;
    private String userName;
}
