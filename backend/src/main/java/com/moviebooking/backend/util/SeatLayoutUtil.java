package com.moviebooking.backend.util;

import com.moviebooking.backend.dto.SeatCategoryBand;
import com.moviebooking.backend.entity.Screen;
import com.moviebooking.backend.entity.SeatCategory;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Turns a screen's ordered {@link SeatCategory} list into the concrete seat layout.
 * <p>
 * Row letters are assigned globally, sequentially, across all categories: the first
 * category (displayOrder 0, nearest the screen) owns rows A, B, C…; the next category
 * continues from where the previous one stopped. Seat labels stay "A1", "B3" etc.,
 * compatible with the comma-separated storage used for bookings.
 * <p>
 * Only single-letter rows (A–Z) are supported — a screen may define at most 26 rows.
 */
public final class SeatLayoutUtil {

    private SeatLayoutUtil() {}

    /** Per-category bands (name, price, the row letters it owns, seatsPerRow) for the seat-info response. */
    public static List<SeatCategoryBand> buildBands(Screen screen) {
        List<SeatCategoryBand> bands = new ArrayList<>();
        List<SeatCategory> categories = screen.getSeatCategories();
        if (categories == null || categories.isEmpty()) {
            return bands;
        }

        int running = 0; // index of the next unused row letter
        for (SeatCategory cat : categories) {
            int rows = cat.getNumRows() == null ? 0 : cat.getNumRows();
            List<String> rowLabels = new ArrayList<>();
            for (int i = 0; i < rows && running < 26; i++, running++) {
                rowLabels.add(String.valueOf((char) ('A' + running)));
            }
            bands.add(new SeatCategoryBand(
                    cat.getName(),
                    cat.getPrice(),
                    rowLabels,
                    cat.getSeatsPerRow(),
                    cat.isBestseller()
            ));
        }
        return bands;
    }

    /** Reverse lookup: row letter -> price, used to price a booking seat-by-seat. Empty when no categories. */
    public static Map<Character, BigDecimal> rowLetterToPrice(Screen screen) {
        Map<Character, BigDecimal> map = new HashMap<>();
        List<SeatCategory> categories = screen.getSeatCategories();
        if (categories == null || categories.isEmpty()) {
            return map;
        }

        int running = 0;
        for (SeatCategory cat : categories) {
            int rows = cat.getNumRows() == null ? 0 : cat.getNumRows();
            for (int i = 0; i < rows && running < 26; i++, running++) {
                map.put((char) ('A' + running), cat.getPrice());
            }
        }
        return map;
    }

    /** Total physical seats implied by the categories (Σ numRows × seatsPerRow). */
    public static int totalSeats(List<SeatCategory> categories) {
        if (categories == null) return 0;
        int total = 0;
        for (SeatCategory cat : categories) {
            int rows = cat.getNumRows() == null ? 0 : cat.getNumRows();
            int perRow = cat.getSeatsPerRow() == null ? 0 : cat.getSeatsPerRow();
            total += rows * perRow;
        }
        return total;
    }
}
