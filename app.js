// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyA5SA_HxctHDMeW9Q2Hfmaul8uyuTlArOU",
  authDomain: "project-cloud-fcfa5.firebaseapp.com",
  projectId: "project-cloud-fcfa5",
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

//Elemente DOM
const email = document.getElementById("email");
const password = document.getElementById("password");
const movieInput = document.getElementById("movieInput");
const movieResult = document.getElementById("movieResult");
const moviesList = document.getElementById("moviesList");

let currentMovie = null;

// ================= AUTH =================
function register() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, password)
    .catch(err => alert(err.message));
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .catch(err => alert(err.message));
}

function logout() {
  resetUI();
  auth.signOut();
}

// ================= SEARCH =================
async function searchMovie() {
  const query = movieInput.value;

  if (!query) {
    alert("Scrie numele filmului!");
    return;
  }

  const res = await fetch(`https://www.omdbapi.com/?t=${query}&apikey=afd13c1d`);
  const data = await res.json();

  if (data.Response === "False") {
    alert("Film not found!");
    return;
  }

  currentMovie = data;

  movieResult.innerHTML = `
    <img src="${data.Poster}">
    <div class="movie-info">
      <h2>${data.Title}</h2>
      <p>📅 ${data.Year}</p>
      <p>⭐ ${data.imdbRating}</p>
      <p>${data.Plot}</p>
    </div>
  `;

  //background cinematic
  document.body.style.setProperty(
    "--bg",
    `url(${data.Poster})`
  );
}

// ================= SAVE =================
function saveMovie() {
  if (!currentMovie) {
    alert("Caută un film înainte!");
    return;
  }

  db.collection("movies").add({
    title: currentMovie.Title,
    poster: currentMovie.Poster,
    year: currentMovie.Year,
    rating: currentMovie.imdbRating,
    plot: currentMovie.Plot,
    user: auth.currentUser.email
  });
}

// ================= LOAD =================
function loadMovies() {
  db.collection("movies")
    .where("user", "==", auth.currentUser.email)
    .onSnapshot(snapshot => {
      moviesList.innerHTML = "";

      snapshot.forEach(doc => {
        const movie = doc.data();

        const card = document.createElement("div");
        card.classList.add("movie-card");

        card.innerHTML = `
          <img src="${movie.poster}">
          <span>${movie.title}</span>
        `;

        //CLICK PE FILM
        card.onclick = () => {
          currentMovie = movie;

          movieResult.innerHTML = `
            <img src="${movie.poster}">
            <div class="movie-info">
              <h2>${movie.title}</h2>
              <p>📅 ${movie.year || "N/A"}</p>
              <p>⭐ ${movie.rating || "N/A"}</p>
              <p>${movie.plot || "No description available."}</p>
            </div>
          `;

          // highlight
          document.querySelectorAll(".movie-card")
            .forEach(el => el.classList.remove("active"));

          card.classList.add("active");

          // background
          document.body.style.setProperty(
            "--bg",
            `url(${movie.poster})`
          );
        };

        // DELETE
        const btn = document.createElement("button");
        btn.textContent = "✖";
        btn.classList.add("delete-btn");

        btn.onclick = (e) => {
          e.stopPropagation();
          db.collection("movies").doc(doc.id).delete();
        };

        card.appendChild(btn);
        moviesList.appendChild(card);
      });
    });
}

// ================= CLEAR =================
function clearInput() {
  movieInput.value = "";
  movieResult.innerHTML = "<p class='placeholder'>Search a movie 🎬</p>";
  currentMovie = null;
}

// ================= RESET =================
function resetUI() {
  clearInput();
  moviesList.innerHTML = "";
}

// ================= AUTH STATE =================
auth.onAuthStateChanged(user => {
  if (user) {
    document.getElementById("auth").style.display = "none";
    document.getElementById("app").style.display = "block";
    loadMovies();
  } else {
    resetUI();
    document.getElementById("auth").style.display = "block";
    document.getElementById("app").style.display = "none";
  }
});

// ================= ENTER SEARCH =================
movieInput.addEventListener("keypress", e => {
  if (e.key === "Enter") searchMovie();
});