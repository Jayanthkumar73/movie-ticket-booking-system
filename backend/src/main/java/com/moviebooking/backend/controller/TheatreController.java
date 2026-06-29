package com.moviebooking.backend.controller;

import com.moviebooking.backend.entity.Theatre;
import com.moviebooking.backend.service.TheatreService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/theatres")
public class TheatreController {

    @Autowired
    private TheatreService theatreService;

    @GetMapping
    public List<Theatre> getAllTheatres() {
        return theatreService.getAllTheatres();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Theatre> getTheatreById(@PathVariable Long id) {
        return ResponseEntity.ok(theatreService.getTheatreById(id));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Theatre> addTheatre(
            @RequestPart("theatre") Theatre theatre,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        try {
            Theatre savedTheatre = theatreService.addTheatre(theatre, file);
            return new ResponseEntity<>(savedTheatre, HttpStatus.CREATED);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Theatre> updateTheatre(
            @PathVariable Long id,
            @RequestPart("theatre") Theatre theatreDetails,
            @RequestPart(value = "file", required = false) MultipartFile file) {
        try {
            Theatre updatedTheatre = theatreService.updateTheatre(id, theatreDetails, file);
            return ResponseEntity.ok(updatedTheatre);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<HttpStatus> deleteTheatre(@PathVariable Long id) {
        try {
            theatreService.deleteTheatre(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
