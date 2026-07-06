package com.moviebooking.backend.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "screens")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Screen {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String screenName;

    @Column(nullable = false)
    private Integer totalSeats;

    @Enumerated(EnumType.STRING)
    private ScreenType screenType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "theatre_id", nullable = false)
    // Serialize only what we need; exclude the screens list back to avoid circular JSON
    @JsonIgnoreProperties({"screens", "hibernateLazyInitializer", "handler"})
    private Theatre theatre;

    // Priced seat tiers (e.g. CLASSIC, EXECUTIVE). Empty for legacy flat-price screens.
    @OneToMany(mappedBy = "screen", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("displayOrder ASC")
    @JsonIgnoreProperties({"screen", "hibernateLazyInitializer", "handler"})
    private List<SeatCategory> seatCategories = new ArrayList<>();
}
