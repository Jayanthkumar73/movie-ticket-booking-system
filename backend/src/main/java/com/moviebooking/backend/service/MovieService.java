package com.moviebooking.backend.service;

import com.moviebooking.backend.entity.Movie;
import com.moviebooking.backend.repository.MovieRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
public class MovieService {
    @Autowired
    private MovieRepository movieRepository;

    @Autowired
    private CloudinaryService cloudinaryService;

    public List<Movie> getAllMovies() {
        return movieRepository.findAll();
    }

    public Movie getMovieById(Long id) {
        return movieRepository.findById(id).orElseThrow(() -> new RuntimeException("Movie not found"));
    }

    public Movie addMovie(Movie movie, MultipartFile file) throws IOException {
        if (file != null && !file.isEmpty()) {
            String imageUrl = cloudinaryService.uploadImage(file);
            movie.setPosterImageUrl(imageUrl);
        }
        return movieRepository.save(movie);
    }

    public Movie updateMovie(Long id, Movie movieDetails, MultipartFile file) throws IOException {
        Movie movie = getMovieById(id);
        movie.setMovieName(movieDetails.getMovieName());
        movie.setLanguage(movieDetails.getLanguage());
        movie.setGenre(movieDetails.getGenre());
        movie.setDuration(movieDetails.getDuration());
        movie.setReleaseDate(movieDetails.getReleaseDate());
        movie.setDescription(movieDetails.getDescription());
        movie.setTrailerUrl(movieDetails.getTrailerUrl());

        if (file != null && !file.isEmpty()) {
            String imageUrl = cloudinaryService.uploadImage(file);
            movie.setPosterImageUrl(imageUrl);
        }

        return movieRepository.save(movie);
    }

    public void deleteMovie(Long id) {
        movieRepository.deleteById(id);
    }
}
