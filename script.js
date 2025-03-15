// Object to Store Vote Counts
const votes = { great: 0, ok: 0, bad: 0 };

// Animation Mapping (Now Matches Sound Length)
const animations = {
    great: "happyBounce 0.5s ease",
    ok: "neutralShake 0.5s ease",
    bad: "sadShrink 0.5s ease"
};

// Load saved votes from localStorage on page load
document.addEventListener("DOMContentLoaded", () => {
    let hasVotes = false;

    Object.keys(votes).forEach(type => {
        const savedVotes = localStorage.getItem(type);
        if (savedVotes) {
            votes[type] = parseInt(savedVotes);
            document.getElementById(`${type}-count`).innerText = votes[type];
            hasVotes = true;
        }
    });

    // If there are saved votes, apply the correct background color
    if (hasVotes) {
        updateBackgroundColor();
    }

    // Preload sounds for instant play
    preloadSounds();

    // Initialize floating emojis
    initializeFloatingEmojis();
});

/**
 * Increases the vote count when an emoji is clicked
 * @param {string} type - The selected emoji type ('great', 'ok', 'bad')
 */
function vote(type) {
    votes[type]++;
    document.getElementById(`${type}-count`).innerText = votes[type];

    // Save to localStorage
    localStorage.setItem(type, votes[type]);

    // Play sound effect
    playSound();

    // Apply animation effect
    applyAnimation(type);

    // Update the background color based on vote distribution
    updateBackgroundColor();
}

/**
 * Updates the background color based on the vote distribution
 */
function updateBackgroundColor() {
    let totalVotes = votes.great + votes.ok + votes.bad;

    if (totalVotes === 0) return; // Avoid division by zero

    // Define base colors
    const green = [34, 139, 34];  // Green (Great)
    const white = [255, 255, 255]; // White (OK)
    const red = [255, 0, 0];  // Red (Bad)

    // Calculate percentage weights
    let greatWeight = votes.great / totalVotes;
    let okWeight = votes.ok / totalVotes;
    let badWeight = votes.bad / totalVotes;

    // Blend colors based on vote counts
    let blendedColor = [
        Math.round(green[0] * greatWeight + white[0] * okWeight + red[0] * badWeight),
        Math.round(green[1] * greatWeight + white[1] * okWeight + red[1] * badWeight),
        Math.round(green[2] * greatWeight + white[2] * okWeight + red[2] * badWeight)
    ];

    // Apply the blended background color
    document.body.style.backgroundColor = `rgb(${blendedColor[0]}, ${blendedColor[1]}, ${blendedColor[2]})`;

    // Save the background color to localStorage for persistence
    localStorage.setItem("backgroundColor", JSON.stringify(blendedColor));
}

/**
 * Applies animation when an emoji is clicked
 * @param {string} type - The emoji type
 */
function applyAnimation(type) {
    let emojiElement = document.getElementById(`${type}-emoji`);

    if (!emojiElement) {
        console.error(`Element with ID ${type}-emoji not found`);
        return;
    }

    // Reset animation for smooth replay
    emojiElement.style.animation = "none";
    void emojiElement.offsetWidth;  // Force reflow

    setTimeout(() => {
        emojiElement.style.animation = animations[type];
    }, 10);
}

/**
 * Resets all votes and restores the default background color
 */
function resetVotes() {
    Object.keys(votes).forEach(type => {
        votes[type] = 0;
        document.getElementById(`${type}-count`).innerText = "0";
        localStorage.removeItem(type);
    });

    // Reset Background Color to Default (White)
    document.body.style.backgroundColor = "white";
    localStorage.removeItem("backgroundColor");
}

/**
 * Plays the voting sound effect
 */
function playSound() {
    const originalSound = document.getElementById("sound-click");

    if (originalSound) {
        // Clone the audio element to allow overlapping sounds
        const soundClone = originalSound.cloneNode();
        soundClone.play().catch(error => {
            console.error("Audio playback failed:", error);
        });

        // Remove cloned element after playing
        setTimeout(() => {
            soundClone.remove();
        }, 2000); // Matches sound duration
    }
}

/**
 * Preloads sounds to remove latency issues on first play
 */
function preloadSounds() {
    ["great", "ok", "bad"].forEach(type => {
        const sound = document.getElementById(`sound-${type}`);
        if (sound) {
            sound.volume = 1.0;
            sound.load();
        }
    });
}

/**
 * Floating Emojis Logic
 */
const floatingEmojiContainer = document.getElementById("floating-emojis");
const EMOJI_LIST = ["😊", "😐", "☹️"];
const floatingEmojis = [];
const NUM_FLOATING_EMOJIS = 6;

/**
 * Initializes floating emojis
 */
function initializeFloatingEmojis() {
    for (let i = 0; i < NUM_FLOATING_EMOJIS; i++) {
        let emoji = document.createElement("div");
        emoji.classList.add("floating-emoji");
        emoji.innerHTML = EMOJI_LIST[Math.floor(Math.random() * EMOJI_LIST.length)];

        let x = Math.random() * (window.innerWidth - 100);
        let y = Math.random() * (window.innerHeight - 100);
        let dx = (Math.random() - 0.5) * 3; // Random speed
        let dy = (Math.random() - 0.5) * 3; // Random speed

        emoji.style.left = `${x}px`;
        emoji.style.top = `${y}px`;

        floatingEmojis.push({ element: emoji, x, y, dx, dy });

        floatingEmojiContainer.appendChild(emoji);
    }

    moveFloatingEmojis();
}

/**
 * Moves floating emojis and handles their collisions
 */
function moveFloatingEmojis() {
    let screenWidth = window.innerWidth;
    let screenHeight = window.innerHeight;

    for (let i = 0; i < floatingEmojis.length; i++) {
        let emoji = floatingEmojis[i];

        // Move the emoji
        emoji.x += emoji.dx;
        emoji.y += emoji.dy;

        // Bounce off walls
        if (emoji.x <= 0 || emoji.x + 70 >= screenWidth) emoji.dx *= -1;
        if (emoji.y <= 0 || emoji.y + 70 >= screenHeight) emoji.dy *= -1;

        // Detect collisions and swap directions
        for (let j = i + 1; j < floatingEmojis.length; j++) {
            if (detectCollision(floatingEmojis[i], floatingEmojis[j])) {
                let tempDx = floatingEmojis[i].dx;
                let tempDy = floatingEmojis[i].dy;

                floatingEmojis[i].dx = floatingEmojis[j].dx;
                floatingEmojis[i].dy = floatingEmojis[j].dy;

                floatingEmojis[j].dx = tempDx;
                floatingEmojis[j].dy = tempDy;
            }
        }

        // Apply new position
        emoji.element.style.left = `${emoji.x}px`;
        emoji.element.style.top = `${emoji.y}px`;
    }

    requestAnimationFrame(moveFloatingEmojis);
}

/**
 * Detects collisions between two floating emojis
 */
function detectCollision(emoji1, emoji2) {
    let dx = emoji1.x - emoji2.x;
    let dy = emoji1.y - emoji2.y;
    let distance = Math.sqrt(dx * dx + dy * dy);

    return distance < 80; // Adjusted for emoji size
}
