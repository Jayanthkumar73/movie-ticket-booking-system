package com.moviebooking.backend.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import java.util.List;

/**
 * Response from OMDb title search (?s=<query>).
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class OmdbSearchResponse {

    @JsonProperty("Search")
    private List<Item> search;

    @JsonProperty("Response")
    private String response;      // "True" / "False"

    @JsonProperty("Error")
    private String error;

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class Item {
        @JsonProperty("Title")
        private String title;

        @JsonProperty("Year")
        private String year;

        @JsonProperty("imdbID")
        private String imdbId;

        @JsonProperty("Poster")
        private String poster;

        @JsonProperty("Type")
        private String type;      // movie / series / episode
    }
}
