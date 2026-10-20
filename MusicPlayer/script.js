const songs = [
    {title: "Song One", artist:"Artist One", src:"songs/song1.mp3", cover: "covers/cover1.jpg"},
    {title: "Song Two", artist:"Artist Two", src:"songs/song2.mp3", cover: "covers/cover2.jpg"},
    {title: "Song Three", artist:"Artist Three", src:"songs/song3.mp3", cover: "covers/cover3.jpg"},
    {title: "Song Four", artist:"Artist Four", src:"songs/song4.mp3", cover: "covers/cover4.jpg"},
    {title: "Song Five", artist:"Artist Five", src:"songs/song5.mp3", cover: "covers/cover5.jpg"},
];

const audio = new Audio();
const coverEl = document.getElementById("cover");
const playBtn = document.getElementById("play-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const progressEl = document.getElementById("progress");
const currentTimeEl = document.getElementById("current-time");
const durationEl = document.getElementById("duration");
const playlistEl = document.getElementById("playlist");
const volumeEl = document.getElementById("volume");
const miniCoverEl = document.getElementById("mini-cover");
const miniTitleEl = document.getElementById("mini-title");
const miniArtistEl = document.getElementById("mini-artist");
const miniPlayBtn = document.getElementById("mini-play");
const miniNextBtn = document.getElementById("mini-next");
const miniFillEl = document.getElementById("mini-progress-fill");
const muteBtn = document.getElementById("mute-btn");
const repeatBtn = document.getElementById("repeat-btn");
const shuffleBtn = document.getElementById("shuffle-btn");
const navLinks = document.querySelectorAll(".nav-link");
const homeView = document.getElementById("home-view");
const libraryView = document.getElementById("library-view");
const libraryList = document.getElementById("library-list");
const libraryEmpty = document.getElementById("library-empty");
const likeBtn = document.getElementById("like-btn");
const bgEl = document.querySelector(".bg-blur");

muteBtn.addEventListener("click", function () {
  audio.muted = !audio.muted;
  muteBtn.textContent = audio.muted ? "🔇" : "🔊";
});
navLinks.forEach(function (link) {
  link.addEventListener("click", function () {
    showView(link.dataset.view);
  });
});

likeBtn.addEventListener("click", function () {
  if (liked.includes(currentIndex)) {
    liked = liked.filter(function (i) { return i !== currentIndex; });
  } else {
    liked.push(currentIndex);
  }
  localStorage.setItem("liked", JSON.stringify(liked));
  updateLikeBtn();
  if (!libraryView.hidden) renderLibrary();
});

libraryList.addEventListener("click", function (event) {
  const item = event.target.closest("li");
  if (!item) return;
  loadSong(Number(item.dataset.index));
  audio.play();
});

audio.addEventListener("ended", handleEnded);
function formatTime(seconds) {
  if (isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return String(mins).padStart(2, "0") + ":" + String(secs).padStart(2, "0");
}
audio.addEventListener("loadedmetadata", function () {
  progressEl.max = audio.duration;
  durationEl.textContent = formatTime(audio.duration);
});
audio.addEventListener("timeupdate", function () {
  if (!isSeeking) {
    progressEl.value = audio.currentTime;
  }
  currentTimeEl.textContent = formatTime(audio.currentTime);
  if (audio.duration) {
    miniFillEl.style.width = (audio.currentTime / audio.duration * 100) + "%";
  }
});
progressEl.addEventListener("input", function () {
  audio.currentTime = progressEl.value;
});
progressEl.addEventListener("pointerdown", function () {
  isSeeking = true;
});
progressEl.addEventListener("pointerup", function () {
  isSeeking = false;
});


function renderPlaylist() {
  playlistEl.innerHTML = "";
  songs.forEach(function (song, index) {
    playlistEl.appendChild(makeSongItem(index));
  });
}
renderPlaylist();

renderPlaylist();

function makeSongItem(index) {
  const song = songs[index];
  const li = document.createElement("li");
  li.dataset.index = index;

  const img = document.createElement("img");
  img.src = song.cover;
  img.alt = "";
  img.onerror = function () { img.style.visibility = "hidden"; };

  const box = document.createElement("div");
  const title = document.createElement("strong");
  title.textContent = song.title;
  const artist = document.createElement("span");
  artist.textContent = song.artist;

  box.append(title, artist);
  li.append(img, box);
  return li;
}

const titleEl = document.getElementById("song-title");
const artistEl = document.getElementById("song-artist");

let currentIndex = 0;
const repeatModes = ["off", "all", "one"];
let repeatIndex = 0;
let isSeeking = false;
let shuffleOn = false;
let liked = JSON.parse(localStorage.getItem("liked") || "[]");

function handleEnded() {
  const mode = repeatModes[repeatIndex];

  if (mode === "one") {
    audio.currentTime = 0;
    audio.play();
  } else if (mode === "all") {
    nextSong();
  } else if (shuffleOn || currentIndex !== songs.length - 1) {
    nextSong();
  }
}
function showView(name) {
  homeView.hidden = name !== "home";
  libraryView.hidden = name !== "library";
  navLinks.forEach(function (link) {
    link.classList.toggle("active", link.dataset.view === name);
  });
  if (name === "library") renderLibrary();
}

function renderLibrary() {
  libraryList.innerHTML = "";
  libraryEmpty.hidden = liked.length > 0;
  liked.forEach(function (index) {
    libraryList.appendChild(makeSongItem(index));
  });
}

function updateLikeBtn() {
  const isLiked = liked.includes(currentIndex);
  likeBtn.textContent = isLiked ? "♥" : "♡";
  likeBtn.classList.toggle("active", isLiked);
  likeBtn.setAttribute("aria-label", isLiked ? "Unlike" : "Like");
}
function loadSong (index) {
    currentIndex = index;
    titleEl.textContent = songs[index].title;
    artistEl.textContent = songs[index].artist;
    audio.src = songs[index].src;
    coverEl.src = songs[index].cover;
    miniCoverEl.src = songs[index].cover;
    miniTitleEl.textContent = songs[index].title;
    miniArtistEl.textContent = songs[index].artist;
    console.log("Now Playing:", songs[index].title);
    updateActive();
    updateLikeBtn();
    bgEl.style.backgroundImage = "url(" + songs[index].cover + ")";
}
loadSong(0);
playlistEl.addEventListener("click", function (event) {
    const item = event.target.closest("li");
    if (!item) return;
    loadSong(Number(item.dataset.index));
    audio.play();
});
function togglePlay() {
    if (audio.paused) {
        audio.play();
    } else {
        audio.pause();
    }
}
playBtn.addEventListener("click", togglePlay);
audio.addEventListener("play", function () {
    playBtn.textContent = "❚❚";
    miniPlayBtn.textContent = "❚❚";
});
audio.addEventListener("pause", function () {
    playBtn.textContent = "▶";
    miniPlayBtn.textContent = "▶";
});
function nextSong() {
  if (shuffleOn && songs.length > 1) {
    let randomIndex;
    do {
      randomIndex = Math.floor(Math.random() * songs.length);
    } while (randomIndex === currentIndex);
    loadSong(randomIndex);
  } else {
    loadSong((currentIndex + 1) % songs.length);
  }
  audio.play();
}

function prevSong() {
  loadSong((currentIndex - 1 + songs.length) % songs.length);
  audio.play();
}
prevBtn.addEventListener("click", prevSong);
nextBtn.addEventListener("click", nextSong);
miniPlayBtn.addEventListener("click", togglePlay);
miniNextBtn.addEventListener("click", nextSong);
audio.volume = volumeEl.value / 100;

volumeEl.addEventListener("input", function () {
  audio.volume = volumeEl.value / 100;
});
function updateActive() {
  const items = playlistEl.querySelectorAll("li");
  items.forEach(function (item, i) {
    item.classList.toggle("active", i === currentIndex);
  });
}
document.addEventListener("keydown", function (event) {
  if (event.code === "Space") {
    event.preventDefault();
    togglePlay();
  }
});
repeatBtn.addEventListener("click", function () {
  repeatIndex = (repeatIndex + 1) % repeatModes.length;
  const mode = repeatModes[repeatIndex];

  repeatBtn.textContent = mode === "one" ? "🔂" : "🔁";
  repeatBtn.classList.toggle("active", mode !== "off");
  repeatBtn.setAttribute("aria-label", "Repeat: " + mode);
});
shuffleBtn.addEventListener("click", function () {
  shuffleOn = !shuffleOn;
  shuffleBtn.classList.toggle("active", shuffleOn);
  shuffleBtn.setAttribute("aria-label", "Shuffle: " + (shuffleOn ? "on" : "off"));
});

const searchEl = document.getElementById("search");

searchEl.addEventListener("input", function () {
  // If you're on the library page, jump back to the playlist so results are visible
  if (searchEl.value && homeView.hidden) showView("home");

  const q = searchEl.value.trim().toLowerCase();
  playlistEl.querySelectorAll("li").forEach(function (li) {
    li.hidden = !li.textContent.toLowerCase().includes(q);
  });
});