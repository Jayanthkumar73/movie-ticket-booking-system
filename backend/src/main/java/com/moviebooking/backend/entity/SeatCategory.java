package com.moviebooking.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Table(name = "seat_categories")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class SeatCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private Integer numRows;

    @Column(nullable = false)
    private Integer seatsPerRow;

    // 0 = nearest the screen (front rows, usually the cheaper tier)
    @Column(nullable = false)
    private Integer displayOrder;

    // Highlights this tier as the "Bestseller" section in the seat map
    @Column(nullable = false)
    private boolean bestseller;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "screen_id", nullable = false)
    // Break the circular JSON (Screen -> seatCategories -> screen) and don't drag the theatre along
    @JsonIgnoreProperties({"seatCategories", "theatre", "hibernateLazyInitializer", "handler"})
    private Screen screen;
}
