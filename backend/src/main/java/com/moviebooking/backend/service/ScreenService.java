package com.moviebooking.backend.service;

import com.moviebooking.backend.dto.ScreenRequest;
import com.moviebooking.backend.dto.SeatCategoryRequest;
import com.moviebooking.backend.entity.Screen;
import com.moviebooking.backend.entity.ScreenType;
import com.moviebooking.backend.entity.SeatCategory;
import com.moviebooking.backend.entity.Theatre;
import com.moviebooking.backend.repository.ScreenRepository;
import com.moviebooking.backend.repository.TheatreRepository;
import com.moviebooking.backend.util.SeatLayoutUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
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

    public Screen addScreen(Long theatreId, ScreenRequest request) {
        Theatre theatre = theatreRepository.findById(theatreId)
                .orElseThrow(() -> new RuntimeException("Theatre not found"));
        Screen screen = new Screen();
        screen.setTheatre(theatre);
        applyRequest(screen, request);
        return screenRepository.save(screen);
    }

    public Screen updateScreen(Long id, ScreenRequest request) {
        Screen screen = screenRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Screen not found"));
        applyRequest(screen, request);
        return screenRepository.save(screen);
    }

    /**
     * Copies request fields onto the screen. When categories are supplied they replace the
     * existing ones (orphanRemoval deletes the old rows) and totalSeats is derived from them;
     * otherwise the screen stays a legacy flat-price screen using the supplied totalSeats.
     */
    private void applyRequest(Screen screen, ScreenRequest request) {
        screen.setScreenName(request.getScreenName());
        if (request.getScreenType() != null) {
            screen.setScreenType(ScreenType.valueOf(request.getScreenType()));
        }

        List<SeatCategoryRequest> catReqs = request.getCategories();
        if (catReqs != null && !catReqs.isEmpty()) {
            List<SeatCategory> categories = new ArrayList<>();
            int totalRows = 0;
            for (int i = 0; i < catReqs.size(); i++) {
                SeatCategoryRequest cr = catReqs.get(i);
                SeatCategory cat = new SeatCategory();
                cat.setName(cr.getName());
                cat.setPrice(cr.getPrice());
                cat.setNumRows(cr.getNumRows());
                cat.setSeatsPerRow(cr.getSeatsPerRow());
                cat.setDisplayOrder(cr.getDisplayOrder() != null ? cr.getDisplayOrder() : i);
                cat.setBestseller(cr.isBestseller());
                cat.setScreen(screen);
                categories.add(cat);
                totalRows += cr.getNumRows() == null ? 0 : cr.getNumRows();
            }
            if (totalRows > 26) {
                throw new RuntimeException("A screen may define at most 26 rows (A–Z) across all categories");
            }
            // Replace in place so orphanRemoval cleans up categories dropped on update.
            screen.getSeatCategories().clear();
            screen.getSeatCategories().addAll(categories);
            screen.setTotalSeats(SeatLayoutUtil.totalSeats(categories));
        } else {
            screen.getSeatCategories().clear();
            screen.setTotalSeats(request.getTotalSeats());
        }
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
