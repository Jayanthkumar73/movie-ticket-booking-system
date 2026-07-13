package com.moviebooking.backend.service;

import com.moviebooking.backend.entity.*;
import com.moviebooking.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * ShowSchedulerService — keeps showtimes always fresh.
 *
 * Two triggers:
 *   1. Called by DatabaseInitializer on every backend startup.
 *   2. @Scheduled cron fires at 00:05 AM every night automatically.
 *
 * What it does each time:
 *   - Deletes past shows that have NO confirmed bookings (safe cleanup).
 *   - Tops up every movie with shows from today → today+4 days.
 *     • Top 15 movies (DB insertion order): 3 shows/day across IMAX, PREMIUM, REGULAR.
 *     • All remaining movies: 3 shows/day if screens are available, else minimum 1/day.
 */
@Service
public class ShowSchedulerService {

    // How many days ahead to schedule shows (today + 4 more = 5 days total)
    private static final int DAYS_AHEAD = 4;
    // Number of top movies that get full multi-screen coverage
    private static final int TOP_MOVIE_COUNT = 15;

    private static final List<LocalTime> SHOW_TIMES = List.of(
            LocalTime.of(10, 0),   // 10:00 AM
            LocalTime.of(13, 30),  // 01:30 PM
            LocalTime.of(16, 45),  // 04:45 PM
            LocalTime.of(20, 0),   // 08:00 PM
            LocalTime.of(23, 0)    // 11:00 PM
    );

    @Autowired
    private ShowRepository showRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private ScreenRepository screenRepository;

    @Autowired
    private BookingRepository bookingRepository;

    /**
     * Midnight cron — runs every day at 00:05 AM automatically.
     * Fires even without a backend restart, so shows always roll forward.
     */
    @Scheduled(cron = "0 5 0 * * *")
    public void scheduledRefresh() {
        System.out.println("[ShowScheduler] Midnight cron triggered — refreshing shows...");
        refreshShows();
    }

    /**
     * Public entry point — called on startup from DatabaseInitializer,
     * and also by the nightly cron above.
     */
    @Transactional
    public void refreshShows() {
        LocalDate today = LocalDate.now();
        LocalDate endDate = today.plusDays(DAYS_AHEAD);

        int deleted = cleanUpPastShows(today);
        int created = topUpShows(today, endDate);

        System.out.println("[ShowScheduler] Refresh complete. " +
                "Deleted " + deleted + " stale past shows. " +
                "Created " + created + " new future shows.");
    }

    /**
     * Step 1 — Delete past shows that have no CONFIRMED bookings.
     * Shows with confirmed bookings are preserved for booking history.
     */
    private int cleanUpPastShows(LocalDate today) {
        // Find all shows strictly before today
        List<Show> pastShows = showRepository.findByShowDateBefore(today);

        // Collect show IDs that have at least one CONFIRMED booking — we must NOT delete these
        Set<Long> showsWithConfirmedBookings = bookingRepository
                .findByStatus(BookingStatus.CONFIRMED)
                .stream()
                .map(b -> b.getShow().getId())
                .collect(Collectors.toSet());

        // Only delete shows with NO confirmed bookings
        List<Show> safeToDelete = pastShows.stream()
                .filter(s -> !showsWithConfirmedBookings.contains(s.getId()))
                .collect(Collectors.toList());

        showRepository.deleteAll(safeToDelete);
        return safeToDelete.size();
    }

