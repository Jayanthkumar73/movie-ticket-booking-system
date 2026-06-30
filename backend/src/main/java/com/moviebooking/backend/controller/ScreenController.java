package com.moviebooking.backend.controller;

import com.moviebooking.backend.entity.Screen;
import com.moviebooking.backend.service.ScreenService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/screens")
public class ScreenController {

    @Autowired
    private ScreenService screenService;

    @GetMapping
    public List<Screen> getScreens(@RequestParam Long theatreId) {
        return screenService.getScreensByTheatre(theatreId);
    }

    @GetMapping("/all")
    public List<Screen> getAllScreens() {
        return screenService.getAllScreens();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('THEATRE_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Screen> addScreen(@RequestParam Long theatreId, @RequestBody Screen screen) {
        return ResponseEntity.ok(screenService.addScreen(theatreId, screen));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('THEATRE_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Screen> updateScreen(@PathVariable Long id, @RequestBody Screen screen) {
        return ResponseEntity.ok(screenService.updateScreen(id, screen));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('THEATRE_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<Void> deleteScreen(@PathVariable Long id) {
        screenService.deleteScreen(id);
        return ResponseEntity.noContent().build();
    }
}
