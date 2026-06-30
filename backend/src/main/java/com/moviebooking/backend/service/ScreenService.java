package com.moviebooking.backend.service;

import com.moviebooking.backend.entity.Screen;
import com.moviebooking.backend.entity.Theatre;
import com.moviebooking.backend.repository.ScreenRepository;
import com.moviebooking.backend.repository.TheatreRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ScreenService {

    @Autowired
    private ScreenRepository screenRepository;

    @Autowired
    private TheatreRepository theatreRepository;

    public List<Screen> getScreensByTheatre(Long theatreId) {
        return screenRepository.findByTheatreId(theatreId);
    }

    public Screen addScreen(Long theatreId, Screen screen) {
        Theatre theatre = theatreRepository.findById(theatreId)
                .orElseThrow(() -> new RuntimeException("Theatre not found"));
        screen.setTheatre(theatre);
        return screenRepository.save(screen);
    }

    public Screen updateScreen(Long id, Screen screenDetails) {
        Screen screen = screenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Screen not found"));
        screen.setScreenName(screenDetails.getScreenName());
        screen.setTotalSeats(screenDetails.getTotalSeats());
        screen.setScreenType(screenDetails.getScreenType());
        return screenRepository.save(screen);
    }

    public void deleteScreen(Long id) {
        screenRepository.deleteById(id);
    }

    public Screen getScreenById(Long id) {
        return screenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Screen not found"));
    }

    public List<Screen> getAllScreens() {
        return screenRepository.findAll();
    }
}
