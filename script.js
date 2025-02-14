// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCkeUHT5wBxr2eNlNCFqUfyhayZ7VMzjv8",
    authDomain: "student-portal-a2284.firebaseapp.com",
    projectId: "student-portal-a2284",
    storageBucket: "student-portal-a2284.appspot.com",
    messagingSenderId: "854780246625",
    appId: "1:854780246625:web:86899fc898fa2650668820"
  };

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

// List of collections
const collections = [
    { id: "NSCGrade10Above50MathsAlgebraicExpression", name: "Grade 10 Maths: Algebraic Expressions", thumbnail: "https://example.com/grade10-maths.jpg" },
    { id: "NSCGrade11Above50MathsEquationAndInequalities", name: "Grade 11 Maths: Equations & Inequalities", thumbnail: "https://example.com/grade11-maths.jpg" },
    { id: "NSCGrade12UpgradingPhysicsVPM", name: "Grade 12 Physics: VPM", thumbnail: "https://example.com/grade12-physics.jpg" }
];

// Function to show loading indicator
function showLoading() {
    document.getElementById("loading-indicator").style.display = "block";
}

// Function to hide loading indicator
function hideLoading() {
    document.getElementById("loading-indicator").style.display = "none";
}

// Function to show toast notification
function showToast(message, type = "info") {
    const toast = document.getElementById("toast");
    const toastMessage = document.getElementById("toast-message");
    toastMessage.textContent = message;
    toast.style.display = "block";
    setTimeout(() => {
        toast.style.display = "none";
    }, 3000);
}

// Function to display collection list
function displayCollections() {
    const collectionsGrid = document.getElementById("collections-grid");
    collectionsGrid.innerHTML = ""; // Clear previous content

    collections.forEach((collection) => {
        const collectionCard = document.createElement("div");
        collectionCard.className = "collection-card";
        collectionCard.onclick = () => fetchCourses(collection.id, collection.name);

        const thumbnail = document.createElement("div");
        thumbnail.className = "collection-thumbnail";
        thumbnail.style.backgroundImage = `url(${collection.thumbnail})`;

        const title = document.createElement("div");
        title.className = "collection-title";
        title.textContent = collection.name;

        collectionCard.appendChild(thumbnail);
        collectionCard.appendChild(title);
        collectionsGrid.appendChild(collectionCard);
    });
}

// Function to fetch and display courses
async function fetchCourses(collectionId, collectionName) {
    showLoading();
    const coursesGrid = document.getElementById("courses-grid");
    coursesGrid.innerHTML = ""; // Clear previous content

    // Update the course list title
    document.getElementById("course-list-title").textContent = collectionName;

    // Hide the collection list and show the course list
    document.getElementById("collection-list-screen").style.display = "none";
    document.getElementById("course-list-screen").style.display = "block";

    try {
        // Fetch documents from the Firestore collection
        const querySnapshot = await db.collection(collectionId).get();

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const thumbnailUrl = data.thumbnailUrl;
            const title = data.title || "No Title"; // Fallback if title is missing
            const description = data.description || "No Description"; // Fallback if description is missing
            const videoUrls = data.videoUrl || []; // Array of video URLs

            // Create a course container
            const courseContainer = document.createElement("div");
            courseContainer.className = "course-container";

            // Thumbnail
            const thumbnail = document.createElement("div");
            thumbnail.className = "thumbnail";
            thumbnail.style.backgroundImage = `url(${thumbnailUrl})`;

            // Course Content
            const courseContent = document.createElement("div");
            courseContent.className = "course-content";

            // Course Title
            const courseTitle = document.createElement("div");
            courseTitle.className = "course-title";
            courseTitle.textContent = title;

            // Course Description
            const courseDescription = document.createElement("div");
            courseDescription.className = "course-description";
            courseDescription.textContent = description;

            // Purchase Button
            const purchaseButton = document.createElement("button");
            purchaseButton.className = "purchase-button";
            purchaseButton.textContent = "Purchase Course";
            purchaseButton.onclick = () => showPlaylist(doc.id, title, description, thumbnailUrl, videoUrls);

            // Append elements to the course container
            courseContainer.appendChild(thumbnail);
            courseContent.appendChild(courseTitle);
            courseContent.appendChild(courseDescription);
            courseContent.appendChild(purchaseButton);
            courseContainer.appendChild(courseContent);

            // Append the course container to the grid
            coursesGrid.appendChild(courseContainer);
        });
    } catch (error) {
        showToast("Error fetching courses. Please try again.", "error");
        console.error("Error fetching courses: ", error);
    } finally {
        hideLoading();
    }
}

// Function to show the playlist screen
function showPlaylist(courseId, courseTitle, courseDescription, thumbnailUrl, videoUrls) {
    // Hide the course list screen
    document.getElementById("course-list-screen").style.display = "none";

    // Show the playlist screen
    const playlistScreen = document.getElementById("playlist-screen");
    playlistScreen.style.display = "block";

    // Set the playlist thumbnail, title, and description
    document.getElementById("playlist-thumbnail").style.backgroundImage = `url(${thumbnailUrl})`;
    document.getElementById("playlist-title").textContent = courseTitle;
    document.getElementById("playlist-description").textContent = courseDescription;

    // Display the playlist items
    const playlistItems = document.getElementById("playlist-items");
    playlistItems.innerHTML = ""; // Clear previous content

    videoUrls.forEach((videoUrl, index) => {
        const playlistItem = document.createElement("div");
        playlistItem.className = "playlist-item";
        playlistItem.textContent = `Lesson ${index + 1}`;
        playlistItem.onclick = () => playVideo(videoUrl);
        playlistItems.appendChild(playlistItem);
    });
}

// Function to play video in a new screen
function playVideo(videoUrl) {
    // Hide the playlist screen
    document.getElementById("playlist-screen").style.display = "none";

    // Show the video player screen
    const videoPlayerScreen = document.getElementById("video-player-screen");
    videoPlayerScreen.style.display = "block";

    // Set the video source
    const videoPlayer = document.getElementById("video-player");
    const videoSource = document.getElementById("video-source");
    videoSource.src = videoUrl;
    videoPlayer.load();
    videoPlayer.play().catch((error) => {
        showToast("Error playing video. Please try again.", "error");
        console.error("Error playing video: ", error);
    });
}

// Function to go back to the course list
function goBackToCourseList() {
    // Hide the playlist screen
    document.getElementById("playlist-screen").style.display = "none";

    // Show the course list screen
    document.getElementById("course-list-screen").style.display = "block";
}

// Function to go back to the collection list
function goBackToCollectionList() {
    // Hide the course list screen
    document.getElementById("course-list-screen").style.display = "none";

    // Show the collection list screen
    document.getElementById("collection-list-screen").style.display = "block";
}

// Function to go back to the playlist
function goBackToPlaylist() {
    // Pause and reset the video
    const videoPlayer = document.getElementById("video-player");
    videoPlayer.pause();
    videoPlayer.currentTime = 0;

    // Hide the video player screen
    document.getElementById("video-player-screen").style.display = "none";

    // Show the playlist screen
    document.getElementById("playlist-screen").style.display = "block";
}

// Display collections when the page loads
window.onload = displayCollections;