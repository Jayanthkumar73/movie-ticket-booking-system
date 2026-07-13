package com.moviebooking.backend.repository;

import com.moviebooking.backend.entity.Show;
import com.moviebooking.backend.entity.ShowStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface ShowRepository extends JpaRepository<Show, Long> {
    List<Show> findByMovieId(Long movieId);
    List<Show> findByStatus(ShowStatus status);
    List<Show> findByScreenId(Long screenId);
    List<Show> findByShowDateBetween(LocalDate from, LocalDate to);
    List<Show> findByShowDateBefore(LocalDate date);
    List<Show> findByMovieIdAndShowDateBetween(Long movieId, LocalDate from, LocalDate to);
}