    /**
     * Step 2 — For every movie, ensure shows exist from today → endDate.
     * Inserts only what is missing — idempotent (safe to run multiple times).
     */
    private int topUpShows(LocalDate today, LocalDate endDate) {
        List<Movie> allMovies = movieRepository.findAll();
        List<Screen> allScreens = screenRepository.findAll();

        if (allMovies.isEmpty() || allScreens.isEmpty()) {
            System.out.println("[ShowScheduler] No movies or screens found — skipping top-up.");
            return 0;
        }

        // Separate screens by type for smarter assignment
        List<Screen> imaxScreens = allScreens.stream()
                .filter(s -> s.getScreenType() == ScreenType.IMAX).collect(Collectors.toList());
        List<Screen> premiumScreens = allScreens.stream()
                .filter(s -> s.getScreenType() == ScreenType.PREMIUM).collect(Collectors.toList());
        List<Screen> regularScreens = allScreens.stream()
                .filter(s -> s.getScreenType() == ScreenType.REGULAR).collect(Collectors.toList());

        // Fallback: if a specific type is unavailable, use any screen
        if (imaxScreens.isEmpty()) imaxScreens = allScreens;
        if (premiumScreens.isEmpty()) premiumScreens = allScreens;
        if (regularScreens.isEmpty()) regularScreens = allScreens;

        Random random = new Random(42); // fixed seed so prices are deterministic per run
        int totalCreated = 0;

        for (int movieIndex = 0; movieIndex < allMovies.size(); movieIndex++) {
            Movie movie = allMovies.get(movieIndex);
            boolean isTopMovie = movieIndex < TOP_MOVIE_COUNT;

            // Fetch all existing future shows for this movie (today → endDate)
            List<Show> existingShows = showRepository.findByMovieIdAndShowDateBetween(
                    movie.getId(), today, endDate);

            // Build a set of (date, time) pairs that already exist — to avoid duplicates
            Set<String> existingSlots = existingShows.stream()
                    .map(s -> s.getShowDate() + "_" + s.getShowTime())
                    .collect(Collectors.toSet());

            List<Show> toInsert = new ArrayList<>();

            for (int dayOffset = 0; dayOffset <= DAYS_AHEAD; dayOffset++) {
                LocalDate date = today.plusDays(dayOffset);

                if (isTopMovie) {
                    // Top movies: 3 shows/day — one per screen type
                    // Show time indices spread across the day: morning, afternoon, evening
                    int[] timeIndices = getTimeIndices(movieIndex, dayOffset, 3);

                    tryAddShow(toInsert, existingSlots, movie,
                            imaxScreens.get(movieIndex % imaxScreens.size()),
                            date, SHOW_TIMES.get(timeIndices[0]), random);

                    tryAddShow(toInsert, existingSlots, movie,
                            premiumScreens.get(movieIndex % premiumScreens.size()),
                            date, SHOW_TIMES.get(timeIndices[1]), random);

                    tryAddShow(toInsert, existingSlots, movie,
                            regularScreens.get(movieIndex % regularScreens.size()),
                            date, SHOW_TIMES.get(timeIndices[2]), random);

                } else {
                    // Non-top movies: try 3 shows/day; guaranteed minimum 1/day
                    int[] timeIndices = getTimeIndices(movieIndex, dayOffset, 3);

                    // Try PREMIUM screen
                    boolean added = tryAddShow(toInsert, existingSlots, movie,
                            premiumScreens.get(movieIndex % premiumScreens.size()),
                            date, SHOW_TIMES.get(timeIndices[0]), random);

                    // Try REGULAR screen (different time)
                    tryAddShow(toInsert, existingSlots, movie,
                            regularScreens.get(movieIndex % regularScreens.size()),
                            date, SHOW_TIMES.get(timeIndices[1]), random);

                    // Always ensure at least 1 show on REGULAR (the minimum guarantee)
                    if (!added) {
                        tryAddShow(toInsert, existingSlots, movie,
                                regularScreens.get(movieIndex % regularScreens.size()),
                                date, SHOW_TIMES.get(timeIndices[2]), random);
                    }
                }
            }

            if (!toInsert.isEmpty()) {
                showRepository.saveAll(toInsert);
                totalCreated += toInsert.size();
            }
        }

        return totalCreated;
    }

    /**
     * Tries to add a show for the given slot. Returns true if a new show was added.
     * Skips silently if this (date, time) slot already has a show for this movie.
     */
    private boolean tryAddShow(List<Show> toInsert, Set<String> existingSlots,
                               Movie movie, Screen screen,
                               LocalDate date, LocalTime time, Random random) {
        String slotKey = date + "_" + time;
        if (existingSlots.contains(slotKey)) {
            return false; // slot already filled — skip
        }
        BigDecimal price = BigDecimal.valueOf(150 + random.nextInt(251)); // ₹150–₹400
        toInsert.add(new Show(null, date, time, price, ShowStatus.ACTIVE, movie, screen));
        existingSlots.add(slotKey); // mark as filled so we don't add it twice in same batch
        return true;
    }

    /**
     * Returns an array of time slot indices spread across the day,
     * deterministic but varied per movie/day combination.
     */
    private int[] getTimeIndices(int movieIndex, int dayOffset, int count) {
        int[] indices = new int[count];
        for (int i = 0; i < count; i++) {
            indices[i] = (movieIndex + dayOffset + i * 2) % SHOW_TIMES.size();
        }
        return indices;
    }
}
