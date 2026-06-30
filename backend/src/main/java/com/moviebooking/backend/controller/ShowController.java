package com.moviebooking.backend.controller;

import com.moviebooking.backend.dto.SeatInfoDTO;
import com.moviebooking.backend.entity.Show;
import com.moviebooking.backend.service.ShowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/shows")
public class ShowController {

    @Autowired
    private ShowService showService;

    @GetMapping
    public List<Show> getAllShows() {
        return showService.getAllActiveShows();
    }

    @GetMapping("/movie/{movieId}")
    public List<Show> getShowsByMovie(@PathVariable Long movieId) {
        return showService.getShowsByMovie(movieId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Show> getShow(@PathVariable Long id) {
        return ResponseEntity.ok(showService.getShowById(id));
    }

    @GetMapping("/{id}/seats")
    public ResponseEntity<SeatInfoDTO> getSeatInfo(@PathVariable Long id) {
        return ResponseEntity.ok(showService.getSeatInfo(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('THEATRE_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Show> createShow(
            @RequestBody Show show,
            @RequestParam Long movieId,
            @RequestParam Long screenId) {
        return ResponseEntity.ok(showService.createShow(show, movieId, screenId));
    }
}
