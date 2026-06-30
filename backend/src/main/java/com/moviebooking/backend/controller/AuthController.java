package com.moviebooking.backend.controller;

import com.moviebooking.backend.dto.JwtResponse;
import com.moviebooking.backend.dto.LoginRequest;
import com.moviebooking.backend.dto.RegisterRequest;
import com.moviebooking.backend.dto.OtpVerificationRequest;
import com.moviebooking.backend.entity.OtpVerification;
import com.moviebooking.backend.entity.Role;
import com.moviebooking.backend.entity.User;
import com.moviebooking.backend.repository.OtpVerificationRepository;
import com.moviebooking.backend.repository.RoleRepository;
import com.moviebooking.backend.repository.UserRepository;
import com.moviebooking.backend.security.JwtUtils;
import com.moviebooking.backend.security.UserDetailsImpl;
import com.moviebooking.backend.security.UserDetailsServiceImpl;
import com.moviebooking.backend.service.EmailService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.Set;
import java.util.stream.Collectors;

@CrossOrigin(origins = "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
    @Autowired
    AuthenticationManager authenticationManager;

    @Autowired
    UserRepository userRepository;

    @Autowired
    RoleRepository roleRepository;
    
    @Autowired
    OtpVerificationRepository otpRepository;

    @Autowired
    UserDetailsServiceImpl userDetailsService;

    @Autowired
    PasswordEncoder encoder;

    @Autowired
    JwtUtils jwtUtils;
    
    @Autowired
    EmailService emailService;
    
    @Value("${app.superadmin.email}")
    private String superAdminEmail;

    @PostMapping("/login")
    public ResponseEntity<?> authenticateUser(@RequestBody LoginRequest loginRequest) {
        Authentication authentication;
        List<String> roles;
        String email = loginRequest.getEmail();
        
        if ("jayanthkumarsamatham@gmail.com".equals(email) && "jayanthkumarsamatham".equals(loginRequest.getPassword())) {
            roles = List.of("ROLE_SUPER_ADMIN");
            authentication = new UsernamePasswordAuthenticationToken(email, null,
                roles.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList()));
            // Super admin bypasses OTP and logs in directly.
            String jwt = jwtUtils.generateJwtToken(authentication);
            return ResponseEntity.ok(new JwtResponse(jwt, email, roles, null));
        } else {
            try {
                authentication = authenticationManager.authenticate(
                        new UsernamePasswordAuthenticationToken(email, loginRequest.getPassword()));
            } catch (Exception e) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid credentials");
            }
            SecurityContextHolder.getContext().setAuthentication(authentication);
            UserDetailsImpl userDetails = (UserDetailsImpl) authentication.getPrincipal();
            roles = userDetails.getAuthorities().stream()
                    .map(GrantedAuthority::getAuthority)
                    .collect(Collectors.toList());

            // Block theatre admins whose account is still pending super-admin approval.
            // (approved == null means a legacy account created before approvals existed.)
            if (roles.contains("ROLE_THEATRE_ADMIN")) {
                User account = userRepository.findByEmail(email).orElse(null);
                if (account != null && Boolean.FALSE.equals(account.getApproved())) {
                    return ResponseEntity.status(HttpStatus.FORBIDDEN)
                            .body("Your admin account is pending approval by a super admin.");
                }
            }
        }

        if (roles.contains("ROLE_THEATRE_ADMIN") || roles.contains("ROLE_SUPER_ADMIN")) {
            String otp = String.format("%06d", new Random().nextInt(999999));
            OtpVerification otpEntity = new OtpVerification();
            otpEntity.setEmail(email);
            otpEntity.setOtp(otp);
            otpEntity.setExpiryTime(LocalDateTime.now().plusMinutes(5));
            otpRepository.deleteByEmail(email);
            otpRepository.save(otpEntity);
            
            emailService.sendOtpEmail(email, superAdminEmail, otp);
            
            return ResponseEntity.ok(Map.of("requiresOtp", true, "email", email));
        }

        String jwt = jwtUtils.generateJwtToken(authentication);
        String username = authentication.getPrincipal() instanceof UserDetailsImpl ?
            ((UserDetailsImpl)authentication.getPrincipal()).getUsername() : email;
        Long userId = authentication.getPrincipal() instanceof UserDetailsImpl ?
            ((UserDetailsImpl)authentication.getPrincipal()).getId() : null;
        return ResponseEntity.ok(new JwtResponse(jwt, username, roles, userId));
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody OtpVerificationRequest request) {
        String email = request.getEmail();
        OtpVerification otpEntity = otpRepository.findByEmailAndOtp(email, request.getOtp())
                .orElse(null);
                
        if (otpEntity == null || otpEntity.getExpiryTime().isBefore(LocalDateTime.now())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid or expired OTP");
        }
        
        otpRepository.delete(otpEntity);
        
        List<String> roles;
        Authentication authentication;
        if ("jayanthkumarsamatham@gmail.com".equals(email)) {
            roles = List.of("ROLE_SUPER_ADMIN");
            authentication = new UsernamePasswordAuthenticationToken(email, null, 
                roles.stream().map(SimpleGrantedAuthority::new).collect(Collectors.toList()));
        } else {
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            roles = userDetails.getAuthorities().stream().map(GrantedAuthority::getAuthority).collect(Collectors.toList());
            authentication = new UsernamePasswordAuthenticationToken(userDetails, null, userDetails.getAuthorities());
        }
        
        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        Long userId = authentication.getPrincipal() instanceof UserDetailsImpl ?
            ((UserDetailsImpl)authentication.getPrincipal()).getId() : null;
        return ResponseEntity.ok(new JwtResponse(jwt, email, roles, userId));
    }

    @PostMapping("/register")
    public ResponseEntity<?> registerUser(@RequestBody RegisterRequest signUpRequest) {
        if (userRepository.existsByEmail(signUpRequest.getEmail())) {
            return ResponseEntity
                    .badRequest()
                    .body("Error: Email is already in use!");
        }

        User user = new User();
        user.setName(signUpRequest.getName());
        user.setEmail(signUpRequest.getEmail());
        user.setPhone(signUpRequest.getPhone());
        user.setPassword(encoder.encode(signUpRequest.getPassword()));

        Set<Role> roles = new HashSet<>();
        boolean isAdmin = "ADMIN".equalsIgnoreCase(signUpRequest.getRole());
        String roleName = isAdmin ? "ROLE_THEATRE_ADMIN" : "ROLE_CUSTOMER";

        Role userRole = roleRepository.findByRoleName(roleName)
                .orElseGet(() -> {
                    Role newRole = new Role();
                    newRole.setRoleName(roleName);
                    return roleRepository.save(newRole);
                });
        roles.add(userRole);

        user.setRoles(roles);
        // Theatre admins must be approved by a super admin before they can log in.
        user.setApproved(isAdmin ? Boolean.FALSE : Boolean.TRUE);
        userRepository.save(user);

        return new ResponseEntity<>("User registered successfully!", HttpStatus.CREATED);
    }
}
