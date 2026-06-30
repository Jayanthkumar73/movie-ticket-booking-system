package com.moviebooking.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BookingReportDTO {
    private long totalBookings;
    private BigDecimal totalRevenue;
    private long cancelledBookings;
    private List<Map<String, Object>> dailyStats;
    private List<Map<String, Object>> movieStats;
}
