package com.moviebooking.backend.repository;

import com.moviebooking.backend.entity.Theatre;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TheatreRepository extends JpaRepository<Theatre, Long> {
}
