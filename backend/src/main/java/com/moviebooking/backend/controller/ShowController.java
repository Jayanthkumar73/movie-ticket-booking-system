package com.moviebooking.backend.controller;

import com.moviebooking.backend.dto.SeatInfoDTO;
import com.moviebooking.backend.entity.Screen;
import com.moviebooking.backend.entity.Show;
import com.moviebooking.backend.repository.ScreenRepository;
import com.moviebooking.backend.security.UserDetailsImpl;
import com.moviebooking.backend.service.ShowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/shows")
public class ShowController {

    @Autowired
    private ShowService showService;

    @Autowired
    private ScreenRepository screenRepository;

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
    public ResponseEntity<?> createShow(
            @RequestBody Show show,
            @RequestParam Long movieId,
            @RequestParam Long screenId) {
        // Theatre admins can only add shows to screens in their own theatre
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof UserDetailsImpl) {
            Long adminTheatreId = ((UserDetailsImpl) auth.getPrincipal()).getTheatreId();
            if (adminTheatreId != null) {
                Screen screen = screenRepository.findById(screenId).orElse(null);
                if (screen == null || !adminTheatreId.equals(screen.getTheatre().getId())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("You can only add shows to screens in your own theatre.");
                }
            }
        }
        return ResponseEntity.ok(showService.createShow(show, movieId, screenId));
    }
}
