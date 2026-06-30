package com.moviebooking.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SeatInfoDTO {
    private Integer totalSeats;
    private List<String> bookedSeats;
    private BigDecimal pricePerSeat;
    private String screenType;
}
