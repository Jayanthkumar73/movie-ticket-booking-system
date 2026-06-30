package com.moviebooking.backend.controller;

import com.moviebooking.backend.entity.User;
import com.moviebooking.backend.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private UserRepository userRepository;

    private boolean isPendingTheatreAdmin(User user) {
        boolean isTheatreAdmin = user.getRoles().stream()
                .anyMatch(r -> "ROLE_THEATRE_ADMIN".equals(r.getRoleName()));
        return isTheatreAdmin && Boolean.FALSE.equals(user.getApproved());
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getPendingAdmins() {
        List<Map<String, Object>> pending = userRepository.findAll().stream()
                .filter(this::isPendingTheatreAdmin)
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "name", u.getName(),
                        "username", u.getName(),
                        "email", u.getEmail()
                ))
                .collect(Collectors.toList());
        return ResponseEntity.ok(pending);
    }

    @PutMapping("/approve/{userId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> approveAdmin(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        }
        user.setApproved(Boolean.TRUE);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Admin approved", "id", userId));
    }
}
