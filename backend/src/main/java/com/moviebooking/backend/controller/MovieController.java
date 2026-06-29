package com.moviebooking.backend.controller;

import com.moviebooking.backend.entity.Movie;
import com.moviebooking.backend.service.MovieService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/movies")
public class MovieController {

    @Autowired
    private MovieService movieService;

    @GetMapping
    public List<Movie> getAllMovies() {
        return movieService.getAllMovies();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Movie> getMovieById(@PathVariable Long id) {
        return ResponseEntity.ok(movieService.getMovieById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('THEATRE_ADMIN')")
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
    @PreAuthorize("hasRole('THEATRE_ADMIN')")
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
    @PreAuthorize("hasRole('THEATRE_ADMIN')")
    public ResponseEntity<HttpStatus> deleteMovie(@PathVariable Long id) {
        try {
            movieService.deleteMovie(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
