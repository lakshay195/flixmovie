const TMDB_API_KEY = "c7ec19ffdd3279641fb606d19ceb9bb1";
const OMDB_API_KEY = "d7b2e9d9";
const BASE_URL = "https://api.themoviedb.org/3";

// Containers
const trendingContainer = document.getElementById('trending');
const topRatedContainer = document.getElementById('top-rated');
const newReleasesContainer = document.getElementById('new-releases');
const detailsSection = document.getElementById('details-section');
const searchInput = document.getElementById('search');


// Retrieve liked and wishlist movies from local storage
let likedMovies = JSON.parse(localStorage.getItem('likedMovies')) || [];
let wishlistMovies = JSON.parse(localStorage.getItem('wishlistMovies')) || [];

// ✅ Function to Display Attractive Alerts with Auto-Close
function showAlert(message, type = 'success') {
    const alertBox = document.getElementById('alert-message');

    // Set color based on type
    if (type === 'success') {
        alertBox.style.background = '#4caf50';
    } else if (type === 'error') {
        alertBox.style.background = '#f44336';
    } else if (type === 'info') {
        alertBox.style.background = '#2196f3';
    }

    alertBox.textContent = message;
    alertBox.classList.add('show');

    setTimeout(() => {
        alertBox.classList.remove('show');
    }, 4000);
}

// ✅ Fetch and Display Movies
async function fetchMovies(url, container) {
    try {
        const response = await fetch(`${BASE_URL}${url}?api_key=${TMDB_API_KEY}`);
        const data = await response.json();
        displayMovies(data.results, container);
    } catch (error) {
        console.error("Error fetching movies:", error);
    }
}

// ✅ Display Movies with Like and Wishlist
function displayMovies(movies, container) {
    container.innerHTML = '';

    movies.forEach(movie => {
        const { id, title, original_title, poster_path, vote_average } = movie;

        const isLiked = likedMovies.some(m => m.id === id);
        const isWishlisted = wishlistMovies.some(m => m.id === id);

        const movieCard = document.createElement('div');
        movieCard.classList.add('movie-card');

        const poster = poster_path
            ? `https://image.tmdb.org/t/p/w500${poster_path}`
            : 'https://via.placeholder.com/500x750?text=No+Image';

        movieCard.innerHTML = `
            <div class="card-wrapper" data-id="${id}" data-title="${title}">
                <img src="${poster}" alt="${title}" class="poster">
                <div class="overlay">
                    <span class="heart-icon ${isLiked ? 'liked' : ''}" 
                          onclick="event.stopPropagation(); toggleLike(${id}, '${title}', '${poster}', ${vote_average}, this)">
                        ❤️
                    </span>
                    <span class="wishlist-icon ${isWishlisted ? 'wishlisted' : ''}"
                          onclick="event.stopPropagation(); toggleWishlist(${id}, '${title}', '${poster}', ${vote_average}, this)">
                        🌟
                    </span>
                </div>
                <h3>${title}</h3>
                <p>⭐ ${vote_average}</p>
            </div>
        `;

        movieCard.addEventListener('click', () => {
            fetchMovieDetails(id, original_title);
        });

        container.appendChild(movieCard);
    });
}

// ✅ Toggle Like Functionality
function toggleLike(id, title, poster, rating, heartIcon) {
    const movieIndex = likedMovies.findIndex(m => m.id === id);

    if (movieIndex !== -1) {
        likedMovies.splice(movieIndex, 1);
        heartIcon.classList.remove('liked');
        showAlert(`"${title}" removed from Liked Movies!`, 'error');
    } else {
        likedMovies.push({ id, title, poster, rating });
        heartIcon.classList.add('liked');
        showAlert(`"${title}" added to Liked Movies!`, 'success');
    }

    localStorage.setItem('likedMovies', JSON.stringify(likedMovies));
}

