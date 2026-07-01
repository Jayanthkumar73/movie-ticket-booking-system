package com.moviebooking.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Full movie details from OMDb (?i=<imdbId>). OMDb uses capitalised JSON keys,
 * so each field is mapped explicitly. Unknown keys are ignored.
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OmdbDetailResponse {

    @JsonProperty("Title")
    private String title;

    @JsonProperty("Released")
    private String released;      // e.g. "16 Jul 2010"

    @JsonProperty("Runtime")
    private String runtime;       // e.g. "148 min"

    @JsonProperty("Genre")
    private String genre;         // e.g. "Action, Adventure, Sci-Fi"

    @JsonProperty("Language")
    private String language;      // e.g. "English, Japanese, French"

    @JsonProperty("Plot")
    private String plot;

    @JsonProperty("Poster")
    private String poster;

    @JsonProperty("imdbID")
    private String imdbId;

    @JsonProperty("Response")
    private String response;      // "True" / "False"

    @JsonProperty("Error")
    private String error;
}
