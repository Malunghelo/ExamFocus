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
const auth = firebase.auth();

// List of collections
const collections = [
    { id: "NSCGrade10Above50MathsAlgebraicExpression", name: "Grade 10 ExamFocus", thumbnail: "https://example.com/grade10-maths.jpg" },
    { id: "NSCGrade11Above50MathsEquationAndInequalities", name: "Grade 11 ExamFocus", thumbnail: "https://example.com/grade11-maths.jpg" },
    { id: "NSCGrade12UpgradingPhysicsVPM", name: "Grade 12 ExamFocus", thumbnail: "https://example.com/grade12-physics.jpg" }
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

// Function to check if a user has paid for a course
async function hasUserPaid(userId, courseId) {
    const paymentRef = db.collection("users")
        .doc(userId)
        .collection("payments")
        .doc(courseId);
    const doc = await paymentRef.get();
    return doc.exists; // true = paid, false = not paid
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

    const user = auth.currentUser;
    const userUid = user ? user.uid : null;

    try {
        // Fetch documents from the Firestore collection
        const querySnapshot = await db.collection(collectionId).get();

        querySnapshot.forEach(async (doc) => {
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

            // Purchase Button or Access Button
            const actionButton = document.createElement("button");
            actionButton.className = "purchase-button";

            // Function to update the button based on payment status
            const updateButton = (hasPaid) => {
                if (hasPaid) {
                    actionButton.textContent = "Access Course";
                    actionButton.onclick = () => showPlaylist(doc.id, title, description, thumbnailUrl, videoUrls);
                } else {
                    actionButton.textContent = "Purchase Course";
                    actionButton.onclick = () => initiatePayment(doc.id, title, description, thumbnailUrl, videoUrls);
                }
            };

            // Check if the user has paid for the course
            if (userUid) {
                const paymentRef = db.collection("novar users")
                    .doc(userUid)
                    .collection("payments")
                    .doc(doc.id);

                // Listen for real-time updates
                paymentRef.onSnapshot((docSnapshot) => {
                    const hasPaid = docSnapshot.exists;
                    updateButton(hasPaid);
                });
            } else {
                updateButton(false);
            }

            // Append elements to the course container
            courseContainer.appendChild(thumbnail);
            courseContent.appendChild(courseTitle);
            courseContent.appendChild(courseDescription);
            courseContent.appendChild(actionButton);
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

// Function to initiate Paystack payment
function initiatePayment(courseId, courseTitle, courseDescription, thumbnailUrl, videoUrls) {
    const user = auth.currentUser;
    if (!user) {
        showToast("Please log in to purchase the course.", "error");
        return;
    }

    const userUid = user.uid;
    const email = user.email;

    const paymentHandler = PaystackPop.setup({
        key: 'pk_test_368e65cff4a74e4511b39f8c5e255c4cddbb57b3', // Replace with your Paystack public key
        email: email,
        amount: 500000, // Amount in kobo (e.g., 500000 for ₦5000)
        currency: 'ZAR',
        ref: `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`, // Generate a unique reference
        onClose: () => showToast("Payment was not completed.", "error"),
        callback: (response) => {
            if (response.status === 'success') {
                storePaymentInfo(courseId, userUid, courseTitle, courseDescription, thumbnailUrl, videoUrls);
            } else {
                showToast("Payment failed. Please try again.", "error");
            }
        }
    });

    paymentHandler.openIframe();
}

// Function to store payment information in Firestore
async function storePaymentInfo(courseId, userUid, courseTitle, courseDescription, thumbnailUrl, videoUrls) {
    showLoading();
    try {
        await db.collection("users")
            .doc(userUid)
            .collection("payments")
            .doc(courseId)
            .set({
                paidAt: firebase.firestore.FieldValue.serverTimestamp(),
                courseId: courseId
            });

        showToast("Payment successful! You now have access to the course.", "success");

        // Automatically go to the playlist screen after payment
        showPlaylist(courseId, courseTitle, courseDescription, thumbnailUrl, videoUrls);
    } catch (error) {
        showToast("Error storing payment information. Please try again.", "error");
        console.error("Error storing payment info: ", error);
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