// ✅ Toggle Wishlist Functionality
function toggleWishlist(id, title, poster, rating, wishlistIcon) {
    const movieIndex = wishlistMovies.findIndex(m => m.id === id);

    if (movieIndex !== -1) {
        wishlistMovies.splice(movieIndex, 1);
        wishlistIcon.classList.remove('wishlisted');
        showAlert(`"${title}" removed from Wishlist!`, 'error');
    } else {
        wishlistMovies.push({ id, title, poster, rating });
        wishlistIcon.classList.add('wishlisted');
        showAlert(`"${title}" added to Wishlist!`, 'success');
    }

    localStorage.setItem('wishlistMovies', JSON.stringify(wishlistMovies));
}
// ✅ Fetch and Display Movie Details (with Similar Movies)
async function fetchMovieDetails(movieId, title) {
    window.currentDetailsMovieId = movieId;
    window.currentDetailsMovieTitle = title;

    try {
        // Fetch TMDB and OMDB data
        const tmdbRes = await fetch(`${BASE_URL}/movie/${movieId}?api_key=${TMDB_API_KEY}`);
        const tmdbData = await tmdbRes.json();

        const omdbRes = await fetch(`https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}`);
        const omdbData = await omdbRes.json();

        // Store poster and rating for wishlist use
        window.currentDetailsMoviePoster = tmdbData.poster_path
            ? `https://image.tmdb.org/t/p/w500${tmdbData.poster_path}`
            : 'https://via.placeholder.com/500x750?text=No+Image';
        window.currentDetailsMovieRating = omdbData.imdbRating || tmdbData.vote_average || 'N/A';

        // Populate details UI
        document.getElementById('detailsPoster').src = window.currentDetailsMoviePoster;
        document.getElementById('detailsTitle').textContent = omdbData.Title || tmdbData.title;
        document.getElementById('detailsDesc').textContent = omdbData.Plot || tmdbData.overview;
        document.getElementById('detailsDirector').textContent = omdbData.Director || 'N/A';
        document.getElementById('detailsActors').textContent = omdbData.Actors || 'N/A';
        document.getElementById('detailsRuntime').textContent = omdbData.Runtime || `${tmdbData.runtime} min`;
        document.getElementById('detailsGenres').textContent = tmdbData.genres.map(g => g.name).join(', ') || 'N/A';
        document.getElementById('detailsRating').textContent = window.currentDetailsMovieRating;
        document.getElementById('detailsRelease').textContent = omdbData.Released || tmdbData.release_date || 'N/A';

        // Show the overlay
        detailsSection.classList.add('show');

        // 🎯 Load Similar Movies
        const similarContainer = document.getElementById('similar-movies');
        similarContainer.innerHTML = '<p style="color:white;">Loading similar movies...</p>';

        try {
            const simRes = await fetch(`/api/similar/${movieId}`);
            const similarMovies = await simRes.json();

            similarContainer.innerHTML = ''; // Clear loading text

            if (Array.isArray(similarMovies) && similarMovies.length > 0) {
                displayMovies(similarMovies, similarContainer);
            } else {
                similarContainer.innerHTML = '<p style="color:white;">No similar movies found.</p>';
            }
        } catch (error) {
           
        }
    } catch (error) {
        console.error("Error fetching movie details:", error);
    }
}
// ✅ Close Details Section
function closeDetails() {
    detailsSection.classList.remove('show');
}

function toggleWishlistFromDetails() {
    const title = document.getElementById('detailsTitle').textContent;
    const poster = document.getElementById('detailsPoster').src;
    const rating = document.getElementById('detailsRating').textContent;

    // Extract movie ID from the current TMDB poster URL
    const movieIdMatch = poster.match(/\/([0-9]+)\.jpg$/);
    const id = window.currentDetailsMovieId || Date.now(); // fallback unique ID

    const icon = document.getElementById('wishlist-icon');

    toggleWishlist(id, title, poster, rating, icon);
}
async function searchMovies() {
    const query = document.getElementById('search').value.trim();
    const searchResults = document.getElementById('search-results');
    const detailsSection = document.getElementById('movie-details');

    if (!query) {
        showAlert("Please enter a movie name!", "warning");
        return;
    }

    try {
        const res = await fetch(`${BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (data.results.length === 0) {
            searchResults.innerHTML = "<p style='color:white;'>No movies found!</p>";
            return;
        }

        const movie = data.results[0]; // pick top result
        await fetchMovieDetails(movie.id, movie.title); // use your existing function
    } catch (error) {
        console.error("Error searching movie:", error);
        showAlert("Failed to search for the movie!", "error");
    }
}

// ✅ Fetch Random Posters for Hero Section
async function fetchHeroPosters() {
    const posterContainer = document.getElementById('hero-posters');

    try {
        const response = await fetch(`${BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}`);
        const data = await response.json();

        posterContainer.innerHTML = '';
        const shuffledMovies = data.results.sort(() => 0.5 - Math.random()).slice(0, 5);

        shuffledMovies.forEach((movie, index) => {
            const posterUrl = movie.poster_path
                ? `https://image.tmdb.org/t/p/w1280${movie.poster_path}`
                : 'https://via.placeholder.com/1280x720?text=No+Image';

            const posterDiv = document.createElement('div');
            posterDiv.classList.add('poster-fade');
            posterDiv.style.backgroundImage = `url('${posterUrl}')`;
            posterDiv.style.animationDelay = `${index * 5}s`;

            posterContainer.appendChild(posterDiv);
        });

    } catch (error) {
        console.error("Error fetching hero posters:", error);
    }
}

