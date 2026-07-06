package com.moviebooking.backend.dto;

import lombok.Data;

import java.math.BigDecimal;

/** A seat tier as supplied by an admin when creating/updating a screen. */
@Data
public class SeatCategoryRequest {
    private String name;
    private BigDecimal price;
    private Integer numRows;
    private Integer seatsPerRow;
    private Integer displayOrder; // optional; falls back to list index
    private boolean bestseller;
}
