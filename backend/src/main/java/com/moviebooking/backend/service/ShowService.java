package com.moviebooking.backend.service;

import com.moviebooking.backend.dto.SeatInfoDTO;
import com.moviebooking.backend.entity.*;
import com.moviebooking.backend.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class ShowService {

    @Autowired
    private ShowRepository showRepository;

    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private ScreenRepository screenRepository;

    @Autowired
    private BookingRepository bookingRepository;

    public List<Show> getAllActiveShows() {
        return showRepository.findByStatus(ShowStatus.ACTIVE);
    }

    public List<Show> getShowsByMovie(Long movieId) {
        java.time.LocalDate today = java.time.LocalDate.now();
        java.time.LocalTime now = java.time.LocalTime.now();
        return showRepository.findByMovieId(movieId).stream()
                .filter(s -> s.getStatus() == ShowStatus.ACTIVE)
                .filter(s -> {
                    // Completely hide past dates
                    if (s.getShowDate().isBefore(today)) return false;
                    // For today's shows, hide those whose time has already passed
                    if (s.getShowDate().isEqual(today) && s.getShowTime().isBefore(now)) return false;
                    return true;
                })
                .collect(Collectors.toList());
    }

    public Show createShow(Show show, Long movieId, Long screenId) {
        Movie movie = movieRepository.findById(movieId)
                .orElseThrow(() -> new RuntimeException("Movie not found"));
        Screen screen = screenRepository.findById(screenId)
                .orElseThrow(() -> new RuntimeException("Screen not found"));
        show.setMovie(movie);
        show.setScreen(screen);
        show.setStatus(ShowStatus.ACTIVE);
        return showRepository.save(show);
    }

    public Show getShowById(Long id) {
        return showRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Show not found"));
    }

    public SeatInfoDTO getSeatInfo(Long showId) {
        Show show = getShowById(showId);
        java.time.LocalDateTime lockExpiryTime = java.time.LocalDateTime.now().minusMinutes(5);
        List<String> bookedSeats = bookingRepository.findByShowId(showId).stream()
                .filter(b -> b.getStatus() == BookingStatus.CONFIRMED || 
                            (b.getStatus() == BookingStatus.PENDING && b.getBookingDate().isAfter(lockExpiryTime)))
                .flatMap(b -> Arrays.stream(b.getSelectedSeats().split(",")))
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
        return new SeatInfoDTO(
                show.getScreen().getTotalSeats(),
                bookedSeats,
                show.getPricePerSeat(),
                show.getScreen().getScreenType().name()
        );
    }
}