// ✅ Fetch At Least 10 Recommended Movies
async function fetchRecommendedMovies() {
    const recommendedContainer = document.getElementById('recommended');
    const trendingContainer = document.getElementById('trending');

    recommendedContainer.innerHTML = '';
    trendingContainer.innerHTML = '';

    if (likedMovies.length === 0) {
        fetchMovies('/movie/popular', trendingContainer);
        return;
    }

    const uniqueMovieIds = new Set();
    const recommendedMovies = [];

    try {
        for (const movie of likedMovies.slice(-5)) {
            const res = await fetch(`${BASE_URL}/movie/${movie.id}/similar?api_key=${TMDB_API_KEY}`);
            const data = await res.json();

            data.results.forEach(similarMovie => {
                if (!uniqueMovieIds.has(similarMovie.id) && recommendedMovies.length < 15) {
                    uniqueMovieIds.add(similarMovie.id);
                    recommendedMovies.push(similarMovie);
                }
            });

            if (recommendedMovies.length >= 10) break;
        }

        if (recommendedMovies.length >= 10) {
            displayMovies(recommendedMovies.slice(0, 10), recommendedContainer);
        } else {
            fetchMovies('/movie/popular', trendingContainer);
            showAlert("Showing trending movies as no enough recommendations!", "info");
        }

    } catch (error) {
        console.error("Error fetching recommended movies:", error);
        showAlert("Failed to load recommended movies!", "error");
    }
}
// ✅ Show liked movies with posters first, then similar ones
async function fetchLikedGenreRecommendations() {
    const likedGenreContainer = document.getElementById('liked-genre-movies');
    likedGenreContainer.innerHTML = '';

    if (likedMovies.length === 0) return;

    const likedIds = new Set(likedMovies.map(movie => movie.id));
    const uniqueMovieIds = new Set();
    const genreBasedRecommendations = [];

    try {
        // First, fetch full TMDB data for liked movies (to get poster_path)
        for (const liked of likedMovies) {
            const res = await fetch(`${BASE_URL}/movie/${liked.id}?api_key=${TMDB_API_KEY}`);
            const data = await res.json();

            if (data.poster_path && !uniqueMovieIds.has(data.id)) {
                uniqueMovieIds.add(data.id);
                genreBasedRecommendations.push(data);
            }
        }

        // Then, fetch similar movies (excluding liked ones)
        for (const movie of likedMovies.slice(-5)) {
            const res = await fetch(`${BASE_URL}/movie/${movie.id}/similar?api_key=${TMDB_API_KEY}`);
            const data = await res.json();

            data.results.forEach(similarMovie => {
                const isNotLiked = !likedIds.has(similarMovie.id);
                const isUnique = !uniqueMovieIds.has(similarMovie.id);
                const hasPoster = similarMovie.poster_path !== null;

                if (isNotLiked && isUnique && hasPoster && genreBasedRecommendations.length < 20) {
                    uniqueMovieIds.add(similarMovie.id);
                    genreBasedRecommendations.push(similarMovie);
                }
            });

            if (genreBasedRecommendations.length >= 20) break;
        }

        if (genreBasedRecommendations.length > 0) {
            displayMovies(genreBasedRecommendations, likedGenreContainer);
        }

    } catch (error) {
        console.error("Error fetching liked and similar movies:", error);
        showAlert("Failed to load liked-based recommendations!", "error");
    }
}

