//Initialize the Movies List from Local Storage
let movies = JSON.parse(localStorage.getItem('movies')) || [];

//Add New Movie
document.getElementById('movieForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const newMovie = {
        id: Date.now(),
        title: document.getElementById('title').value.trim(),
        director: document.getElementById('director').value.trim(),
        releaseDate: document.getElementById('releaseDate').value,
        status: document.getElementById('status').value,
        rating: 0  // Default rating is 0
    };
    movies.push(newMovie);
    saveToLocalStorage();
    renderMovies();
    e.target.reset();
});

//Sort by function
function sortMovies(criteria) {
    movies.sort((a, b) => {
        if (a[criteria] < b[criteria]) return -1;
        if (a[criteria] > b[criteria]) return 1;
        return 0;
    });
    renderMovies();
}

// Group by function
async function groupBy(criteria) {
    const grouped = {};

    // Group movies based on the selected criteria or custom grouping
    movies.forEach(movie => {
        let key;

        if (movie.title.toLowerCase().includes('harry potter')) {
            key = 'Harry Potter Series';
        } else {
            key = movie[criteria]; // Otherwise, group by the specified criteria
        }

        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(movie);
    });

    const tbody = document.getElementById('movieList');
    tbody.innerHTML = await Promise.all(Object.keys(grouped).map(async key => {
        const group = grouped[key];

        // Calculate the average rating for the group
        const avgRating = group.reduce((sum, movie) => sum + movie.rating, 0) / group.length;
        const avgRatingDisplay = avgRating.toFixed(2);

        // Sort the movies within the group by their number
        const groupWithCover = await Promise.all(group.map(async movie => {
            const cover = await fetchCover(movie.title);
            return { ...movie, cover };
        }));

        // Sort movies by number
        const sortedGroup = groupWithCover.sort((a, b) => {
            const numberA = extractNumber(a.title);
            const numberB = extractNumber(b.title);
            return numberA - numberB;
        });

        return `
            <tr>
                <td colspan="7"><strong>${key} (Average Rating: ${avgRatingDisplay})</strong></td>
            </tr>
            ${sortedGroup.map(movie => `
                <tr class="${movie.status === 'completed' ? 'completed' : ''}">
                    <td><img src="${movie.cover}" alt="${movie.title}" width="50"></td>
                    <td>${movie.title}</td>
                    <td>${movie.director}</td>
                    <td>${movie.releaseDate}</td>
                    <td>${movie.status}</td>
                    <td>${movie.rating}</td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteMovie(${movie.id})">Delete</button>
                    </td>
                </tr>
            `).join('')}
        `;
    })).then(rows => rows.join(''));
}

// Helper function to extract the movie number from the title
function extractNumber(title) {
    const match = title.match(/\d+/); // Match the first number in the title
    return match ? parseInt(match[0]) : Infinity; // If no number is found, return Infinity to place it at the end
}

// Rendering the Movies List
async function renderMovies(filter = "") {
    const tbody = document.getElementById('movieList');
    tbody.innerHTML = await Promise.all(movies
        .filter(movie =>
            movie.title.toLowerCase().includes(filter) ||
            movie.director.toLowerCase().includes(filter)
        )
        .map(async movie => {
            const cover = await fetchCover(movie.title); // Fetch cover for each movie
            return `
                <tr class="${movie.status === 'completed' ? 'completed' : ''}">
                    <td><img src="${cover}" alt="${movie.title}" width="50"></td>
                    <td>${movie.title}</td>
                    <td>${movie.director}</td>
                    <td>${movie.releaseDate}</td>
                    <td>
                        <select class="form-select status-select" data-id="${movie.id}">
                            <option value="to-watch" ${movie.status === 'to-watch' ? 'selected' : ''}>To Watch</option>
                            <option value="watching" ${movie.status === 'watching' ? 'selected' : ''}>Watching</option>
                            <option value="completed" ${movie.status === 'completed' ? 'selected' : ''}>Completed</option>
                        </select>
                    </td>
                    <td>
                        <select class="form-select rating-select" data-id="${movie.id}">
                            <option value="1" ${movie.rating === 1 ? 'selected' : ''}>1</option>
                            <option value="2" ${movie.rating === 2 ? 'selected' : ''}>2</option>
                            <option value="3" ${movie.rating === 3 ? 'selected' : ''}>3</option>
                            <option value="4" ${movie.rating === 4 ? 'selected' : ''}>4</option>
                            <option value="5" ${movie.rating === 5 ? 'selected' : ''}>5</option>
                        </select>
                    </td>
                    <td>
                        <button class="btn btn-danger btn-sm" onclick="deleteMovie(${movie.id})">Delete</button>
                    </td>
                </tr>
            `;
        })
    ).then(rows => rows.join(''));
}

// Handling Changes in Rating and Status
document.getElementById('movieList').addEventListener('change', (e) => {
    if (e.target.classList.contains('rating-select')) {
        const movieId = parseInt(e.target.dataset.id);
        const newRating = parseInt(e.target.value);
        movies = movies.map(movie => movie.id === movieId ? { ...movie, rating: newRating } : movie);
        saveToLocalStorage();
        renderMovies();
    }

    // Update status
    if (e.target.classList.contains('status-select')) {
        const id = parseInt(e.target.dataset.id);
        const newStatus = e.target.value;
        movies = movies.map(movie => movie.id === id ? { ...movie, status: newStatus } : movie);
        if (newStatus === 'completed') showCelebration();
        saveToLocalStorage();
    }
});

// Search functionality
document.getElementById('searchInput').addEventListener('input', (e) => {
    renderMovies(e.target.value.toLowerCase());
});

//Call API to get cover
async function fetchCover(title) {
    const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${title}`);
    const data = await response.json();
    return data.items[0]?.volumeInfo?.imageLinks?.thumbnail || 'default-cover.jpg';
}

//Show celebration
function showCelebration() {
    const audio = new Audio('congratulations.mp3');
    audio.play();

    const celebrationDiv = document.createElement('div');
    celebrationDiv.className = 'celebration';
    celebrationDiv.innerHTML = '🎉 Congratulations! 🎉';
    document.body.appendChild(celebrationDiv);

    setTimeout(() => {
        document.body.removeChild(celebrationDiv);
    }, 3000);
}

//Deleting a Movie
function deleteMovie(id) {
    movies = movies.filter(movie => movie.id !== id);
    saveToLocalStorage();
    renderMovies();
}

//Save Movies to Local Storage
function saveToLocalStorage() {
    localStorage.setItem('movies', JSON.stringify(movies));
}

renderMovies();