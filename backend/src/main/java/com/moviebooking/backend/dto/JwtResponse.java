package com.moviebooking.backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@NoArgsConstructor
public class JwtResponse {
    private String token;
    private String email;
    private List<String> roles;
    private Long userId;
    private Long theatreId;

    public JwtResponse(String token, String email, List<String> roles) {
        this.token = token;
        this.email = email;
        this.roles = roles;
    }

    public JwtResponse(String token, String email, List<String> roles, Long userId) {
        this.token = token;
        this.email = email;
        this.roles = roles;
        this.userId = userId;
    }

    public JwtResponse(String token, String email, List<String> roles, Long userId, Long theatreId) {
        this.token = token;
        this.email = email;
        this.roles = roles;
        this.userId = userId;
        this.theatreId = theatreId;
    }
}