// ✅ Show wishlist movies with posters first, then similar ones
async function fetchWishlistGenreRecommendations() {
    const wishlistGenreContainer = document.getElementById('wishlist-genre-movies');
    wishlistGenreContainer.innerHTML = '';

    const wishlistMovies = JSON.parse(localStorage.getItem('wishlistMovies')) || [];
    if (wishlistMovies.length === 0) return;

    const wishlistIds = new Set(wishlistMovies.map(movie => movie.id));
    const uniqueMovieIds = new Set();
    const genreBasedRecommendations = [];

    try {
        // Step 1: Fetch full TMDB details for wishlist movies
        for (const wishlistMovie of wishlistMovies) {
            const res = await fetch(`${BASE_URL}/movie/${wishlistMovie.id}?api_key=${TMDB_API_KEY}`);
            const data = await res.json();

            if (data.poster_path && !uniqueMovieIds.has(data.id)) {
                uniqueMovieIds.add(data.id);
                genreBasedRecommendations.push(data);
            }
        }

        // Step 2: Fetch similar movies to wishlist ones (excluding already wishlist ones)
        for (const movie of wishlistMovies.slice(-5)) {
            const res = await fetch(`${BASE_URL}/movie/${movie.id}/similar?api_key=${TMDB_API_KEY}`);
            const data = await res.json();

            data.results.forEach(similarMovie => {
                const isNotWishlist = !wishlistIds.has(similarMovie.id);
                const isUnique = !uniqueMovieIds.has(similarMovie.id);
                const hasPoster = similarMovie.poster_path !== null;

                if (isNotWishlist && isUnique && hasPoster && genreBasedRecommendations.length < 20) {
                    uniqueMovieIds.add(similarMovie.id);
                    genreBasedRecommendations.push(similarMovie);
                }
            });

            if (genreBasedRecommendations.length >= 20) break;
        }

        if (genreBasedRecommendations.length > 0) {
            displayMovies(genreBasedRecommendations, wishlistGenreContainer);
        }

    } catch (error) {
        console.error("Error fetching wishlist-based recommendations:", error);
        showAlert("Failed to load wishlist-based recommendations!", "error");
    }
}
// ✅ Recommend movies based on the most common genre in the wishlist
async function fetchGenreRecommendationsFromWishlist() {
    const genreContainer = document.getElementById('genre-movies');
    genreContainer.innerHTML = '';

    const wishlistMovies = JSON.parse(localStorage.getItem('wishlistMovies')) || [];
    if (wishlistMovies.length === 0) return;

    const genreCount = {};
    const wishlistIds = new Set(wishlistMovies.map(m => m.id));

    try {
        // Step 1: Count genres in wishlist
        for (const movie of wishlistMovies) {
            const res = await fetch(`${BASE_URL}/movie/${movie.id}?api_key=${TMDB_API_KEY}`);
            const data = await res.json();
            data.genres.forEach(genre => {
                genreCount[genre.id] = (genreCount[genre.id] || 0) + 1;
            });
        }

        // Step 2: Find most common genre
        const mostCommonGenreId = Object.keys(genreCount).reduce((a, b) => genreCount[a] > genreCount[b] ? a : b, null);
        if (!mostCommonGenreId) return;

        // Step 3: Fetch movies of that genre from TMDB
        const res = await fetch(`${BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&with_genres=${mostCommonGenreId}`);
        const data = await res.json();

        // Step 4: Filter out already watchlisted movies
        const filtered = data.results.filter(movie =>
            !wishlistIds.has(movie.id) && movie.poster_path !== null
        ).slice(0, 15);

        if (filtered.length > 0) {
            displayMovies(filtered, genreContainer);
        }

    } catch (error) {
        console.error("Error fetching genre-based recommendations:", error);
        showAlert("Failed to load genre-based recommendations!", "error");
    }
}


// ✅ Page Load
window.onload = () => {
    getLikedMoviesGenres();
    
};

window.addEventListener('DOMContentLoaded', () => {
    if (likedMovies.length > 0) {
        fetchRecommendedMovies();
        fetchLikedGenreRecommendations();
        fetchWishlistGenreRecommendations();
        fetchGenreRecommendationsFromWishlist();
    } else {
        fetchMovies('/movie/popular', trendingContainer);
    }

    fetchMovies('/movie/top_rated', topRatedContainer);
    fetchMovies('/movie/now_playing', newReleasesContainer);
});

fetchHeroPosters();
fetchMovies('/movie/popular', trendingContainer);
fetchMovies('/movie/top_rated', topRatedContainer);
fetchMovies('/movie/now_playing', newReleasesContainer);
