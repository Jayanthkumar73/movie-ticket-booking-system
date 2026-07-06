package com.moviebooking.backend.dto;

import lombok.Data;

import java.util.List;

/**
 * Admin payload for creating/updating a screen. When {@code categories} is empty the
 * screen is a legacy flat-price screen and {@code totalSeats} is used as supplied;
 * otherwise {@code totalSeats} is derived from the categories server-side.
 */
@Data
public class ScreenRequest {
    private String screenName;
    private Integer totalSeats;
    private String screenType;
    private List<SeatCategoryRequest> categories;
}
