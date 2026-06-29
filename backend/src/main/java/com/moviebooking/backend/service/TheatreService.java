package com.moviebooking.backend.service;

import com.moviebooking.backend.entity.Theatre;
import com.moviebooking.backend.repository.TheatreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class TheatreService {
    @Autowired
    private TheatreRepository theatreRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    public List<Theatre> getAllTheatres() {
        return theatreRepository.findAll();
    }

    public Theatre getTheatreById(Long id) {
        return theatreRepository.findById(id).orElseThrow(() -> new RuntimeException("Theatre not found"));
    }

    public Theatre addTheatre(Theatre theatre, MultipartFile file) throws IOException {
        if (file != null && !file.isEmpty()) {
            String imageUrl = cloudinaryService.uploadImage(file);
            theatre.setTheatreImageUrl(imageUrl);
        }
        return theatreRepository.save(theatre);
    }

    public Theatre updateTheatre(Long id, Theatre theatreDetails, MultipartFile file) throws IOException {
        Theatre theatre = getTheatreById(id);
        theatre.setTheatreName(theatreDetails.getTheatreName());
        theatre.setCity(theatreDetails.getCity());
        theatre.setAddress(theatreDetails.getAddress());
        theatre.setManagerName(theatreDetails.getManagerName());
        theatre.setManagerContact(theatreDetails.getManagerContact());

        if (file != null && !file.isEmpty()) {
            String imageUrl = cloudinaryService.uploadImage(file);
            theatre.setTheatreImageUrl(imageUrl);
        }

        return theatreRepository.save(theatre);
    }

    public void deleteTheatre(Long id) {
        theatreRepository.deleteById(id);
    }
}
