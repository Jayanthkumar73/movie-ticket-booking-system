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

    private boolean isTheatreAdmin(User user) {
        return user.getRoles().stream().anyMatch(r -> "ROLE_THEATRE_ADMIN".equals(r.getRoleName()));
    }

    /** Maps a theatre-admin User to a safe DTO with status. */
    private Map<String, Object> toDto(User u) {
        String status;
        if (Boolean.TRUE.equals(u.getRejected())) {
            status = "REJECTED";
        } else if (Boolean.TRUE.equals(u.getApproved())) {
            status = "APPROVED";
        } else {
            status = "PENDING";
        }
        java.util.Map<String, Object> dto = new java.util.LinkedHashMap<>();
        dto.put("id", u.getId());
        dto.put("name", u.getName());
        dto.put("email", u.getEmail());
        dto.put("status", status);
        dto.put("theatreId", u.getTheatreId());
        return dto;
    }

    /** Returns ALL theatre-admin accounts (pending + approved + rejected) so super admin can see the full history. */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getAllTheatreAdmins() {
        List<Map<String, Object>> admins = userRepository.findAll().stream()
                .filter(this::isTheatreAdmin)
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(admins);
    }

    @PutMapping("/approve/{userId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> approveAdmin(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        user.setApproved(Boolean.TRUE);
        user.setRejected(Boolean.FALSE);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Admin approved", "id", userId));
    }

    @PutMapping("/reject/{userId}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<?> rejectAdmin(@PathVariable Long userId) {
        User user = userRepository.findById(userId).orElse(null);
        if (user == null) return ResponseEntity.status(HttpStatus.NOT_FOUND).body("User not found");
        user.setApproved(Boolean.FALSE);
        user.setRejected(Boolean.TRUE);
        userRepository.save(user);
        return ResponseEntity.ok(Map.of("message", "Admin rejected", "id", userId));
    }
}

