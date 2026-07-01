package com.moviebooking.backend.controller;

import com.moviebooking.backend.dto.OmdbSearchResultDTO;
import com.moviebooking.backend.entity.Movie;
import com.moviebooking.backend.service.MovieService;
import com.moviebooking.backend.service.OmdbService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/movies")
public class MovieController {

    @Autowired
    private MovieService movieService;

    @Autowired
    private OmdbService omdbService;

    @GetMapping
    public List<Movie> getAllMovies() {
        return movieService.getAllMovies();
    }

    /**
     * Search the OMDb catalogue by title so an admin can pick a real movie
     * instead of typing everything by hand.
     */
    @GetMapping("/omdb/search")
    @PreAuthorize("hasAnyRole('THEATRE_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> searchOmdb(@RequestParam String query) {
        if (query == null || query.trim().length() < 2) {
            return ResponseEntity.badRequest().body(Map.of("message", "Enter at least 2 characters to search."));
        }
        try {
            List<OmdbSearchResultDTO> results = omdbService.search(query.trim());
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                    .body(Map.of("message", "Could not reach OMDb: " + e.getMessage()));
        }
    }

    /**
     * Import a searched movie into our catalogue by its IMDb id. Idempotent.
     */
    @PostMapping("/omdb/import")
    @PreAuthorize("hasAnyRole('THEATRE_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<?> importFromOmdb(@RequestParam String imdbId) {
        try {
            Movie movie = omdbService.importMovie(imdbId);
            return new ResponseEntity<>(movie, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("message", e.getMessage()));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<Movie> getMovieById(@PathVariable Long id) {
        return ResponseEntity.ok(movieService.getMovieById(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('THEATRE_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Movie> addMovie(
            @RequestPart("movie") Movie movie,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        try {
            Movie savedMovie = movieService.addMovie(movie, file);
            return new ResponseEntity<>(savedMovie, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('THEATRE_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Movie> updateMovie(
            @PathVariable Long id,
            @RequestPart("movie") Movie movieDetails,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        try {
            Movie updatedMovie = movieService.updateMovie(id, movieDetails, file);
            return ResponseEntity.ok(updatedMovie);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('THEATRE_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<HttpStatus> deleteMovie(@PathVariable Long id) {
        try {
            movieService.deleteMovie(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
