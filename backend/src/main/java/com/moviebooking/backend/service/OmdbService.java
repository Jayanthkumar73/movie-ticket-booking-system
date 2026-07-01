package com.moviebooking.backend.service;

import com.moviebooking.backend.dto.OmdbDetailResponse;
import com.moviebooking.backend.dto.OmdbSearchResponse;
import com.moviebooking.backend.dto.OmdbSearchResultDTO;
import com.moviebooking.backend.entity.Movie;
import com.moviebooking.backend.repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Talks to the OMDb API and turns its responses into our own Movie entities.
 * Admins search by title, then import a chosen result into the local catalogue
 * so it can be scheduled as a show.
 */
@Service
public class OmdbService {

    private static final DateTimeFormatter OMDB_DATE =
            DateTimeFormatter.ofPattern("dd MMM yyyy", Locale.ENGLISH);
    private static final Pattern RUNTIME_MINUTES = Pattern.compile("(\\d+)");
    private static final String NA = "N/A";

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${omdb.api-key}")
    private String apiKey;

    @Value("${omdb.base-url}")
    private String baseUrl;

    @Autowired
    private MovieRepository movieRepository;

    /**
     * Search OMDb by title. Returns an empty list when OMDb finds nothing
     * (it returns Response=False in that case rather than an error).
     */
    public List<OmdbSearchResultDTO> search(String query) {
        String url = UriComponentsBuilder.fromUriString(baseUrl)
                .queryParam("apikey", apiKey)
                .queryParam("s", query)
                .queryParam("type", "movie")
                .toUriString();

        OmdbSearchResponse res = restTemplate.getForObject(url, OmdbSearchResponse.class);
        if (res == null || res.getSearch() == null || !"True".equalsIgnoreCase(res.getResponse())) {
            return Collections.emptyList();
        }

        return res.getSearch().stream()
                .map(item -> new OmdbSearchResultDTO(
                        item.getImdbId(),
                        item.getTitle(),
                        item.getYear(),
                        cleanPoster(item.getPoster()),
                        movieRepository.findByImdbId(item.getImdbId()).isPresent()))
                .collect(Collectors.toList());
    }

    /**
     * Import a movie by its IMDb id. Idempotent: if the movie was already
     * imported it is returned as-is instead of creating a duplicate.
     */
    public Movie importMovie(String imdbId) {
        Optional<Movie> existing = movieRepository.findByImdbId(imdbId);
        if (existing.isPresent()) {
            return existing.get();
        }

        String url = UriComponentsBuilder.fromUriString(baseUrl)
                .queryParam("apikey", apiKey)
                .queryParam("i", imdbId)
                .queryParam("plot", "full")
                .toUriString();

        OmdbDetailResponse d = restTemplate.getForObject(url, OmdbDetailResponse.class);
        if (d == null || !"True".equalsIgnoreCase(d.getResponse())) {
            String reason = (d != null && d.getError() != null) ? d.getError() : "Movie not found on OMDb";
            throw new RuntimeException(reason);
        }

        Movie movie = new Movie();
        movie.setMovieName(orUnknown(d.getTitle()));
        movie.setLanguage(firstValue(d.getLanguage()));
        movie.setGenre(orUnknown(d.getGenre()));
        movie.setDuration(parseRuntime(d.getRuntime()));
        movie.setReleaseDate(parseReleaseDate(d.getReleased()));
        movie.setDescription(isNa(d.getPlot()) ? null : d.getPlot());
        movie.setPosterImageUrl(cleanPoster(d.getPoster()));
        movie.setImdbId(d.getImdbId());

        return movieRepository.save(movie);
    }

    // ── parsing helpers ─────────────────────────────────────

    /** "148 min" -> 148. Falls back to 0 when OMDb has no runtime. */
    private Integer parseRuntime(String runtime) {
        if (isNa(runtime)) return 0;
        Matcher m = RUNTIME_MINUTES.matcher(runtime);
        return m.find() ? Integer.parseInt(m.group(1)) : 0;
    }

    /** "16 Jul 2010" -> LocalDate. Falls back to today if OMDb has no/odd date. */
    private LocalDate parseReleaseDate(String released) {
        if (isNa(released)) return LocalDate.now();
        try {
            return LocalDate.parse(released, OMDB_DATE);
        } catch (Exception e) {
            return LocalDate.now();
        }
    }

    /** OMDb gives comma-separated languages; we keep the primary one. */
    private String firstValue(String csv) {
        if (isNa(csv)) return "Unknown";
        return csv.split(",")[0].trim();
    }

    private String cleanPoster(String poster) {
        return isNa(poster) ? null : poster;
    }

    private String orUnknown(String value) {
        return isNa(value) ? "Unknown" : value;
    }

    private boolean isNa(String value) {
        return value == null || value.isBlank() || NA.equalsIgnoreCase(value);
    }
}
