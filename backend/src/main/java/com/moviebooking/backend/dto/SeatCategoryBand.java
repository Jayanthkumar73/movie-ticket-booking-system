package com.moviebooking.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/** One priced band in the seat map, e.g. "EXECUTIVE" ₹190 spanning rows E–M. */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SeatCategoryBand {
    private String name;
    private BigDecimal price;
    private List<String> rowLabels;
    private Integer seatsPerRow;
    private boolean bestseller;
}
