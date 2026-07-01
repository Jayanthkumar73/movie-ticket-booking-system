package com.moviebooking.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A single row returned to the admin UI when searching OMDb by title.
 * `alreadyImported` lets the frontend disable the Import button for movies
 * that are already in our database.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class OmdbSearchResultDTO {
    private String imdbId;
    private String title;
    private String year;
    private String poster;
    private boolean alreadyImported;
}
